"""
ユーザー管理エンドポイント

ユーザーCRUD操作のAPIエンドポイント
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import math

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.user_service import UserService

router = APIRouter()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="ユーザー作成",
    description="新しいユーザーを作成します。Owner/Teamのみ実行可能です。",
)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> UserResponse:
    """
    ユーザー作成エンドポイント

    Args:
        user_data: ユーザー作成データ
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        UserResponse: 作成されたユーザー情報
    """
    user = await UserService.create_user(db, user_data, current_user_role)
    return UserResponse.model_validate(user)


@router.get(
    "",
    response_model=UserListResponse,
    summary="ユーザー一覧取得",
    description="ユーザー一覧を取得します。ページネーション、ロールフィルタに対応。Owner/Teamのみ実行可能です。",
)
async def get_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> UserListResponse:
    """
    ユーザー一覧取得エンドポイント

    Args:
        page: ページ番号（デフォルト: 1）
        limit: 1ページあたりの件数（デフォルト: 20）
        role: ロールフィルタ（オプション）
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        UserListResponse: ユーザー一覧データ
    """
    users, total = await UserService.get_users(
        db, current_user_role, page, limit, role
    )

    # ページ情報計算
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return UserListResponse(
        data=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="ユーザー詳細取得",
    description="特定のユーザーの詳細情報を取得します。Owner/Team/本人のみ実行可能です。",
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> UserResponse:
    """
    ユーザー詳細取得エンドポイント

    Args:
        user_id: ユーザーID
        db: データベースセッション
        current_user_id: 実行者のユーザーID
        current_user_role: 実行者のロール

    Returns:
        UserResponse: ユーザー詳細情報
    """
    user = await UserService.get_user_by_id(
        db, user_id, current_user_id, current_user_role
    )
    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="ユーザー更新",
    description="ユーザー情報を更新します。Owner/Team/本人のみ実行可能です。ロール変更はOwnerのみ可能です。",
)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> UserResponse:
    """
    ユーザー更新エンドポイント

    Args:
        user_id: ユーザーID
        user_data: 更新データ
        db: データベースセッション
        current_user_id: 実行者のユーザーID
        current_user_role: 実行者のロール

    Returns:
        UserResponse: 更新されたユーザー情報
    """
    user = await UserService.update_user(
        db, user_id, user_data, current_user_id, current_user_role
    )
    return UserResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    response_model=UserResponse,
    summary="ユーザー削除",
    description="ユーザーを削除します（論理削除）。Ownerのみ実行可能です。",
)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> UserResponse:
    """
    ユーザー削除エンドポイント

    Args:
        user_id: ユーザーID
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        UserResponse: 削除されたユーザー情報
    """
    user = await UserService.delete_user(db, user_id, current_user_role)
    return UserResponse.model_validate(user)
