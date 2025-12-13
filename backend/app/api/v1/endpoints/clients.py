"""
クライアント管理エンドポイント

クライアントのCRUD操作API
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, require_role
from app.models import ClientPlan
from app.schemas.client import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse,
)
from app.services.client_service import ClientService

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post(
    "",
    response_model=ClientResponse,
    status_code=201,
    summary="クライアント作成",
    description="新規クライアントを作成（Owner/Teamのみ実行可能）"
)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db_session),
    _role: str = Depends(require_role(["owner", "team"]))
) -> ClientResponse:
    """
    クライアント作成

    Args:
        client_data: クライアント作成データ
        db: データベースセッション
        _role: 認証されたユーザーロール

    Returns:
        作成されたクライアント情報
    """
    client = await ClientService.create_client(db, client_data)
    return ClientResponse.model_validate(client)


@router.get(
    "",
    response_model=ClientListResponse,
    summary="クライアント一覧取得",
    description="クライアント一覧をページネーション付きで取得（Owner/Teamのみ実行可能）"
)
async def get_clients(
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(20, ge=1, le=100, description="1ページあたりの件数"),
    plan: Optional[ClientPlan] = Query(None, description="プランフィルタ"),
    db: AsyncSession = Depends(get_db_session),
    _role: str = Depends(require_role(["owner", "team"]))
) -> ClientListResponse:
    """
    クライアント一覧取得

    Args:
        page: ページ番号（1始まり）
        limit: 1ページあたりの件数
        plan: プランフィルタ
        db: データベースセッション
        _role: 認証されたユーザーロール

    Returns:
        クライアント一覧（ページネーション付き）
    """
    clients, total = await ClientService.get_clients(db, page, limit, plan)
    return ClientListResponse(
        data=[ClientResponse.model_validate(c) for c in clients],
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/{client_id}",
    response_model=ClientResponse,
    summary="クライアント詳細取得",
    description="指定されたクライアントの詳細情報を取得"
)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
    role: str = Depends(require_role(["owner", "team", "client_premium_plus", "client_premium", "client_basic"]))
) -> ClientResponse:
    """
    クライアント詳細取得

    Owner/Teamは全てのクライアント情報を取得可能
    Clientロールは自分自身のクライアント情報のみ取得可能

    Args:
        client_id: クライアントID
        db: データベースセッション
        user_id: 認証されたユーザーID
        role: 認証されたユーザーロール

    Returns:
        クライアント詳細情報
    """
    client = await ClientService.get_client_by_id(db, client_id)

    # 権限チェック: ClientロールはUser IDが一致する場合のみ
    if role not in ["owner", "team"] and str(client.user_id) != user_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のクライアントの情報にアクセスする権限がありません"
        )

    return ClientResponse.model_validate(client)


@router.put(
    "/{client_id}",
    response_model=ClientResponse,
    summary="クライアント更新",
    description="クライアント情報を更新（Owner/Teamのみ実行可能）"
)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db_session),
    _role: str = Depends(require_role(["owner", "team"]))
) -> ClientResponse:
    """
    クライアント更新

    Args:
        client_id: クライアントID
        client_data: 更新データ
        db: データベースセッション
        _role: 認証されたユーザーロール

    Returns:
        更新されたクライアント情報
    """
    client = await ClientService.update_client(db, client_id, client_data)
    return ClientResponse.model_validate(client)
