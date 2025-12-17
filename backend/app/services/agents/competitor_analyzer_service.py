"""
競合分析エージェントサービス

競合チャンネルの新着動画を検出し、分析アラートを生成
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.agent import Agent, AgentTask, CompetitorAlert
from app.models.research import Research, ResearchType
from app.services.external.youtube_api import youtube_api
from app.services.external.ai_clients import claude_client
from app.services.external.social_blade_service import social_blade_service

logger = logging.getLogger(__name__)


class CompetitorAnalyzerService:
    """競合分析エージェントサービス"""

    VIRAL_THRESHOLD_MULTIPLIER = 1.5  # 平均の1.5倍でバイラル判定

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
            # 監視対象の競合チャンネルを取得
            competitors = await self._get_competitors(agent.knowledge_id)

            if not competitors:
                logger.warning("No competitors to analyze")
                return {"alerts_created": 0, "channels_checked": 0}

            alerts_created = 0
            analyzed_channels = []

            for competitor in competitors:
                # 新着動画を検出
                new_videos = await self._detect_new_videos(competitor)

                for video in new_videos:
                    # パフォーマンス分析
                    is_viral = await self._analyze_performance(
                        competitor, video
                    )

                    if is_viral:
                        # AI分析
                        analysis = await self._generate_analysis(
                            competitor, video
                        )

                        # アラート作成
                        alert = await self._create_alert(
                            agent=agent,
                            competitor=competitor,
                            video=video,
                            analysis=analysis,
                        )
                        alerts_created += 1

                analyzed_channels.append({
                    "channel_id": competitor.get("channel_id"),
                    "channel_name": competitor.get("title"),
                    "new_videos_found": len(new_videos),
                })

            return {
                "alerts_created": alerts_created,
                "channels_checked": len(competitors),
                "analyzed_channels": analyzed_channels,
            }

        except Exception as e:
            logger.error(f"Competitor analyzer execution failed: {e}")
            raise

    async def _get_competitors(
        self,
        knowledge_id: Optional[UUID]
    ) -> List[Dict[str, Any]]:
        """監視対象の競合チャンネルを取得"""
        # Researchテーブルから競合チャンネルデータを取得
        query = select(Research).where(
            Research.research_type == ResearchType.COMPETITOR_CHANNEL,
            Research.cache_expires_at > datetime.utcnow()
        )

        result = await self.db.execute(query.limit(20))
        research_records = result.scalars().all()

        # JSONデータから競合チャンネル情報を抽出
        competitors = []
        for record in research_records:
            data = record.data
            if isinstance(data, dict) and "data" in data:
                # CompetitorListResponse形式
                competitors.extend(data.get("data", []))
            elif isinstance(data, list):
                # 直接リスト形式
                competitors.extend(data)
            elif isinstance(data, dict):
                # 単一チャンネル
                competitors.append(data)

        return competitors[:20]  # 最大20チャンネル

    async def _detect_new_videos(
        self,
        competitor: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """新着動画を検出"""
        try:
            channel_id = competitor.get("channel_id")
            if not channel_id:
                return []

            # 最新動画を取得
            videos = await youtube_api.get_channel_videos(
                channel_id=channel_id,
                max_results=5
            )

            # 24時間以内に公開された動画をフィルタ
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            new_videos = []

            for video in videos:
                published_at = video.get("published_at")
                if published_at:
                    try:
                        # ISO形式の日時をパース
                        pub_datetime = datetime.fromisoformat(
                            published_at.replace("Z", "+00:00")
                        )
                        if pub_datetime.replace(tzinfo=None) > cutoff_time:
                            new_videos.append(video)
                    except Exception:
                        pass

            return new_videos

        except Exception as e:
            logger.error(
                f"Failed to detect new videos for channel "
                f"{competitor.get('channel_id')}: {e}"
            )
            return []

    async def _analyze_performance(
        self,
        competitor: Dict[str, Any],
        video: Dict[str, Any]
    ) -> bool:
        """動画のパフォーマンスを分析"""
        view_count = video.get("view_count", 0)

        # 競合の平均再生数を取得（recent_videosから計算）
        recent_videos = competitor.get("recent_videos", [])
        if recent_videos:
            avg_views = sum(v.get("view_count", 0) for v in recent_videos) / len(recent_videos)
        else:
            avg_views = 10000  # デフォルト値

        # Social Bladeから成長率データを取得（オプション）
        try:
            channel_id = competitor.get("channel_id")
            if channel_id:
                growth_data = await social_blade_service.get_growth_rate(channel_id)
                if not growth_data.get("_is_mock"):
                    # Social Bladeデータがある場合は、平均日次再生数を使用
                    avg_daily_views = growth_data.get("avg_daily_views", 0)
                    if avg_daily_views > 0:
                        # 1動画あたりの平均再生数を推定（日次再生数 / 動画投稿頻度）
                        avg_views = avg_daily_views * 7  # 週1本投稿と仮定
        except Exception as e:
            logger.debug(f"Social Blade data not available: {e}")

        # 平均の1.5倍以上でバイラル判定
        threshold = avg_views * self.VIRAL_THRESHOLD_MULTIPLIER

        return view_count >= threshold

    async def _generate_analysis(
        self,
        competitor: Dict[str, Any],
        video: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI分析レポートを生成"""
        analysis = {
            "title_analysis": None,
            "performance_insights": None,
            "suggested_response": None,
        }

        if not claude_client.is_available():
            return analysis

        try:
            # Social Bladeデータを取得
            social_blade_data = {}
            try:
                channel_id = competitor.get("channel_id")
                if channel_id:
                    growth_data = await social_blade_service.get_growth_rate(channel_id)
                    if not growth_data.get("_is_mock"):
                        social_blade_data = growth_data
            except Exception as e:
                logger.debug(f"Social Blade data not available: {e}")

            # Social Bladeデータを含むプロンプト
            sb_info = ""
            if social_blade_data:
                sb_info = f"""
チャンネル成長率データ（Social Blade）:
- 週間登録者増: {social_blade_data.get('subscriber_growth_7d', 0):,}
- 月間登録者増: {social_blade_data.get('subscriber_growth_30d', 0):,}
- 平均日次登録者増: {social_blade_data.get('avg_daily_subs', 0):,.0f}
- 平均日次再生数: {social_blade_data.get('avg_daily_views', 0):,}
"""

            prompt = f"""以下の競合動画を分析してください。

競合チャンネル: {competitor.get('title', 'N/A')}
動画タイトル: {video.get('title', 'N/A')}
再生数: {video.get('view_count', 0):,}
いいね数: {video.get('like_count', 0):,}
コメント数: {video.get('comment_count', 0):,}
{sb_info}
以下の観点で分析してください：
1. タイトルの特徴（なぜクリックされやすいか）
2. パフォーマンスの要因分析
3. 自社で参考にできるポイント

簡潔に、各100文字以内で回答してください。"""

            response = await claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )

            analysis_text = response.content[0].text

            # 簡易的にセクション分割
            lines = analysis_text.split("\n")
            sections = {"title": [], "performance": [], "response": []}
            current = "title"

            for line in lines:
                if "タイトル" in line or "1." in line:
                    current = "title"
                elif "パフォーマンス" in line or "要因" in line or "2." in line:
                    current = "performance"
                elif "参考" in line or "ポイント" in line or "3." in line:
                    current = "response"
                else:
                    sections[current].append(line.strip())

            analysis["title_analysis"] = " ".join(sections["title"])[:200]
            analysis["performance_insights"] = " ".join(sections["performance"])[:200]
            analysis["suggested_response"] = " ".join(sections["response"])[:200]

        except Exception as e:
            logger.error(f"AI analysis failed: {e}")

        return analysis

    async def _create_alert(
        self,
        agent: Agent,
        competitor: Dict[str, Any],
        video: Dict[str, Any],
        analysis: Dict[str, Any],
    ) -> CompetitorAlert:
        """競合アラートを作成"""
        view_count = video.get("view_count", 0)

        # 競合の平均再生数を計算
        recent_videos = competitor.get("recent_videos", [])
        if recent_videos:
            avg_views = sum(v.get("view_count", 0) for v in recent_videos) / len(recent_videos)
        else:
            avg_views = 10000

        growth_rate = (view_count / avg_views - 1) * 100 if avg_views > 0 else 0

        # アラートタイプ決定
        if growth_rate >= 100:
            alert_type = "viral_video"
        elif growth_rate >= 50:
            alert_type = "high_performer"
        else:
            alert_type = "new_video"

        alert = CompetitorAlert(
            agent_id=agent.id,
            knowledge_id=agent.knowledge_id,
            title=f"競合動画: {video.get('title', 'N/A')[:50]}",
            description=(
                f"{competitor.get('title', 'N/A')}が新しい動画を公開。"
                f"再生数: {view_count:,}（平均比 {growth_rate:+.0f}%）"
            ),
            alert_type=alert_type,
            competitor_channel_id=competitor.get("channel_id"),
            competitor_channel_name=competitor.get("title"),
            competitor_video_id=video.get("video_id"),
            competitor_video_title=video.get("title"),
            competitor_video_url=f"https://www.youtube.com/watch?v={video.get('video_id')}",
            analysis=analysis,
            performance_metrics={
                "view_count": view_count,
                "like_count": video.get("like_count", 0),
                "comment_count": video.get("comment_count", 0),
                "avg_channel_views": int(avg_views),
                "growth_rate": growth_rate,
            },
            suggested_response=[
                {
                    "action": "タイトル・サムネイル分析",
                    "description": analysis.get("title_analysis") or "動画を確認してください",
                },
                {
                    "action": "類似コンテンツ検討",
                    "description": analysis.get("suggested_response") or "参考にできるポイントを探してください",
                },
            ],
        )

        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)

        return alert
