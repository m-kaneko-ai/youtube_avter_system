"""
ショート→長尺連携モデル

ショート動画から長尺動画への誘導と
エンゲージメント分析を管理
"""
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Text,
    Integer,
    Float,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
import uuid
import enum

from app.core.database import Base


class VideoType(str, enum.Enum):
    """動画タイプ"""
    SHORT = "short"      # ショート動画
    LONG = "long"        # 長尺動画


class EngagementStatus(str, enum.Enum):
    """連携ステータス"""
    DRAFT = "draft"                    # 下書き
    ACTIVE = "active"                  # 有効
    PAUSED = "paused"                  # 一時停止
    COMPLETED = "completed"            # 完了
    ARCHIVED = "archived"              # アーカイブ


class ShortToLongLink(Base):
    """ショート→長尺連携テーブル"""
    __tablename__ = "short_to_long_links"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="連携ID（UUID）"
    )
    short_video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ショート動画ID（外部キー）"
    )
    long_video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="長尺動画ID（外部キー）"
    )
    # 連携設定
    link_type = Column(
        String(50),
        nullable=False,
        default="description",
        comment="連携タイプ（description, pinned_comment, end_screen, card）"
    )
    link_text = Column(
        Text,
        nullable=True,
        comment="誘導テキスト"
    )
    link_position = Column(
        String(50),
        nullable=True,
        comment="リンク配置位置（top, bottom, time_XX:XX）"
    )
    # ステータス
    status = Column(
        SQLAlchemyEnum(EngagementStatus),
        nullable=False,
        default=EngagementStatus.DRAFT,
        index=True,
        comment="連携ステータス"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="有効/無効"
    )
    # タイムスタンプ
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="更新日時"
    )

    # リレーション
    short_video = relationship(
        "Video",
        foreign_keys=[short_video_id],
        backref="short_to_long_links_as_short"
    )
    long_video = relationship(
        "Video",
        foreign_keys=[long_video_id],
        backref="short_to_long_links_as_long"
    )

    def __repr__(self) -> str:
        return f"<ShortToLongLink(id={self.id}, short={self.short_video_id}, long={self.long_video_id})>"


class EngagementMetrics(Base):
    """エンゲージメント指標テーブル"""
    __tablename__ = "engagement_metrics"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="指標ID（UUID）"
    )
    link_id = Column(
        UUID(as_uuid=True),
        ForeignKey("short_to_long_links.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="連携ID（外部キー）"
    )
    # 期間
    recorded_date = Column(
        DateTime,
        nullable=False,
        index=True,
        comment="記録日"
    )
    # ショート動画指標
    short_views = Column(
        Integer,
        nullable=False,
        default=0,
        comment="ショート動画再生回数"
    )
    short_likes = Column(
        Integer,
        nullable=False,
        default=0,
        comment="ショート動画いいね数"
    )
    short_comments = Column(
        Integer,
        nullable=False,
        default=0,
        comment="ショート動画コメント数"
    )
    short_shares = Column(
        Integer,
        nullable=False,
        default=0,
        comment="ショート動画共有数"
    )
    # 長尺動画指標
    long_views = Column(
        Integer,
        nullable=False,
        default=0,
        comment="長尺動画再生回数"
    )
    long_likes = Column(
        Integer,
        nullable=False,
        default=0,
        comment="長尺動画いいね数"
    )
    long_comments = Column(
        Integer,
        nullable=False,
        default=0,
        comment="長尺動画コメント数"
    )
    long_watch_time_minutes = Column(
        Float,
        nullable=True,
        comment="長尺動画総視聴時間（分）"
    )
    # 連携指標
    click_through_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="クリックスルー数（ショート→長尺）"
    )
    click_through_rate = Column(
        Float,
        nullable=True,
        comment="クリックスルー率（%）"
    )
    conversion_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="コンバージョン数（長尺で一定時間以上視聴）"
    )
    conversion_rate = Column(
        Float,
        nullable=True,
        comment="コンバージョン率（%）"
    )
    # 追加データ
    extra_data = Column(
        JSONB,
        nullable=True,
        comment="追加指標データ（JSON）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="作成日時"
    )

    # リレーション
    link = relationship("ShortToLongLink", backref="metrics")

    def __repr__(self) -> str:
        return f"<EngagementMetrics(id={self.id}, link_id={self.link_id}, date={self.recorded_date})>"


class ShortVideoClip(Base):
    """ショート動画切り抜き元テーブル"""
    __tablename__ = "short_video_clips"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="切り抜きID（UUID）"
    )
    short_video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ショート動画ID（外部キー）"
    )
    source_video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="元動画ID（外部キー）"
    )
    # 切り抜き情報
    start_time_seconds = Column(
        Integer,
        nullable=True,
        comment="元動画の開始時間（秒）"
    )
    end_time_seconds = Column(
        Integer,
        nullable=True,
        comment="元動画の終了時間（秒）"
    )
    clip_title = Column(
        String(200),
        nullable=True,
        comment="切り抜きタイトル"
    )
    clip_description = Column(
        Text,
        nullable=True,
        comment="切り抜き説明"
    )
    # ステータス
    is_published = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="公開済みフラグ"
    )
    published_at = Column(
        DateTime,
        nullable=True,
        comment="公開日時"
    )
    # タイムスタンプ
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="更新日時"
    )

    # リレーション
    short_video = relationship(
        "Video",
        foreign_keys=[short_video_id],
        backref="as_short_clip"
    )
    source_video = relationship(
        "Video",
        foreign_keys=[source_video_id],
        backref="short_clips"
    )

    def __repr__(self) -> str:
        return f"<ShortVideoClip(id={self.id}, short={self.short_video_id}, source={self.source_video_id})>"
