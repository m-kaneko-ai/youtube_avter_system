"""
企画・計画用モデル

AI提案チャットセッションと提案データを管理
"""
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Float, Boolean, ForeignKey, Enum as SQLAlchemyEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class PlanningSessionStatus(str, enum.Enum):
    """企画チャットセッションステータス"""
    ACTIVE = "active"          # アクティブ
    COMPLETED = "completed"    # 完了
    ARCHIVED = "archived"      # アーカイブ


class SuggestionType(str, enum.Enum):
    """提案種別"""
    SHORT = "short"    # ショート動画
    LONG = "long"      # 長尺動画


class PlanningChatSession(Base):
    """企画用チャットセッションテーブル"""
    __tablename__ = "planning_chat_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="セッションID（UUID）"
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
        ForeignKey("knowledges.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ナレッジID（外部キー）"
    )
    status = Column(
        SQLAlchemyEnum(PlanningSessionStatus),
        nullable=False,
        default=PlanningSessionStatus.ACTIVE,
        comment="セッションステータス"
    )
    messages = Column(
        JSONB,
        nullable=False,
        server_default='[]',
        comment="メッセージ履歴（[{type: 'user'|'assistant', content: str, suggestions: [], created_at: str}]）"
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
    client = relationship("Client", backref="planning_chat_sessions")
    knowledge = relationship("Knowledge", backref="planning_chat_sessions")
    suggestions = relationship("AISuggestion", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<PlanningChatSession(id={self.id}, status={self.status})>"


class AISuggestion(Base):
    """AI提案テーブル"""
    __tablename__ = "ai_suggestions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="提案ID（UUID）"
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("planning_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="セッションID（外部キー）"
    )
    title = Column(
        String(500),
        nullable=False,
        comment="提案タイトル"
    )
    description = Column(
        Text,
        nullable=True,
        comment="提案説明"
    )
    suggestion_type = Column(
        SQLAlchemyEnum(SuggestionType),
        nullable=False,
        default=SuggestionType.SHORT,
        comment="提案種別（short/long）"
    )
    tags = Column(
        JSONB,
        nullable=True,
        comment="タグ（JSON配列）"
    )
    estimated_views = Column(
        String(50),
        nullable=True,
        comment="予想視聴数（例：50K-100K）"
    )
    confidence = Column(
        Float,
        nullable=True,
        comment="信頼度（0.0-1.0）"
    )
    is_adopted = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="採用フラグ"
    )
    adopted_project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="採用されたプロジェクトID（外部キー）"
    )
    adopted_at = Column(
        DateTime,
        nullable=True,
        comment="採用日時"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )

    # リレーション
    session = relationship("PlanningChatSession", back_populates="suggestions")
    adopted_project = relationship("Project", backref="ai_suggestion")

    def __repr__(self) -> str:
        return f"<AISuggestion(id={self.id}, title={self.title}, is_adopted={self.is_adopted})>"


class ProjectSchedule(Base):
    """プロジェクトスケジュールテーブル"""
    __tablename__ = "project_schedules"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="スケジュールID（UUID）"
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="プロジェクトID（外部キー）"
    )
    scheduled_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="予定日"
    )
    published_date = Column(
        Date,
        nullable=True,
        comment="公開日"
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
    project = relationship("Project", backref="schedule", uselist=False)

    def __repr__(self) -> str:
        return f"<ProjectSchedule(project_id={self.project_id}, scheduled_date={self.scheduled_date})>"
