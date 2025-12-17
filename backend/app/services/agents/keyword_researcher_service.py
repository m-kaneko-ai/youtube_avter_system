"""
キーワードリサーチエージェントサービス

キーワードを調査し、検索ボリュームと競合度を分析
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTask
from app.services.external import serp_api, youtube_api

logger = logging.getLogger(__name__)


class KeywordResearcherService:
    """キーワードリサーチエージェントサービス"""

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
            seed_keywords = input_data.get("keywords", [])
            category = input_data.get("category", "")

            if not seed_keywords and not category:
                seed_keywords = ["YouTube 収益化", "動画編集", "AI"]

            all_keywords = []

            for seed in seed_keywords[:5]:  # 最大5キーワード
                # 関連キーワード取得
                related = await self._get_related_keywords(seed)
                all_keywords.extend(related)

                # YouTube検索結果を取得
                youtube_data = await self._get_youtube_insights(seed)

                all_keywords.append({
                    "keyword": seed,
                    "is_seed": True,
                    "youtube_videos": youtube_data.get("count", 0),
                    "avg_views": youtube_data.get("avg_views", 0),
                    "competition": youtube_data.get("competition", "medium"),
                })

            # 重複除去と整理
            unique_keywords = self._deduplicate_keywords(all_keywords)

            return {
                "keywords_found": len(unique_keywords),
                "seed_keywords": seed_keywords,
                "keywords": unique_keywords[:50],  # 最大50件
            }

        except Exception as e:
            logger.error(f"Keyword researcher execution failed: {e}")
            raise

    async def _get_related_keywords(
        self,
        seed_keyword: str
    ) -> List[Dict[str, Any]]:
        """関連キーワードを取得"""
        keywords = []

        try:
            # Google Trendsから関連キーワード
            trends = await serp_api.search_google_trends(seed_keyword)

            for item in trends[:10]:
                keywords.append({
                    "keyword": item.get("keyword", ""),
                    "is_seed": False,
                    "trend_direction": item.get("trend_direction", "stable"),
                    "source": "google_trends",
                })

        except Exception as e:
            logger.error(f"Failed to get related keywords: {e}")

        return keywords

    async def _get_youtube_insights(
        self,
        keyword: str
    ) -> Dict[str, Any]:
        """YouTube検索結果から洞察を取得"""
        try:
            videos = await youtube_api.search_popular_videos(
                query=keyword,
                max_results=10
            )

            if not videos:
                return {"count": 0, "avg_views": 0, "competition": "unknown"}

            total_views = sum(v.get("view_count", 0) for v in videos)
            avg_views = total_views / len(videos) if videos else 0

            # 競合度判定
            if avg_views > 100000:
                competition = "high"
            elif avg_views > 10000:
                competition = "medium"
            else:
                competition = "low"

            return {
                "count": len(videos),
                "avg_views": avg_views,
                "competition": competition,
            }

        except Exception as e:
            logger.error(f"Failed to get YouTube insights: {e}")
            return {"count": 0, "avg_views": 0, "competition": "unknown"}

    def _deduplicate_keywords(
        self,
        keywords: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """キーワードを重複除去"""
        seen = set()
        unique = []

        for kw in keywords:
            keyword = kw.get("keyword", "").lower().strip()
            if keyword and keyword not in seen:
                seen.add(keyword)
                unique.append(kw)

        return unique
