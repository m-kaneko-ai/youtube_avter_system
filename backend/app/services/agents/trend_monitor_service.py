"""
トレンド監視エージェントサービス

Google Trends + YouTube検索でトレンドを検出し、アラートを生成
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.agent import Agent, AgentTask, TrendAlert
from app.models.knowledge import Knowledge
from app.services.external.serp_api import serp_api
from app.services.external.youtube_api import youtube_api
from app.services.external.ai_clients import claude_client

logger = logging.getLogger(__name__)


class TrendMonitorService:
    """トレンド監視エージェントサービス"""

    SCORE_THRESHOLD_HIGH = 70
    SCORE_THRESHOLD_MEDIUM = 50

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
            # キーワード取得
            keywords = await self._get_monitoring_keywords(agent.knowledge_id)

            if not keywords:
                logger.warning("No keywords to monitor")
                return {"alerts_created": 0, "keywords_checked": 0}

            alerts_created = 0
            trends_found = []

            for keyword in keywords:
                # トレンドスコア計算
                trend_data = await self._analyze_keyword_trend(keyword)

                if trend_data and trend_data.get("score", 0) >= self.SCORE_THRESHOLD_MEDIUM:
                    # AIで重要度判定
                    importance = await self._evaluate_importance(keyword, trend_data)
                    trend_data["importance"] = importance

                    # アラート作成
                    alert = await self._create_alert(
                        agent=agent,
                        keyword=keyword,
                        trend_data=trend_data,
                    )
                    alerts_created += 1
                    trends_found.append({
                        "keyword": keyword,
                        "score": trend_data.get("score"),
                        "alert_id": str(alert.id),
                    })

            return {
                "alerts_created": alerts_created,
                "keywords_checked": len(keywords),
                "trends_found": trends_found,
            }

        except Exception as e:
            logger.error(f"Trend monitor execution failed: {e}")
            raise

    async def _get_monitoring_keywords(
        self,
        knowledge_id: Optional[UUID]
    ) -> List[str]:
        """監視キーワードを取得"""
        keywords = []

        if knowledge_id:
            # ナレッジから関連キーワードを取得
            result = await self.db.execute(
                select(Knowledge).where(Knowledge.id == knowledge_id)
            )
            knowledge = result.scalar_one_or_none()

            if knowledge:
                # 各セクションからキーワードを抽出
                sections = [
                    knowledge.section_1_main_target,
                    knowledge.section_2_sub_target,
                    knowledge.section_3_competitor,
                    knowledge.section_4_company,
                    knowledge.section_5_aha_concept,
                    knowledge.section_6_concept_summary,
                    knowledge.section_7_customer_journey,
                    knowledge.section_8_promotion_strategy,
                ]

                for section in sections:
                    if section and isinstance(section, dict):
                        # キーワードフィールドがあれば使用
                        if "keywords" in section:
                            if isinstance(section["keywords"], list):
                                keywords.extend(section["keywords"])
                            elif isinstance(section["keywords"], str):
                                keywords.append(section["keywords"])

                        # ターゲットキーワードも追加
                        if "target_keywords" in section:
                            if isinstance(section["target_keywords"], list):
                                keywords.extend(section["target_keywords"])
                            elif isinstance(section["target_keywords"], str):
                                keywords.append(section["target_keywords"])

        # デフォルトキーワード（ナレッジがない場合）
        if not keywords:
            keywords = [
                "YouTube 収益化",
                "AIアバター",
                "動画編集 AI",
                "ショート動画",
            ]

        return list(set(keywords))[:20]  # 最大20キーワード

    async def _analyze_keyword_trend(
        self,
        keyword: str
    ) -> Optional[Dict[str, Any]]:
        """キーワードのトレンドを分析"""
        try:
            # Google Trends検索
            trends_data = await serp_api.search_google_trends(keyword)

            # YouTube検索で関連動画数を取得
            youtube_results = await youtube_api.search_popular_videos(
                query=keyword,
                max_results=10
            )

            # スコア計算
            trends_score = self._calculate_trends_score(trends_data)
            youtube_score = self._calculate_youtube_score(youtube_results)

            # 総合スコア（トレンド40% + YouTube60%）
            total_score = (trends_score * 0.4) + (youtube_score * 0.6)

            if total_score < self.SCORE_THRESHOLD_MEDIUM:
                return None

            return {
                "score": total_score,
                "trends_score": trends_score,
                "youtube_score": youtube_score,
                "related_keywords": [
                    t.get("keyword") for t in trends_data[:5]
                ] if trends_data else [],
                "top_videos": [
                    {
                        "title": v.get("title"),
                        "view_count": v.get("view_count"),
                        "video_id": v.get("video_id"),
                    }
                    for v in youtube_results[:3]
                ] if youtube_results else [],
                "source": "serp_api+youtube",
            }

        except Exception as e:
            logger.error(f"Trend analysis failed for '{keyword}': {e}")
            return None

    def _calculate_trends_score(self, trends_data: List[Dict]) -> float:
        """トレンドスコアを計算"""
        if not trends_data:
            return 0

        # 急上昇キーワードの数でスコア化
        rising_count = sum(
            1 for t in trends_data
            if t.get("trend_direction") == "up"
        )

        # 最大100点
        return min(rising_count * 15, 100)

    def _calculate_youtube_score(self, videos: List[Dict]) -> float:
        """YouTubeスコアを計算"""
        if not videos:
            return 0

        # 平均再生数でスコア化
        total_views = sum(v.get("view_count", 0) for v in videos)
        avg_views = total_views / len(videos) if videos else 0

        # 10万再生以上で100点、線形スケール
        return min(avg_views / 1000, 100)

    async def _evaluate_importance(
        self,
        keyword: str,
        trend_data: Dict[str, Any]
    ) -> str:
        """AIで重要度を評価"""
        if not claude_client.is_available():
            # AIが使えない場合はスコアベースで判定
            score = trend_data.get("score", 0)
            if score >= self.SCORE_THRESHOLD_HIGH:
                return "high"
            return "medium"

        try:
            prompt = f"""以下のトレンドキーワードの重要度を評価してください。

