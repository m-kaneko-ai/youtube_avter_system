"""
管理エンドポイント

システム設定、API連携、監査ログAPI
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.models.admin import AuditAction
from app.schemas.admin import (
    SystemSettingResponse,
    SystemSettingUpdateRequest,
    SystemSettingListResponse,
    ApiConnectionResponse,
    ApiConnectionCreateRequest,
    ApiConnectionUpdateRequest,
    ApiConnectionTestResponse,
    ApiConnectionListResponse,
    AuditLogListResponse,
    SystemHealthResponse,
)
from app.services.admin_service import (
    SettingsService,
    ApiConnectionService,
    AuditLogService,
    SystemHealthService,
)

router = APIRouter()


# ============================================================
# システム設定エンドポイント
# ============================================================

@router.get(
    "/settings",
    response_model=SystemSettingListResponse,
    summary="システム設定一覧取得",
    description="システム設定の一覧を取得します。",
)
async def list_settings(
    include_private: bool = Query(False, description="非公開設定を含む"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> SystemSettingListResponse:
    """システム設定一覧取得エンドポイント"""
    return await SettingsService.list_settings(db, current_user_role, include_private)


@router.get(
    "/settings/{key}",
    response_model=SystemSettingResponse,
    summary="システム設定取得",
    description="指定したキーのシステム設定を取得します。",
)
async def get_setting(
    key: str = Path(..., description="設定キー"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> SystemSettingResponse:
    """システム設定取得エンドポイント"""
    return await SettingsService.get_setting(db, current_user_role, key)


@router.put(
    "/settings/{key}",
    response_model=SystemSettingResponse,
    summary="システム設定更新",
    description="指定したキーのシステム設定を更新します。",
)
async def update_setting(
    request: SystemSettingUpdateRequest,
    key: str = Path(..., description="設定キー"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> SystemSettingResponse:
    """システム設定更新エンドポイント"""
    return await SettingsService.update_setting(
        db, current_user_role, current_user_id, key, request
    )


# ============================================================
# API連携エンドポイント
# ============================================================

@router.get(
    "/connections",
    response_model=ApiConnectionListResponse,
    summary="API連携一覧取得",
    description="API連携の一覧を取得します。",
)
async def list_connections(
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ApiConnectionListResponse:
    """API連携一覧取得エンドポイント"""
    return await ApiConnectionService.list_connections(db, current_user_role)


@router.post(
    "/connections",
    response_model=ApiConnectionResponse,
    summary="API連携作成",
    description="新しいAPI連携を作成します。",
)
async def create_connection(
    request: ApiConnectionCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ApiConnectionResponse:
    """API連携作成エンドポイント"""
    return await ApiConnectionService.create_connection(db, current_user_role, request)


@router.put(
    "/connections/{connection_id}",
    response_model=ApiConnectionResponse,
    summary="API連携更新",
    description="指定したAPI連携を更新します。",
)
async def update_connection(
    request: ApiConnectionUpdateRequest,
    connection_id: UUID = Path(..., description="連携ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ApiConnectionResponse:
    """API連携更新エンドポイント"""
    return await ApiConnectionService.update_connection(
        db, current_user_role, connection_id, request
    )


@router.post(
    "/connections/{connection_id}/test",
    response_model=ApiConnectionTestResponse,
    summary="API連携テスト",
    description="指定したAPI連携の接続テストを実行します。",
)
async def test_connection(
    connection_id: UUID = Path(..., description="連携ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ApiConnectionTestResponse:
    """API連携テストエンドポイント"""
    return await ApiConnectionService.test_connection(db, current_user_role, connection_id)


@router.delete(
    "/connections/{connection_id}",
    summary="API連携削除",
    description="指定したAPI連携を削除します。",
)
async def delete_connection(
    connection_id: UUID = Path(..., description="連携ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> dict:
    """API連携削除エンドポイント"""
    return await ApiConnectionService.delete_connection(db, current_user_role, connection_id)


# ============================================================
# 監査ログエンドポイント
# ============================================================

@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    summary="監査ログ一覧取得",
    description="監査ログの一覧を取得します。",
)
async def list_audit_logs(
    page: int = Query(1, ge=1, description="ページ番号"),
    page_size: int = Query(50, ge=1, le=100, description="ページサイズ"),
    action: Optional[AuditAction] = Query(None, description="アクションフィルター"),
    resource_type: Optional[str] = Query(None, description="リソース種別フィルター"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AuditLogListResponse:
    """監査ログ一覧取得エンドポイント"""
    return await AuditLogService.list_logs(
        db, current_user_role, page, page_size, action, resource_type
    )


# ============================================================
# システムヘルスエンドポイント
# ============================================================

@router.get(
    "/health",
    response_model=SystemHealthResponse,
    summary="システムヘルス取得",
    description="システムの健全性状態を取得します。",
)
async def get_system_health(
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> SystemHealthResponse:
    """システムヘルス取得エンドポイント"""
    return await SystemHealthService.get_health(db, current_user_role)
