"""
エージェント自動化APIエンドポイント

エージェント管理、タスク実行、コメント自動化、トレンド/競合アラート
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.agent import (
    Agent,
    AgentTask,
    AgentSchedule,
    CommentTemplate,
    CommentQueue,
    AgentLog,
    TrendAlert,
    CompetitorAlert,
    AgentType,
    AgentStatus,
    TaskStatus,
    TaskPriority,
    ScheduleFrequency,
    CommentSentiment,
    ReplyStatus,
)
from app.schemas.agent import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentListResponse,
    AgentStatusUpdate,
    AgentTaskCreate,
    AgentTaskResponse,
    AgentTaskListResponse,
    TaskProgressUpdate,
    AgentScheduleCreate,
    AgentScheduleUpdate,
    AgentScheduleResponse,
    AgentScheduleListResponse,
    CommentTemplateCreate,
    CommentTemplateUpdate,
    CommentTemplateResponse,
    CommentTemplateListResponse,
    CommentQueueCreate,
    CommentQueueUpdate,
    CommentQueueResponse,
    CommentQueueListResponse,
    CommentApproval,
    CommentAnalysisResult,
    AgentLogCreate,
    AgentLogResponse,
    AgentLogListResponse,
    TrendAlertCreate,
    TrendAlertUpdate,
    TrendAlertResponse,
    TrendAlertListResponse,
    CompetitorAlertCreate,
    CompetitorAlertUpdate,
    CompetitorAlertResponse,
    CompetitorAlertListResponse,
    AgentSummary,
    AgentDashboard,
)

router = APIRouter()


# ============================================================
# Agent Endpoints
# ============================================================

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(
    agent_type: Optional[str] = Query(None, description="エージェントタイプでフィルタ"),
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    is_enabled: Optional[bool] = Query(None, description="有効/無効でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェント一覧を取得"""
    query = select(Agent)

    if agent_type:
        query = query.where(Agent.agent_type == agent_type)
    if status:
        query = query.where(Agent.status == status)
    if is_enabled is not None:
        query = query.where(Agent.is_enabled == is_enabled)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(Agent.created_at.desc())
    result = await db.execute(query)
    agents = result.scalars().all()

    return AgentListResponse(
        agents=[AgentResponse.model_validate(a) for a in agents],
        total=total,
    )