キーワード: {keyword}
トレンドスコア: {trend_data.get('score', 0):.1f}
関連キーワード: {', '.join(trend_data.get('related_keywords', []))}
人気動画の平均再生数: {sum(v.get('view_count', 0) for v in trend_data.get('top_videos', [])) / max(len(trend_data.get('top_videos', [])), 1):,.0f}

YouTube動画制作の観点から、このトレンドを動画ネタとして活用する価値を評価してください。
「high」「medium」「low」のいずれかで回答してください。理由は不要です。"""

            response = await claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}]
            )

            result = response.content[0].text.strip().lower()
            if result in ["high", "medium", "low"]:
                return result
            return "medium"

        except Exception as e:
            logger.error(f"Importance evaluation failed: {e}")
            return "medium"

    async def _create_alert(
        self,
        agent: Agent,
        keyword: str,
        trend_data: Dict[str, Any],
    ) -> TrendAlert:
        """トレンドアラートを作成"""
        importance = trend_data.get("importance", "medium")
        score = trend_data.get("score", 0)

        # アラートタイプ決定
        if score >= self.SCORE_THRESHOLD_HIGH:
            alert_type = "keyword_spike"
        else:
            alert_type = "rising_trend"

        # 推奨アクション生成
        suggested_actions = self._generate_suggested_actions(keyword, trend_data)

        alert = TrendAlert(
            agent_id=agent.id,
            knowledge_id=agent.knowledge_id,
            title=f"トレンド検出: {keyword}",
            description=f"キーワード「{keyword}」がトレンド上昇中です。スコア: {score:.1f}",
            alert_type=alert_type,
            source=trend_data.get("source", "unknown"),
            keyword=keyword,
            trend_score=score,
            related_data={
                "trends_score": trend_data.get("trends_score"),
                "youtube_score": trend_data.get("youtube_score"),
                "related_keywords": trend_data.get("related_keywords", []),
                "top_videos": trend_data.get("top_videos", []),
            },
            suggested_actions=suggested_actions,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)

        return alert

    def _generate_suggested_actions(
        self,
        keyword: str,
        trend_data: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """推奨アクションを生成"""
        actions = []
        score = trend_data.get("score", 0)

        if score >= self.SCORE_THRESHOLD_HIGH:
            actions.append({
                "priority": "high",
                "action": "即座に企画を検討",
                "description": f"「{keyword}」をテーマにした動画企画を今すぐ立案してください。"
            })

        actions.append({
            "priority": "medium",
            "action": "競合動画を分析",
            "description": "上位動画のタイトル・サムネイル・構成を分析してください。"
        })

        if trend_data.get("related_keywords"):
            actions.append({
                "priority": "low",
                "action": "関連キーワードを調査",
                "description": f"関連キーワード: {', '.join(trend_data.get('related_keywords', [])[:3])}"
            })

        return actions
