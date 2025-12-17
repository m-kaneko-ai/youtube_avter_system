"""
ナレッジモデル

1ナレッジ = 1ブランド/事業 または 1コンテンツシリーズ
8セクション構造でターゲット・競合・コンセプト・戦略を管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLAlchemyEnum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import uuid
import enum

from app.core.database import Base


class KnowledgeType(str, enum.Enum):
    """ナレッジタイプ"""
    BRAND = "brand"  # ブランド/事業
    CONTENT_SERIES = "content_series"  # コンテンツシリーズ


class Knowledge(Base):
    """ナレッジテーブル"""
    __tablename__ = "knowledges"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ナレッジID（UUID）"
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="クライアントID（外部キー）"
    )
    name = Column(
        String(255),
        nullable=False,
        comment="ナレッジ名"
    )
    type = Column(
        SQLAlchemyEnum(KnowledgeType),
        nullable=False,
        default=KnowledgeType.BRAND,
        comment="ナレッジタイプ"
    )

    # 8セクション構造
    section_1_main_target = Column(
        JSONB,
        nullable=True,
        comment="セクション1: メインターゲット像"
    )
    section_2_sub_target = Column(
        JSONB,
        nullable=True,
        comment="セクション2: サブターゲット像"
    )
    section_3_competitor = Column(
        JSONB,
        nullable=True,
        comment="セクション3: 競合分析（Competitor）"
    )
    section_4_company = Column(
        JSONB,
        nullable=True,
        comment="セクション4: 自社分析（Company）"
    )
    section_5_aha_concept = Column(
        JSONB,
        nullable=True,
        comment="セクション5: AHAコンセプト"
    )
    section_6_concept_summary = Column(
        JSONB,
        nullable=True,
        comment="セクション6: コンセプトまとめ"
    )
    section_7_customer_journey = Column(
        JSONB,
        nullable=True,
        comment="セクション7: カスタマージャーニー"
    )
    section_8_promotion_strategy = Column(
        JSONB,
        nullable=True,
        comment="セクション8: プロモーション戦略 & 商品設計"
    )

    # RAG用ベクトル埋め込み（pgvector）
    # Claude API (text-embedding-3-large) の次元数は1536
    embedding = Column(
        Vector(1536),
        nullable=True,
        comment="ベクトル埋め込み（RAG用・1536次元）"
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
    client = relationship("Client", backref="knowledges")

    # インデックス定義
    __table_args__ = (
        Index(
            "ix_knowledges_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"}
        ),
    )

    def __repr__(self) -> str:
        return f"<Knowledge(id={self.id}, name={self.name}, type={self.type})>"
