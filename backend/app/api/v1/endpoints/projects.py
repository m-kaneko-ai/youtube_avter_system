"""
プロジェクト・動画管理エンドポイント

プロジェクト・動画CRUD操作と承認フローのAPIエンドポイント
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import math

from app.api.deps import get_db_session, get_current_user_id
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    VideoApprovalRequest,
    VideoApprovalResponse,
)
from app.services.project_service import ProjectService, VideoService
from app.models.project import ProjectStatus

router = APIRouter()


# ============================================================
# プロジェクト管理エンドポイント
# ============================================================

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="プロジェクト作成",
    description="新しいプロジェクトを作成します。",
)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> ProjectResponse:
    """
    プロジェクト作成エンドポイント

    Args:
        project_data: プロジェクト作成データ
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Returns:
        ProjectResponse: 作成されたプロジェクト情報
    """
    project = await ProjectService.create_project(db, project_data)
    return ProjectResponse.model_validate(project)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="プロジェクト一覧取得",
    description="プロジェクト一覧を取得します。ページネーション、フィルタに対応。",
)
async def get_projects(
    page: int = 1,
    limit: int = 20,
    client_id: Optional[UUID] = None,
    status: Optional[ProjectStatus] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> ProjectListResponse:
    """
    プロジェクト一覧取得エンドポイント

    Args:
        page: ページ番号（デフォルト: 1）
        limit: 1ページあたりの件数（デフォルト: 20）
        client_id: クライアントIDフィルタ（オプション）
        status: ステータスフィルタ（オプション）
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Returns:
        ProjectListResponse: プロジェクト一覧データ
    """
    projects, total = await ProjectService.get_projects(
        db, page, limit, client_id, status
    )

    return ProjectListResponse(
        data=[ProjectResponse.model_validate(project) for project in projects],
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="プロジェクト詳細取得",
    description="特定のプロジェクトの詳細情報を取得します。",
)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> ProjectResponse:
    """
    プロジェクト詳細取得エンドポイント

    Args:
        project_id: プロジェクトID
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Returns:
        ProjectResponse: プロジェクト詳細情報

    Raises:
        HTTPException: プロジェクトが存在しない場合
    """
    project = await ProjectService.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"プロジェクト（ID: {project_id}）が見つかりません"
        )
    return ProjectResponse.model_validate(project)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="プロジェクト更新",
    description="プロジェクトの情報を更新します。",
)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> ProjectResponse:
    """
    プロジェクト更新エンドポイント

    Args:
        project_id: プロジェクトID
        project_data: 更新データ
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Returns:
        ProjectResponse: 更新されたプロジェクト情報

    Raises:
        HTTPException: プロジェクトが存在しない場合
    """
    project = await ProjectService.update_project(db, project_id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"プロジェクト（ID: {project_id}）が見つかりません"
        )
    return ProjectResponse.model_validate(project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="プロジェクト削除",
    description="プロジェクトを削除します。関連する動画・ワークフローも全て削除されます。",
)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> None:
    """
    プロジェクト削除エンドポイント

    Args:
        project_id: プロジェクトID
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Raises:
        HTTPException: プロジェクトが存在しない場合
    """
    success = await ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"プロジェクト（ID: {project_id}）が見つかりません"
        )
