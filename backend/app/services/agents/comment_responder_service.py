"""
コメント返信エージェントサービス

公開動画のコメントを取得し、AI返信を生成して承認キューに追加
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.agent import (
    Agent, AgentTask, CommentTemplate, CommentQueue,
    CommentSentiment, ReplyStatus
)
from app.models.project import Video
from app.services.external import youtube_api, claude_client

logger = logging.getLogger(__name__)


class CommentResponderService:
    """コメント返信エージェントサービス"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute(
        self,
        agent: Agent,
        task: AgentTask,
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """エージェントを実行"""
        try:
            # 公開済み動画を取得
            videos = await self._get_published_videos(agent.knowledge_id)

            if not videos:
                logger.warning("No published videos to process")
                return {"comments_processed": 0, "replies_generated": 0}

            total_comments = 0
            total_replies = 0
            processed_videos = []

            for video in videos:
                # コメント取得
                comments = await self._get_new_comments(video)
                total_comments += len(comments)

                for comment in comments:
                    # 既に処理済みか確認
                    if await self._is_already_processed(comment["comment_id"]):
                        continue

                    # 感情分析
                    sentiment = await self._analyze_sentiment(comment["text"])

                    # 返信生成
                    reply_text = await self._generate_reply(
                        video=video,
                        comment=comment,
                        sentiment=sentiment,
                    )

                    if reply_text:
                        # キューに追加
                        await self._add_to_queue(
                            video=video,
                            comment=comment,
                            sentiment=sentiment,
                            reply_text=reply_text,
                        )
                        total_replies += 1

                processed_videos.append({
                    "video_id": str(video.id),
                    "title": video.title,
                    "comments_found": len(comments),
                })

            return {
                "comments_processed": total_comments,
                "replies_generated": total_replies,
                "videos_processed": len(videos),
                "processed_videos": processed_videos,
            }

        except Exception as e:
            logger.error(f"Comment responder execution failed: {e}")
            raise

    async def _get_published_videos(
        self,
        knowledge_id: Optional[UUID]
    ) -> List[Video]:
        """公開済み動画を取得"""
        query = select(Video).where(
            and_(
                Video.status == "published",
                Video.youtube_video_id.isnot(None)
            )
        )

        # 最近7日間の動画に限定
        cutoff = datetime.utcnow() - timedelta(days=7)
        query = query.where(Video.published_at >= cutoff)

        result = await self.db.execute(query.limit(10))
        return result.scalars().all()

    async def _get_new_comments(
        self,
        video: Video
    ) -> List[Dict[str, Any]]:
        """新しいコメントを取得"""
        if not video.youtube_video_id:
            return []

        try:
            comments = await youtube_api.get_video_comments(
                video_id=video.youtube_video_id,
                max_results=50
            )
            return comments

        except Exception as e:
            logger.error(f"Failed to get comments for video {video.id}: {e}")
            return []

    async def _is_already_processed(
        self,
        youtube_comment_id: str
    ) -> bool:
        """既に処理済みか確認"""
        result = await self.db.execute(
            select(CommentQueue).where(
                CommentQueue.youtube_comment_id == youtube_comment_id
            )
        )
        return result.scalar_one_or_none() is not None

    async def _analyze_sentiment(
        self,
        comment_text: str
    ) -> CommentSentiment:
        """コメントの感情を分析"""
        if not claude_client.is_available():
            # 簡易判定
            if "?" in comment_text or "?" in comment_text:
                return CommentSentiment.QUESTION
            return CommentSentiment.NEUTRAL

        try:
            prompt = f"""以下のYouTubeコメントの感情を分析してください。

コメント: {comment_text}

「positive」「neutral」「negative」「question」のいずれかで回答してください。
- positive: 肯定的、感謝、褒め
- neutral: 中立的、感想
- negative: 否定的、批判、不満
- question: 質問、疑問"""

            response = await claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=20,
                messages=[{"role": "user", "content": prompt}]
            )

            result = response.content[0].text.strip().lower()
            sentiment_map = {
                "positive": CommentSentiment.POSITIVE,
                "neutral": CommentSentiment.NEUTRAL,
                "negative": CommentSentiment.NEGATIVE,
                "question": CommentSentiment.QUESTION,
            }
            return sentiment_map.get(result, CommentSentiment.NEUTRAL)

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return CommentSentiment.NEUTRAL

    async def _generate_reply(
        self,
        video: Video,
        comment: Dict[str, Any],
        sentiment: CommentSentiment,
    ) -> Optional[str]:
        """返信を生成"""
        # テンプレートを探す
        template = await self._find_matching_template(sentiment)

        if template and not template.use_ai_generation:
            # テンプレートから返信生成
            reply = template.template_text
            reply = reply.replace("{{author}}", comment.get("author", ""))
            reply = reply.replace("{{video_title}}", video.title or "")
            return reply

        # AI生成
        if not claude_client.is_available():
            return None

        try:
            sentiment_guide = {
                CommentSentiment.POSITIVE: "感謝を伝え、嬉しさを表現",
                CommentSentiment.NEUTRAL: "丁寧に返信、追加情報を提供",
                CommentSentiment.NEGATIVE: "真摯に受け止め、改善を約束",
                CommentSentiment.QUESTION: "質問に丁寧に回答",
            }

            prompt = f"""以下のYouTubeコメントに返信を作成してください。

動画タイトル: {video.title}
コメント投稿者: {comment.get("author", "視聴者")}
コメント内容: {comment.get("text", "")}
コメントの感情: {sentiment.value}

返信のガイドライン:
- {sentiment_guide.get(sentiment, "丁寧に返信")}
- 2-3文程度で簡潔に
- フレンドリーだが丁寧な口調
- 絵文字は1-2個まで使用可

返信文のみを出力してください。"""

            response = await claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Reply generation failed: {e}")
            return None

    async def _find_matching_template(
        self,
        sentiment: CommentSentiment
    ) -> Optional[CommentTemplate]:
        """マッチするテンプレートを探す"""
        result = await self.db.execute(
            select(CommentTemplate).where(
                and_(
                    CommentTemplate.is_active == True,
                    CommentTemplate.target_sentiment == sentiment
                )
            ).order_by(CommentTemplate.priority.desc())
        )
        return result.scalar_one_or_none()

    async def _add_to_queue(
        self,
        video: Video,
        comment: Dict[str, Any],
        sentiment: CommentSentiment,
        reply_text: str,
    ):
        """承認キューに追加"""
        queue_item = CommentQueue(
            video_id=video.id,
            youtube_comment_id=comment["comment_id"],
            author_name=comment.get("author"),
            author_channel_id=comment.get("author_channel_id"),
            comment_text=comment.get("text", ""),
            comment_likes=comment.get("like_count", 0),
            comment_published_at=datetime.fromisoformat(
                comment.get("published_at", "").replace("Z", "+00:00")
            ) if comment.get("published_at") else None,
            sentiment=sentiment,
            is_question=sentiment == CommentSentiment.QUESTION,
            reply_text=reply_text,
            reply_generated_by="ai",
            status=ReplyStatus.PENDING,
            requires_approval=True,
        )

        self.db.add(queue_item)
        await self.db.commit()
