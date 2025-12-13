"""
公開・配信モデル

YouTube/TikTok/Instagram公開管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class PublishPlatform(str, enum.Enum):
    """公開プラットフォーム"""
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"


class PublishStatus(str, enum.Enum):
    """公開ステータス"""
    PENDING = "pending"          # 待機中
    SCHEDULED = "scheduled"      # スケジュール済み
    PUBLISHING = "publishing"    # 公開処理中
    PUBLISHED = "published"      # 公開完了
    FAILED = "failed"            # 公開失敗


class Publication(Base):
    """公開テーブル"""
    __tablename__ = "publications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="公開ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    platform = Column(
        SQLAlchemyEnum(PublishPlatform),
        nullable=False,
        index=True,
        comment="公開プラットフォーム"
    )
    status = Column(
        SQLAlchemyEnum(PublishStatus),
        nullable=False,
        default=PublishStatus.PENDING,
        index=True,
        comment="公開ステータス"
    )
    title = Column(
        String(500),
        nullable=True,
        comment="公開タイトル"
    )
    description = Column(
        Text,
        nullable=True,
        comment="公開説明文"
    )
    tags = Column(
        JSONB,
        nullable=True,
        comment="タグ（JSON配列）"
    )
    platform_video_id = Column(
        String(100),
        nullable=True,
        comment="プラットフォーム側の動画ID"
    )
    platform_url = Column(
        String(1000),
        nullable=True,
        comment="プラットフォーム側のURL"
    )
    scheduled_at = Column(
        DateTime,
        nullable=True,
        comment="スケジュール公開日時"
    )
    published_at = Column(
        DateTime,
        nullable=True,
        comment="公開完了日時"
    )
    publish_options = Column(
        JSONB,
        nullable=True,
        comment="公開オプション（JSON）"
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
    video = relationship("Video", backref="publications")

    def __repr__(self) -> str:
        return f"<Publication(id={self.id}, platform={self.platform}, status={self.status})>"


class PublishSchedule(Base):
    """公開スケジュールテーブル"""
    __tablename__ = "publish_schedules"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="スケジュールID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    platforms = Column(
        JSONB,
        nullable=False,
        default=list,
        comment="対象プラットフォーム（JSON配列）"
    )
    scheduled_at = Column(
        DateTime,
        nullable=False,
        comment="スケジュール日時"
    )
    status = Column(
        SQLAlchemyEnum(PublishStatus),
        nullable=False,
        default=PublishStatus.SCHEDULED,
        index=True,
        comment="ステータス"
    )
    recurrence = Column(
        String(50),
        nullable=True,
        comment="繰り返し設定（daily/weekly/monthly）"
    )
    schedule_options = Column(
        JSONB,
        nullable=True,
        comment="スケジュールオプション（JSON）"
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
    video = relationship("Video", backref="publish_schedules")

    def __repr__(self) -> str:
        return f"<PublishSchedule(id={self.id}, scheduled_at={self.scheduled_at})>"
