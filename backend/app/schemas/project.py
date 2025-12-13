"""
プロジェクト・動画関連のPydanticスキーマ

リクエスト/レスポンスのバリデーションに使用
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.project import (
    ProjectStatus,
    VideoStatus,
    WorkflowStepName,
    WorkflowStepStatus,
)


# ============================================================
# Project スキーマ
# ============================================================

class ProjectBase(BaseModel):
    """プロジェクト基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=255, description="プロジェクト名")
    description: Optional[str] = Field(None, description="説明")
    knowledge_id: Optional[UUID] = Field(None, description="ナレッジID")


class ProjectCreate(ProjectBase):
    """プロジェクト作成リクエスト"""
    client_id: UUID = Field(..., description="クライアントID")


class ProjectUpdate(BaseModel):
    """プロジェクト更新リクエスト"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="プロジェクト名")
    description: Optional[str] = Field(None, description="説明")
    status: Optional[ProjectStatus] = Field(None, description="ステータス")
    knowledge_id: Optional[UUID] = Field(None, description="ナレッジID")


class ProjectResponse(ProjectBase):
    """プロジェクト詳細レスポンス"""
    id: UUID
    client_id: UUID
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """プロジェクト一覧レスポンス"""
    data: list[ProjectResponse]
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ", ge=1)
    page_size: int = Field(..., description="ページサイズ", ge=1)

    class Config:
        from_attributes = True


# ============================================================
# Video スキーマ
# ============================================================

class VideoBase(BaseModel):
    """動画基本スキーマ"""
    title: Optional[str] = Field(None, max_length=500, description="タイトル")
    script: Optional[str] = Field(None, description="台本")
    video_metadata: Optional[dict[str, Any]] = Field(None, description="メタデータ（説明文、タグ等）")


class VideoCreate(VideoBase):
    """動画作成リクエスト"""
    project_id: UUID = Field(..., description="プロジェクトID")


class VideoUpdate(BaseModel):
    """動画更新リクエスト"""
    title: Optional[str] = Field(None, max_length=500, description="タイトル")
    script: Optional[str] = Field(None, description="台本")
    status: Optional[VideoStatus] = Field(None, description="ステータス")
    youtube_url: Optional[str] = Field(None, max_length=500, description="YouTube URL")
    analytics: Optional[dict[str, Any]] = Field(None, description="分析データ")
    video_metadata: Optional[dict[str, Any]] = Field(None, description="メタデータ")


class VideoResponse(VideoBase):
    """動画詳細レスポンス"""
    id: UUID
    project_id: UUID
    status: VideoStatus
    youtube_url: Optional[str]
    analytics: Optional[dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VideoListResponse(BaseModel):
    """動画一覧レスポンス"""
    data: list[VideoResponse]
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ", ge=1)
    page_size: int = Field(..., description="ページサイズ", ge=1)

    class Config:
        from_attributes = True


# ============================================================
# WorkflowStep スキーマ
# ============================================================

class WorkflowStepBase(BaseModel):
    """ワークフローステップ基本スキーマ"""
    step_name: WorkflowStepName = Field(..., description="ステップ名")
    comments: Optional[str] = Field(None, description="コメント・修正依頼")


class WorkflowStepCreate(WorkflowStepBase):
    """ワークフローステップ作成リクエスト"""
    video_id: UUID = Field(..., description="動画ID")


class WorkflowStepUpdate(BaseModel):
    """ワークフローステップ更新リクエスト"""
    status: Optional[WorkflowStepStatus] = Field(None, description="ステータス")
    comments: Optional[str] = Field(None, description="コメント・修正依頼")
    result_data: Optional[dict[str, Any]] = Field(None, description="実行結果データ")


class WorkflowStepResponse(WorkflowStepBase):
    """ワークフローステップ詳細レスポンス"""
    id: UUID
    video_id: UUID
    status: WorkflowStepStatus
    approver_id: Optional[UUID]
    approved_at: Optional[datetime]
    result_data: Optional[dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 承認関連スキーマ
# ============================================================

class VideoApprovalRequest(BaseModel):
    """動画承認リクエスト"""
    approved: bool = Field(..., description="承認するか（True=承認、False=却下）")
    comments: Optional[str] = Field(None, description="承認コメント・修正依頼")


class VideoApprovalResponse(BaseModel):
    """動画承認レスポンス"""
    video_id: UUID
    status: VideoStatus
    approved_at: datetime
    approver_id: UUID
    comments: Optional[str]

    class Config:
        from_attributes = True
