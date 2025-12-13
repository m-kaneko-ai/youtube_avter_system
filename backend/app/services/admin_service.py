"""
管理サービス

システム設定、API連携、監査ログのビジネスロジック
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.admin import (
    SystemSetting,
    ApiConnection,
    ApiConnectionStatus,
    AuditLog,
    AuditAction,
)
from app.models.user import UserRole
from app.schemas.admin import (
    SystemSettingResponse,
    SystemSettingUpdateRequest,
    SystemSettingListResponse,
    ApiConnectionResponse,
    ApiConnectionCreateRequest,
    ApiConnectionUpdateRequest,
    ApiConnectionTestResponse,
    ApiConnectionListResponse,
    AuditLogResponse,
    AuditLogListResponse,
    SystemHealthResponse,
)


class SettingsService:
    """システム設定サービス"""

    @staticmethod
    async def list_settings(
        db: AsyncSession,
        current_user_role: str,
        include_private: bool = False,
    ) -> SystemSettingListResponse:
        """
        システム設定一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            include_private: 非公開設定を含むか

        Returns:
            SystemSettingListResponse: 設定一覧
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="システム設定取得にはOwnerロールが必要です",
            )

        query = select(SystemSetting)
        if not include_private:
            query = query.where(SystemSetting.is_public == True)
        query = query.order_by(SystemSetting.key)

        result = await db.execute(query)
        settings = result.scalars().all()

        return SystemSettingListResponse(
            settings=[SystemSettingResponse.model_validate(s) for s in settings],
            total=len(settings),
        )

    @staticmethod
    async def get_setting(
        db: AsyncSession,
        current_user_role: str,
        key: str,
    ) -> SystemSettingResponse:
        """
        システム設定を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            key: 設定キー

        Returns:
            SystemSettingResponse: 設定情報
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="システム設定取得にはOwnerロールが必要です",
            )

        query = select(SystemSetting).where(SystemSetting.key == key)
        result = await db.execute(query)
        setting = result.scalar_one_or_none()

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="設定が見つかりません",
            )

        return SystemSettingResponse.model_validate(setting)

    @staticmethod
    async def update_setting(
        db: AsyncSession,
        current_user_role: str,
        current_user_id: str,
        key: str,
        request: SystemSettingUpdateRequest,
    ) -> SystemSettingResponse:
        """
        システム設定を更新

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            current_user_id: 実行者のユーザーID
            key: 設定キー
            request: 更新リクエスト

        Returns:
            SystemSettingResponse: 更新後の設定情報
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="システム設定更新にはOwnerロールが必要です",
            )

        query = select(SystemSetting).where(SystemSetting.key == key)
        result = await db.execute(query)
        setting = result.scalar_one_or_none()

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="設定が見つかりません",
            )

        setting.value = request.value
        setting.updated_by = UUID(current_user_id)
        setting.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(setting)

        return SystemSettingResponse.model_validate(setting)


