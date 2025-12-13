"""
企画・計画機能のPydanticスキーマ

カレンダー、企画一覧、AI提案チャット、統計情報のリクエスト/レスポンス
"""
from datetime import datetime, date
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.project import ProjectStatus
from app.models.planning import SuggestionType, PlanningSessionStatus


# ============================================================
# カレンダー関連スキーマ
# ============================================================

class CalendarProjectItem(BaseModel):
    """カレンダー用プロジェクト情報"""
    id: UUID
    title: str
    type: str = Field(..., description="short/long")
    status: ProjectStatus
    scheduled_date: Optional[date] = None
    published_date: Optional[date] = None

    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    """カレンダーデータレスポンス"""
    year: int
    month: int
    projects: list[CalendarProjectItem]


class ScheduleUpdateRequest(BaseModel):
    """スケジュール更新リクエスト"""
    project_id: UUID = Field(..., description="プロジェクトID")
    scheduled_date: date = Field(..., description="予定日")


class ScheduleUpdateResponse(BaseModel):
    """スケジュール更新レスポンス"""
    success: bool
    project: dict[str, Any]


# ============================================================
# 企画一覧関連スキーマ
# ============================================================

class PlanningProjectItem(BaseModel):
    """企画一覧用プロジェクト情報"""
    id: UUID
    title: str
    category: Optional[str] = None
    type: str = Field(..., description="short/long")
    status: ProjectStatus
    scheduled_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlanningProjectDetail(BaseModel):
    """企画詳細レスポンス"""
    id: UUID
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    type: str = Field(..., description="short/long")
    status: ProjectStatus
    scheduled_date: Optional[date] = None
    knowledge_id: Optional[UUID] = None
    ai_suggestion_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanningPagination(BaseModel):
    """ページネーション情報"""
    total: int
    page: int
    limit: int
    total_pages: int


class PlanningProjectListResponse(BaseModel):
    """企画一覧レスポンス"""
    projects: list[PlanningProjectItem]
    pagination: PlanningPagination


class ProjectStatusUpdateRequest(BaseModel):
    """プロジェクトステータス更新リクエスト"""
    status: ProjectStatus = Field(..., description="新しいステータス")


class ProjectDeleteResponse(BaseModel):
    """プロジェクト削除レスポンス"""
    success: bool
    message: str


# ============================================================
# AI提案チャット関連スキーマ
# ============================================================

class ChatSessionCreateRequest(BaseModel):
    """チャットセッション作成リクエスト"""
    knowledge_id: Optional[UUID] = Field(None, description="ナレッジID")


class ChatSessionCreateResponse(BaseModel):
    """チャットセッション作成レスポンス"""
    session_id: UUID
    created_at: datetime


class AISuggestionItem(BaseModel):
    """AI提案アイテム"""
    id: UUID
    title: str
    description: Optional[str] = None
    type: SuggestionType
    tags: Optional[list[str]] = None
    estimated_views: Optional[str] = None
    confidence: Optional[float] = None

    class Config:
        from_attributes = True


class ChatMessageSendRequest(BaseModel):
    """チャットメッセージ送信リクエスト"""
    content: str = Field(..., min_length=1, max_length=5000, description="メッセージ内容")
    type: str = Field("user", description="メッセージ種別（user/system）")


class ChatMessageResponse(BaseModel):
    """チャットメッセージレスポンス"""
    message_id: UUID
    type: str = Field(..., description="メッセージ種別（user/assistant）")
    content: str
    suggestions: list[AISuggestionItem] = []
    created_at: datetime


class ChatMessageItem(BaseModel):
    """チャットメッセージ履歴アイテム"""
    message_id: UUID
    type: str
    content: str
    suggestions: list[AISuggestionItem] = []
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    """チャット履歴レスポンス"""
    session_id: UUID
    messages: list[ChatMessageItem]
    has_more: bool = False


# ============================================================
# 提案採用関連スキーマ
# ============================================================

class SuggestionAdoptRequest(BaseModel):
    """提案採用リクエスト"""
    scheduled_date: Optional[date] = Field(None, description="予定日")
    modifications: Optional[dict[str, str]] = Field(None, description="修正内容（titleなど）")


class SuggestionAdoptResponse(BaseModel):
    """提案採用レスポンス"""
    success: bool
    project: dict[str, Any]


class AdoptedSuggestionItem(BaseModel):
    """採用済み提案アイテム"""
    suggestion_id: UUID
    title: str
    type: SuggestionType
    project_id: UUID
    project_status: ProjectStatus
    scheduled_date: Optional[date] = None
    adopted_at: datetime

    class Config:
        from_attributes = True


class AdoptedSuggestionsResponse(BaseModel):
    """採用済み提案一覧レスポンス"""
    suggestions: list[AdoptedSuggestionItem]
    total: int


class SuggestionUnadoptResponse(BaseModel):
    """提案採用取り消しレスポンス"""
    success: bool
    message: str


# ============================================================
# コンテキスト関連スキーマ
# ============================================================

class TrendItem(BaseModel):
    """トレンド情報"""
    keyword: str
    volume: int
    growth: int = Field(..., description="成長率（%）")


class KnowledgeContext(BaseModel):
    """ナレッジコンテキスト"""
    target_persona: Optional[str] = None
    insights: list[str] = []
    successful_patterns: list[str] = []


class RecentProjectItem(BaseModel):
    """最近のプロジェクト情報"""
    title: str
    performance: str = Field(..., description="good/average/poor")


class PlanningContextResponse(BaseModel):
    """AI提案用コンテキストレスポンス"""
    trends: list[TrendItem]
    knowledge: Optional[KnowledgeContext] = None
    recent_projects: list[RecentProjectItem]


# ============================================================
# 統計関連スキーマ
# ============================================================

class StatusStats(BaseModel):
    """ステータス別統計"""
    planning: int = 0
    production: int = 0
    scheduled: int = 0
    published: int = 0


class TypeStats(BaseModel):
    """種別統計"""
    short: int = 0
    long: int = 0


class MonthStats(BaseModel):
    """月間統計"""
    created: int = 0
    published: int = 0


class PlanningStatsResponse(BaseModel):
    """企画統計レスポンス"""
    total_projects: int
    by_status: StatusStats
    by_type: TypeStats
    this_month: MonthStats
