"""
台本・メタデータ生成のPydanticスキーマ

台本生成、タイトル生成、説明文生成、サムネイル生成のリクエスト/レスポンス
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.script import ScriptStatus, GeneratorType, ThumbnailStatus


# ============================================================
# 台本生成スキーマ（6-A）
# ============================================================

class ScriptGenerateRequest(BaseModel):
    """台本生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    knowledge_id: Optional[UUID] = Field(None, description="ナレッジID")
    title: Optional[str] = Field(None, max_length=500, description="台本タイトル")
    prompt: Optional[str] = Field(None, description="追加プロンプト")
    generator: GeneratorType = Field(GeneratorType.CLAUDE, description="生成エンジン（claude/gemini）")
    target_duration: Optional[int] = Field(None, ge=30, le=3600, description="目標再生時間（秒）")
    style: Optional[str] = Field(None, description="台本スタイル（casual/formal/educational等）")


class ScriptResponse(BaseModel):
    """台本レスポンス"""
    id: UUID
    video_id: UUID
    knowledge_id: Optional[UUID] = None
    title: Optional[str] = None
    content: Optional[str] = None
    prompt: Optional[str] = None
    generator: GeneratorType
    status: ScriptStatus
    word_count: Optional[int] = None
    estimated_duration: Optional[int] = None
    generation_params: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptUpdateRequest(BaseModel):
    """台本更新リクエスト"""
    title: Optional[str] = Field(None, max_length=500, description="台本タイトル")
    content: Optional[str] = Field(None, description="台本本文")


class ScriptGenerateResponse(BaseModel):
    """台本生成開始レスポンス"""
    script_id: UUID
    status: ScriptStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")


# ============================================================
# メタデータ生成スキーマ（6-B）
# ============================================================

class TitleGenerateRequest(BaseModel):
    """タイトル生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    script_content: Optional[str] = Field(None, description="台本内容（参照用）")
    keywords: Optional[list[str]] = Field(None, description="キーワード")
    style: Optional[str] = Field(None, description="タイトルスタイル（clickbait/informative/question等）")
    count: int = Field(5, ge=1, le=10, description="生成する候補数")


class TitleGenerateResponse(BaseModel):
    """タイトル生成レスポンス"""
    video_id: UUID
    titles: list[str]
    recommended_index: int = Field(0, description="推奨タイトルのインデックス")
    generated_at: datetime


class DescriptionGenerateRequest(BaseModel):
    """説明文生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    script_content: Optional[str] = Field(None, description="台本内容（参照用）")
    title: Optional[str] = Field(None, description="動画タイトル")
    keywords: Optional[list[str]] = Field(None, description="キーワード")
    include_timestamps: bool = Field(True, description="タイムスタンプを含める")
    include_links: bool = Field(True, description="関連リンクセクションを含める")


class DescriptionGenerateResponse(BaseModel):
    """説明文生成レスポンス"""
    video_id: UUID
    description: str
    hashtags: list[str] = []
    generated_at: datetime


# ============================================================
# サムネイル生成スキーマ（6-B）
# ============================================================

class ThumbnailGenerateRequest(BaseModel):
    """サムネイル生成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")
    title: Optional[str] = Field(None, description="動画タイトル（参照用）")
    prompt: Optional[str] = Field(None, description="生成プロンプト")
    style: Optional[str] = Field(None, description="スタイル（modern/minimal/bold等）")
    include_text: bool = Field(True, description="テキストを含める")
    text_content: Optional[str] = Field(None, description="サムネイルに含めるテキスト")


class ThumbnailResponse(BaseModel):
    """サムネイルレスポンス"""
    id: UUID
    video_id: UUID
    prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: ThumbnailStatus
    width: Optional[int] = None
    height: Optional[int] = None
    generation_params: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ThumbnailGenerateResponse(BaseModel):
    """サムネイル生成開始レスポンス"""
    thumbnail_id: UUID
    status: ThumbnailStatus
    message: str
    estimated_completion: Optional[int] = Field(None, description="予想完了時間（秒）")


# ============================================================
# 共通スキーマ
# ============================================================

class GenerationStatusResponse(BaseModel):
    """生成ステータスレスポンス"""
    id: UUID
    status: str
    progress: Optional[int] = Field(None, ge=0, le=100, description="進捗（%）")
    message: Optional[str] = None
    result_url: Optional[str] = None
