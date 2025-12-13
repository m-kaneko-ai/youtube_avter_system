"""
管理機能のPydanticスキーマ

システム設定、API連携、監査ログのリクエスト/レスポンス
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.admin import ApiConnectionStatus, AuditAction


# ============================================================
# システム設定スキーマ
# ============================================================

class SystemSettingResponse(BaseModel):
    """システム設定レスポンス"""
    id: UUID
    key: str
    value: Optional[str] = None
    value_type: str
    description: Optional[str] = None
    is_public: bool
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemSettingUpdateRequest(BaseModel):
    """システム設定更新リクエスト"""
    value: str = Field(..., description="設定値")


class SystemSettingListResponse(BaseModel):
    """システム設定一覧レスポンス"""
    settings: list[SystemSettingResponse]
    total: int


# ============================================================
# API連携スキーマ
# ============================================================

class ApiConnectionResponse(BaseModel):
    """API連携レスポンス"""
    id: UUID
    name: str
    service: str
    client_id: Optional[UUID] = None
    status: ApiConnectionStatus
    settings: Optional[dict[str, Any]] = None
    last_sync_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiConnectionCreateRequest(BaseModel):
    """API連携作成リクエスト"""
    name: str = Field(..., max_length=100, description="連携名")
    service: str = Field(..., max_length=50, description="サービス名")
    client_id: Optional[UUID] = Field(None, description="クライアントID")
    credentials: Optional[dict[str, Any]] = Field(None, description="認証情報")
    settings: Optional[dict[str, Any]] = Field(None, description="連携設定")


class ApiConnectionUpdateRequest(BaseModel):
    """API連携更新リクエスト"""
    name: Optional[str] = Field(None, max_length=100, description="連携名")
    credentials: Optional[dict[str, Any]] = Field(None, description="認証情報")
    settings: Optional[dict[str, Any]] = Field(None, description="連携設定")


class ApiConnectionTestResponse(BaseModel):
    """API連携テストレスポンス"""
    connection_id: UUID
    service: str
    status: ApiConnectionStatus
    message: str
    response_time_ms: Optional[int] = None


class ApiConnectionListResponse(BaseModel):
    """API連携一覧レスポンス"""
    connections: list[ApiConnectionResponse]
    total: int


# ============================================================
# 監査ログスキーマ
# ============================================================

class AuditLogResponse(BaseModel):
    """監査ログレスポンス"""
    id: UUID
    user_id: Optional[UUID] = None
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    extra_data: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """監査ログ一覧レスポンス"""
    logs: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


# ============================================================
# ヘルスチェック・ステータススキーマ
# ============================================================

class SystemHealthResponse(BaseModel):
    """システムヘルスレスポンス"""
    status: str
    version: str
    database: dict[str, Any]
    cache: dict[str, Any]
    external_services: dict[str, Any]
    uptime_seconds: int
