"""
シリーズ管理モデル

動画シリーズと再生リスト管理を提供
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
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
import uuid
import enum

from app.core.database import Base


class SeriesStatus(str, enum.Enum):
    """シリーズステータス"""
    DRAFT = "draft"                  # 下書き
    ACTIVE = "active"                # 公開中
    PAUSED = "paused"                # 一時停止
    COMPLETED = "completed"          # 完了
    ARCHIVED = "archived"            # アーカイブ


class SeriesType(str, enum.Enum):
    """シリーズタイプ"""
    PLAYLIST = "playlist"            # 再生リスト
    TOPIC = "topic"                  # テーマシリーズ
    TUTORIAL = "tutorial"            # チュートリアル
    SEASONAL = "seasonal"            # 季節限定
    CAMPAIGN = "campaign"            # キャンペーン


class Series(Base):
    """シリーズテーブル"""
    __tablename__ = "series"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="シリーズID（UUID）"
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="プロジェクトID（外部キー）"
    )
    knowledge_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
        comment="ナレッジID（外部キー）"
    )
    # 基本情報
    name = Column(
        String(255),
        nullable=False,
        comment="シリーズ名"
    )
    description = Column(
        Text,
        nullable=True,
        comment="シリーズ説明"
    )
    series_type = Column(
        SQLAlchemyEnum(SeriesType),
        nullable=False,
        default=SeriesType.PLAYLIST,
        index=True,
        comment="シリーズタイプ"
    )
    status = Column(
        SQLAlchemyEnum(SeriesStatus),
        nullable=False,
        default=SeriesStatus.DRAFT,
        index=True,
        comment="シリーズステータス"
    )
    # YouTube連携
    youtube_playlist_id = Column(
        String(100),
        nullable=True,
        index=True,
        comment="YouTube再生リストID"
    )
    youtube_playlist_url = Column(
        String(500),
        nullable=True,
        comment="YouTube再生リストURL"
    )
    # サムネイル
    thumbnail_url = Column(
        String(500),
        nullable=True,
        comment="シリーズサムネイルURL"
    )
    # タグ
    tags = Column(
        ARRAY(String(50)),
        nullable=True,
        comment="タグ配列"
    )
    # スケジュール
    start_date = Column(
        DateTime,
        nullable=True,
        comment="開始日"
    )
    end_date = Column(
        DateTime,
        nullable=True,
        comment="終了日"
    )
    target_video_count = Column(
        Integer,
        nullable=True,
        comment="目標動画本数"
    )
    release_frequency = Column(
        String(50),
        nullable=True,
        comment="公開頻度（daily, weekly, biweekly, monthly）"
    )
    # 統計
    total_videos = Column(
        Integer,
        nullable=False,
        default=0,
        comment="総動画数"
    )
    total_views = Column(
        Integer,
        nullable=False,
        default=0,
        comment="総再生回数"
    )
    total_watch_time_hours = Column(
        Float,
        nullable=True,
        comment="総視聴時間（時間）"
    )
    avg_view_duration_seconds = Column(
        Integer,
        nullable=True,
        comment="平均視聴時間（秒）"
    )
    # 追加設定
    settings = Column(
        JSONB,
        nullable=True,
        comment="追加設定（JSON）"
    )
    # 作成者
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="作成者ID"
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
    project = relationship("Project", backref="series_list")
    creator = relationship("User", backref="created_series")
    video_items = relationship(
        "SeriesVideoItem",
        back_populates="series",
        cascade="all, delete-orphan",
        order_by="SeriesVideoItem.order_index"
    )

    def __repr__(self) -> str:
        return f"<Series(id={self.id}, name={self.name}, status={self.status})>"


class SeriesVideoItem(Base):
    """シリーズ内動画アイテムテーブル"""
    __tablename__ = "series_video_items"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="アイテムID（UUID）"
    )
    series_id = Column(
        UUID(as_uuid=True),
        ForeignKey("series.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="シリーズID（外部キー）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    # 順番
    order_index = Column(
        Integer,
        nullable=False,
        default=0,
        comment="並び順インデックス"
    )
    episode_number = Column(
        Integer,
        nullable=True,
        comment="エピソード番号"
    )
    episode_title = Column(
        String(255),
        nullable=True,
        comment="エピソードタイトル（シリーズ内用）"
    )
    # 公開ステータス
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
    scheduled_at = Column(
        DateTime,
        nullable=True,
        comment="公開予定日時"
    )
    # パフォーマンス
    views = Column(
        Integer,
        nullable=False,
        default=0,
        comment="再生回数"
    )
    likes = Column(
        Integer,
        nullable=False,
        default=0,
        comment="いいね数"
    )
    comments = Column(
        Integer,
        nullable=False,
        default=0,
        comment="コメント数"
    )
    avg_view_duration_seconds = Column(
        Integer,
        nullable=True,
        comment="平均視聴時間（秒）"
    )
    retention_rate = Column(
        Float,
        nullable=True,
        comment="リテンション率（%）"
    )
    # タイムスタンプ
    added_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="追加日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="更新日時"
    )

    # リレーション
    series = relationship("Series", back_populates="video_items")
    video = relationship("Video", backref="series_items")

    def __repr__(self) -> str:
        return f"<SeriesVideoItem(id={self.id}, series={self.series_id}, video={self.video_id}, order={self.order_index})>"


class SeriesPerformanceLog(Base):
    """シリーズパフォーマンスログテーブル"""
    __tablename__ = "series_performance_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ログID（UUID）"
    )
    series_id = Column(
        UUID(as_uuid=True),
        ForeignKey("series.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="シリーズID（外部キー）"
    )
    # 期間
    recorded_date = Column(
        DateTime,
        nullable=False,
        index=True,
        comment="記録日"
    )
    # 統計
    total_views = Column(
        Integer,
        nullable=False,
        default=0,
        comment="日次総再生回数"
    )
    new_subscribers = Column(
        Integer,
        nullable=False,
        default=0,
        comment="新規登録者数"
    )
    watch_time_minutes = Column(
        Float,
        nullable=True,
        comment="視聴時間（分）"
    )
    impressions = Column(
        Integer,
        nullable=True,
        comment="インプレッション数"
    )
    impression_ctr = Column(
        Float,
        nullable=True,
        comment="インプレッションCTR（%）"
    )
    # 追加データ
    extra_metrics = Column(
        JSONB,
        nullable=True,
        comment="追加指標（JSON）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("NOW()"),
        comment="作成日時"
    )

    # リレーション
    series = relationship("Series", backref="performance_logs")

    def __repr__(self) -> str:
        return f"<SeriesPerformanceLog(id={self.id}, series={self.series_id}, date={self.recorded_date})>"