@router.post("/agents", response_model=AgentResponse)
async def create_agent(
    data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントを作成"""
    agent = Agent(
        name=data.name,
        description=data.description,
        agent_type=data.agent_type,
        knowledge_id=data.knowledge_id,
        config=data.config,
        credentials=data.credentials,
        is_enabled=data.is_enabled,
        auto_execute=data.auto_execute,
        max_concurrent_tasks=data.max_concurrent_tasks,
        retry_count=data.retry_count,
        timeout_seconds=data.timeout_seconds,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    return AgentResponse.model_validate(agent)


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェント詳細を取得"""
    result = await db.execute(
        select(Agent).where(Agent.id == UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse.model_validate(agent)


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントを更新"""
    result = await db.execute(
        select(Agent).where(Agent.id == UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)

    await db.commit()
    await db.refresh(agent)

    return AgentResponse.model_validate(agent)


@router.delete("/agents/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントを削除"""
    result = await db.execute(
        select(Agent).where(Agent.id == UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await db.delete(agent)
    await db.commit()

    return {"message": "Agent deleted successfully"}


@router.post("/agents/{agent_id}/status", response_model=AgentResponse)
async def update_agent_status(
    agent_id: str,
    data: AgentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントステータスを更新"""
    result = await db.execute(
        select(Agent).where(Agent.id == UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = data.status
    await db.commit()
    await db.refresh(agent)

    return AgentResponse.model_validate(agent)


@router.post("/agents/{agent_id}/run", response_model=AgentTaskResponse)
async def run_agent(
    agent_id: str,
    task_name: str = Query(..., description="タスク名"),
    input_data: Optional[dict] = None,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントを手動実行"""
    result = await db.execute(
        select(Agent).where(Agent.id == UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.is_enabled:
        raise HTTPException(status_code=400, detail="Agent is disabled")

    # Create task
    task = AgentTask(
        agent_id=agent.id,
        name=task_name,
        input_data=input_data,
        status=TaskStatus.PENDING,
        priority=TaskPriority.NORMAL,
    )
    db.add(task)

    # Update agent status
    agent.status = AgentStatus.RUNNING
    agent.last_run_at = datetime.utcnow()

    await db.commit()
    await db.refresh(task)

    # TODO: Trigger actual task execution via Celery

    return AgentTaskResponse.model_validate(task)


# ============================================================
# Agent Task Endpoints
# ============================================================

@router.get("/tasks", response_model=AgentTaskListResponse)
async def get_agent_tasks(
    agent_id: Optional[str] = Query(None, description="エージェントIDでフィルタ"),
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    priority: Optional[str] = Query(None, description="優先度でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントタスク一覧を取得"""
    query = select(AgentTask)

    if agent_id:
        query = query.where(AgentTask.agent_id == UUID(agent_id))
    if status:
        query = query.where(AgentTask.status == status)
    if priority:
        query = query.where(AgentTask.priority == priority)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(AgentTask.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()

    return AgentTaskListResponse(
        tasks=[AgentTaskResponse.model_validate(t) for t in tasks],
        total=total,
    )


@router.get("/tasks/{task_id}", response_model=AgentTaskResponse)
async def get_agent_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントタスク詳細を取得"""
    result = await db.execute(
        select(AgentTask).where(AgentTask.id == UUID(task_id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return AgentTaskResponse.model_validate(task)


@router.post("/tasks/{task_id}/cancel")
async def cancel_agent_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントタスクをキャンセル"""
    result = await db.execute(
        select(AgentTask).where(AgentTask.id == UUID(task_id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Task already completed or cancelled")

    task.status = TaskStatus.CANCELLED
    task.completed_at = datetime.utcnow()
    await db.commit()

    return {"message": "Task cancelled successfully"}


# ============================================================
# Agent Schedule Endpoints
# ============================================================

@router.get("/schedules", response_model=AgentScheduleListResponse)
async def get_agent_schedules(
    agent_id: Optional[str] = Query(None, description="エージェントIDでフィルタ"),
    is_active: Optional[bool] = Query(None, description="有効/無効でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントスケジュール一覧を取得"""
    query = select(AgentSchedule)

    if agent_id:
        query = query.where(AgentSchedule.agent_id == UUID(agent_id))
    if is_active is not None:
        query = query.where(AgentSchedule.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(AgentSchedule.created_at.desc())
    result = await db.execute(query)
    schedules = result.scalars().all()

    return AgentScheduleListResponse(
        schedules=[AgentScheduleResponse.model_validate(s) for s in schedules],
        total=total,
    )


@router.post("/schedules", response_model=AgentScheduleResponse)
async def create_agent_schedule(
    data: AgentScheduleCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントスケジュールを作成"""
    schedule = AgentSchedule(
        agent_id=data.agent_id,
        name=data.name,
        description=data.description,
        frequency=data.frequency,
        cron_expression=data.cron_expression,
        hour=data.hour,
        minute=data.minute,
        day_of_week=data.day_of_week,
        day_of_month=data.day_of_month,
        timezone=data.timezone,
        task_config=data.task_config,
        is_active=data.is_active,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return AgentScheduleResponse.model_validate(schedule)


@router.put("/schedules/{schedule_id}", response_model=AgentScheduleResponse)
async def update_agent_schedule(
    schedule_id: str,
    data: AgentScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントスケジュールを更新"""
    result = await db.execute(
        select(AgentSchedule).where(AgentSchedule.id == UUID(schedule_id))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule)

    return AgentScheduleResponse.model_validate(schedule)


@router.delete("/schedules/{schedule_id}")
async def delete_agent_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントスケジュールを削除"""
    result = await db.execute(
        select(AgentSchedule).where(AgentSchedule.id == UUID(schedule_id))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    await db.delete(schedule)
    await db.commit()

    return {"message": "Schedule deleted successfully"}


# ============================================================
# Comment Template Endpoints
# ============================================================

@router.get("/comment-templates", response_model=CommentTemplateListResponse)
async def get_comment_templates(
    knowledge_id: Optional[str] = Query(None, description="ナレッジIDでフィルタ"),
    category: Optional[str] = Query(None, description="カテゴリでフィルタ"),
    target_sentiment: Optional[str] = Query(None, description="対象感情でフィルタ"),
    is_active: Optional[bool] = Query(None, description="有効/無効でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """コメントテンプレート一覧を取得"""
    query = select(CommentTemplate)

    if knowledge_id:
        query = query.where(CommentTemplate.knowledge_id == UUID(knowledge_id))
    if category:
        query = query.where(CommentTemplate.category == category)
    if target_sentiment:
        query = query.where(CommentTemplate.target_sentiment == target_sentiment)
    if is_active is not None:
        query = query.where(CommentTemplate.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(CommentTemplate.priority.desc())
    result = await db.execute(query)
    templates = result.scalars().all()

    return CommentTemplateListResponse(
        templates=[CommentTemplateResponse.model_validate(t) for t in templates],
        total=total,
    )


@router.post("/comment-templates", response_model=CommentTemplateResponse)
async def create_comment_template(
    data: CommentTemplateCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """コメントテンプレートを作成"""
    template = CommentTemplate(
        knowledge_id=data.knowledge_id,
        name=data.name,
        description=data.description,
        category=data.category,
        target_sentiment=data.target_sentiment,
        target_keywords=data.target_keywords,
        exclude_keywords=data.exclude_keywords,
        min_likes=data.min_likes,
        template_text=data.template_text,
        variations=data.variations,
        use_ai_generation=data.use_ai_generation,
        ai_prompt=data.ai_prompt,
        ai_style=data.ai_style,
        is_active=data.is_active,
        priority=data.priority,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return CommentTemplateResponse.model_validate(template)


@router.put("/comment-templates/{template_id}", response_model=CommentTemplateResponse)
async def update_comment_template(
    template_id: str,
    data: CommentTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """コメントテンプレートを更新"""
    result = await db.execute(
        select(CommentTemplate).where(CommentTemplate.id == UUID(template_id))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    await db.commit()
    await db.refresh(template)

    return CommentTemplateResponse.model_validate(template)


@router.delete("/comment-templates/{template_id}")
async def delete_comment_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """コメントテンプレートを削除"""
    result = await db.execute(
        select(CommentTemplate).where(CommentTemplate.id == UUID(template_id))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(template)
    await db.commit()

    return {"message": "Template deleted successfully"}


# ============================================================
# Comment Queue Endpoints
# ============================================================

@router.get("/comment-queue", response_model=CommentQueueListResponse)
async def get_comment_queue(
    video_id: Optional[str] = Query(None, description="動画IDでフィルタ"),
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    sentiment: Optional[str] = Query(None, description="感情でフィルタ"),
    requires_approval: Optional[bool] = Query(None, description="承認要否でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """コメントキュー一覧を取得"""
    query = select(CommentQueue)

    if video_id:
        query = query.where(CommentQueue.video_id == UUID(video_id))
    if status:
        query = query.where(CommentQueue.status == status)
    if sentiment:
        query = query.where(CommentQueue.sentiment == sentiment)
    if requires_approval is not None:
        query = query.where(CommentQueue.requires_approval == requires_approval)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(CommentQueue.created_at.desc())
    result = await db.execute(query)
    comments = result.scalars().all()

    return CommentQueueListResponse(
        comments=[CommentQueueResponse.model_validate(c) for c in comments],
        total=total,
    )


@router.post("/comment-queue/{comment_id}/approve", response_model=CommentQueueResponse)
async def approve_comment(
    comment_id: str,
    data: CommentApproval,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """コメント返信を承認/却下"""
    result = await db.execute(
        select(CommentQueue).where(CommentQueue.id == UUID(comment_id))
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if data.approved:
        comment.status = ReplyStatus.APPROVED
        comment.approved_by = current_user.id
        comment.approved_at = datetime.utcnow()
        if data.modified_reply:
            comment.reply_text = data.modified_reply
    else:
        comment.status = ReplyStatus.SKIPPED

    await db.commit()
    await db.refresh(comment)

    return CommentQueueResponse.model_validate(comment)


@router.post("/comment-queue/{comment_id}/send", response_model=CommentQueueResponse)
async def send_comment_reply(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """承認済みコメント返信を送信"""
    result = await db.execute(
        select(CommentQueue).where(CommentQueue.id == UUID(comment_id))
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.status != ReplyStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Comment not approved")

    # TODO: Implement actual YouTube reply via API
    comment.status = ReplyStatus.SENT
    comment.sent_at = datetime.utcnow()

    await db.commit()
    await db.refresh(comment)

    return CommentQueueResponse.model_validate(comment)


# ============================================================
# Trend Alert Endpoints
# ============================================================

@router.get("/trend-alerts", response_model=TrendAlertListResponse)
async def get_trend_alerts(
    knowledge_id: Optional[str] = Query(None, description="ナレッジIDでフィルタ"),
    alert_type: Optional[str] = Query(None, description="アラートタイプでフィルタ"),
    is_read: Optional[bool] = Query(None, description="既読/未読でフィルタ"),
    is_actioned: Optional[bool] = Query(None, description="対応済/未対応でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """トレンドアラート一覧を取得"""
    query = select(TrendAlert)

    if knowledge_id:
        query = query.where(TrendAlert.knowledge_id == UUID(knowledge_id))
    if alert_type:
        query = query.where(TrendAlert.alert_type == alert_type)
    if is_read is not None:
        query = query.where(TrendAlert.is_read == is_read)
    if is_actioned is not None:
        query = query.where(TrendAlert.is_actioned == is_actioned)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(TrendAlert.detected_at.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()

    return TrendAlertListResponse(
        alerts=[TrendAlertResponse.model_validate(a) for a in alerts],
        total=total,
    )


@router.put("/trend-alerts/{alert_id}", response_model=TrendAlertResponse)
async def update_trend_alert(
    alert_id: str,
    data: TrendAlertUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """トレンドアラートを更新"""
    result = await db.execute(
        select(TrendAlert).where(TrendAlert.id == UUID(alert_id))
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "is_actioned" and value:
            alert.actioned_at = datetime.utcnow()
        setattr(alert, key, value)

    await db.commit()
    await db.refresh(alert)

    return TrendAlertResponse.model_validate(alert)


@router.post("/trend-alerts/{alert_id}/read", response_model=TrendAlertResponse)
async def mark_trend_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """トレンドアラートを既読にする"""
    result = await db.execute(
        select(TrendAlert).where(TrendAlert.id == UUID(alert_id))
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    await db.commit()
    await db.refresh(alert)

    return TrendAlertResponse.model_validate(alert)


# ============================================================
# Competitor Alert Endpoints
# ============================================================

@router.get("/competitor-alerts", response_model=CompetitorAlertListResponse)
async def get_competitor_alerts(
    knowledge_id: Optional[str] = Query(None, description="ナレッジIDでフィルタ"),
    alert_type: Optional[str] = Query(None, description="アラートタイプでフィルタ"),
    competitor_channel_id: Optional[str] = Query(None, description="競合チャンネルIDでフィルタ"),
    is_read: Optional[bool] = Query(None, description="既読/未読でフィルタ"),
    is_actioned: Optional[bool] = Query(None, description="対応済/未対応でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """競合アラート一覧を取得"""
    query = select(CompetitorAlert)

    if knowledge_id:
        query = query.where(CompetitorAlert.knowledge_id == UUID(knowledge_id))
    if alert_type:
        query = query.where(CompetitorAlert.alert_type == alert_type)
    if competitor_channel_id:
        query = query.where(CompetitorAlert.competitor_channel_id == competitor_channel_id)
    if is_read is not None:
        query = query.where(CompetitorAlert.is_read == is_read)
    if is_actioned is not None:
        query = query.where(CompetitorAlert.is_actioned == is_actioned)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(CompetitorAlert.detected_at.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()

    return CompetitorAlertListResponse(
        alerts=[CompetitorAlertResponse.model_validate(a) for a in alerts],
        total=total,
    )


@router.put("/competitor-alerts/{alert_id}", response_model=CompetitorAlertResponse)
async def update_competitor_alert(
    alert_id: str,
    data: CompetitorAlertUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """競合アラートを更新"""
    result = await db.execute(
        select(CompetitorAlert).where(CompetitorAlert.id == UUID(alert_id))
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "is_actioned" and value:
            alert.actioned_at = datetime.utcnow()
        setattr(alert, key, value)

    await db.commit()
    await db.refresh(alert)

    return CompetitorAlertResponse.model_validate(alert)


@router.post("/competitor-alerts/{alert_id}/read", response_model=CompetitorAlertResponse)
async def mark_competitor_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """競合アラートを既読にする"""
    result = await db.execute(
        select(CompetitorAlert).where(CompetitorAlert.id == UUID(alert_id))
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    await db.commit()
    await db.refresh(alert)

    return CompetitorAlertResponse.model_validate(alert)


# ============================================================
# Agent Logs Endpoints
# ============================================================

@router.get("/logs", response_model=AgentLogListResponse)
async def get_agent_logs(
    agent_id: Optional[str] = Query(None, description="エージェントIDでフィルタ"),
    task_id: Optional[str] = Query(None, description="タスクIDでフィルタ"),
    level: Optional[str] = Query(None, description="ログレベルでフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントログ一覧を取得"""
    query = select(AgentLog)

    if agent_id:
        query = query.where(AgentLog.agent_id == UUID(agent_id))
    if task_id:
        query = query.where(AgentLog.task_id == UUID(task_id))
    if level:
        query = query.where(AgentLog.level == level)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(AgentLog.created_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()

    return AgentLogListResponse(
        logs=[AgentLogResponse.model_validate(log) for log in logs],
        total=total,
    )


# ============================================================
# Dashboard/Summary Endpoints
# ============================================================

@router.get("/summary", response_model=AgentSummary)
async def get_agent_summary(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントサマリーを取得"""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Agent counts
    total_agents_result = await db.execute(select(func.count(Agent.id)))
    total_agents = total_agents_result.scalar() or 0

    active_agents_result = await db.execute(
        select(func.count(Agent.id)).where(Agent.is_enabled == True)
    )
    active_agents = active_agents_result.scalar() or 0

    running_agents_result = await db.execute(
        select(func.count(Agent.id)).where(Agent.status == AgentStatus.RUNNING)
    )
    running_agents = running_agents_result.scalar() or 0

    # Task counts today
    total_tasks_today_result = await db.execute(
        select(func.count(AgentTask.id)).where(AgentTask.created_at >= today)
    )
    total_tasks_today = total_tasks_today_result.scalar() or 0

    successful_tasks_today_result = await db.execute(
        select(func.count(AgentTask.id)).where(
            and_(
                AgentTask.created_at >= today,
                AgentTask.status == TaskStatus.COMPLETED
            )
        )
    )
    successful_tasks_today = successful_tasks_today_result.scalar() or 0

    failed_tasks_today_result = await db.execute(
        select(func.count(AgentTask.id)).where(
            and_(
                AgentTask.created_at >= today,
                AgentTask.status == TaskStatus.FAILED
            )
        )
    )
    failed_tasks_today = failed_tasks_today_result.scalar() or 0

    # Pending comments
    pending_comments_result = await db.execute(
        select(func.count(CommentQueue.id)).where(CommentQueue.status == ReplyStatus.PENDING)
    )
    pending_comments = pending_comments_result.scalar() or 0

    # Unread alerts
    unread_trend_alerts_result = await db.execute(
        select(func.count(TrendAlert.id)).where(TrendAlert.is_read == False)
    )
    unread_trend_alerts = unread_trend_alerts_result.scalar() or 0

    unread_competitor_alerts_result = await db.execute(
        select(func.count(CompetitorAlert.id)).where(CompetitorAlert.is_read == False)
    )
    unread_competitor_alerts = unread_competitor_alerts_result.scalar() or 0

    return AgentSummary(
        total_agents=total_agents,
        active_agents=active_agents,
        running_agents=running_agents,
        total_tasks_today=total_tasks_today,
        successful_tasks_today=successful_tasks_today,
        failed_tasks_today=failed_tasks_today,
        pending_comments=pending_comments,
        unread_trend_alerts=unread_trend_alerts,
        unread_competitor_alerts=unread_competitor_alerts,
    )


@router.get("/dashboard", response_model=AgentDashboard)
async def get_agent_dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エージェントダッシュボードを取得"""
    # Get summary
    summary = await get_agent_summary(db=db, _current_user=_current_user)

    # Recent agents
    agents_result = await db.execute(
        select(Agent).order_by(Agent.updated_at.desc()).limit(5)
    )
    recent_agents = agents_result.scalars().all()

    # Recent tasks
    tasks_result = await db.execute(
        select(AgentTask).order_by(AgentTask.created_at.desc()).limit(10)
    )
    recent_tasks = tasks_result.scalars().all()

    # Recent trend alerts
    trend_alerts_result = await db.execute(
        select(TrendAlert).order_by(TrendAlert.detected_at.desc()).limit(5)
    )
    recent_trend_alerts = trend_alerts_result.scalars().all()

    # Recent competitor alerts
    competitor_alerts_result = await db.execute(
        select(CompetitorAlert).order_by(CompetitorAlert.detected_at.desc()).limit(5)
    )
    recent_competitor_alerts = competitor_alerts_result.scalars().all()

    # Pending comments
    pending_comments_result = await db.execute(
        select(CommentQueue)
        .where(CommentQueue.status == ReplyStatus.PENDING)
        .order_by(CommentQueue.created_at.desc())
        .limit(10)
    )
    pending_comments = pending_comments_result.scalars().all()

    return AgentDashboard(
        summary=summary,
        recent_agents=[AgentResponse.model_validate(a) for a in recent_agents],
        recent_tasks=[AgentTaskResponse.model_validate(t) for t in recent_tasks],
        recent_trend_alerts=[TrendAlertResponse.model_validate(a) for a in recent_trend_alerts],
        recent_competitor_alerts=[CompetitorAlertResponse.model_validate(a) for a in recent_competitor_alerts],
        pending_comments=[CommentQueueResponse.model_validate(c) for c in pending_comments],
    )
