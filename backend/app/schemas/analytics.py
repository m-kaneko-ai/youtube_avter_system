"""
分析機能のPydanticスキーマ

動画分析、チャンネル分析、レポート生成のリクエスト/レスポンス
"""
from datetime import datetime, date
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.analytics import ReportType, ReportStatus


# ============================================================
# 動画分析スキーマ
# ============================================================

class VideoAnalyticsResponse(BaseModel):
    """動画分析レスポンス"""
    video_id: UUID
    date_from: date
    date_to: date
    total_views: int = 0
    total_watch_time_minutes: float = 0.0
    average_view_duration: float = 0.0
    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    subscribers_gained: int = 0
    subscribers_lost: int = 0
    average_ctr: float = 0.0
    total_impressions: int = 0
    traffic_sources: Optional[dict[str, Any]] = None
    demographics: Optional[dict[str, Any]] = None
    daily_stats: Optional[list[dict[str, Any]]] = None


# ============================================================
# チャンネル分析スキーマ
# ============================================================

class ChannelOverviewResponse(BaseModel):
    """チャンネル概要レスポンス"""
    client_id: UUID
    date_from: date
    date_to: date
    total_views: int = 0
    total_watch_time_minutes: float = 0.0
    subscribers: int = 0
    subscribers_change: int = 0
    total_videos: int = 0
    average_ctr: float = 0.0
    estimated_revenue: float = 0.0
    top_videos: Optional[list[dict[str, Any]]] = None
    daily_stats: Optional[list[dict[str, Any]]] = None


# ============================================================
# パフォーマンスレポートスキーマ
# ============================================================

class PerformanceReportResponse(BaseModel):
    """パフォーマンスレポートレスポンス"""
    client_id: UUID
    date_from: date
    date_to: date
    summary: dict[str, Any]
    video_performance: list[dict[str, Any]]
    growth_metrics: dict[str, Any]
    engagement_metrics: dict[str, Any]
    comparison: Optional[dict[str, Any]] = None


# ============================================================
# トレンド分析スキーマ
# ============================================================

class TrendAnalysisResponse(BaseModel):
    """トレンド分析レスポンス"""
    client_id: UUID
    date_from: date
    date_to: date
    view_trend: list[dict[str, Any]]
    subscriber_trend: list[dict[str, Any]]
    engagement_trend: list[dict[str, Any]]
    best_performing_time: Optional[dict[str, Any]] = None
    content_performance: Optional[list[dict[str, Any]]] = None


# ============================================================
# レポート生成スキーマ
# ============================================================

class ReportGenerateRequest(BaseModel):
    """レポート生成リクエスト"""
    report_type: ReportType = Field(ReportType.WEEKLY, description="レポートタイプ")
    date_from: date = Field(..., description="開始日")
    date_to: date = Field(..., description="終了日")
    title: Optional[str] = Field(None, max_length=500, description="レポートタイトル")
    include_video_details: bool = Field(True, description="動画詳細を含む")
    include_recommendations: bool = Field(True, description="改善提案を含む")
    export_format: str = Field("json", description="エクスポート形式（json/pdf/csv）")


class ReportResponse(BaseModel):
    """レポートレスポンス"""
    id: UUID
    client_id: UUID
    report_type: ReportType
    status: ReportStatus
    title: Optional[str] = None
    date_from: date
    date_to: date
    summary: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportGenerateResponse(BaseModel):
    """レポート生成開始レスポンス"""
    report_id: UUID
    status: ReportStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")
