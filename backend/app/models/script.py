"""
台本・メタデータ生成モデル

台本、タイトル、説明文、サムネイルの生成管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ScriptStatus(str, enum.Enum):
    """台本ステータス"""
    GENERATING = "generating"    # 生成中
    COMPLETED = "completed"      # 生成完了
    FAILED = "failed"            # 生成失敗
    EDITED = "edited"            # 編集済み


class GeneratorType(str, enum.Enum):
    """生成エンジン種別"""
    CLAUDE = "claude"    # Claude API
    GEMINI = "gemini"    # Gemini API


class Script(Base):
    """台本テーブル"""
    __tablename__ = "scripts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="台本ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    knowledge_id = Column(
        UUID(as_uuid=True),
        ForeignKey("knowledges.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ナレッジID（外部キー）"
    )
    title = Column(
        String(500),
        nullable=True,
        comment="台本タイトル"
    )
    content = Column(
        Text,
        nullable=True,
        comment="台本本文"
    )
    prompt = Column(
        Text,
        nullable=True,
        comment="生成に使用したプロンプト"
    )
    generator = Column(
        SQLAlchemyEnum(GeneratorType),
        nullable=False,
        default=GeneratorType.CLAUDE,
        comment="使用した生成エンジン"
    )
    status = Column(
        SQLAlchemyEnum(ScriptStatus),
        nullable=False,
        default=ScriptStatus.GENERATING,
        index=True,
        comment="ステータス"
    )
    word_count = Column(
        Integer,
        nullable=True,
        comment="文字数"
    )
    estimated_duration = Column(
        Integer,
        nullable=True,
        comment="予想再生時間（秒）"
    )
    generation_params = Column(
        JSONB,
        nullable=True,
        comment="生成パラメータ（JSON）"
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
    video = relationship("Video", backref="scripts")
    knowledge = relationship("Knowledge", backref="scripts")

    def __repr__(self) -> str:
        return f"<Script(id={self.id}, status={self.status})>"


class ThumbnailStatus(str, enum.Enum):
    """サムネイルステータス"""
    GENERATING = "generating"    # 生成中
    COMPLETED = "completed"      # 生成完了
    FAILED = "failed"            # 生成失敗


class Thumbnail(Base):
    """サムネイルテーブル"""
    __tablename__ = "thumbnails"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="サムネイルID（UUID）"
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
        comment="生成に使用したプロンプト"
    )
    image_url = Column(
        String(1000),
        nullable=True,
        comment="生成された画像URL"
    )
    status = Column(
        SQLAlchemyEnum(ThumbnailStatus),
        nullable=False,
        default=ThumbnailStatus.GENERATING,
        index=True,
        comment="ステータス"
    )
    width = Column(
        Integer,
        nullable=True,
        comment="画像幅（px）"
    )
    height = Column(
        Integer,
        nullable=True,
        comment="画像高さ（px）"
    )
    generation_params = Column(
        JSONB,
        nullable=True,
        comment="生成パラメータ（JSON）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    # リレーション
    video = relationship("Video", backref="thumbnails")

    def __repr__(self) -> str:
        return f"<Thumbnail(id={self.id}, status={self.status})>"


class MetadataGeneration(Base):
    """メタデータ生成履歴テーブル"""
    __tablename__ = "metadata_generations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="生成履歴ID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    metadata_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="メタデータ種別（title/description）"
    )
    prompt = Column(
        Text,
        nullable=True,
        comment="生成に使用したプロンプト"
    )
    result = Column(
        Text,
        nullable=True,
        comment="生成結果"
    )
    alternatives = Column(
        JSONB,
        nullable=True,
        comment="代替案（JSON配列）"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    # リレーション
    video = relationship("Video", backref="metadata_generations")

    def __repr__(self) -> str:
        return f"<MetadataGeneration(id={self.id}, type={self.metadata_type})>"
