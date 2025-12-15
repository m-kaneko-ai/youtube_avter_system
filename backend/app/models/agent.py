"""
Agent Models

自動化エージェント、タスク、コメント自動化のSQLAlchemyモデル
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


# ============================================================
# Enums
# ============================================================

class AgentType(str, Enum):
    """エージェントタイプ"""
    TREND_MONITOR = "trend_monitor"  # トレンド監視（秘策2）
    COMPETITOR_ANALYZER = "competitor_analyzer"  # 競合分析
    COMMENT_RESPONDER = "comment_responder"  # コメント返信（秘策6）
    CONTENT_SCHEDULER = "content_scheduler"  # コンテンツスケジューラー
    PERFORMANCE_TRACKER = "performance_tracker"  # パフォーマンス追跡
    QA_CHECKER = "qa_checker"  # QAチェッカー
    KEYWORD_RESEARCHER = "keyword_researcher"  # キーワードリサーチ


class AgentStatus(str, Enum):
    """エージェントステータス"""
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    DISABLED = "disabled"


class TaskStatus(str, Enum):
    """タスクステータス"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """タスク優先度"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ScheduleFrequency(str, Enum):
    """スケジュール頻度"""
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class CommentSentiment(str, Enum):
    """コメント感情"""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    QUESTION = "question"


class ReplyStatus(str, Enum):
    """返信ステータス"""
    PENDING = "pending"
    APPROVED = "approved"
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


# ============================================================
# Agent Models
# ============================================================

class Agent(Base):
    """エージェント"""
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_id = Column(UUID(as_uuid=True), ForeignKey("knowledges.id", ondelete="CASCADE"), nullable=True)

    # 基本情報
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    agent_type = Column(SQLEnum(AgentType), nullable=False)
    status = Column(SQLEnum(AgentStatus), nullable=False, default=AgentStatus.IDLE)

    # 設定
    config = Column(JSONB, nullable=True)  # エージェント固有の設定
    credentials = Column(JSONB, nullable=True)  # 暗号化されたAPI認証情報

    # 実行設定
    is_enabled = Column(Boolean, nullable=False, default=True)
    auto_execute = Column(Boolean, nullable=False, default=False)  # 自動実行
    max_concurrent_tasks = Column(Integer, nullable=False, default=1)
    retry_count = Column(Integer, nullable=False, default=3)
    timeout_seconds = Column(Integer, nullable=False, default=300)

    # 統計
    total_tasks_run = Column(Integer, nullable=False, default=0)
    successful_tasks = Column(Integer, nullable=False, default=0)
    failed_tasks = Column(Integer, nullable=False, default=0)
    last_run_at = Column(DateTime, nullable=True)
    last_success_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    tasks = relationship("AgentTask", back_populates="agent", cascade="all, delete-orphan")
    schedules = relationship("AgentSchedule", back_populates="agent", cascade="all, delete-orphan")


class AgentTask(Base):
    """エージェントタスク"""
    __tablename__ = "agent_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("agent_schedules.id", ondelete="SET NULL"), nullable=True)

    # タスク情報
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(100), nullable=True)  # サブタスクタイプ
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.NORMAL)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.PENDING)

    # 入出力
    input_data = Column(JSONB, nullable=True)  # タスク入力
    output_data = Column(JSONB, nullable=True)  # タスク出力

    # 実行情報
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    # エラー情報
    error_message = Column(Text, nullable=True)
    error_details = Column(JSONB, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)

    # 進捗
    progress_percent = Column(Float, nullable=True)
    progress_message = Column(String(500), nullable=True)

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    agent = relationship("Agent", back_populates="tasks")
    schedule = relationship("AgentSchedule", back_populates="tasks")


class AgentSchedule(Base):
    """エージェントスケジュール"""
    __tablename__ = "agent_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)

    # スケジュール情報
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    frequency = Column(SQLEnum(ScheduleFrequency), nullable=False)

    # 実行時間設定
    cron_expression = Column(String(100), nullable=True)  # カスタムcron
    hour = Column(Integer, nullable=True)  # 0-23
    minute = Column(Integer, nullable=False, default=0)  # 0-59
    day_of_week = Column(ARRAY(Integer), nullable=True)  # 0-6 (月-日)
    day_of_month = Column(Integer, nullable=True)  # 1-31
    timezone = Column(String(50), nullable=False, default="Asia/Tokyo")

    # タスク設定
    task_config = Column(JSONB, nullable=True)  # タスク実行時の設定

    # ステータス
    is_active = Column(Boolean, nullable=False, default=True)
    next_run_at = Column(DateTime, nullable=True)
    last_run_at = Column(DateTime, nullable=True)

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    agent = relationship("Agent", back_populates="schedules")
    tasks = relationship("AgentTask", back_populates="schedule")


# ============================================================
# Comment Automation Models
# ============================================================

