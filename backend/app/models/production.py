"""
動画制作モデル

音声生成、アバター動画生成、B-roll生成の管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class GenerationStatus(str, enum.Enum):
    """生成ステータス（共通）"""
    PENDING = "pending"          # 待機中
    GENERATING = "generating"    # 生成中
    COMPLETED = "completed"      # 生成完了
    FAILED = "failed"            # 生成失敗


class AudioGeneration(Base):
    """音声生成テーブル"""
    __tablename__ = "audio_generations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="音声生成ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    script_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scripts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="台本ID（外部キー）"
    )
    voice_id = Column(
        String(100),
        nullable=True,
        comment="MiniMax Audio ボイスID"
    )
    voice_name = Column(
        String(200),
        nullable=True,
        comment="ボイス名"
    )
    text = Column(
        Text,
        nullable=True,
        comment="読み上げテキスト"
    )
    audio_url = Column(
        String(1000),
        nullable=True,
        comment="生成された音声URL"
    )
    duration = Column(
        Float,
        nullable=True,
        comment="音声長（秒）"
    )
    status = Column(
        SQLAlchemyEnum(GenerationStatus),
        nullable=False,
        default=GenerationStatus.PENDING,
        index=True,
        comment="ステータス"
    )
    speed = Column(
        Float,
        nullable=True,
        default=1.0,
        comment="読み上げ速度"
    )
    pitch = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="ピッチ調整"
    )
    generation_params = Column(
        JSONB,
        nullable=True,
        comment="生成パラメータ（JSON）"
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
    video = relationship("Video", backref="audio_generations")
    script = relationship("Script", backref="audio_generations")

    def __repr__(self) -> str:
        return f"<AudioGeneration(id={self.id}, status={self.status})>"


class AvatarGeneration(Base):
    """アバター動画生成テーブル"""
    __tablename__ = "avatar_generations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="アバター生成ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    audio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audio_generations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="音声ID（外部キー）"
    )
    avatar_id = Column(
        String(100),
        nullable=True,
        comment="HeyGen アバターID"
    )
    avatar_name = Column(
        String(200),
        nullable=True,
        comment="アバター名"
    )
    video_url = Column(
        String(1000),
        nullable=True,
        comment="生成された動画URL"
    )
    thumbnail_url = Column(
        String(1000),
        nullable=True,
        comment="動画サムネイルURL"
    )
    duration = Column(
        Float,
        nullable=True,
        comment="動画長（秒）"
    )
    width = Column(
        Integer,
        nullable=True,
        default=1920,
        comment="動画幅（px）"
    )
    height = Column(
        Integer,
        nullable=True,
        default=1080,
        comment="動画高さ（px）"
    )
    status = Column(
        SQLAlchemyEnum(GenerationStatus),
        nullable=False,
        default=GenerationStatus.PENDING,
        index=True,
        comment="ステータス"
    )
    heygen_task_id = Column(
        String(100),
        nullable=True,
        comment="HeyGen タスクID"
    )
    generation_params = Column(
        JSONB,
        nullable=True,
        comment="生成パラメータ（JSON）"
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
    video = relationship("Video", backref="avatar_generations")
    audio = relationship("AudioGeneration", backref="avatar_generations")

    def __repr__(self) -> str:
        return f"<AvatarGeneration(id={self.id}, status={self.status})>"


class BrollGeneration(Base):
    """B-roll動画生成テーブル"""
    __tablename__ = "broll_generations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="B-roll生成ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    prompt = Column(
        Text,
        nullable=True,
        comment="生成プロンプト"
    )
    style = Column(
        String(50),
        nullable=True,
        comment="映像スタイル"
    )
    video_url = Column(
        String(1000),
        nullable=True,
        comment="生成された動画URL"
    )
    thumbnail_url = Column(
        String(1000),
        nullable=True,
        comment="動画サムネイルURL"
    )
    duration = Column(
        Float,
        nullable=True,
        comment="動画長（秒）"
    )
    width = Column(
        Integer,
        nullable=True,
        default=1920,
        comment="動画幅（px）"
    )
    height = Column(
        Integer,
        nullable=True,
        default=1080,
        comment="動画高さ（px）"
    )
    status = Column(
        SQLAlchemyEnum(GenerationStatus),
        nullable=False,
        default=GenerationStatus.PENDING,
        index=True,
        comment="ステータス"
    )
    veo_task_id = Column(
        String(100),
        nullable=True,
        comment="Veo タスクID"
    )
    timestamp_start = Column(
        Float,
        nullable=True,
        comment="挿入開始位置（秒）"
    )
    timestamp_end = Column(
        Float,
        nullable=True,
        comment="挿入終了位置（秒）"
    )
    generation_params = Column(
        JSONB,
        nullable=True,
        comment="生成パラメータ（JSON）"
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
    video = relationship("Video", backref="broll_generations")

    def __repr__(self) -> str:
        return f"<BrollGeneration(id={self.id}, status={self.status})>"
