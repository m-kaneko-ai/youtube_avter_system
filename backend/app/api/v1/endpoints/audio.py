"""
音声生成エンドポイント

MiniMax Audio連携による音声生成API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.production import (
    AudioGenerateRequest,
    AudioResponse,
    AudioGenerateResponse,
)
from app.services.production_service import AudioService

router = APIRouter()


@router.post(
    "/generate",
    response_model=AudioGenerateResponse,
    summary="音声生成",
    description="MiniMax Audioを使用して台本から音声を生成します。",
)
async def generate_audio(
    request: AudioGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AudioGenerateResponse:
    """音声生成エンドポイント"""
    return await AudioService.generate_audio(db, current_user_role, request)


@router.get(
    "/{audio_id}",
    response_model=AudioResponse,
    summary="音声取得",
    description="指定した音声の詳細情報を取得します。",
)
async def get_audio(
    audio_id: UUID = Path(..., description="音声ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AudioResponse:
    """音声取得エンドポイント"""
    return await AudioService.get_audio(db, current_user_role, audio_id)
