"""
タグモデル

動画コンテンツのタグ分類マスターデータ
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base


class Tag(Base):
    """タグテーブル"""
    __tablename__ = "tags"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="タグID（UUID）"
    )
    name = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="タグ名"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name={self.name})>"
