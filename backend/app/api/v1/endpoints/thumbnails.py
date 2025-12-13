"""
サムネイル生成エンドポイント

サムネイルの生成・取得API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.script import (
    ThumbnailGenerateRequest,
    ThumbnailResponse,
    ThumbnailGenerateResponse,
)
from app.services.script_service import ThumbnailService

router = APIRouter()


@router.post(
    "/generate",
    response_model=ThumbnailGenerateResponse,
    summary="サムネイル生成",
    description="AIを使用してサムネイル画像を生成します。",
)
async def generate_thumbnail(
    request: ThumbnailGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ThumbnailGenerateResponse:
    """サムネイル生成エンドポイント"""
    return await ThumbnailService.generate_thumbnail(db, current_user_role, request)


@router.get(
    "/{thumbnail_id}",
    response_model=ThumbnailResponse,
    summary="サムネイル取得",
    description="指定したサムネイルの詳細情報を取得します。",
)
async def get_thumbnail(
    thumbnail_id: UUID = Path(..., description="サムネイルID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ThumbnailResponse:
    """サムネイル取得エンドポイント"""
    return await ThumbnailService.get_thumbnail(db, current_user_role, thumbnail_id)