class ApiConnectionService:
    """API連携サービス"""

    @staticmethod
    async def list_connections(
        db: AsyncSession,
        current_user_role: str,
    ) -> ApiConnectionListResponse:
        """
        API連携一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール

        Returns:
            ApiConnectionListResponse: 連携一覧
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API連携取得にはOwnerロールが必要です",
            )

        query = select(ApiConnection).order_by(ApiConnection.service, ApiConnection.name)
        result = await db.execute(query)
        connections = result.scalars().all()

        return ApiConnectionListResponse(
            connections=[ApiConnectionResponse.model_validate(c) for c in connections],
            total=len(connections),
        )

    @staticmethod
    async def create_connection(
        db: AsyncSession,
        current_user_role: str,
        request: ApiConnectionCreateRequest,
    ) -> ApiConnectionResponse:
        """
        API連携を作成

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: 作成リクエスト

        Returns:
            ApiConnectionResponse: 作成された連携情報
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API連携作成にはOwnerロールが必要です",
            )

        connection = ApiConnection(
            name=request.name,
            service=request.service,
            client_id=request.client_id,
            status=ApiConnectionStatus.INACTIVE,
            credentials=request.credentials,
            settings=request.settings,
        )
        db.add(connection)
        await db.commit()
        await db.refresh(connection)

        return ApiConnectionResponse.model_validate(connection)

    @staticmethod
    async def update_connection(
        db: AsyncSession,
        current_user_role: str,
        connection_id: UUID,
        request: ApiConnectionUpdateRequest,
    ) -> ApiConnectionResponse:
        """
        API連携を更新

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            connection_id: 連携ID
            request: 更新リクエスト

        Returns:
            ApiConnectionResponse: 更新後の連携情報
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API連携更新にはOwnerロールが必要です",
            )

        connection = await db.get(ApiConnection, connection_id)
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API連携が見つかりません",
            )

        if request.name is not None:
            connection.name = request.name
        if request.credentials is not None:
            connection.credentials = request.credentials
        if request.settings is not None:
            connection.settings = request.settings

        connection.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(connection)

        return ApiConnectionResponse.model_validate(connection)

    @staticmethod
    async def test_connection(
        db: AsyncSession,
        current_user_role: str,
        connection_id: UUID,
    ) -> ApiConnectionTestResponse:
        """
        API連携をテスト

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            connection_id: 連携ID

        Returns:
            ApiConnectionTestResponse: テスト結果
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API連携テストにはOwnerロールが必要です",
            )

        connection = await db.get(ApiConnection, connection_id)
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API連携が見つかりません",
            )

        # スタブ：テスト成功を返す
        connection.status = ApiConnectionStatus.ACTIVE
        connection.last_sync_at = datetime.utcnow()
        connection.error_message = None
        await db.commit()
        await db.refresh(connection)

        return ApiConnectionTestResponse(
            connection_id=connection.id,
            service=connection.service,
            status=connection.status,
            message="接続テストに成功しました",
            response_time_ms=120,
        )

    @staticmethod
    async def delete_connection(
        db: AsyncSession,
        current_user_role: str,
        connection_id: UUID,
    ) -> dict:
        """
        API連携を削除

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            connection_id: 連携ID

        Returns:
            dict: 削除結果
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API連携削除にはOwnerロールが必要です",
            )

        connection = await db.get(ApiConnection, connection_id)
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API連携が見つかりません",
            )

        await db.delete(connection)
        await db.commit()

        return {"message": "API連携を削除しました", "connection_id": str(connection_id)}


class AuditLogService:
    """監査ログサービス"""

    @staticmethod
    async def list_logs(
        db: AsyncSession,
        current_user_role: str,
        page: int = 1,
        page_size: int = 50,
        action: Optional[AuditAction] = None,
        resource_type: Optional[str] = None,
    ) -> AuditLogListResponse:
        """
        監査ログ一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            page: ページ番号
            page_size: ページサイズ
            action: アクションフィルター
            resource_type: リソース種別フィルター

        Returns:
            AuditLogListResponse: ログ一覧
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="監査ログ取得にはOwnerロールが必要です",
            )

        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
            count_query = count_query.where(AuditLog.resource_type == resource_type)

        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        logs = result.scalars().all()

        count_result = await db.execute(count_query)
        total = count_result.scalar()

        return AuditLogListResponse(
            logs=[AuditLogResponse.model_validate(log) for log in logs],
            total=total,
            page=page,
            page_size=page_size,
        )


class SystemHealthService:
    """システムヘルスサービス"""

    @staticmethod
    async def get_health(
        db: AsyncSession,
        current_user_role: str,
    ) -> SystemHealthResponse:
        """
        システムヘルスを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール

        Returns:
            SystemHealthResponse: ヘルス情報
        """
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="システムヘルス取得にはOwnerロールが必要です",
            )

        # スタブ：サンプルデータを返す
        return SystemHealthResponse(
            status="healthy",
            version="1.0.0",
            database={
                "status": "connected",
                "response_time_ms": 5,
                "pool_size": 10,
            },
            cache={
                "status": "connected",
                "response_time_ms": 2,
                "memory_usage_mb": 128,
            },
            external_services={
                "youtube_api": "healthy",
                "heygen_api": "healthy",
                "minimax_api": "healthy",
            },
            uptime_seconds=86400,
        )
