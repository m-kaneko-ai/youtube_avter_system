"""
コンテンツ複利戦略モデル

ショート動画から長尺動画への誘導、シリーズ間の相互リンクを最適化し、
視聴者のエンゲージメントを最大化する
"""
from datetime import date, datetime
from uuid import UUID, uuid4
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class LinkType(str, enum.Enum):
    """リンクタイプ"""
    END_SCREEN = "end_screen"  # 終了画面
    CARD = "card"  # カード
    DESCRIPTION = "description"  # 説明欄
    PINNED_COMMENT = "pinned_comment"  # 固定コメント


class ContentLink(Base):
    """コンテンツ間のリンク"""
    __tablename__ = "content_links"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    source_video_id = Column(PGUUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    target_video_id = Column(PGUUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    link_type = Column(SQLEnum(LinkType), nullable=False)
    position_seconds = Column(Integer, nullable=True, comment="挿入位置（秒）")
    click_count = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False, comment="クリック率")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # リレーション
    source_video = relationship("Video", foreign_keys=[source_video_id], backref="outbound_links")
    target_video = relationship("Video", foreign_keys=[target_video_id], backref="inbound_links")

    def __repr__(self):
        return f"<ContentLink {self.source_video_id} -> {self.target_video_id} ({self.link_type.value})>"


class ContentCluster(Base):
    """コンテンツクラスター（関連動画群）"""
    __tablename__ = "content_clusters"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    knowledge_id = Column(PGUUID(as_uuid=True), ForeignKey("knowledges.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    video_ids = Column(JSONB, default=list, nullable=False, comment="動画IDリスト")
    total_views = Column(Integer, default=0, nullable=False)
    avg_retention = Column(Float, default=0.0, nullable=False, comment="平均視聴維持率（%）")
    cluster_score = Column(Float, default=0.0, nullable=False, comment="クラスター全体の評価スコア")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # リレーション
    knowledge = relationship("Knowledge", backref="content_clusters")

    def __repr__(self):
        return f"<ContentCluster {self.name} (score={self.cluster_score:.2f})>"


class CompoundMetrics(Base):
    """複利効果メトリクス"""
    __tablename__ = "compound_metrics"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    video_id = Column(PGUUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    referral_views = Column(Integer, default=0, nullable=False, comment="他動画からの流入視聴数")
    referral_watch_time = Column(Float, default=0.0, nullable=False, comment="流入視聴時間（分）")
    outbound_clicks = Column(Integer, default=0, nullable=False, comment="他動画への誘導クリック数")
    compound_score = Column(Float, default=0.0, nullable=False, comment="複利スコア（0-100）")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # リレーション
    video = relationship("Video", backref="compound_metrics")

    def __repr__(self):
        return f"<CompoundMetrics video={self.video_id} date={self.date} score={self.compound_score:.2f}>"


__all__ = [
    "LinkType",
    "ContentLink",
    "ContentCluster",
    "CompoundMetrics",
]
