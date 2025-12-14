"""
ショート→長尺連携スキーマ

Pydanticスキーマ定義
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class VideoTypeEnum(str, Enum):
    """動画タイプ"""
    SHORT = "short"
    LONG = "long"


class EngagementStatusEnum(str, Enum):
    """連携ステータス"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class LinkTypeEnum(str, Enum):
    """連携タイプ"""
    DESCRIPTION = "description"
    PINNED_COMMENT = "pinned_comment"
    END_SCREEN = "end_screen"
    CARD = "card"


# ============================================================
# Short to Long Link Schemas
# ============================================================

class ShortToLongLinkBase(BaseModel):
    """ショート→長尺連携基本スキーマ"""
    short_video_id: str = Field(..., description="ショート動画ID")
    long_video_id: str = Field(..., description="長尺動画ID")
    link_type: str = Field("description", description="連携タイプ")
    link_text: Optional[str] = Field(None, description="誘導テキスト")
    link_position: Optional[str] = Field(None, description="リンク配置位置")


class ShortToLongLinkCreate(ShortToLongLinkBase):
    """ショート→長尺連携作成スキーマ"""
    is_active: bool = Field(True, description="有効フラグ")


class ShortToLongLinkUpdate(BaseModel):
    """ショート→長尺連携更新スキーマ"""
    link_type: Optional[str] = Field(None, description="連携タイプ")
    link_text: Optional[str] = Field(None, description="誘導テキスト")
    link_position: Optional[str] = Field(None, description="リンク配置位置")
    status: Optional[EngagementStatusEnum] = Field(None, description="ステータス")
    is_active: Optional[bool] = Field(None, description="有効フラグ")


class VideoSummary(BaseModel):
    """動画サマリー（連携表示用）"""
    id: str = Field(..., description="動画ID")
    title: Optional[str] = Field(None, description="タイトル")
    youtube_url: Optional[str] = Field(None, description="YouTube URL")
    status: str = Field(..., description="ステータス")


class ShortToLongLinkResponse(ShortToLongLinkBase):
    """ショート→長尺連携レスポンス"""
    id: str = Field(..., description="連携ID")
    status: EngagementStatusEnum = Field(..., description="ステータス")
    is_active: bool = Field(..., description="有効フラグ")
    short_video: Optional[VideoSummary] = Field(None, description="ショート動画情報")
    long_video: Optional[VideoSummary] = Field(None, description="長尺動画情報")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


# ============================================================
# Engagement Metrics Schemas
# ============================================================

class EngagementMetricsBase(BaseModel):
    """エンゲージメント指標基本スキーマ"""
    link_id: str = Field(..., description="連携ID")
    recorded_date: datetime = Field(..., description="記録日")


class EngagementMetricsCreate(EngagementMetricsBase):
    """エンゲージメント指標作成スキーマ"""
    # ショート動画指標
    short_views: int = Field(0, description="ショート動画再生回数")
    short_likes: int = Field(0, description="ショート動画いいね数")
    short_comments: int = Field(0, description="ショート動画コメント数")
    short_shares: int = Field(0, description="ショート動画共有数")
    # 長尺動画指標
    long_views: int = Field(0, description="長尺動画再生回数")
    long_likes: int = Field(0, description="長尺動画いいね数")
    long_comments: int = Field(0, description="長尺動画コメント数")
    long_watch_time_minutes: Optional[float] = Field(None, description="長尺視聴時間（分）")
    # 連携指標
    click_through_count: int = Field(0, description="クリックスルー数")
    conversion_count: int = Field(0, description="コンバージョン数")


class EngagementMetricsResponse(EngagementMetricsBase):
    """エンゲージメント指標レスポンス"""
    id: str = Field(..., description="指標ID")
    # ショート動画指標
    short_views: int = Field(..., description="ショート動画再生回数")
    short_likes: int = Field(..., description="ショート動画いいね数")
    short_comments: int = Field(..., description="ショート動画コメント数")
    short_shares: int = Field(..., description="ショート動画共有数")
    # 長尺動画指標
    long_views: int = Field(..., description="長尺動画再生回数")
    long_likes: int = Field(..., description="長尺動画いいね数")
    long_comments: int = Field(..., description="長尺動画コメント数")
    long_watch_time_minutes: Optional[float] = Field(None, description="長尺視聴時間（分）")
    # 連携指標
    click_through_count: int = Field(..., description="クリックスルー数")
    click_through_rate: Optional[float] = Field(None, description="クリックスルー率（%）")
    conversion_count: int = Field(..., description="コンバージョン数")
    conversion_rate: Optional[float] = Field(None, description="コンバージョン率（%）")
    created_at: datetime = Field(..., description="作成日時")

    class Config:
        from_attributes = True


