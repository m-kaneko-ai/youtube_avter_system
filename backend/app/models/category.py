"""
カテゴリモデル

動画コンテンツのカテゴリ分類マスターデータ
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base


class Category(Base):
    """カテゴリテーブル"""
    __tablename__ = "categories"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="カテゴリID（UUID）"
    )
    name = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="カテゴリ名"
    )
    description = Column(
        Text,
        nullable=True,
        comment="説明"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name})>"
