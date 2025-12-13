"""
マスターデータ管理エンドポイント

カテゴリ、タグの取得API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id
from app.schemas.master import CategoryListResponse, TagListResponse, CategoryResponse, TagResponse
from app.services.master_service import MasterService

router = APIRouter(prefix="/master", tags=["master"])


@router.get(
    "/categories",
    response_model=CategoryListResponse,
    summary="カテゴリ一覧取得",
    description="動画コンテンツのカテゴリマスターデータを取得"
)
async def get_categories(
    db: AsyncSession = Depends(get_db_session),
    _user_id: str = Depends(get_current_user_id)
) -> CategoryListResponse:
    """
    カテゴリ一覧取得

    認証済みユーザーならアクセス可能

    Args:
        db: データベースセッション
        _user_id: 認証されたユーザーID

    Returns:
        カテゴリ一覧
    """
    categories = await MasterService.get_categories(db)
    return CategoryListResponse(
        data=[CategoryResponse.model_validate(c) for c in categories]
    )


@router.get(
    "/tags",
    response_model=TagListResponse,
    summary="タグ一覧取得",
    description="動画コンテンツのタグマスターデータを取得"
)
async def get_tags(
    db: AsyncSession = Depends(get_db_session),
    _user_id: str = Depends(get_current_user_id)
) -> TagListResponse:
    """
    タグ一覧取得

    認証済みユーザーならアクセス可能

    Args:
        db: データベースセッション
        _user_id: 認証されたユーザーID

    Returns:
        タグ一覧
    """
    tags = await MasterService.get_tags(db)
    return TagListResponse(
        data=[TagResponse.model_validate(t) for t in tags]
    )
