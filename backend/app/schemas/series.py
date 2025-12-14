"""
シリーズ管理スキーマ

Pydanticスキーマ定義
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class SeriesStatusEnum(str, Enum):
    """シリーズステータス"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SeriesTypeEnum(str, Enum):
    """シリーズタイプ"""
    PLAYLIST = "playlist"
    TOPIC = "topic"
    TUTORIAL = "tutorial"
    SEASONAL = "seasonal"
    CAMPAIGN = "campaign"


class ReleaseFrequencyEnum(str, Enum):
    """公開頻度"""
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


# ============================================================
# Series Schemas
# ============================================================

class SeriesBase(BaseModel):
    """シリーズ基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255, description="シリーズ名")
    description: Optional[str] = Field(None, description="シリーズ説明")
    series_type: SeriesTypeEnum = Field(
        SeriesTypeEnum.PLAYLIST, description="シリーズタイプ"
    )


class SeriesCreate(SeriesBase):
    """シリーズ作成スキーマ"""
    project_id: Optional[str] = Field(None, description="プロジェクトID")
    knowledge_id: Optional[str] = Field(None, description="ナレッジID")
    youtube_playlist_id: Optional[str] = Field(None, description="YouTube再生リストID")
    youtube_playlist_url: Optional[str] = Field(None, description="YouTube再生リストURL")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")
    tags: Optional[List[str]] = Field(None, description="タグ")
    start_date: Optional[datetime] = Field(None, description="開始日")
    end_date: Optional[datetime] = Field(None, description="終了日")
    target_video_count: Optional[int] = Field(None, description="目標動画本数")
    release_frequency: Optional[str] = Field(None, description="公開頻度")


class SeriesUpdate(BaseModel):
    """シリーズ更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="シリーズ名")
    description: Optional[str] = Field(None, description="シリーズ説明")
    series_type: Optional[SeriesTypeEnum] = Field(None, description="シリーズタイプ")
    status: Optional[SeriesStatusEnum] = Field(None, description="ステータス")
    youtube_playlist_id: Optional[str] = Field(None, description="YouTube再生リストID")
    youtube_playlist_url: Optional[str] = Field(None, description="YouTube再生リストURL")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")
    tags: Optional[List[str]] = Field(None, description="タグ")
    start_date: Optional[datetime] = Field(None, description="開始日")
    end_date: Optional[datetime] = Field(None, description="終了日")
    target_video_count: Optional[int] = Field(None, description="目標動画本数")
    release_frequency: Optional[str] = Field(None, description="公開頻度")


class SeriesResponse(SeriesBase):
    """シリーズレスポンス"""
    id: str = Field(..., description="シリーズID")
    project_id: Optional[str] = Field(None, description="プロジェクトID")
    knowledge_id: Optional[str] = Field(None, description="ナレッジID")
    status: SeriesStatusEnum = Field(..., description="ステータス")
    youtube_playlist_id: Optional[str] = Field(None, description="YouTube再生リストID")
    youtube_playlist_url: Optional[str] = Field(None, description="YouTube再生リストURL")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")
    tags: Optional[List[str]] = Field(None, description="タグ")
    start_date: Optional[datetime] = Field(None, description="開始日")
    end_date: Optional[datetime] = Field(None, description="終了日")
    target_video_count: Optional[int] = Field(None, description="目標動画本数")
    release_frequency: Optional[str] = Field(None, description="公開頻度")
    # 統計
    total_videos: int = Field(0, description="総動画数")
    total_views: int = Field(0, description="総再生回数")
    total_watch_time_hours: Optional[float] = Field(None, description="総視聴時間（時間）")
    avg_view_duration_seconds: Optional[int] = Field(None, description="平均視聴時間（秒）")
    # タイムスタンプ
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


# ============================================================
# Series Video Item Schemas
# ============================================================

class SeriesVideoItemBase(BaseModel):
    """シリーズ動画アイテム基本スキーマ"""
    series_id: str = Field(..., description="シリーズID")
    video_id: str = Field(..., description="動画ID")
    order_index: int = Field(0, description="並び順")
    episode_number: Optional[int] = Field(None, description="エピソード番号")
    episode_title: Optional[str] = Field(None, description="エピソードタイトル")


