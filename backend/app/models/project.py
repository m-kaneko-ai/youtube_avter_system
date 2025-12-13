"""
プロジェクト・動画・ワークフローモデル

動画制作プロジェクトと各ステップの承認フローを管理
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLAlchemyEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    """プロジェクトステータス"""
    PLANNING = "planning"            # 企画中
    PRODUCTION = "production"        # 制作中
    SCHEDULED = "scheduled"          # 公開予約済み
    PUBLISHED = "published"          # 公開済み
    CANCELLED = "cancelled"          # キャンセル


class VideoStatus(str, enum.Enum):
    """動画ステータス"""
    DRAFT = "draft"                      # 下書き
    IN_PRODUCTION = "in_production"      # 制作中
    PENDING_APPROVAL = "pending_approval"  # 承認待ち
    APPROVED = "approved"                # 承認済み
    PUBLISHED = "published"              # 公開済み
    REJECTED = "rejected"                # 却下


class WorkflowStepName(str, enum.Enum):
    """ワークフローステップ名"""
    RESEARCH = "research"                # 競合調査・トレンド分析
    PLANNING = "planning"                # 企画立案
    SCRIPT = "script"                    # 台本生成
    METADATA = "metadata"                # メタデータ生成
    AUDIO = "audio"                      # 音声生成
    AVATAR = "avatar"                    # アバター動画生成
    EDITING = "editing"                  # 編集・B-roll挿入
    PUBLISH = "publish"                  # 公開


class WorkflowStepStatus(str, enum.Enum):
    """ワークフローステップステータス"""
    PENDING = "pending"              # 未着手
    IN_PROGRESS = "in_progress"      # 進行中
    COMPLETED = "completed"          # 完了
    REJECTED = "rejected"            # 却下


class Project(Base):
    """プロジェクトテーブル"""
    __tablename__ = "projects"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="プロジェクトID（UUID）"
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="クライアントID（外部キー）"
    )
    knowledge_id = Column(
        UUID(as_uuid=True),
        nullable=True,  # ナレッジ未実装のためnullable
        index=True,
        comment="ナレッジID（外部キー）"
    )
    name = Column(
        String(255),
        nullable=False,
        comment="プロジェクト名"
    )
    description = Column(
        Text,
        nullable=True,
        comment="説明"
    )
    status = Column(
        SQLAlchemyEnum(ProjectStatus),
        nullable=False,
        default=ProjectStatus.PLANNING,
        index=True,
        comment="ステータス"
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
    client = relationship("Client", backref="projects")
    videos = relationship("Video", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, status={self.status})>"


class Video(Base):
    """動画テーブル"""
    __tablename__ = "videos"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="動画ID（UUID）"
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="プロジェクトID（外部キー）"
    )
    title = Column(
        String(500),
        nullable=True,
        comment="タイトル"
    )
    script = Column(
        Text,
        nullable=True,
        comment="台本"
    )
    status = Column(
        SQLAlchemyEnum(VideoStatus),
        nullable=False,
        default=VideoStatus.DRAFT,
        index=True,
        comment="ステータス"
    )
    youtube_url = Column(
        String(500),
        nullable=True,
        comment="YouTube URL"
    )
    analytics = Column(
        JSONB,
        nullable=True,
        comment="分析データ（JSON）"
    )
    video_metadata = Column(
        JSONB,
        nullable=True,
        comment="メタデータ（説明文、タグ等）"
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
    project = relationship("Project", back_populates="videos")
    workflow_steps = relationship("WorkflowStep", back_populates="video", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="video", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Video(id={self.id}, title={self.title}, status={self.status})>"


class WorkflowStep(Base):
    """ワークフローステップテーブル"""
    __tablename__ = "workflow_steps"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ワークフローステップID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID（外部キー）"
    )
    step_name = Column(
        SQLAlchemyEnum(WorkflowStepName),
        nullable=False,
        comment="ステップ名"
    )
    status = Column(
        SQLAlchemyEnum(WorkflowStepStatus),
        nullable=False,
        default=WorkflowStepStatus.PENDING,
        comment="ステータス"
    )
    approver_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="承認者ID（外部キー）"
    )
    approved_at = Column(
        DateTime,
        nullable=True,
        comment="承認日時"
    )
    comments = Column(
        Text,
        nullable=True,
        comment="コメント・修正依頼"
    )
    result_data = Column(
        JSONB,
        nullable=True,
        comment="実行結果データ（JSON）"
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
    video = relationship("Video", back_populates="workflow_steps")
    approver = relationship("User")

    def __repr__(self) -> str:
        return f"<WorkflowStep(id={self.id}, step_name={self.step_name}, status={self.status})>"
