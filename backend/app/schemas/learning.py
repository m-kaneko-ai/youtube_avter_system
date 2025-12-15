"""
Learning Schemas

パフォーマンス学習システムのPydanticスキーマ
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================
# Enums
# ============================================================

class PerformanceLevel(str, Enum):
    EXCEPTIONAL = "exceptional"
    HIGH = "high"
    AVERAGE = "average"
    BELOW_AVERAGE = "below_average"
    LOW = "low"


class LearningCategory(str, Enum):
    TITLE = "title"
    THUMBNAIL = "thumbnail"
    HOOK = "hook"
    CONTENT_STRUCTURE = "content_structure"
    CTA = "cta"
    TIMING = "timing"
    LENGTH = "length"
    TAGS = "tags"


class InsightType(str, Enum):
    SUCCESS_PATTERN = "success_pattern"
    FAILURE_PATTERN = "failure_pattern"
    TREND = "trend"
    RECOMMENDATION = "recommendation"
    CORRELATION = "correlation"


# ============================================================
# Performance Record Schemas
# ============================================================

class PerformanceRecordBase(BaseModel):
    """パフォーマンス記録ベース"""
    video_type: str = Field(..., description="動画タイプ（short/long）")
    published_at: Optional[datetime] = None
    views: int = 0
    likes: int = 0
    dislikes: int = 0
    comments: int = 0
    shares: int = 0
    subscribers_gained: int = 0
    subscribers_lost: int = 0
    watch_time_minutes: Optional[float] = None
    avg_view_duration_seconds: Optional[int] = None
    avg_view_percentage: Optional[float] = None
    impressions: int = 0
    ctr: Optional[float] = None
    title_length: Optional[int] = None
    has_number_in_title: bool = False
    has_question_in_title: bool = False
    has_emoji_in_title: bool = False
    video_length_seconds: Optional[int] = None
    publish_day_of_week: Optional[int] = None
    publish_hour: Optional[int] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    extra_attributes: Optional[Dict[str, Any]] = None


class PerformanceRecordCreate(PerformanceRecordBase):
    """パフォーマンス記録作成"""
    video_id: str
    project_id: Optional[str] = None
    knowledge_id: Optional[str] = None


class PerformanceRecordUpdate(BaseModel):
    """パフォーマンス記録更新"""
    views: Optional[int] = None
    likes: Optional[int] = None
    dislikes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    subscribers_gained: Optional[int] = None
    subscribers_lost: Optional[int] = None
    watch_time_minutes: Optional[float] = None
    avg_view_duration_seconds: Optional[int] = None
    avg_view_percentage: Optional[float] = None
    impressions: Optional[int] = None
    ctr: Optional[float] = None
    performance_level: Optional[PerformanceLevel] = None
    performance_score: Optional[float] = None


class PerformanceRecordResponse(PerformanceRecordBase):
    """パフォーマンス記録レスポンス"""
    id: str
    video_id: str
    project_id: Optional[str] = None
    knowledge_id: Optional[str] = None
    recorded_at: datetime
    performance_level: PerformanceLevel
    performance_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PerformanceRecordListResponse(BaseModel):
    """パフォーマンス記録リストレスポンス"""
    records: List[PerformanceRecordResponse]
    total: int


# ============================================================
# Learning Insight Schemas
# ============================================================

class LearningInsightBase(BaseModel):
    """学習インサイトベース"""
    insight_type: InsightType
    category: LearningCategory
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    confidence_score: float = Field(0.5, ge=0, le=1)
    sample_size: int = 0
    recommendation: Optional[str] = None
    expected_impact: Optional[str] = None


class LearningInsightCreate(LearningInsightBase):
    """学習インサイト作成"""
    knowledge_id: Optional[str] = None
    project_id: Optional[str] = None


class LearningInsightResponse(LearningInsightBase):
    """学習インサイトレスポンス"""
    id: str
    knowledge_id: Optional[str] = None
    project_id: Optional[str] = None
    is_active: bool
    is_applied: bool
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningInsightListResponse(BaseModel):
    """学習インサイトリストレスポンス"""
    insights: List[LearningInsightResponse]
    total: int


# ============================================================
# Success Pattern Schemas
# ============================================================

class SuccessPatternBase(BaseModel):
    """成功パターンベース"""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: LearningCategory
    pattern_data: Dict[str, Any]
    example_video_ids: Optional[List[str]] = None
    avg_performance_boost: Optional[float] = None
    success_rate: Optional[float] = None


class SuccessPatternCreate(SuccessPatternBase):
    """成功パターン作成"""
    knowledge_id: Optional[str] = None


class SuccessPatternResponse(SuccessPatternBase):
    """成功パターンレスポンス"""
    id: str
    knowledge_id: Optional[str] = None
    application_count: int
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SuccessPatternListResponse(BaseModel):
    """成功パターンリストレスポンス"""
    patterns: List[SuccessPatternResponse]
    total: int


# ============================================================
# Recommendation Schemas
# ============================================================

class RecommendationBase(BaseModel):
    """推奨事項ベース"""
    category: LearningCategory
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    action_items: Optional[List[Dict[str, Any]]] = None
    expected_impact_score: Optional[float] = None
    expected_metric: Optional[str] = None
    expected_improvement: Optional[str] = None


class RecommendationCreate(RecommendationBase):
    """推奨事項作成"""
    video_id: Optional[str] = None
    project_id: Optional[str] = None
    knowledge_id: Optional[str] = None
    based_on_pattern_id: Optional[str] = None
    based_on_insight_id: Optional[str] = None


class RecommendationResponse(RecommendationBase):
    """推奨事項レスポンス"""
    id: str
    video_id: Optional[str] = None
    project_id: Optional[str] = None
    knowledge_id: Optional[str] = None
    based_on_pattern_id: Optional[str] = None
    based_on_insight_id: Optional[str] = None
    is_applied: bool
    applied_at: Optional[datetime] = None
    result_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationListResponse(BaseModel):
    """推奨事項リストレスポンス"""
    recommendations: List[RecommendationResponse]
    total: int


# ============================================================
# Learning Summary Schemas
# ============================================================

class LearningSummary(BaseModel):
    """学習サマリー"""
    total_records: int
    total_insights: int
    total_patterns: int
    total_recommendations: int
    avg_performance_score: Optional[float] = None
    top_performing_category: Optional[str] = None
    most_common_success_pattern: Optional[str] = None
    active_recommendations: int


class LearningTrend(BaseModel):
    """学習トレンド"""
    date: str
    avg_performance: float
    insights_generated: int
    patterns_discovered: int


class LearningTrendsResponse(BaseModel):
    """学習トレンドレスポンス"""
    trends: List[LearningTrend]
    period_days: int


# ============================================================
# Learning Analysis Request
# ============================================================

class LearningAnalysisRequest(BaseModel):
    """学習分析リクエスト"""
    knowledge_id: Optional[str] = None
    project_id: Optional[str] = None
    video_ids: Optional[List[str]] = None
    categories: Optional[List[LearningCategory]] = None
    min_sample_size: int = Field(5, ge=1)
    confidence_threshold: float = Field(0.6, ge=0, le=1)


class LearningAnalysisResponse(BaseModel):
    """学習分析レスポンス"""
    analysis_id: str
    status: str
    insights_generated: int
    patterns_discovered: int
    recommendations_created: int
    processing_time_seconds: float
    summary: Dict[str, Any]
