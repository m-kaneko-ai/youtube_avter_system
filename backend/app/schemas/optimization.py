"""
Optimization Schemas

YouTubeアルゴリズム最適化のPydanticスキーマ
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================

class ABTestStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ABTestType(str, Enum):
    THUMBNAIL = "thumbnail"
    TITLE = "title"
    DESCRIPTION = "description"


class RetentionEventType(str, Enum):
    HOOK = "hook"
    DROP = "drop"
    SPIKE = "spike"
    CTA = "cta"
    END = "end"


class EndScreenElementType(str, Enum):
    VIDEO = "video"
    PLAYLIST = "playlist"
    SUBSCRIBE = "subscribe"
    LINK = "link"


class EndScreenPosition(str, Enum):
    TOP_LEFT = "top_left"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_RIGHT = "bottom_right"
    CENTER = "center"


# ============================================================
# Retention Schemas
# ============================================================

class RetentionDataPoint(BaseModel):
    """リテンションデータポイント"""
    timestamp: float = Field(..., description="タイムスタンプ（秒）")
    retention_rate: float = Field(..., description="リテンション率（%）")


class RetentionEventBase(BaseModel):
    """リテンションイベントベース"""
    event_type: RetentionEventType
    timestamp_seconds: float
    timestamp_percentage: Optional[float] = None
    retention_before: Optional[float] = None
    retention_after: Optional[float] = None
    change_rate: Optional[float] = None
    content_at_timestamp: Optional[str] = None
    analysis_notes: Optional[str] = None
    recommended_action: Optional[str] = None


class RetentionEventResponse(RetentionEventBase):
    """リテンションイベントレスポンス"""
    id: UUID
    retention_curve_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class RetentionCurveBase(BaseModel):
    """リテンション曲線ベース"""
    video_id: UUID
    knowledge_id: Optional[UUID] = None


class RetentionCurveCreate(RetentionCurveBase):
    """リテンション曲線作成"""
    data_points: List[RetentionDataPoint]
    video_length_seconds: Optional[int] = None
    sample_size: int = 0


class RetentionCurveResponse(RetentionCurveBase):
    """リテンション曲線レスポンス"""
    id: UUID
    data_points: List[Dict[str, Any]]
    avg_view_percentage: Optional[float] = None
    avg_view_duration_seconds: Optional[int] = None
    hook_retention: Optional[float] = None
    mid_retention: Optional[float] = None
    end_retention: Optional[float] = None
    major_drop_points: Optional[List[Dict[str, Any]]] = None
    recovery_points: Optional[List[Dict[str, Any]]] = None
    benchmark_comparison: Optional[float] = None
    category_rank: Optional[int] = None
    video_length_seconds: Optional[int] = None
    sample_size: int
    recorded_at: datetime
    events: List[RetentionEventResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RetentionAnalysisRequest(BaseModel):
    """リテンション分析リクエスト"""
    video_id: UUID
    include_recommendations: bool = True


class RetentionAnalysisResponse(BaseModel):
    """リテンション分析レスポンス"""
    curve: RetentionCurveResponse
    drop_points: List[RetentionEventResponse]
    recommendations: List[str]
    overall_score: float
    comparison_to_average: float


# ============================================================
# A/B Test Schemas
# ============================================================

class ABTestVariantBase(BaseModel):
    """A/Bテストバリアントベース"""
    variant_name: str = Field(..., max_length=10)
    is_control: bool = False
    content: Optional[str] = None
    image_url: Optional[str] = None
    image_data: Optional[Dict[str, Any]] = None


class ABTestVariantCreate(ABTestVariantBase):
    """A/Bテストバリアント作成"""
    pass


class ABTestVariantUpdate(BaseModel):
    """A/Bテストバリアント更新"""
    content: Optional[str] = None
    image_url: Optional[str] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    views: Optional[int] = None
    ctr: Optional[float] = None
    avg_view_duration: Optional[float] = None
    avg_view_percentage: Optional[float] = None


class ABTestVariantResponse(ABTestVariantBase):
    """A/Bテストバリアントレスポンス"""
    id: UUID
    ab_test_id: UUID
    impressions: int
    clicks: int
    views: int
    ctr: Optional[float] = None
    avg_view_duration: Optional[float] = None
    avg_view_percentage: Optional[float] = None
    likes: int
    comments: int
    shares: int
    subscribers_gained: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ABTestBase(BaseModel):
    """A/Bテストベース"""
    video_id: UUID
    knowledge_id: Optional[UUID] = None
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    test_type: ABTestType


class ABTestCreate(ABTestBase):
    """A/Bテスト作成"""
    duration_hours: int = 24
    traffic_split: float = 50.0
    min_sample_size: int = 1000
    confidence_level: float = 0.95
    variants: List[ABTestVariantCreate]


class ABTestUpdate(BaseModel):
    """A/Bテスト更新"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ABTestStatus] = None
    duration_hours: Optional[int] = None
    traffic_split: Optional[float] = None


