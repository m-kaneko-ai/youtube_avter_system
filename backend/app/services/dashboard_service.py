"""
ダッシュボードサービス

タスク管理と通知のビジネスロジック
"""
from datetime import datetime, date, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.dashboard import (
    Task,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    Notification,
    NotificationType,
)
from app.models.project import Project


class DashboardService:
    """ダッシュボードサービス"""

    @staticmethod
    async def get_today_tasks(
        db: AsyncSession,
        user_id: UUID,
        status_filter: Optional[TaskStatus] = None,
    ) -> dict:
        """
        今日のタスク一覧を取得

        Args:
            db: データベースセッション
            user_id: ユーザーID
            status_filter: ステータスフィルタ

        Returns:
            dict: タスク一覧と統計情報
        """
        today = date.today()

        # ベースクエリ
        base_query = select(Task).where(
            Task.user_id == user_id,
            or_(
                Task.due_date == today,
                Task.due_date.is_(None),
                and_(
                    Task.due_date < today,
                    Task.status != TaskStatus.COMPLETED
                )
            )
        )

        # ステータスフィルタ
        if status_filter:
            query = base_query.where(Task.status == status_filter)
        else:
            query = base_query

        # タスク取得
        query = query.options(
            selectinload(Task.project),
            selectinload(Task.video),
        ).order_by(Task.priority.desc(), Task.due_date)

        result = await db.execute(query)
        tasks = result.scalars().all()

        # 統計情報取得（全タスク）
        all_result = await db.execute(base_query)
        all_tasks = all_result.scalars().all()

        pending_count = len([t for t in all_tasks if t.status == TaskStatus.PENDING])
        in_progress_count = len([t for t in all_tasks if t.status == TaskStatus.IN_PROGRESS])
        completed_count = len([t for t in all_tasks if t.status == TaskStatus.COMPLETED])
        overdue_count = len([t for t in all_tasks if t.status == TaskStatus.OVERDUE])

        return {
            "tasks": [
                {
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description or "",
                    "category": task.category.value,
                    "status": task.status.value,
                    "priority": task.priority.value,
                    "due_time": task.due_time or "",
                    "project": task.project.name if task.project else None,
                }
                for task in tasks
            ],
            "total": len(tasks),
            "pending_count": pending_count,
            "in_progress_count": in_progress_count,
            "completed_count": completed_count,
            "overdue_count": overdue_count,
        }

    @staticmethod
    async def update_task_status(
        db: AsyncSession,
        user_id: UUID,
        task_id: UUID,
        new_status: TaskStatus,
    ) -> dict:
        """
        タスクのステータスを更新

        Args:
            db: データベースセッション
            user_id: ユーザーID
            task_id: タスクID
            new_status: 新しいステータス

        Returns:
            dict: 更新後のタスク
        """
        query = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        ).options(selectinload(Task.project))

        result = await db.execute(query)
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="タスクが見つかりません"
            )

        task.status = new_status
        if new_status == TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(task)

        return {
            "id": str(task.id),
            "title": task.title,
            "description": task.description or "",
            "category": task.category.value,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_time": task.due_time or "",
            "project": task.project.name if task.project else None,
        }

    @staticmethod
    async def get_notifications(
        db: AsyncSession,
        user_id: UUID,
        unread_only: bool = False,
    ) -> dict:
        """
        通知一覧を取得

        Args:
            db: データベースセッション
            user_id: ユーザーID
            unread_only: 未読のみ取得

        Returns:
            dict: 通知一覧と統計情報
        """
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc())

        result = await db.execute(query)
        notifications = result.scalars().all()

        # 未読数取得
        unread_query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        unread_result = await db.execute(unread_query)
        unread_count = unread_result.scalar()

        def format_time(dt: datetime) -> str:
            """時刻をフォーマット"""
            now = datetime.utcnow()
            diff = now - dt
            if diff < timedelta(minutes=1):
                return "たった今"
            elif diff < timedelta(hours=1):
                minutes = int(diff.total_seconds() / 60)
                return f"{minutes}分前"
            elif diff < timedelta(days=1):
                hours = int(diff.total_seconds() / 3600)
                return f"{hours}時間前"
            elif diff < timedelta(days=2):
                return "昨日"
            else:
                return dt.strftime("%Y/%m/%d")

        return {
            "notifications": [
                {
                    "id": str(n.id),
                    "type": n.type.value,
                    "title": n.title,
                    "message": n.message,
                    "time": format_time(n.created_at),
                    "is_read": n.is_read,
                    "action_url": n.action_url,
                }
                for n in notifications
            ],
            "total": len(notifications),
            "unread_count": unread_count,
        }

    @staticmethod
    async def mark_notification_as_read(
        db: AsyncSession,
        user_id: UUID,
        notification_id: UUID,
    ) -> dict:
        """
        通知を既読にする

        Args:
            db: データベースセッション
            user_id: ユーザーID
            notification_id: 通知ID

        Returns:
            dict: 更新後の通知
        """
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )

        result = await db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="通知が見つかりません"
            )

        notification.is_read = True
        notification.read_at = datetime.utcnow()

        await db.commit()
        await db.refresh(notification)

        return {
            "id": str(notification.id),
            "type": notification.type.value,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "action_url": notification.action_url,
        }

    @staticmethod
    async def mark_all_notifications_as_read(
        db: AsyncSession,
        user_id: UUID,
    ) -> dict:
        """
        全ての通知を既読にする

        Args:
            db: データベースセッション
            user_id: ユーザーID

        Returns:
            dict: 成功メッセージ
        """
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )

        result = await db.execute(query)
        notifications = result.scalars().all()

        now = datetime.utcnow()
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now

        await db.commit()

        return {"message": "All notifications marked as read"}

    @staticmethod
    async def delete_notification(
        db: AsyncSession,
        user_id: UUID,
        notification_id: UUID,
    ) -> dict:
        """
        通知を削除する

        Args:
            db: データベースセッション
            user_id: ユーザーID
            notification_id: 通知ID

        Returns:
            dict: 成功メッセージ
        """
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )

        result = await db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="通知が見つかりません"
            )

        await db.delete(notification)
        await db.commit()

        return {"message": "Notification deleted"}

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        action_url: Optional[str] = None,
    ) -> dict:
        """
        通知を作成する

        Args:
            db: データベースセッション
            user_id: ユーザーID
            notification_type: 通知タイプ
            title: タイトル
            message: メッセージ
            action_url: アクションURL

        Returns:
            dict: 作成された通知
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        return {
            "id": str(notification.id),
            "type": notification.type.value,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "action_url": notification.action_url,
        }

    @staticmethod
    async def create_task(
        db: AsyncSession,
        user_id: UUID,
        title: str,
        category: TaskCategory,
        priority: TaskPriority = TaskPriority.MEDIUM,
        description: Optional[str] = None,
        video_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        due_date: Optional[date] = None,
        due_time: Optional[str] = None,
    ) -> dict:
        """
        タスクを作成する

        Args:
            db: データベースセッション
            user_id: ユーザーID
            title: タイトル
            category: カテゴリ
            priority: 優先度
            description: 説明
            video_id: 動画ID
            project_id: プロジェクトID
            due_date: 期限日
            due_time: 期限時間

        Returns:
            dict: 作成されたタスク
        """
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            category=category,
            priority=priority,
            video_id=video_id,
            project_id=project_id,
            due_date=due_date or date.today(),
            due_time=due_time,
        )

        db.add(task)
        await db.commit()
        await db.refresh(task)

        return {
            "id": str(task.id),
            "title": task.title,
            "description": task.description or "",
            "category": task.category.value,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_time": task.due_time or "",
            "project": None,
        }
