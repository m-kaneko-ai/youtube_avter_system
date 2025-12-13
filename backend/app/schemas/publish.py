"""
公開・配信のPydanticスキーマ

YouTube/TikTok/Instagram公開のリクエスト/レスポンス
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.publish import PublishPlatform, PublishStatus


# ============================================================
# YouTube公開スキーマ
# ============================================================

class YouTubePublishRequest(BaseModel):
    """YouTube公開リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    title: str = Field(..., max_length=100, description="動画タイトル")
    description: Optional[str] = Field(None, description="動画説明文")
    tags: Optional[list[str]] = Field(None, description="タグ")
    category_id: Optional[str] = Field(None, description="YouTubeカテゴリID")
    privacy_status: str = Field("private", description="公開設定（public/unlisted/private）")
    scheduled_at: Optional[datetime] = Field(None, description="スケジュール公開日時")


class YouTubePublishResponse(BaseModel):
    """YouTube公開レスポンス"""
    publication_id: UUID
    platform: PublishPlatform
    status: PublishStatus
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    message: str


# ============================================================
# TikTok公開スキーマ
# ============================================================

class TikTokPublishRequest(BaseModel):
    """TikTok公開リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    title: str = Field(..., max_length=150, description="動画タイトル/キャプション")
    tags: Optional[list[str]] = Field(None, description="ハッシュタグ")
    allow_comments: bool = Field(True, description="コメント許可")
    allow_duet: bool = Field(True, description="デュエット許可")
    allow_stitch: bool = Field(True, description="スティッチ許可")
    scheduled_at: Optional[datetime] = Field(None, description="スケジュール公開日時")


class TikTokPublishResponse(BaseModel):
    """TikTok公開レスポンス"""
    publication_id: UUID
    platform: PublishPlatform
    status: PublishStatus
    tiktok_video_id: Optional[str] = None
    tiktok_url: Optional[str] = None
    message: str


# ============================================================
# Instagram公開スキーマ
# ============================================================

class InstagramPublishRequest(BaseModel):
    """Instagram公開リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    caption: str = Field(..., max_length=2200, description="キャプション")
    tags: Optional[list[str]] = Field(None, description="ハッシュタグ")
    location_id: Optional[str] = Field(None, description="位置情報ID")
    share_to_feed: bool = Field(True, description="フィードにシェア")
    scheduled_at: Optional[datetime] = Field(None, description="スケジュール公開日時")


class InstagramPublishResponse(BaseModel):
    """Instagram公開レスポンス"""
    publication_id: UUID
    platform: PublishPlatform
    status: PublishStatus
    instagram_media_id: Optional[str] = None
    instagram_url: Optional[str] = None
    message: str


# ============================================================
# 公開情報取得スキーマ
# ============================================================

class PublicationResponse(BaseModel):
    """公開情報レスポンス"""
    id: UUID
    video_id: UUID
    platform: PublishPlatform
    status: PublishStatus
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    platform_video_id: Optional[str] = None
    platform_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    publish_options: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# スケジュール公開スキーマ
# ============================================================

class ScheduleCreateRequest(BaseModel):
    """スケジュール作成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    platforms: list[PublishPlatform] = Field(..., min_length=1, description="対象プラットフォーム")
    scheduled_at: datetime = Field(..., description="スケジュール日時")
    recurrence: Optional[str] = Field(None, description="繰り返し設定（daily/weekly/monthly）")
    schedule_options: Optional[dict[str, Any]] = Field(None, description="スケジュールオプション")


class ScheduleResponse(BaseModel):
    """スケジュールレスポンス"""
    id: UUID
    video_id: UUID
    platforms: list[str]
    scheduled_at: datetime
    status: PublishStatus
    recurrence: Optional[str] = None
    schedule_options: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduleCreateResponse(BaseModel):
    """スケジュール作成レスポンス"""
    schedule_id: UUID
    status: PublishStatus
    message: str