class ABTestResponse(ABTestBase):
    """A/Bテストレスポンス"""
    id: UUID
    created_by: Optional[UUID] = None
    status: ABTestStatus
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_hours: int
    traffic_split: float
    min_sample_size: int
    confidence_level: float
    winner_variant: Optional[str] = None
    statistical_significance: Optional[float] = None
    variants: List[ABTestVariantResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ABTestListResponse(BaseModel):
    """A/Bテストリストレスポンス"""
    tests: List[ABTestResponse]
    total: int


class ABTestResultResponse(BaseModel):
    """A/Bテスト結果レスポンス"""
    test: ABTestResponse
    winner: Optional[ABTestVariantResponse] = None
    statistical_significance: float
    confidence_interval: Dict[str, float]
    recommendation: str


# ============================================================
# Posting Time Schemas
# ============================================================

class DayPerformance(BaseModel):
    """曜日別パフォーマンス"""
    day: int = Field(..., ge=0, le=6, description="曜日（0=月, 6=日）")
    avg_views: float
    avg_ctr: float
    sample_count: int


class HourPerformance(BaseModel):
    """時間別パフォーマンス"""
    hour: int = Field(..., ge=0, le=23)
    avg_views: float
    avg_ctr: float
    sample_count: int


class RecommendedSlot(BaseModel):
    """推奨投稿スロット"""
    day: int
    hour: int
    score: float
    reasoning: Optional[str] = None


class PostingTimeAnalysisBase(BaseModel):
    """最適投稿時間分析ベース"""
    knowledge_id: UUID
    video_type: Optional[str] = None


class PostingTimeAnalysisCreate(PostingTimeAnalysisBase):
    """最適投稿時間分析作成"""
    analysis_period_days: int = 90


class PostingTimeAnalysisResponse(PostingTimeAnalysisBase):
    """最適投稿時間分析レスポンス"""
    id: UUID
    analysis_period_days: int
    sample_size: int
    optimal_day_of_week: Optional[int] = None
    optimal_hour: Optional[int] = None
    optimal_minute: int
    day_performance: Optional[List[DayPerformance]] = None
    hour_performance: Optional[List[HourPerformance]] = None
    heatmap_data: Optional[List[List[float]]] = None
    recommended_slots: Optional[List[RecommendedSlot]] = None
    competitor_posting_times: Optional[Dict[str, Any]] = None
    avoid_times: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    analyzed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostingScheduleRecommendationBase(BaseModel):
    """投稿スケジュール推奨ベース"""
    analysis_id: UUID
    video_id: Optional[UUID] = None
    recommended_datetime: datetime


class PostingScheduleRecommendationCreate(PostingScheduleRecommendationBase):
    """投稿スケジュール推奨作成"""
    pass


class PostingScheduleRecommendationResponse(PostingScheduleRecommendationBase):
    """投稿スケジュール推奨レスポンス"""
    id: UUID
    recommended_day_of_week: int
    recommended_hour: int
    score: float
    reasoning: Optional[str] = None
    predicted_initial_views: Optional[int] = None
    predicted_ctr: Optional[float] = None
    is_accepted: bool
    actual_posted_at: Optional[datetime] = None
    actual_initial_views: Optional[int] = None
    actual_ctr: Optional[float] = None
    accuracy_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# End Screen Schemas
# ============================================================

class EndScreenElementBase(BaseModel):
    """終了画面要素ベース"""
    element_type: EndScreenElementType
    position: EndScreenPosition
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    start_offset_seconds: float = 0
    duration_seconds: Optional[float] = None
    target_video_id: Optional[UUID] = None
    target_playlist_id: Optional[str] = None
    target_url: Optional[str] = None
    custom_message: Optional[str] = None
    display_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    display_order: int = 0


class EndScreenElementCreate(EndScreenElementBase):
    """終了画面要素作成"""
    pass


class EndScreenElementUpdate(BaseModel):
    """終了画面要素更新"""
    position: Optional[EndScreenPosition] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    start_offset_seconds: Optional[float] = None
    duration_seconds: Optional[float] = None
    target_video_id: Optional[UUID] = None
    target_playlist_id: Optional[str] = None
    target_url: Optional[str] = None
    custom_message: Optional[str] = None
    display_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    display_order: Optional[int] = None


class EndScreenElementResponse(EndScreenElementBase):
    """終了画面要素レスポンス"""
    id: UUID
    end_screen_id: UUID
    impressions: int
    clicks: int
    click_through_rate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EndScreenBase(BaseModel):
    """終了画面ベース"""
    video_id: UUID
    knowledge_id: Optional[UUID] = None
    start_time_seconds: float
    duration_seconds: float = 20.0
    background_type: str = "video"
    background_color: Optional[str] = None
    background_image_url: Optional[str] = None


class EndScreenCreate(EndScreenBase):
    """終了画面作成"""
    elements: List[EndScreenElementCreate] = []


class EndScreenUpdate(BaseModel):
    """終了画面更新"""
    start_time_seconds: Optional[float] = None
    duration_seconds: Optional[float] = None
    background_type: Optional[str] = None
    background_color: Optional[str] = None
    background_image_url: Optional[str] = None
    is_active: Optional[bool] = None


class EndScreenResponse(EndScreenBase):
    """終了画面レスポンス"""
    id: UUID
    total_clicks: int
    click_through_rate: Optional[float] = None
    is_active: bool
    is_published: bool
    elements: List[EndScreenElementResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EndScreenTemplateBase(BaseModel):
    """終了画面テンプレートベース"""
    knowledge_id: Optional[UUID] = None
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    video_type: Optional[str] = None
    layout: Dict[str, Any]
    element_configs: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None


class EndScreenTemplateCreate(EndScreenTemplateBase):
    """終了画面テンプレート作成"""
    pass


class EndScreenTemplateUpdate(BaseModel):
    """終了画面テンプレート更新"""
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None
    element_configs: Optional[List[Dict[str, Any]]] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None


class EndScreenTemplateResponse(EndScreenTemplateBase):
    """終了画面テンプレートレスポンス"""
    id: UUID
    created_by: Optional[UUID] = None
    avg_click_through_rate: Optional[float] = None
    usage_count: int
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EndScreenTemplateListResponse(BaseModel):
    """終了画面テンプレートリストレスポンス"""
    templates: List[EndScreenTemplateResponse]
    total: int


# ============================================================
# Summary Schemas
# ============================================================

class OptimizationSummary(BaseModel):
    """最適化サマリー"""
    total_ab_tests: int
    active_ab_tests: int
    completed_ab_tests: int
    avg_ctr_improvement: Optional[float] = None
    total_end_screens: int
    avg_end_screen_ctr: Optional[float] = None
    posting_time_analyses: int
    avg_posting_accuracy: Optional[float] = None
