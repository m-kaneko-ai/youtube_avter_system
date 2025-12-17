"""
ユーザーモデル

Google OAuth認証により作成されるユーザー情報を管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """ユーザーロール"""
    OWNER = "owner"
    TEAM = "team"
    CLIENT_PREMIUM_PLUS = "client_premium_plus"
    CLIENT_PREMIUM = "client_premium"
    CLIENT_BASIC = "client_basic"


class User(Base):
    """ユーザーテーブル"""
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ユーザーID（UUID）"
    )
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="メールアドレス"
    )
    name = Column(
        String(255),
        nullable=False,
        comment="ユーザー名"
    )
    role = Column(
        SQLAlchemyEnum(UserRole),
        nullable=False,
        default=UserRole.CLIENT_BASIC,
        comment="ロール"
    )
    google_id = Column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
        comment="Google OAuth ID"
    )
    avatar_url = Column(
        String(500),
        nullable=True,
        comment="アバター画像URL"
    )
    # YouTube OAuth認証情報
    youtube_access_token = Column(
        String(500),
        nullable=True,
        comment="YouTube Analytics API アクセストークン"
    )
    youtube_refresh_token = Column(
        String(500),
        nullable=True,
        comment="YouTube Analytics API リフレッシュトークン"
    )
    youtube_token_expires_at = Column(
        Integer,
        nullable=True,
        comment="YouTube トークン有効期限（UNIX timestamp）"
    )
    youtube_channel_id = Column(
        String(255),
        nullable=True,
        comment="YouTube チャンネルID"
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

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
