"""
台本生成エンドポイント

台本の生成・取得・更新API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id_dev as get_current_user_id, get_current_user_role_dev as get_current_user_role
from app.schemas.script import (
    ScriptGenerateRequest,
    ScriptResponse,
    ScriptUpdateRequest,
    ScriptGenerateResponse,
)
from app.services.script_service import ScriptService

router = APIRouter()


@router.post(
    "/generate",
    response_model=ScriptGenerateResponse,
    summary="台本生成",
    description="Claude/Gemini APIを使用して台本を生成します。",
)
async def generate_script(
    request: ScriptGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScriptGenerateResponse:
    """台本生成エンドポイント"""
    return await ScriptService.generate_script(db, current_user_role, request)


@router.get(
    "/{script_id}",
    response_model=ScriptResponse,
    summary="台本取得",
    description="指定した台本の詳細情報を取得します。",
)
async def get_script(
    script_id: UUID = Path(..., description="台本ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScriptResponse:
    """台本取得エンドポイント"""
    return await ScriptService.get_script(db, current_user_role, script_id)


@router.put(
    "/{script_id}",
    response_model=ScriptResponse,
    summary="台本更新",
    description="台本の内容を更新します。",
)
async def update_script(
    script_id: UUID = Path(..., description="台本ID"),
    request: ScriptUpdateRequest = ...,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScriptResponse:
    """台本更新エンドポイント"""
    return await ScriptService.update_script(db, current_user_role, script_id, request)