# ============================================================
# Short Video Clip Schemas
# ============================================================

class ShortVideoClipBase(BaseModel):
    """ショート動画切り抜き基本スキーマ"""
    short_video_id: str = Field(..., description="ショート動画ID")
    source_video_id: Optional[str] = Field(None, description="元動画ID")
    start_time_seconds: Optional[int] = Field(None, description="開始時間（秒）")
    end_time_seconds: Optional[int] = Field(None, description="終了時間（秒）")
    clip_title: Optional[str] = Field(None, description="切り抜きタイトル")
    clip_description: Optional[str] = Field(None, description="切り抜き説明")


class ShortVideoClipCreate(ShortVideoClipBase):
    """ショート動画切り抜き作成スキーマ"""
    pass


class ShortVideoClipUpdate(BaseModel):
    """ショート動画切り抜き更新スキーマ"""
    start_time_seconds: Optional[int] = Field(None, description="開始時間（秒）")
    end_time_seconds: Optional[int] = Field(None, description="終了時間（秒）")
    clip_title: Optional[str] = Field(None, description="切り抜きタイトル")
    clip_description: Optional[str] = Field(None, description="切り抜き説明")
    is_published: Optional[bool] = Field(None, description="公開済みフラグ")


class ShortVideoClipResponse(ShortVideoClipBase):
    """ショート動画切り抜きレスポンス"""
    id: str = Field(..., description="切り抜きID")
    is_published: bool = Field(..., description="公開済みフラグ")
    published_at: Optional[datetime] = Field(None, description="公開日時")
    short_video: Optional[VideoSummary] = Field(None, description="ショート動画情報")
    source_video: Optional[VideoSummary] = Field(None, description="元動画情報")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


# ============================================================
# List & Stats Schemas
# ============================================================

class ShortToLongLinkListResponse(BaseModel):
    """ショート→長尺連携一覧レスポンス"""
    links: List[ShortToLongLinkResponse] = Field(..., description="連携一覧")
    total: int = Field(..., description="総数")


class EngagementSummary(BaseModel):
    """エンゲージメントサマリー"""
    total_links: int = Field(0, description="総連携数")
    active_links: int = Field(0, description="有効な連携数")
    total_clicks: int = Field(0, description="総クリック数")
    avg_ctr: float = Field(0.0, description="平均CTR")
    total_conversions: int = Field(0, description="総コンバージョン数")
    avg_conversion_rate: float = Field(0.0, description="平均コンバージョン率")


class EngagementDailyStats(BaseModel):
    """日別エンゲージメント統計"""
    date: str = Field(..., description="日付（YYYY-MM-DD）")
    short_views: int = Field(0, description="ショート再生数")
    long_views: int = Field(0, description="長尺再生数")
    clicks: int = Field(0, description="クリック数")
    conversions: int = Field(0, description="コンバージョン数")


class LinkPerformanceResponse(BaseModel):
    """連携パフォーマンスレスポンス"""
    link_id: str = Field(..., description="連携ID")
    short_video_title: Optional[str] = Field(None, description="ショート動画タイトル")
    long_video_title: Optional[str] = Field(None, description="長尺動画タイトル")
    total_short_views: int = Field(0, description="ショート総再生数")
    total_clicks: int = Field(0, description="総クリック数")
    ctr: float = Field(0.0, description="CTR（%）")
    total_conversions: int = Field(0, description="総コンバージョン数")
    conversion_rate: float = Field(0.0, description="コンバージョン率（%）")
    daily_stats: List[EngagementDailyStats] = Field(
        default_factory=list, description="日別統計"
    )
