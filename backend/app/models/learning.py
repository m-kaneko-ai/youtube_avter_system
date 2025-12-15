"""
Learning Models

パフォーマンス学習システムのモデル定義
- 動画パフォーマンスの記録と学習
- 成功パターンの抽出
- 推奨事項の生成
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


# ============================================================
# Enums
# ============================================================

class PerformanceLevel(str, PyEnum):
    """パフォーマンスレベル"""
    EXCEPTIONAL = "exceptional"  # 上位10%
    HIGH = "high"  # 上位25%
    AVERAGE = "average"  # 平均的
    BELOW_AVERAGE = "below_average"  # 平均以下
    LOW = "low"  # 下位25%


class LearningCategory(str, PyEnum):
    """学習カテゴリ"""
    TITLE = "title"  # タイトル
    THUMBNAIL = "thumbnail"  # サムネイル
    HOOK = "hook"  # フック（冒頭）
    CONTENT_STRUCTURE = "content_structure"  # コンテンツ構成
    CTA = "cta"  # CTA
    TIMING = "timing"  # 投稿タイミング
    LENGTH = "length"  # 動画の長さ
    TAGS = "tags"  # タグ


class InsightType(str, PyEnum):
    """インサイトタイプ"""
    SUCCESS_PATTERN = "success_pattern"  # 成功パターン
    FAILURE_PATTERN = "failure_pattern"  # 失敗パターン
    TREND = "trend"  # トレンド
    RECOMMENDATION = "recommendation"  # 推奨事項
    CORRELATION = "correlation"  # 相関関係


# ============================================================
# Performance Record Model
# ============================================================

class PerformanceRecord(Base):
    """動画パフォーマンス記録"""
    __tablename__ = "performance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="記録ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, comment="動画ID")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, comment="プロジェクトID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # 基本情報
    video_type = Column(String(20), nullable=False, comment="動画タイプ（short/long）")
    published_at = Column(DateTime, nullable=True, comment="公開日時")
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow, comment="記録日時")

    # パフォーマンス指標
    views = Column(Integer, default=0, comment="再生回数")
    likes = Column(Integer, default=0, comment="いいね数")
    dislikes = Column(Integer, default=0, comment="低評価数")
    comments = Column(Integer, default=0, comment="コメント数")
    shares = Column(Integer, default=0, comment="共有数")
    subscribers_gained = Column(Integer, default=0, comment="獲得登録者数")
    subscribers_lost = Column(Integer, default=0, comment="失った登録者数")

    # 視聴データ
    watch_time_minutes = Column(Float, nullable=True, comment="総視聴時間（分）")
    avg_view_duration_seconds = Column(Integer, nullable=True, comment="平均視聴時間（秒）")
    avg_view_percentage = Column(Float, nullable=True, comment="平均視聴率（%）")

    # クリック率
    impressions = Column(Integer, default=0, comment="インプレッション数")
    ctr = Column(Float, nullable=True, comment="クリック率（%）")

    # パフォーマンスレベル
    performance_level = Column(
        SQLAlchemyEnum(PerformanceLevel, name="performancelevel", create_type=False),
        default=PerformanceLevel.AVERAGE,
        comment="パフォーマンスレベル"
    )
    performance_score = Column(Float, nullable=True, comment="パフォーマンススコア（0-100）")

    # コンテンツ属性（学習用）
    title_length = Column(Integer, nullable=True, comment="タイトル文字数")
    has_number_in_title = Column(Boolean, default=False, comment="タイトルに数字あり")
    has_question_in_title = Column(Boolean, default=False, comment="タイトルに疑問符あり")
    has_emoji_in_title = Column(Boolean, default=False, comment="タイトルに絵文字あり")
    video_length_seconds = Column(Integer, nullable=True, comment="動画の長さ（秒）")
    publish_day_of_week = Column(Integer, nullable=True, comment="公開曜日（0-6）")
    publish_hour = Column(Integer, nullable=True, comment="公開時間（0-23）")

    # メタデータ
    tags = Column(ARRAY(String(50)), nullable=True, comment="タグ")
    category = Column(String(100), nullable=True, comment="カテゴリ")
    extra_attributes = Column(JSONB, nullable=True, comment="追加属性（JSON）")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")


# ============================================================
# Learning Insight Model
# ============================================================

class LearningInsight(Base):
    """学習インサイト"""
    __tablename__ = "learning_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="インサイトID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID（チャンネル別）")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, comment="プロジェクトID")

    # インサイト情報
    insight_type = Column(
        SQLAlchemyEnum(InsightType, name="insighttype", create_type=False),
        nullable=False,
        comment="インサイトタイプ"
    )
    category = Column(
        SQLAlchemyEnum(LearningCategory, name="learningcategory", create_type=False),
        nullable=False,
        comment="学習カテゴリ"
    )

    # コンテンツ
    title = Column(String(255), nullable=False, comment="インサイトタイトル")
    description = Column(Text, nullable=True, comment="詳細説明")
    evidence = Column(JSONB, nullable=True, comment="根拠データ（JSON）")

    # 信頼度
    confidence_score = Column(Float, default=0.5, comment="信頼度スコア（0-1）")
    sample_size = Column(Integer, default=0, comment="サンプルサイズ")

    # 推奨事項
    recommendation = Column(Text, nullable=True, comment="推奨アクション")
    expected_impact = Column(String(100), nullable=True, comment="期待される影響")

    # ステータス
    is_active = Column(Boolean, default=True, comment="有効フラグ")
    is_applied = Column(Boolean, default=False, comment="適用済みフラグ")
    applied_at = Column(DateTime, nullable=True, comment="適用日時")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")


# ============================================================
# Success Pattern Model
# ============================================================

class SuccessPattern(Base):
    """成功パターン"""
    __tablename__ = "success_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="パターンID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # パターン情報
    name = Column(String(255), nullable=False, comment="パターン名")
    description = Column(Text, nullable=True, comment="パターン説明")
    category = Column(
        SQLAlchemyEnum(LearningCategory, name="learningcategory", create_type=False),
        nullable=False,
        comment="カテゴリ"
    )

    # パターン詳細
    pattern_data = Column(JSONB, nullable=False, comment="パターンデータ（JSON）")
    example_video_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True, comment="例となる動画ID")

    # 効果測定
    avg_performance_boost = Column(Float, nullable=True, comment="平均パフォーマンス向上率（%）")
    success_rate = Column(Float, nullable=True, comment="成功率（%）")
    application_count = Column(Integer, default=0, comment="適用回数")

    # ステータス
    is_active = Column(Boolean, default=True, comment="有効フラグ")
    priority = Column(Integer, default=0, comment="優先度")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")


# ============================================================
# Recommendation Model
# ============================================================

class Recommendation(Base):
    """推奨事項"""
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="推奨ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=True, comment="対象動画ID")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, comment="プロジェクトID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # 推奨情報
    category = Column(
        SQLAlchemyEnum(LearningCategory, name="learningcategory", create_type=False),
        nullable=False,
        comment="カテゴリ"
    )
    title = Column(String(255), nullable=False, comment="推奨タイトル")
    description = Column(Text, nullable=True, comment="推奨説明")
    action_items = Column(JSONB, nullable=True, comment="アクションアイテム（JSON）")

    # 根拠
    based_on_pattern_id = Column(UUID(as_uuid=True), ForeignKey("success_patterns.id", ondelete="SET NULL"), nullable=True, comment="基づくパターンID")
    based_on_insight_id = Column(UUID(as_uuid=True), ForeignKey("learning_insights.id", ondelete="SET NULL"), nullable=True, comment="基づくインサイトID")

    # 期待効果
    expected_impact_score = Column(Float, nullable=True, comment="期待影響スコア（0-100）")
    expected_metric = Column(String(50), nullable=True, comment="期待される指標")
    expected_improvement = Column(String(100), nullable=True, comment="期待される改善")

    # ステータス
    is_applied = Column(Boolean, default=False, comment="適用済みフラグ")
    applied_at = Column(DateTime, nullable=True, comment="適用日時")
    result_score = Column(Float, nullable=True, comment="結果スコア")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    based_on_pattern = relationship("SuccessPattern", foreign_keys=[based_on_pattern_id])
    based_on_insight = relationship("LearningInsight", foreign_keys=[based_on_insight_id])


# ============================================================
# Learning History Model
# ============================================================

class LearningHistory(Base):
    """学習履歴"""
    __tablename__ = "learning_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="履歴ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # 学習情報
    learning_type = Column(String(50), nullable=False, comment="学習タイプ")
    input_data_summary = Column(JSONB, nullable=True, comment="入力データサマリー")
    output_summary = Column(JSONB, nullable=True, comment="出力サマリー")

    # 結果
    patterns_discovered = Column(Integer, default=0, comment="発見パターン数")
    insights_generated = Column(Integer, default=0, comment="生成インサイト数")
    recommendations_created = Column(Integer, default=0, comment="作成推奨数")

    # メタデータ
    processing_time_seconds = Column(Float, nullable=True, comment="処理時間（秒）")
    model_version = Column(String(50), nullable=True, comment="モデルバージョン")

    created_at = Column(DateTime, default=datetime.utcnow, comment="実行日時")
