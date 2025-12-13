"""
チャットセッションモデル

ナレッジ構築用のチャットボットセッションを管理
ヒアリングシートの代わりにチャット形式でナレッジを構築
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ChatSessionStatus(str, enum.Enum):
    """チャットセッションステータス"""
    IN_PROGRESS = "in_progress"  # 進行中
    COMPLETED = "completed"  # 完了
    PAUSED = "paused"  # 一時停止


class ChatSession(Base):
    """チャットセッションテーブル"""
    __tablename__ = "chat_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="チャットセッションID（UUID）"
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
        ForeignKey("knowledges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ナレッジID（外部キー）"
    )
    current_step = Column(
        Integer,
        nullable=False,
        default=1,
        comment="現在のステップ（1-8: 8セクション対応）"
    )
    messages = Column(
        JSONB,
        nullable=False,
        server_default='[]',
        comment="メッセージ履歴（[{role: 'user'|'assistant', content: str, timestamp: str}]）"
    )
    status = Column(
        SQLAlchemyEnum(ChatSessionStatus),
        nullable=False,
        default=ChatSessionStatus.IN_PROGRESS,
        comment="セッションステータス"
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
    client = relationship("Client", backref="chat_sessions")
    knowledge = relationship("Knowledge", backref="chat_sessions")

    def __repr__(self) -> str:
        return f"<ChatSession(id={self.id}, knowledge_id={self.knowledge_id}, step={self.current_step}, status={self.status})>"
