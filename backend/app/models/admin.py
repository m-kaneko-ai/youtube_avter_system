"""
管理機能モデル

システム設定、API連携、監査ログ
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLAlchemyEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ApiConnectionStatus(str, enum.Enum):
    """API連携ステータス"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class AuditAction(str, enum.Enum):
    """監査アクション種別"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    GENERATE = "generate"


class SystemSetting(Base):
    """システム設定テーブル"""
    __tablename__ = "system_settings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="設定ID（UUID）"
    )
    key = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
        comment="設定キー"
    )
    value = Column(
        Text,
        nullable=True,
        comment="設定値"
    )
    value_type = Column(
        String(50),
        nullable=False,
        default="string",
        comment="値の型（string/number/boolean/json）"
    )
    description = Column(
        Text,
        nullable=True,
        comment="設定の説明"
    )
    is_public = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="公開設定かどうか"
    )
    updated_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="更新者ID"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="更新日時"
    )

    # リレーション
    updater = relationship("User", backref="updated_settings")

    def __repr__(self) -> str:
        return f"<SystemSetting(key={self.key})>"


class ApiConnection(Base):
    """API連携テーブル"""
    __tablename__ = "api_connections"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="連携ID（UUID）"
    )
    name = Column(
        String(100),
        nullable=False,
        index=True,
        comment="連携名"
    )
    service = Column(
        String(50),
        nullable=False,
        index=True,
        comment="サービス名（youtube/tiktok/heygen等）"
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="クライアントID（クライアント固有の場合）"
    )
    status = Column(
        SQLAlchemyEnum(ApiConnectionStatus),
        nullable=False,
        default=ApiConnectionStatus.INACTIVE,
        index=True,
        comment="ステータス"
    )
    credentials = Column(
        JSONB,
        nullable=True,
        comment="認証情報（暗号化済み）"
    )
    settings = Column(
        JSONB,
        nullable=True,
        comment="連携設定"
    )
    last_sync_at = Column(
        DateTime,
        nullable=True,
        comment="最終同期日時"
    )
    error_message = Column(
        Text,
        nullable=True,
        comment="エラーメッセージ"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="更新日時"
    )

    # リレーション
    client = relationship("Client", backref="api_connections")

    def __repr__(self) -> str:
        return f"<ApiConnection(name={self.name}, service={self.service})>"


class AuditLog(Base):
    """監査ログテーブル"""
    __tablename__ = "audit_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ログID（UUID）"
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ユーザーID"
    )
    action = Column(
        SQLAlchemyEnum(AuditAction),
        nullable=False,
        index=True,
        comment="アクション"
    )
    resource_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="リソース種別"
    )
    resource_id = Column(
        String(100),
        nullable=True,
        index=True,
        comment="リソースID"
    )
    description = Column(
        Text,
        nullable=True,
        comment="説明"
    )
    ip_address = Column(
        String(50),
        nullable=True,
        comment="IPアドレス"
    )
    user_agent = Column(
        String(500),
        nullable=True,
        comment="ユーザーエージェント"
    )
    extra_data = Column(
        JSONB,
        nullable=True,
        comment="追加メタデータ"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="作成日時"
    )

    # リレーション
    user = relationship("User", backref="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog(action={self.action}, resource_type={self.resource_type})>"
