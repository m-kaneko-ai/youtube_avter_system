"""
メタデータ生成エンドポイント

タイトル・説明文の生成API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.script import (
    TitleGenerateRequest,
    TitleGenerateResponse,
    DescriptionGenerateRequest,
    DescriptionGenerateResponse,
)
from app.services.script_service import MetadataService

router = APIRouter()


@router.post(
    "/title",
    response_model=TitleGenerateResponse,
    summary="タイトル生成",
    description="AIを使用して動画タイトルの候補を生成します。",
)
async def generate_title(
    request: TitleGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> TitleGenerateResponse:
    """タイトル生成エンドポイント"""
    return await MetadataService.generate_title(db, current_user_role, request)


@router.post(
    "/description",
    response_model=DescriptionGenerateResponse,
    summary="説明文生成",
    description="AIを使用して動画の説明文を生成します。",
)
async def generate_description(
    request: DescriptionGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> DescriptionGenerateResponse:
    """説明文生成エンドポイント"""
    return await MetadataService.generate_description(db, current_user_role, request)
