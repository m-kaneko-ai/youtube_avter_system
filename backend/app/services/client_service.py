"""
クライアント管理サービス

クライアントのCRUD操作ビジネスロジック
"""
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Client, ClientPlan
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:
    """クライアント管理サービス"""

    @staticmethod
    async def create_client(
        db: AsyncSession,
        client_data: ClientCreate
    ) -> Client:
        """
        クライアント作成

        Args:
            db: データベースセッション
            client_data: クライアント作成データ

        Returns:
            作成されたクライアント

        Raises:
            HTTPException: ユーザーが存在しない場合
        """
        # ユーザー存在チェックは外部キー制約で担保
        client = Client(
            user_id=client_data.user_id,
            company_name=client_data.company_name,
            plan=client_data.plan,
            knowledge_count=0
        )
        db.add(client)
        await db.commit()
        await db.refresh(client)
        return client

    @staticmethod
    async def get_clients(
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        plan: Optional[ClientPlan] = None
    ) -> tuple[list[Client], int]:
        """
        クライアント一覧取得

        Args:
            db: データベースセッション
            page: ページ番号（1始まり）
            limit: 1ページあたりの件数
            plan: フィルタ用プラン

        Returns:
            (クライアントリスト, 総件数)のタプル
        """
        # ベースクエリ
        query = select(Client)

        # プランフィルタ
        if plan:
            query = query.where(Client.plan == plan)

        # 総件数取得
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ページネーション
        offset = (page - 1) * limit
        query = query.order_by(Client.created_at.desc()).offset(offset).limit(limit)

        # データ取得
        result = await db.execute(query)
        clients = result.scalars().all()

        return list(clients), total

    @staticmethod
    async def get_client_by_id(
        db: AsyncSession,
        client_id: UUID
    ) -> Client:
        """
        クライアント詳細取得

        Args:
            db: データベースセッション
            client_id: クライアントID

        Returns:
            クライアント

        Raises:
            HTTPException: クライアントが存在しない場合
        """
        query = select(Client).where(Client.id == client_id)
        result = await db.execute(query)
        client = result.scalar_one_or_none()

        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client with id {client_id} not found"
            )

        return client

    @staticmethod
    async def update_client(
        db: AsyncSession,
        client_id: UUID,
        client_data: ClientUpdate
    ) -> Client:
        """
        クライアント更新

        Args:
            db: データベースセッション
            client_id: クライアントID
            client_data: 更新データ

        Returns:
            更新されたクライアント

        Raises:
            HTTPException: クライアントが存在しない場合
        """
        client = await ClientService.get_client_by_id(db, client_id)

        # 更新
        update_data = client_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(client, key, value)

        await db.commit()
        await db.refresh(client)
        return client
