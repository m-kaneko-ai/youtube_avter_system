"""
アバター動画生成エンドポイント

HeyGen連携によるAIアバター動画生成API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.production import (
    AvatarGenerateRequest,
    AvatarResponse,
    AvatarGenerateResponse,
)
from app.services.production_service import AvatarService

router = APIRouter()


@router.post(
    "/generate",
    response_model=AvatarGenerateResponse,
    summary="アバター動画生成",
    description="HeyGenを使用してAIアバター動画を生成します。",
)
async def generate_avatar(
    request: AvatarGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AvatarGenerateResponse:
    """アバター動画生成エンドポイント"""
    return await AvatarService.generate_avatar(db, current_user_role, request)


@router.get(
    "/{avatar_id}",
    response_model=AvatarResponse,
    summary="アバター動画取得",
    description="指定したアバター動画の詳細情報を取得します。",
)
async def get_avatar(
    avatar_id: UUID = Path(..., description="アバター動画ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AvatarResponse:
    """アバター動画取得エンドポイント"""
    return await AvatarService.get_avatar(db, current_user_role, avatar_id)