class SeriesVideoItemCreate(BaseModel):
    """シリーズ動画アイテム作成スキーマ"""
    video_id: str = Field(..., description="動画ID")
    order_index: Optional[int] = Field(None, description="並び順")
    episode_number: Optional[int] = Field(None, description="エピソード番号")
    episode_title: Optional[str] = Field(None, description="エピソードタイトル")
    scheduled_at: Optional[datetime] = Field(None, description="公開予定日時")


class SeriesVideoItemUpdate(BaseModel):
    """シリーズ動画アイテム更新スキーマ"""
    order_index: Optional[int] = Field(None, description="並び順")
    episode_number: Optional[int] = Field(None, description="エピソード番号")
    episode_title: Optional[str] = Field(None, description="エピソードタイトル")
    scheduled_at: Optional[datetime] = Field(None, description="公開予定日時")


class VideoInfo(BaseModel):
    """動画情報（シリーズ表示用）"""
    id: str = Field(..., description="動画ID")
    title: Optional[str] = Field(None, description="タイトル")
    youtube_url: Optional[str] = Field(None, description="YouTube URL")
    status: str = Field(..., description="ステータス")


class SeriesVideoItemResponse(BaseModel):
    """シリーズ動画アイテムレスポンス"""
    id: str = Field(..., description="アイテムID")
    series_id: str = Field(..., description="シリーズID")
    video_id: str = Field(..., description="動画ID")
    order_index: int = Field(..., description="並び順")
    episode_number: Optional[int] = Field(None, description="エピソード番号")
    episode_title: Optional[str] = Field(None, description="エピソードタイトル")
    is_published: bool = Field(..., description="公開済みフラグ")
    published_at: Optional[datetime] = Field(None, description="公開日時")
    scheduled_at: Optional[datetime] = Field(None, description="公開予定日時")
    # パフォーマンス
    views: int = Field(0, description="再生回数")
    likes: int = Field(0, description="いいね数")
    comments: int = Field(0, description="コメント数")
    avg_view_duration_seconds: Optional[int] = Field(None, description="平均視聴時間（秒）")
    retention_rate: Optional[float] = Field(None, description="リテンション率（%）")
    # 動画情報
    video: Optional[VideoInfo] = Field(None, description="動画情報")
    # タイムスタンプ
    added_at: datetime = Field(..., description="追加日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


# ============================================================
# List & Stats Schemas
# ============================================================

class SeriesListResponse(BaseModel):
    """シリーズ一覧レスポンス"""
    series: List[SeriesResponse] = Field(..., description="シリーズ一覧")
    total: int = Field(..., description="総数")


class SeriesWithVideosResponse(SeriesResponse):
    """シリーズ詳細レスポンス（動画一覧含む）"""
    video_items: List[SeriesVideoItemResponse] = Field(
        default_factory=list, description="動画アイテム一覧"
    )


class SeriesStats(BaseModel):
    """シリーズ統計"""
    total_series: int = Field(0, description="総シリーズ数")
    active_series: int = Field(0, description="有効なシリーズ数")
    total_videos: int = Field(0, description="総動画数")
    total_views: int = Field(0, description="総再生回数")
    avg_videos_per_series: float = Field(0.0, description="シリーズあたり平均動画数")


class SeriesDailyStats(BaseModel):
    """シリーズ日別統計"""
    date: str = Field(..., description="日付（YYYY-MM-DD）")
    views: int = Field(0, description="再生数")
    new_subscribers: int = Field(0, description="新規登録者数")
    watch_time_minutes: float = Field(0.0, description="視聴時間（分）")


class SeriesPerformanceResponse(BaseModel):
    """シリーズパフォーマンスレスポンス"""
    series_id: str = Field(..., description="シリーズID")
    series_name: str = Field(..., description="シリーズ名")
    total_videos: int = Field(0, description="総動画数")
    total_views: int = Field(0, description="総再生回数")
    total_watch_time_hours: float = Field(0.0, description="総視聴時間（時間）")
    avg_view_duration_seconds: int = Field(0, description="平均視聴時間（秒）")
    subscriber_growth: int = Field(0, description="登録者増加数")
    daily_stats: List[SeriesDailyStats] = Field(
        default_factory=list, description="日別統計"
    )


class ReorderVideosRequest(BaseModel):
    """動画並び替えリクエスト"""
    video_ids: List[str] = Field(..., description="並び替え後の動画ID配列")


class BulkAddVideosRequest(BaseModel):
    """動画一括追加リクエスト"""
    video_ids: List[str] = Field(..., description="追加する動画ID配列")
    start_episode_number: Optional[int] = Field(None, description="開始エピソード番号")
