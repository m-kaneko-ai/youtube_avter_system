"""
動画制作のPydanticスキーマ

音声生成、アバター動画生成、B-roll生成のリクエスト/レスポンス
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.production import GenerationStatus


# ============================================================
# 音声生成スキーマ（7-A: Audio）
# ============================================================

class AudioGenerateRequest(BaseModel):
    """音声生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    script_id: Optional[UUID] = Field(None, description="台本ID")
    voice_id: Optional[str] = Field(None, max_length=100, description="MiniMax Audio ボイスID")
    voice_name: Optional[str] = Field(None, max_length=200, description="ボイス名")
    text: Optional[str] = Field(None, description="読み上げテキスト（台本IDがない場合に使用）")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="読み上げ速度")
    pitch: float = Field(0.0, ge=-12.0, le=12.0, description="ピッチ調整")


class AudioResponse(BaseModel):
    """音声レスポンス"""
    id: UUID
    video_id: UUID
    script_id: Optional[UUID] = None
    voice_id: Optional[str] = None
    voice_name: Optional[str] = None
    text: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[float] = None
    status: GenerationStatus
    speed: Optional[float] = None
    pitch: Optional[float] = None
    generation_params: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AudioGenerateResponse(BaseModel):
    """音声生成開始レスポンス"""
    audio_id: UUID
    status: GenerationStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")


# ============================================================
# アバター動画生成スキーマ（7-B: Avatar）
# ============================================================

class AvatarGenerateRequest(BaseModel):
    """アバター動画生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    audio_id: Optional[UUID] = Field(None, description="音声ID（MiniMax Audio生成済み）")
    script_id: Optional[UUID] = Field(None, description="台本ID（音声IDがない場合にHeyGen TTSで使用）")
    voice_id: Optional[str] = Field(None, max_length=100, description="HeyGen ボイスID（TTS用）")
    avatar_id: Optional[str] = Field(None, max_length=100, description="HeyGen アバターID")
    avatar_name: Optional[str] = Field(None, max_length=200, description="アバター名")
    width: int = Field(1920, ge=640, le=3840, description="動画幅（px）")
    height: int = Field(1080, ge=360, le=2160, description="動画高さ（px）")
    background_color: Optional[str] = Field(None, description="背景色")
    background_url: Optional[str] = Field(None, description="背景画像URL")


class AvatarResponse(BaseModel):
    """アバター動画レスポンス"""
    id: UUID
    video_id: UUID
    audio_id: Optional[UUID] = None
    avatar_id: Optional[str] = None
    avatar_name: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    status: GenerationStatus
    heygen_task_id: Optional[str] = None
    generation_params: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AvatarGenerateResponse(BaseModel):
    """アバター動画生成開始レスポンス"""
    avatar_id: UUID
    status: GenerationStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")


# ============================================================
# B-roll動画生成スキーマ（7-C: B-roll）
# ============================================================

class BrollGenerateRequest(BaseModel):
    """B-roll動画生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    prompt: str = Field(..., min_length=10, description="生成プロンプト")
    style: Optional[str] = Field(None, description="映像スタイル（cinematic/documentary/modern等）")
    duration: float = Field(5.0, ge=2.0, le=30.0, description="動画長（秒）")
    width: int = Field(1920, ge=640, le=3840, description="動画幅（px）")
    height: int = Field(1080, ge=360, le=2160, description="動画高さ（px）")
    timestamp_start: Optional[float] = Field(None, ge=0, description="挿入開始位置（秒）")
    timestamp_end: Optional[float] = Field(None, ge=0, description="挿入終了位置（秒）")


class BrollResponse(BaseModel):
    """B-roll動画レスポンス"""
    id: UUID
    video_id: UUID
    prompt: Optional[str] = None
    style: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    status: GenerationStatus
    veo_task_id: Optional[str] = None
    timestamp_start: Optional[float] = None
    timestamp_end: Optional[float] = None
    generation_params: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BrollGenerateResponse(BaseModel):
    """B-roll動画生成開始レスポンス"""
    broll_id: UUID
    status: GenerationStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")


# ============================================================
# 共通スキーマ
# ============================================================

class ProductionStatusResponse(BaseModel):
    """動画制作ステータスレスポンス"""
    id: UUID
    type: str = Field(..., description="生成タイプ（audio/avatar/broll）")
    status: GenerationStatus
    progress: Optional[int] = Field(None, ge=0, le=100, description="進捗（%）")
    message: Optional[str] = None
    result_url: Optional[str] = None
