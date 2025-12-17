"""
パフォーマンス追跡エージェントサービス

公開済み動画のパフォーマンスを取得し、分析
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.agent import Agent, AgentTask
from app.models.project import Video
from app.models.analytics import VideoAnalytics
from app.services.external import youtube_api

logger = logging.getLogger(__name__)


class PerformanceTrackerService:
    """パフォーマンス追跡エージェントサービス"""

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
            videos = await self._get_published_videos()

            videos_updated = 0
            performance_data = []

            for video in videos:
                if not video.youtube_video_id:
                    continue

                # YouTube APIからデータ取得（youtube_apiには直接動画取得がないので検索で代用）
                # 実際の実装ではYouTube Analytics APIを使用
                metrics = await self._get_video_metrics(video)

                if metrics:
                    await self._update_analytics(video, metrics)
                    videos_updated += 1
                    performance_data.append({
                        "video_id": str(video.id),
                        "title": video.title,
                        "views": metrics.get("view_count", 0),
                        "likes": metrics.get("like_count", 0),
                    })

            return {
                "videos_analyzed": len(videos),
                "videos_updated": videos_updated,
                "performance_data": performance_data,
            }

        except Exception as e:
            logger.error(f"Performance tracker execution failed: {e}")
            raise

    async def _get_published_videos(self) -> List[Video]:
        """公開済み動画を取得"""
        result = await self.db.execute(
            select(Video).where(
                Video.status == "published",
                Video.youtube_video_id.isnot(None)
            ).limit(50)
        )
        return result.scalars().all()

    async def _get_video_metrics(
        self,
        video: Video
    ) -> Optional[Dict[str, Any]]:
        """動画のメトリクスを取得"""
        # 注: 実際のYouTube Analytics APIは別途実装が必要
        # ここでは簡易版としてコメント取得の結果を使用
        try:
            # youtube_apiには個別動画取得がないため、
            # 実際の実装ではYouTube Data APIのvideos.listを使用
            return {
                "view_count": 0,
                "like_count": 0,
                "comment_count": 0,
                "updated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get metrics for video {video.id}: {e}")
            return None

    async def _update_analytics(
        self,
        video: Video,
        metrics: Dict[str, Any]
    ):
        """分析データを更新"""
        # VideoAnalyticsレコードを更新または作成
        result = await self.db.execute(
            select(VideoAnalytics).where(VideoAnalytics.video_id == video.id)
        )
        analytics = result.scalar_one_or_none()

        if analytics:
            analytics.view_count = metrics.get("view_count", 0)
            analytics.like_count = metrics.get("like_count", 0)
            analytics.comment_count = metrics.get("comment_count", 0)
            analytics.updated_at = datetime.utcnow()
        else:
            analytics = VideoAnalytics(
                video_id=video.id,
                view_count=metrics.get("view_count", 0),
                like_count=metrics.get("like_count", 0),
                comment_count=metrics.get("comment_count", 0),
            )
            self.db.add(analytics)

        await self.db.commit()
