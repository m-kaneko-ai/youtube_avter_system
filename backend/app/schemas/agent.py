"""
Agent Schemas

エージェント、タスク、コメント自動化のPydanticスキーマ
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.agent import (
    AgentType,
    AgentStatus,
    TaskStatus,
    TaskPriority,
    ScheduleFrequency,
    CommentSentiment,
    ReplyStatus,
)


# ============================================================
# Agent Schemas
# ============================================================

class AgentBase(BaseModel):
    """エージェント基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    agent_type: AgentType
    config: Optional[Dict[str, Any]] = None
    is_enabled: bool = True
    auto_execute: bool = False
    max_concurrent_tasks: int = Field(default=1, ge=1, le=10)
    retry_count: int = Field(default=3, ge=0, le=10)
    timeout_seconds: int = Field(default=300, ge=30, le=3600)


class AgentCreate(AgentBase):
    """エージェント作成スキーマ"""
    knowledge_id: Optional[UUID] = None
    credentials: Optional[Dict[str, Any]] = None


class AgentUpdate(BaseModel):
    """エージェント更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None
    auto_execute: Optional[bool] = None
    max_concurrent_tasks: Optional[int] = Field(None, ge=1, le=10)
    retry_count: Optional[int] = Field(None, ge=0, le=10)
    timeout_seconds: Optional[int] = Field(None, ge=30, le=3600)


class AgentResponse(AgentBase):
    """エージェントレスポンススキーマ"""
    id: UUID
    knowledge_id: Optional[UUID]
    status: AgentStatus
    total_tasks_run: int
    successful_tasks: int
    failed_tasks: int
    last_run_at: Optional[datetime]
    last_success_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    """エージェント一覧レスポンス"""
    agents: List[AgentResponse]
    total: int


class AgentStatusUpdate(BaseModel):
    """エージェントステータス更新"""
    status: AgentStatus


# ============================================================
# Agent Task Schemas
# ============================================================

class AgentTaskBase(BaseModel):
    """エージェントタスク基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    task_type: Optional[str] = Field(None, max_length=100)
    priority: TaskPriority = TaskPriority.NORMAL
    input_data: Optional[Dict[str, Any]] = None


class AgentTaskCreate(AgentTaskBase):
    """エージェントタスク作成スキーマ"""
    agent_id: UUID
    schedule_id: Optional[UUID] = None
    max_retries: int = Field(default=3, ge=0, le=10)


class AgentTaskResponse(AgentTaskBase):
    """エージェントタスクレスポンススキーマ"""
    id: UUID
    agent_id: UUID
    schedule_id: Optional[UUID]
    status: TaskStatus
    output_data: Optional[Dict[str, Any]]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    error_message: Optional[str]
    error_details: Optional[Dict[str, Any]]
    retry_count: int
    max_retries: int
    progress_percent: Optional[float]
    progress_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentTaskListResponse(BaseModel):
    """エージェントタスク一覧レスポンス"""
    tasks: List[AgentTaskResponse]
    total: int


class TaskProgressUpdate(BaseModel):
    """タスク進捗更新"""
    progress_percent: float = Field(..., ge=0, le=100)
    progress_message: Optional[str] = Field(None, max_length=500)


# ============================================================
# Agent Schedule Schemas
# ============================================================

class AgentScheduleBase(BaseModel):
    """エージェントスケジュール基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    frequency: ScheduleFrequency
    cron_expression: Optional[str] = Field(None, max_length=100)
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)
    day_of_week: Optional[List[int]] = None  # 0-6
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    timezone: str = Field(default="Asia/Tokyo", max_length=50)
    task_config: Optional[Dict[str, Any]] = None
    is_active: bool = True


class AgentScheduleCreate(AgentScheduleBase):
    """エージェントスケジュール作成スキーマ"""
    agent_id: UUID


class AgentScheduleUpdate(BaseModel):
    """エージェントスケジュール更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    frequency: Optional[ScheduleFrequency] = None
    cron_expression: Optional[str] = Field(None, max_length=100)
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: Optional[int] = Field(None, ge=0, le=59)
    day_of_week: Optional[List[int]] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    timezone: Optional[str] = Field(None, max_length=50)
    task_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class AgentScheduleResponse(AgentScheduleBase):
    """エージェントスケジュールレスポンススキーマ"""
    id: UUID
    agent_id: UUID
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentScheduleListResponse(BaseModel):
    """エージェントスケジュール一覧レスポンス"""
    schedules: List[AgentScheduleResponse]
    total: int


