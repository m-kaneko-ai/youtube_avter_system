"""
台本生成エンドポイント

台本の生成・取得・更新・専門家レビューAPI
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id_dev as get_current_user_id, get_current_user_role_dev as get_current_user_role
from app.schemas.script import (
    ScriptGenerateRequest,
    ScriptResponse,
    ScriptUpdateRequest,
    ScriptGenerateResponse,
)
from app.schemas.expert_review import (
    ExpertReviewRequest,
    ExpertReviewResponse,
)
from app.services.script_service import ScriptService
from app.services.expert_review_service import expert_review_service

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


@router.post(
    "/expert-review",
    response_model=ExpertReviewResponse,
    summary="5人の専門家による台本添削",
    description="5人のAI専門家が台本を添削し、改善版と安心セットを生成します。",
)
async def expert_review_script(
    request: ExpertReviewRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ExpertReviewResponse:
    """
    専門家レビューエンドポイント

    5人の専門家が台本を添削:
    - 🎣 フックマスター: 冒頭30秒の鬼
    - 🎬 ストーリーアーキテクト: 構成全体の設計士
    - 🎭 エンタメプロデューサー: 演出とリズムの魔術師
    - 🎯 ターゲットインサイター: ペルソナ共感の専門家
    - 📣 CTAストラテジスト: 行動喚起の戦略家
    """
    # 権限チェック
    if current_user_role not in ["owner", "team"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="専門家レビューにはOwnerまたはTeamロールが必要です",
        )

    # TODO: ナレッジDBから関連情報を取得
    knowledge_context = None
    if request.knowledge_id:
        # knowledge_context = await KnowledgeService.get_context(db, request.knowledge_id)
        pass

    return await expert_review_service.review_script(request, knowledge_context)
