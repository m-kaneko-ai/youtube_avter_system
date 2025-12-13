"""
クライアントモデル

Ownerが管理するクライアント情報を格納
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLAlchemyEnum, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ClientPlan(str, enum.Enum):
    """クライアントプラン"""
    BASIC = "basic"
    PREMIUM = "premium"
    PREMIUM_PLUS = "premium_plus"


class Client(Base):
    """クライアントテーブル"""
    __tablename__ = "clients"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="クライアントID（UUID）"
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ユーザーID（外部キー）"
    )
    company_name = Column(
        String(255),
        nullable=False,
        comment="会社名"
    )
    plan = Column(
        SQLAlchemyEnum(ClientPlan),
        nullable=False,
        default=ClientPlan.BASIC,
        comment="契約プラン"
    )
    knowledge_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="ナレッジ数"
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
    user = relationship("User", backref="clients")

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_name={self.company_name}, plan={self.plan})>"