# ============================================================
# Comment Template Schemas
# ============================================================

class CommentTemplateBase(BaseModel):
    """コメントテンプレート基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    target_sentiment: Optional[CommentSentiment] = None
    target_keywords: Optional[List[str]] = None
    exclude_keywords: Optional[List[str]] = None
    min_likes: Optional[int] = Field(None, ge=0)
    template_text: str
    variations: Optional[List[str]] = None
    use_ai_generation: bool = False
    ai_prompt: Optional[str] = None
    ai_style: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    priority: int = Field(default=0, ge=0)


class CommentTemplateCreate(CommentTemplateBase):
    """コメントテンプレート作成スキーマ"""
    knowledge_id: Optional[UUID] = None


class CommentTemplateUpdate(BaseModel):
    """コメントテンプレート更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    target_sentiment: Optional[CommentSentiment] = None
    target_keywords: Optional[List[str]] = None
    exclude_keywords: Optional[List[str]] = None
    min_likes: Optional[int] = Field(None, ge=0)
    template_text: Optional[str] = None
    variations: Optional[List[str]] = None
    use_ai_generation: Optional[bool] = None
    ai_prompt: Optional[str] = None
    ai_style: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)


class CommentTemplateResponse(CommentTemplateBase):
    """コメントテンプレートレスポンススキーマ"""
    id: UUID
    knowledge_id: Optional[UUID]
    usage_count: int
    success_rate: Optional[float]
    avg_engagement: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentTemplateListResponse(BaseModel):
    """コメントテンプレート一覧レスポンス"""
    templates: List[CommentTemplateResponse]
    total: int


# ============================================================
# Comment Queue Schemas
# ============================================================

class CommentQueueBase(BaseModel):
    """コメントキュー基本スキーマ"""
    video_id: UUID
    youtube_comment_id: str = Field(..., max_length=255)
    author_name: Optional[str] = Field(None, max_length=255)
    author_channel_id: Optional[str] = Field(None, max_length=255)
    comment_text: str
    comment_likes: int = Field(default=0, ge=0)
    comment_published_at: Optional[datetime] = None


class CommentQueueCreate(CommentQueueBase):
    """コメントキュー作成スキーマ"""
    template_id: Optional[UUID] = None
    requires_approval: bool = True


class CommentQueueUpdate(BaseModel):
    """コメントキュー更新スキーマ"""
    reply_text: Optional[str] = None
    status: Optional[ReplyStatus] = None
    requires_approval: Optional[bool] = None


class CommentQueueResponse(CommentQueueBase):
    """コメントキューレスポンススキーマ"""
    id: UUID
    template_id: Optional[UUID]
    sentiment: Optional[CommentSentiment]
    detected_keywords: Optional[List[str]]
    sentiment_score: Optional[float]
    is_question: bool
    reply_text: Optional[str]
    reply_generated_by: Optional[str]
    status: ReplyStatus
    requires_approval: bool
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    sent_at: Optional[datetime]
    youtube_reply_id: Optional[str]
    error_message: Optional[str]
    reply_likes: Optional[int]
    engagement_change: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentQueueListResponse(BaseModel):
    """コメントキュー一覧レスポンス"""
    comments: List[CommentQueueResponse]
    total: int


class CommentApproval(BaseModel):
    """コメント承認"""
    approved: bool
    modified_reply: Optional[str] = None


class CommentAnalysisResult(BaseModel):
    """コメント分析結果"""
    sentiment: CommentSentiment
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    is_question: bool
    detected_keywords: List[str]
    suggested_template_id: Optional[UUID] = None
    generated_reply: Optional[str] = None


# ============================================================
# Agent Log Schemas
# ============================================================

class AgentLogBase(BaseModel):
    """エージェントログ基本スキーマ"""
    level: str = Field(..., max_length=20)
    message: str
    details: Optional[Dict[str, Any]] = None
    source: Optional[str] = Field(None, max_length=255)
    action: Optional[str] = Field(None, max_length=100)


