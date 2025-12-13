"""
分析機能モデル

動画分析、チャンネル分析、レポート管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey, Enum as SQLAlchemyEnum, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ReportType(str, enum.Enum):
    """レポートタイプ"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReportStatus(str, enum.Enum):
    """レポートステータス"""
    PENDING = "pending"          # 待機中
    GENERATING = "generating"    # 生成中
    COMPLETED = "completed"      # 生成完了
    FAILED = "failed"            # 生成失敗


class VideoAnalytics(Base):
    """動画分析テーブル"""
    __tablename__ = "video_analytics"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="分析ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    date = Column(
        Date,
        nullable=False,
        index=True,
        comment="分析日"
    )
    views = Column(
        Integer,
        nullable=True,
        default=0,
        comment="視聴回数"
    )
    watch_time_minutes = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="総視聴時間（分）"
    )
    average_view_duration = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="平均視聴時間（秒）"
    )
    likes = Column(
        Integer,
        nullable=True,
        default=0,
        comment="いいね数"
    )
    dislikes = Column(
        Integer,
        nullable=True,
        default=0,
        comment="低評価数"
    )
    comments = Column(
        Integer,
        nullable=True,
        default=0,
        comment="コメント数"
    )
    shares = Column(
        Integer,
        nullable=True,
        default=0,
        comment="シェア数"
    )
    subscribers_gained = Column(
        Integer,
        nullable=True,
        default=0,
        comment="獲得登録者数"
    )
    subscribers_lost = Column(
        Integer,
        nullable=True,
        default=0,
        comment="解除登録者数"
    )
    ctr = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="クリック率（%）"
    )
    impressions = Column(
        Integer,
        nullable=True,
        default=0,
        comment="インプレッション数"
    )
    traffic_sources = Column(
        JSONB,
        nullable=True,
        comment="トラフィックソース（JSON）"
    )
    demographics = Column(
        JSONB,
        nullable=True,
        comment="視聴者属性（JSON）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    # リレーション
    video = relationship("Video", backref="video_analytics")

    def __repr__(self) -> str:
        return f"<VideoAnalytics(id={self.id}, video_id={self.video_id}, date={self.date})>"


class ChannelAnalytics(Base):
    """チャンネル分析テーブル"""
    __tablename__ = "channel_analytics"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="分析ID（UUID）"
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="クライアントID（外部キー）"
    )
    date = Column(
        Date,
        nullable=False,
        index=True,
        comment="分析日"
    )
    total_views = Column(
        Integer,
        nullable=True,
        default=0,
        comment="総視聴回数"
    )
    total_watch_time_minutes = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="総視聴時間（分）"
    )
    subscribers = Column(
        Integer,
        nullable=True,
        default=0,
        comment="総登録者数"
    )
    subscribers_change = Column(
        Integer,
        nullable=True,
        default=0,
        comment="登録者数変化"
    )
    total_videos = Column(
        Integer,
        nullable=True,
        default=0,
        comment="総動画数"
    )
    average_ctr = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="平均クリック率（%）"
    )
    revenue = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="収益（円）"
    )
    top_videos = Column(
        JSONB,
        nullable=True,
        comment="トップ動画（JSON）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    # リレーション
    client = relationship("Client", backref="channel_analytics")

    def __repr__(self) -> str:
        return f"<ChannelAnalytics(id={self.id}, client_id={self.client_id}, date={self.date})>"


class AnalyticsReport(Base):
    """分析レポートテーブル"""
    __tablename__ = "analytics_reports"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="レポートID（UUID）"
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="クライアントID（外部キー）"
    )
    report_type = Column(
        SQLAlchemyEnum(ReportType),
        nullable=False,
        default=ReportType.WEEKLY,
        index=True,
        comment="レポートタイプ"
    )
    status = Column(
        SQLAlchemyEnum(ReportStatus),
        nullable=False,
        default=ReportStatus.PENDING,
        index=True,
        comment="ステータス"
    )
    title = Column(
        String(500),
        nullable=True,
        comment="レポートタイトル"
    )
    date_from = Column(
        Date,
        nullable=False,
        comment="開始日"
    )
    date_to = Column(
        Date,
        nullable=False,
        comment="終了日"
    )
    summary = Column(
        Text,
        nullable=True,
        comment="レポートサマリー"
    )
    data = Column(
        JSONB,
        nullable=True,
        comment="レポートデータ（JSON）"
    )
    file_url = Column(
        String(1000),
        nullable=True,
        comment="レポートファイルURL"
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
    client = relationship("Client", backref="analytics_reports")

    def __repr__(self) -> str:
        return f"<AnalyticsReport(id={self.id}, type={self.report_type}, status={self.status})>"