class CommentTemplate(Base):
    """コメント返信テンプレート"""
    __tablename__ = "comment_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_id = Column(UUID(as_uuid=True), ForeignKey("knowledges.id", ondelete="CASCADE"), nullable=True)

    # テンプレート情報
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # カテゴリ（質問、感謝など）

    # 対象条件
    target_sentiment = Column(SQLEnum(CommentSentiment), nullable=True)
    target_keywords = Column(ARRAY(String), nullable=True)  # マッチするキーワード
    exclude_keywords = Column(ARRAY(String), nullable=True)  # 除外キーワード
    min_likes = Column(Integer, nullable=True)  # 最小いいね数

    # テンプレート内容
    template_text = Column(Text, nullable=False)  # {{author}}, {{keyword}} などのプレースホルダー
    variations = Column(ARRAY(Text), nullable=True)  # バリエーション

    # AI設定
    use_ai_generation = Column(Boolean, nullable=False, default=False)
    ai_prompt = Column(Text, nullable=True)  # AI生成用プロンプト
    ai_style = Column(String(100), nullable=True)  # AIスタイル（friendly, professional等）

    # 統計
    usage_count = Column(Integer, nullable=False, default=0)
    success_rate = Column(Float, nullable=True)
    avg_engagement = Column(Float, nullable=True)  # 返信後の平均エンゲージメント

    # ステータス
    is_active = Column(Boolean, nullable=False, default=True)
    priority = Column(Integer, nullable=False, default=0)

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommentQueue(Base):
    """コメント返信キュー"""
    __tablename__ = "comment_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("comment_templates.id", ondelete="SET NULL"), nullable=True)

    # 元コメント情報
    youtube_comment_id = Column(String(255), nullable=False)  # YouTube APIのコメントID
    author_name = Column(String(255), nullable=True)
    author_channel_id = Column(String(255), nullable=True)
    comment_text = Column(Text, nullable=False)
    comment_likes = Column(Integer, nullable=False, default=0)
    comment_published_at = Column(DateTime, nullable=True)

    # 分析結果
    sentiment = Column(SQLEnum(CommentSentiment), nullable=True)
    detected_keywords = Column(ARRAY(String), nullable=True)
    sentiment_score = Column(Float, nullable=True)  # -1.0 〜 1.0
    is_question = Column(Boolean, nullable=False, default=False)

    # 返信内容
    reply_text = Column(Text, nullable=True)
    reply_generated_by = Column(String(50), nullable=True)  # template, ai, manual

    # ステータス
    status = Column(SQLEnum(ReplyStatus), nullable=False, default=ReplyStatus.PENDING)
    requires_approval = Column(Boolean, nullable=False, default=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # 送信情報
    sent_at = Column(DateTime, nullable=True)
    youtube_reply_id = Column(String(255), nullable=True)  # 送信後のYouTube返信ID
    error_message = Column(Text, nullable=True)

    # 効果測定
    reply_likes = Column(Integer, nullable=True)
    engagement_change = Column(Float, nullable=True)  # 返信後のエンゲージメント変化

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentLog(Base):
    """エージェント実行ログ"""
    __tablename__ = "agent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=True)

    # ログ情報
    level = Column(String(20), nullable=False)  # DEBUG, INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    details = Column(JSONB, nullable=True)

    # コンテキスト
    source = Column(String(255), nullable=True)  # ログ発生元
    action = Column(String(100), nullable=True)  # 実行中のアクション

    # タイムスタンプ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class TrendAlert(Base):
    """トレンドアラート（秘策2: サブエージェント戦略）"""
    __tablename__ = "trend_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=True)
    knowledge_id = Column(UUID(as_uuid=True), ForeignKey("knowledges.id", ondelete="CASCADE"), nullable=True)

    # アラート情報
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    alert_type = Column(String(100), nullable=False)  # keyword_spike, competitor_video, news_topic

    # トレンド詳細
    source = Column(String(100), nullable=True)  # youtube, google_trends, twitter等
    source_url = Column(String(2048), nullable=True)
    keyword = Column(String(255), nullable=True)
    trend_score = Column(Float, nullable=True)  # トレンドスコア
    growth_rate = Column(Float, nullable=True)  # 成長率

    # 関連データ
    related_data = Column(JSONB, nullable=True)  # 関連動画、検索ボリューム等
    suggested_actions = Column(JSONB, nullable=True)  # 推奨アクション

    # ステータス
    is_read = Column(Boolean, nullable=False, default=False)
    is_actioned = Column(Boolean, nullable=False, default=False)
    actioned_at = Column(DateTime, nullable=True)
    action_taken = Column(Text, nullable=True)  # 実施したアクション

    # 有効期限
    expires_at = Column(DateTime, nullable=True)  # トレンドの有効期限

    # タイムスタンプ
    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CompetitorAlert(Base):
    """競合アラート"""
    __tablename__ = "competitor_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=True)
    knowledge_id = Column(UUID(as_uuid=True), ForeignKey("knowledges.id", ondelete="CASCADE"), nullable=True)

    # アラート情報
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    alert_type = Column(String(100), nullable=False)  # new_video, viral_video, strategy_change

    # 競合情報
    competitor_channel_id = Column(String(255), nullable=True)
    competitor_channel_name = Column(String(255), nullable=True)
    competitor_video_id = Column(String(255), nullable=True)
    competitor_video_title = Column(String(500), nullable=True)
    competitor_video_url = Column(String(2048), nullable=True)

    # 分析結果
    analysis = Column(JSONB, nullable=True)  # タイトル分析、サムネイル分析等
    performance_metrics = Column(JSONB, nullable=True)  # 再生数、成長率等
    suggested_response = Column(JSONB, nullable=True)  # 推奨対応

    # ステータス
    is_read = Column(Boolean, nullable=False, default=False)
    is_actioned = Column(Boolean, nullable=False, default=False)
    actioned_at = Column(DateTime, nullable=True)
    action_taken = Column(Text, nullable=True)

    # タイムスタンプ
    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