class AgentLogCreate(AgentLogBase):
    """エージェントログ作成スキーマ"""
    agent_id: UUID
    task_id: Optional[UUID] = None


class AgentLogResponse(AgentLogBase):
    """エージェントログレスポンススキーマ"""
    id: UUID
    agent_id: UUID
    task_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class AgentLogListResponse(BaseModel):
    """エージェントログ一覧レスポンス"""
    logs: List[AgentLogResponse]
    total: int


# ============================================================
# Trend Alert Schemas
# ============================================================

class TrendAlertBase(BaseModel):
    """トレンドアラート基本スキーマ"""
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    alert_type: str = Field(..., max_length=100)
    source: Optional[str] = Field(None, max_length=100)
    source_url: Optional[str] = Field(None, max_length=2048)
    keyword: Optional[str] = Field(None, max_length=255)
    trend_score: Optional[float] = None
    growth_rate: Optional[float] = None
    related_data: Optional[Dict[str, Any]] = None
    suggested_actions: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class TrendAlertCreate(TrendAlertBase):
    """トレンドアラート作成スキーマ"""
    agent_id: Optional[UUID] = None
    knowledge_id: Optional[UUID] = None


class TrendAlertUpdate(BaseModel):
    """トレンドアラート更新スキーマ"""
    is_read: Optional[bool] = None
    is_actioned: Optional[bool] = None
    action_taken: Optional[str] = None


class TrendAlertResponse(TrendAlertBase):
    """トレンドアラートレスポンススキーマ"""
    id: UUID
    agent_id: Optional[UUID]
    knowledge_id: Optional[UUID]
    is_read: bool
    is_actioned: bool
    actioned_at: Optional[datetime]
    action_taken: Optional[str]
    detected_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class TrendAlertListResponse(BaseModel):
    """トレンドアラート一覧レスポンス"""
    alerts: List[TrendAlertResponse]
    total: int


# ============================================================
# Competitor Alert Schemas
# ============================================================

class CompetitorAlertBase(BaseModel):
    """競合アラート基本スキーマ"""
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    alert_type: str = Field(..., max_length=100)
    competitor_channel_id: Optional[str] = Field(None, max_length=255)
    competitor_channel_name: Optional[str] = Field(None, max_length=255)
    competitor_video_id: Optional[str] = Field(None, max_length=255)
    competitor_video_title: Optional[str] = Field(None, max_length=500)
    competitor_video_url: Optional[str] = Field(None, max_length=2048)
    analysis: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    suggested_response: Optional[Dict[str, Any]] = None


class CompetitorAlertCreate(CompetitorAlertBase):
    """競合アラート作成スキーマ"""
    agent_id: Optional[UUID] = None
    knowledge_id: Optional[UUID] = None


class CompetitorAlertUpdate(BaseModel):
    """競合アラート更新スキーマ"""
    is_read: Optional[bool] = None
    is_actioned: Optional[bool] = None
    action_taken: Optional[str] = None


class CompetitorAlertResponse(CompetitorAlertBase):
    """競合アラートレスポンススキーマ"""
    id: UUID
    agent_id: Optional[UUID]
    knowledge_id: Optional[UUID]
    is_read: bool
    is_actioned: bool
    actioned_at: Optional[datetime]
    action_taken: Optional[str]
    detected_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class CompetitorAlertListResponse(BaseModel):
    """競合アラート一覧レスポンス"""
    alerts: List[CompetitorAlertResponse]
    total: int


# ============================================================
# Summary Schemas
# ============================================================

class AgentSummary(BaseModel):
    """エージェントサマリー"""
    total_agents: int
    active_agents: int
    running_agents: int
    total_tasks_today: int
    successful_tasks_today: int
    failed_tasks_today: int
    pending_comments: int
    unread_trend_alerts: int
    unread_competitor_alerts: int


class AgentDashboard(BaseModel):
    """エージェントダッシュボード"""
    summary: AgentSummary
    recent_agents: List[AgentResponse]
    recent_tasks: List[AgentTaskResponse]
    recent_trend_alerts: List[TrendAlertResponse]
    recent_competitor_alerts: List[CompetitorAlertResponse]
    pending_comments: List[CommentQueueResponse]
