"""
B-roll動画生成エンドポイント

Veo連携によるB-roll動画生成API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.production import (
    BrollGenerateRequest,
    BrollResponse,
    BrollGenerateResponse,
)
from app.services.production_service import BrollService

router = APIRouter()


@router.post(
    "/generate",
    response_model=BrollGenerateResponse,
    summary="B-roll動画生成",
    description="Veoを使用してB-roll動画を生成します。",
)
async def generate_broll(
    request: BrollGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> BrollGenerateResponse:
    """B-roll動画生成エンドポイント"""
    return await BrollService.generate_broll(db, current_user_role, request)


@router.get(
    "/{broll_id}",
    response_model=BrollResponse,
    summary="B-roll動画取得",
    description="指定したB-roll動画の詳細情報を取得します。",
)
async def get_broll(
    broll_id: UUID = Path(..., description="B-roll動画ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> BrollResponse:
    """B-roll動画取得エンドポイント"""
    return await BrollService.get_broll(db, current_user_role, broll_id)
