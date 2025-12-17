"""
コンテンツスケジューラーエージェントサービス

公開予定の動画を管理し、通知を送信
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.agent import Agent, AgentTask
from app.models.publish import PublishSchedule

logger = logging.getLogger(__name__)


class ContentSchedulerService:
    """コンテンツスケジューラーエージェントサービス"""

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
            # 今日と明日の公開予定を取得
            schedules = await self._get_upcoming_schedules()

            notifications_sent = 0
            upcoming = []

            for schedule in schedules:
                hours_until = self._hours_until_publish(schedule.scheduled_at)

                upcoming.append({
                    "schedule_id": str(schedule.id),
                    "video_id": str(schedule.video_id) if schedule.video_id else None,
                    "scheduled_at": schedule.scheduled_at.isoformat(),
                    "hours_until": hours_until,
                    "platform": schedule.platform,
                })

                # 24時間以内なら通知フラグ
                if hours_until <= 24:
                    notifications_sent += 1

            return {
                "upcoming_count": len(schedules),
                "notifications_sent": notifications_sent,
                "upcoming": upcoming,
            }

        except Exception as e:
            logger.error(f"Content scheduler execution failed: {e}")
            raise

    async def _get_upcoming_schedules(self) -> List[PublishSchedule]:
        """今後48時間の公開予定を取得"""
        now = datetime.utcnow()
        cutoff = now + timedelta(hours=48)

        result = await self.db.execute(
            select(PublishSchedule).where(
                and_(
                    PublishSchedule.scheduled_at >= now,
                    PublishSchedule.scheduled_at <= cutoff,
                    PublishSchedule.status == "scheduled"
                )
            ).order_by(PublishSchedule.scheduled_at)
        )
        return result.scalars().all()

    def _hours_until_publish(self, scheduled_at: datetime) -> float:
        """公開までの時間を計算"""
        delta = scheduled_at - datetime.utcnow()
        return delta.total_seconds() / 3600
