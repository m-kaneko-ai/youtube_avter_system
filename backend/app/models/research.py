"""
リサーチ関連モデル

競合調査・トレンド情報のキャッシュ用テーブル定義
"""
from datetime import datetime
from enum import Enum as PyEnum
from uuid import uuid4
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    JSON,
    Enum,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ResearchType(str, PyEnum):
    """リサーチタイプ"""
    COMPETITOR_CHANNEL = "competitor_channel"
    POPULAR_VIDEO = "popular_video"
    KEYWORD_TREND = "keyword_trend"
    NEWS_TREND = "news_trend"


class Research(Base):
    """
    リサーチデータ（キャッシュ）テーブル

    外部API（YouTube Data API、SerpAPI等）からの取得データをキャッシュ
    """
    __tablename__ = "research"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    research_type = Column(
        Enum(ResearchType),
        nullable=False,
        index=True,
        comment="リサーチタイプ"
    )
    query = Column(String(500), nullable=False, index=True, comment="検索クエリ")
    data = Column(JSON, nullable=False, comment="取得データ（JSON）")
    cache_expires_at = Column(DateTime, nullable=False, comment="キャッシュ有効期限")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Research(id={self.id}, type={self.research_type}, query={self.query})>"
