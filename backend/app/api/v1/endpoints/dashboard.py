"""
ダッシュボードAPIエンドポイント

今日のタスク管理と通知管理のエンドポイントを提供
DB連携対応（DB利用不可時はモックデータにフォールバック）
"""
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.dashboard_service import DashboardService
from app.models.dashboard import (
    TaskStatus as DBTaskStatus,
    TaskPriority as DBTaskPriority,
    TaskCategory as DBTaskCategory,
    NotificationType as DBNotificationType,
)

router = APIRouter()

# DB利用フラグ（認証実装後にTrueに変更）
USE_DATABASE = False


# ============ Enums ============

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"


class TaskPriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class TaskCategory(str, Enum):
    script = "script"
    thumbnail = "thumbnail"
    video = "video"
    publish = "publish"
    review = "review"


class NotificationType(str, Enum):
    approval = "approval"
    alert = "alert"
    info = "info"
    comment = "comment"
    performance = "performance"
    video = "video"
    team = "team"
    system = "system"


# ============ Schemas ============

class Task(BaseModel):
    id: str
    title: str
    description: str
    category: TaskCategory
    status: TaskStatus
    priority: TaskPriority
    due_time: str
    project: Optional[str] = None


class TasksResponse(BaseModel):
    tasks: list[Task]
    total: int
    pending_count: int
    in_progress_count: int
    completed_count: int
    overdue_count: int


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class Notification(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    time: str
    is_read: bool
    action_url: Optional[str] = None


class NotificationsResponse(BaseModel):
    notifications: list[Notification]
    total: int
    unread_count: int


class MessageResponse(BaseModel):
    message: str


# ============ Mock Data ============
# TODO: データベース連携後は削除

MOCK_TASKS: list[Task] = [
    Task(
        id="1",
        title="【Python入門】台本の最終確認",
        description="Claude版の台本をレビューして承認",
        category=TaskCategory.script,
        status=TaskStatus.pending,
        priority=TaskPriority.high,
        due_time="10:00",
        project="Python入門シリーズ",
    ),
    Task(
        id="2",
        title="AIツール比較のサムネイル選定",
        description="5案から最終版を選択",
        category=TaskCategory.thumbnail,
        status=TaskStatus.in_progress,
        priority=TaskPriority.high,
        due_time="12:00",
        project="AIツール比較",
    ),
    Task(
        id="3",
        title="時短テクニック動画の音声確認",
        description="MiniMax Audioで生成した音声をチェック",
        category=TaskCategory.video,
        status=TaskStatus.pending,
        priority=TaskPriority.medium,
        due_time="14:00",
        project="時短テクニック",
    ),
    Task(
        id="4",
        title="ChatGPT活用術の公開設定",
        description="YouTubeへのアップロード準備",
        category=TaskCategory.publish,
        status=TaskStatus.pending,
        priority=TaskPriority.medium,
        due_time="18:00",
        project="ChatGPT活用術",
    ),
    Task(
        id="5",
        title="マーケティングトレンド企画の承認",
        description="チームメンバーからの企画提案をレビュー",
        category=TaskCategory.review,
        status=TaskStatus.overdue,
        priority=TaskPriority.high,
        due_time="昨日",
        project="マーケティングトレンド2025",
    ),
    Task(
        id="6",
        title="SNS運用の裏技 台本作成",
        description="Gemini/Claude両方で生成開始",
        category=TaskCategory.script,
        status=TaskStatus.completed,
        priority=TaskPriority.low,
        due_time="09:00",
        project="SNS運用術",
    ),
]

MOCK_NOTIFICATIONS: list[Notification] = [
    Notification(
        id="1",
        type=NotificationType.approval,
        title="承認リクエスト",
        message="「Python入門完全ガイド」の台本が承認待ちです",
        time="5分前",
        is_read=False,
        action_url="/script",
    ),
    Notification(
        id="2",
        type=NotificationType.performance,
        title="パフォーマンスアラート",
        message="「ChatGPT活用術5選」が10万再生を突破しました！",
        time="1時間前",
        is_read=False,
        action_url="/analytics",
    ),
    Notification(
        id="3",
        type=NotificationType.alert,
        title="期限アラート",
        message="「マーケティングトレンド2025」の公開予定日が明日です",
        time="2時間前",
        is_read=False,
        action_url="/publish",
    ),
    Notification(
        id="4",
        type=NotificationType.comment,
        title="新しいコメント",
        message="AIツール比較動画に高評価コメントが10件追加されました",
        time="3時間前",
        is_read=True,
        action_url="/analytics",
    ),
    Notification(
        id="5",
        type=NotificationType.video,
        title="動画生成完了",
        message="HeyGenでのアバター動画生成が完了しました",
        time="4時間前",
        is_read=True,
        action_url="/production",
    ),
    Notification(
        id="6",
        type=NotificationType.team,
        title="チームアクティビティ",
        message="田中さんが新しい企画を提案しました",
        time="5時間前",
        is_read=True,
        action_url="/planning",
    ),
    Notification(
        id="7",
        type=NotificationType.info,
        title="トレンド情報",
        message="「AI副業」関連のキーワードが急上昇中です",
        time="6時間前",
        is_read=True,
        action_url="/research",
    ),
    Notification(
        id="8",
        type=NotificationType.system,
        title="システム通知",
        message="AIクレジットの残量が20%を下回りました",
        time="昨日",
        is_read=True,
        action_url="/admin",
    ),
]


# ============ Endpoints ============

@router.get("/tasks/today", response_model=TasksResponse, tags=["Dashboard"])
async def get_today_tasks(
    status: Optional[TaskStatus] = Query(None, description="ステータスでフィルタ"),
    db: AsyncSession = Depends(get_db),
):
    """
    今日のタスク一覧を取得

    Args:
        status: フィルタするステータス（オプション）
        db: データベースセッション

    Returns:
        TasksResponse: タスク一覧と統計
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # user_id = current_user.id
        pass

    # モックデータ使用
    tasks = MOCK_TASKS.copy()

    if status:
        tasks = [t for t in tasks if t.status == status]

    all_tasks = MOCK_TASKS
    return TasksResponse(
        tasks=tasks,
        total=len(tasks),
        pending_count=len([t for t in all_tasks if t.status == TaskStatus.pending]),
        in_progress_count=len([t for t in all_tasks if t.status == TaskStatus.in_progress]),
        completed_count=len([t for t in all_tasks if t.status == TaskStatus.completed]),
        overdue_count=len([t for t in all_tasks if t.status == TaskStatus.overdue]),
    )


@router.patch("/tasks/{task_id}/status", response_model=Task, tags=["Dashboard"])
async def update_task_status(
    task_id: str,
    update: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    タスクのステータスを更新

    Args:
        task_id: タスクID
        update: 更新内容
        db: データベースセッション

    Returns:
        Task: 更新後のタスク
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # status_map = {
        #     TaskStatus.pending: DBTaskStatus.PENDING,
        #     TaskStatus.in_progress: DBTaskStatus.IN_PROGRESS,
        #     TaskStatus.completed: DBTaskStatus.COMPLETED,
        #     TaskStatus.overdue: DBTaskStatus.OVERDUE,
        # }
        # result = await DashboardService.update_task_status(
        #     db, user_id, UUID(task_id), status_map[update.status]
        # )
        # return Task(**result)
        pass

    # モックデータ使用
    for i, task in enumerate(MOCK_TASKS):
        if task.id == task_id:
            updated_task = Task(
                id=task.id,
                title=task.title,
                description=task.description,
                category=task.category,
                status=update.status,
                priority=task.priority,
                due_time=task.due_time,
                project=task.project,
            )
            MOCK_TASKS[i] = updated_task
            return updated_task

    raise HTTPException(status_code=404, detail="Task not found")


@router.get("/notifications", response_model=NotificationsResponse, tags=["Dashboard"])
async def get_notifications(
    unread_only: bool = Query(False, description="未読のみを取得"),
    db: AsyncSession = Depends(get_db),
):
    """
    通知一覧を取得

    Args:
        unread_only: 未読のみを取得するか
        db: データベースセッション

    Returns:
        NotificationsResponse: 通知一覧と統計
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # result = await DashboardService.get_notifications(db, user_id, unread_only)
        # return NotificationsResponse(**result)
        pass

    # モックデータ使用
    notifications = MOCK_NOTIFICATIONS.copy()

    if unread_only:
        notifications = [n for n in notifications if not n.is_read]

    return NotificationsResponse(
        notifications=notifications,
        total=len(notifications),
        unread_count=len([n for n in MOCK_NOTIFICATIONS if not n.is_read]),
    )


@router.post("/notifications/{notification_id}/read", response_model=Notification, tags=["Dashboard"])
async def mark_notification_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    通知を既読にする

    Args:
        notification_id: 通知ID
        db: データベースセッション

    Returns:
        Notification: 更新後の通知
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # result = await DashboardService.mark_notification_as_read(
        #     db, user_id, UUID(notification_id)
        # )
        # return Notification(**result)
        pass

    # モックデータ使用
    for i, notification in enumerate(MOCK_NOTIFICATIONS):
        if notification.id == notification_id:
            updated = Notification(
                id=notification.id,
                type=notification.type,
                title=notification.title,
                message=notification.message,
                time=notification.time,
                is_read=True,
                action_url=notification.action_url,
            )
            MOCK_NOTIFICATIONS[i] = updated
            return updated

    raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/notifications/read-all", response_model=MessageResponse, tags=["Dashboard"])
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
):
    """
    全ての通知を既読にする

    Args:
        db: データベースセッション

    Returns:
        MessageResponse: 成功メッセージ
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # result = await DashboardService.mark_all_notifications_as_read(db, user_id)
        # return MessageResponse(**result)
        pass

    # モックデータ使用
    for i, notification in enumerate(MOCK_NOTIFICATIONS):
        if not notification.is_read:
            MOCK_NOTIFICATIONS[i] = Notification(
                id=notification.id,
                type=notification.type,
                title=notification.title,
                message=notification.message,
                time=notification.time,
                is_read=True,
                action_url=notification.action_url,
            )

    return MessageResponse(message="All notifications marked as read")


@router.delete("/notifications/{notification_id}", response_model=MessageResponse, tags=["Dashboard"])
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    通知を削除する

    Args:
        notification_id: 通知ID
        db: データベースセッション

    Returns:
        MessageResponse: 成功メッセージ
    """
    # DB利用モードの場合（認証実装後に有効化）
    if USE_DATABASE:
        # TODO: 認証からuser_idを取得
        # result = await DashboardService.delete_notification(
        #     db, user_id, UUID(notification_id)
        # )
        # return MessageResponse(**result)
        pass

    # モックデータ使用
    global MOCK_NOTIFICATIONS
    original_len = len(MOCK_NOTIFICATIONS)
    MOCK_NOTIFICATIONS = [n for n in MOCK_NOTIFICATIONS if n.id != notification_id]

    if len(MOCK_NOTIFICATIONS) == original_len:
        raise HTTPException(status_code=404, detail="Notification not found")

    return MessageResponse(message="Notification deleted")
