"""
Optimization Models

YouTubeアルゴリズム最適化のモデル定義
- リテンション曲線分析
- A/Bテスト管理
- 最適投稿時間分析
- 終了画面最適化
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

class ABTestStatus(str, PyEnum):
    """A/Bテストステータス"""
    DRAFT = "draft"  # 下書き
    RUNNING = "running"  # 実行中
    PAUSED = "paused"  # 一時停止
    COMPLETED = "completed"  # 完了
    CANCELLED = "cancelled"  # キャンセル


class ABTestType(str, PyEnum):
    """A/Bテストタイプ"""
    THUMBNAIL = "thumbnail"  # サムネイル
    TITLE = "title"  # タイトル
    DESCRIPTION = "description"  # 説明文


class RetentionEventType(str, PyEnum):
    """リテンションイベントタイプ"""
    HOOK = "hook"  # フック（冒頭）
    DROP = "drop"  # 離脱ポイント
    SPIKE = "spike"  # 視聴スパイク
    CTA = "cta"  # CTA
    END = "end"  # 終了


class EndScreenElementType(str, PyEnum):
    """終了画面要素タイプ"""
    VIDEO = "video"  # 動画
    PLAYLIST = "playlist"  # プレイリスト
    SUBSCRIBE = "subscribe"  # チャンネル登録
    LINK = "link"  # リンク


class EndScreenPosition(str, PyEnum):
    """終了画面位置"""
    TOP_LEFT = "top_left"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_RIGHT = "bottom_right"
    CENTER = "center"


# ============================================================
# Retention Analysis Model
# ============================================================

class RetentionCurve(Base):
    """リテンション曲線"""
    __tablename__ = "retention_curves"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="曲線ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, comment="動画ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # リテンションデータ
    data_points = Column(JSONB, nullable=False, comment="リテンションデータポイント [{timestamp, retention_rate}]")
    avg_view_percentage = Column(Float, nullable=True, comment="平均視聴率（%）")
    avg_view_duration_seconds = Column(Integer, nullable=True, comment="平均視聴時間（秒）")

    # 分析結果
    hook_retention = Column(Float, nullable=True, comment="フック（最初30秒）リテンション率")
    mid_retention = Column(Float, nullable=True, comment="中盤リテンション率")
    end_retention = Column(Float, nullable=True, comment="終盤リテンション率")

    # 離脱ポイント
    major_drop_points = Column(JSONB, nullable=True, comment="主要離脱ポイント [{timestamp, drop_rate}]")
    recovery_points = Column(JSONB, nullable=True, comment="回復ポイント [{timestamp, recovery_rate}]")

    # ベンチマーク比較
    benchmark_comparison = Column(Float, nullable=True, comment="ベンチマーク比較（%差）")
    category_rank = Column(Integer, nullable=True, comment="カテゴリ内順位")

    # メタデータ
    video_length_seconds = Column(Integer, nullable=True, comment="動画の長さ（秒）")
    sample_size = Column(Integer, default=0, comment="サンプルサイズ（視聴回数）")
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow, comment="記録日時")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    events = relationship("RetentionEvent", back_populates="retention_curve", cascade="all, delete-orphan")


class RetentionEvent(Base):
    """リテンションイベント（離脱/スパイクポイント）"""
    __tablename__ = "retention_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="イベントID")
    retention_curve_id = Column(UUID(as_uuid=True), ForeignKey("retention_curves.id", ondelete="CASCADE"), nullable=False, comment="曲線ID")

    # イベント情報
    event_type = Column(
        SQLAlchemyEnum(RetentionEventType, name="retentioneventtype", create_type=False),
        nullable=False,
        comment="イベントタイプ"
    )
    timestamp_seconds = Column(Float, nullable=False, comment="タイムスタンプ（秒）")
    timestamp_percentage = Column(Float, nullable=True, comment="タイムスタンプ（%）")

    # 変化率
    retention_before = Column(Float, nullable=True, comment="イベント前リテンション率")
    retention_after = Column(Float, nullable=True, comment="イベント後リテンション率")
    change_rate = Column(Float, nullable=True, comment="変化率（%）")

    # コンテンツ分析
    content_at_timestamp = Column(Text, nullable=True, comment="タイムスタンプ時のコンテンツ")
    analysis_notes = Column(Text, nullable=True, comment="分析ノート")
    recommended_action = Column(Text, nullable=True, comment="推奨アクション")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")

    # Relationships
    retention_curve = relationship("RetentionCurve", back_populates="events")


# ============================================================
# A/B Test Model
# ============================================================

class ABTest(Base):
    """A/Bテスト"""
    __tablename__ = "ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="テストID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, comment="動画ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="作成者ID")

    # テスト情報
    name = Column(String(255), nullable=False, comment="テスト名")
    description = Column(Text, nullable=True, comment="テスト説明")
    test_type = Column(
        SQLAlchemyEnum(ABTestType, name="abtesttype", create_type=False),
        nullable=False,
        comment="テストタイプ"
    )

    # ステータス
    status = Column(
        SQLAlchemyEnum(ABTestStatus, name="abteststatus", create_type=False),
        default=ABTestStatus.DRAFT,
        comment="ステータス"
    )

    # 期間
    started_at = Column(DateTime, nullable=True, comment="開始日時")
    ended_at = Column(DateTime, nullable=True, comment="終了日時")
    duration_hours = Column(Integer, default=24, comment="テスト期間（時間）")

    # 設定
    traffic_split = Column(Float, default=50.0, comment="トラフィック分割（%）")
    min_sample_size = Column(Integer, default=1000, comment="最小サンプルサイズ")
    confidence_level = Column(Float, default=0.95, comment="信頼水準")

    # 結果
    winner_variant = Column(String(10), nullable=True, comment="勝者バリアント（A/B）")
    statistical_significance = Column(Float, nullable=True, comment="統計的有意性")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    variants = relationship("ABTestVariant", back_populates="ab_test", cascade="all, delete-orphan")


class ABTestVariant(Base):
    """A/Bテストバリアント"""
    __tablename__ = "ab_test_variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="バリアントID")
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id", ondelete="CASCADE"), nullable=False, comment="テストID")

    # バリアント情報
    variant_name = Column(String(10), nullable=False, comment="バリアント名（A/B）")
    is_control = Column(Boolean, default=False, comment="コントロール（元のバージョン）")

    # コンテンツ
    content = Column(Text, nullable=True, comment="コンテンツ（タイトル/説明）")
    image_url = Column(String(500), nullable=True, comment="画像URL（サムネイル）")
    image_data = Column(JSONB, nullable=True, comment="画像メタデータ")

    # メトリクス
    impressions = Column(Integer, default=0, comment="インプレッション数")
    clicks = Column(Integer, default=0, comment="クリック数")
    views = Column(Integer, default=0, comment="再生回数")
    ctr = Column(Float, nullable=True, comment="クリック率（%）")
    avg_view_duration = Column(Float, nullable=True, comment="平均視聴時間（秒）")
    avg_view_percentage = Column(Float, nullable=True, comment="平均視聴率（%）")

    # 追加メトリクス
    likes = Column(Integer, default=0, comment="いいね数")
    comments = Column(Integer, default=0, comment="コメント数")
    shares = Column(Integer, default=0, comment="共有数")
    subscribers_gained = Column(Integer, default=0, comment="獲得登録者数")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    ab_test = relationship("ABTest", back_populates="variants")


# ============================================================
# Optimal Posting Time Model
# ============================================================

class PostingTimeAnalysis(Base):
    """最適投稿時間分析"""
    __tablename__ = "posting_time_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="分析ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=False, comment="ナレッジID")

    # 分析設定
    video_type = Column(String(20), nullable=True, comment="動画タイプ（short/long）")
    analysis_period_days = Column(Integer, default=90, comment="分析期間（日）")
    sample_size = Column(Integer, default=0, comment="サンプルサイズ")

    # 最適時間
    optimal_day_of_week = Column(Integer, nullable=True, comment="最適曜日（0=月, 6=日）")
    optimal_hour = Column(Integer, nullable=True, comment="最適時間（0-23）")
    optimal_minute = Column(Integer, default=0, comment="最適分（0-59）")

    # 曜日別パフォーマンス
    day_performance = Column(JSONB, nullable=True, comment="曜日別パフォーマンス [{day, avg_views, avg_ctr}]")

    # 時間別パフォーマンス
    hour_performance = Column(JSONB, nullable=True, comment="時間別パフォーマンス [{hour, avg_views, avg_ctr}]")

    # ヒートマップデータ
    heatmap_data = Column(JSONB, nullable=True, comment="曜日×時間ヒートマップ")

    # 推奨スロット
    recommended_slots = Column(JSONB, nullable=True, comment="推奨投稿スロット [{day, hour, score}]")

    # 競合分析
    competitor_posting_times = Column(JSONB, nullable=True, comment="競合の投稿時間")
    avoid_times = Column(JSONB, nullable=True, comment="避けるべき時間")

    # 信頼度
    confidence_score = Column(Float, nullable=True, comment="信頼度スコア（0-1）")

    analyzed_at = Column(DateTime, nullable=False, default=datetime.utcnow, comment="分析日時")
    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")


class PostingScheduleRecommendation(Base):
    """投稿スケジュール推奨"""
    __tablename__ = "posting_schedule_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="推奨ID")
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("posting_time_analyses.id", ondelete="CASCADE"), nullable=False, comment="分析ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=True, comment="動画ID")

    # 推奨時間
    recommended_datetime = Column(DateTime, nullable=False, comment="推奨投稿日時")
    recommended_day_of_week = Column(Integer, nullable=False, comment="推奨曜日")
    recommended_hour = Column(Integer, nullable=False, comment="推奨時間")

    # スコア
    score = Column(Float, nullable=False, comment="推奨スコア（0-100）")
    reasoning = Column(Text, nullable=True, comment="推奨理由")

    # 予測
    predicted_initial_views = Column(Integer, nullable=True, comment="予測初期再生数")
    predicted_ctr = Column(Float, nullable=True, comment="予測CTR")

    # ステータス
    is_accepted = Column(Boolean, default=False, comment="承認済み")
    actual_posted_at = Column(DateTime, nullable=True, comment="実際の投稿日時")

    # 結果（投稿後）
    actual_initial_views = Column(Integer, nullable=True, comment="実際の初期再生数")
    actual_ctr = Column(Float, nullable=True, comment="実際のCTR")
    accuracy_score = Column(Float, nullable=True, comment="精度スコア")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")


# ============================================================
# End Screen Model
# ============================================================

class EndScreen(Base):
    """終了画面"""
    __tablename__ = "end_screens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="終了画面ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, comment="動画ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # 終了画面設定
    start_time_seconds = Column(Float, nullable=False, comment="開始時間（秒）")
    duration_seconds = Column(Float, default=20.0, comment="表示時間（秒）")

    # 背景
    background_type = Column(String(20), default="video", comment="背景タイプ（video/image/color）")
    background_color = Column(String(20), nullable=True, comment="背景色")
    background_image_url = Column(String(500), nullable=True, comment="背景画像URL")

    # パフォーマンス
    total_clicks = Column(Integer, default=0, comment="総クリック数")
    click_through_rate = Column(Float, nullable=True, comment="クリック率")

    # ステータス
    is_active = Column(Boolean, default=True, comment="有効フラグ")
    is_published = Column(Boolean, default=False, comment="公開済み")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    elements = relationship("EndScreenElement", back_populates="end_screen", cascade="all, delete-orphan")


class EndScreenElement(Base):
    """終了画面要素"""
    __tablename__ = "end_screen_elements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="要素ID")
    end_screen_id = Column(UUID(as_uuid=True), ForeignKey("end_screens.id", ondelete="CASCADE"), nullable=False, comment="終了画面ID")

    # 要素タイプ
    element_type = Column(
        SQLAlchemyEnum(EndScreenElementType, name="endscreenelementtype", create_type=False),
        nullable=False,
        comment="要素タイプ"
    )

    # 位置・サイズ
    position = Column(
        SQLAlchemyEnum(EndScreenPosition, name="endscreenposition", create_type=False),
        nullable=False,
        comment="位置"
    )
    position_x = Column(Float, nullable=True, comment="X座標（%）")
    position_y = Column(Float, nullable=True, comment="Y座標（%）")
    width = Column(Float, nullable=True, comment="幅（%）")
    height = Column(Float, nullable=True, comment="高さ（%）")

    # タイミング
    start_offset_seconds = Column(Float, default=0, comment="開始オフセット（秒）")
    duration_seconds = Column(Float, nullable=True, comment="表示時間（秒）")

    # コンテンツ
    target_video_id = Column(UUID(as_uuid=True), nullable=True, comment="対象動画ID")
    target_playlist_id = Column(String(100), nullable=True, comment="対象プレイリストID")
    target_url = Column(String(500), nullable=True, comment="対象URL")
    custom_message = Column(String(200), nullable=True, comment="カスタムメッセージ")

    # 表示設定
    display_text = Column(String(100), nullable=True, comment="表示テキスト")
    thumbnail_url = Column(String(500), nullable=True, comment="サムネイルURL")

    # パフォーマンス
    impressions = Column(Integer, default=0, comment="インプレッション数")
    clicks = Column(Integer, default=0, comment="クリック数")
    click_through_rate = Column(Float, nullable=True, comment="クリック率")

    # 順序
    display_order = Column(Integer, default=0, comment="表示順序")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    end_screen = relationship("EndScreen", back_populates="elements")


# ============================================================
# End Screen Template Model
# ============================================================

class EndScreenTemplate(Base):
    """終了画面テンプレート"""
    __tablename__ = "end_screen_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="テンプレートID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="作成者ID")

    # テンプレート情報
    name = Column(String(255), nullable=False, comment="テンプレート名")
    description = Column(Text, nullable=True, comment="説明")
    video_type = Column(String(20), nullable=True, comment="動画タイプ（short/long）")

    # レイアウト
    layout = Column(JSONB, nullable=False, comment="レイアウト定義")
    element_configs = Column(JSONB, nullable=True, comment="要素設定")

    # パフォーマンス（テンプレート使用時の平均）
    avg_click_through_rate = Column(Float, nullable=True, comment="平均クリック率")
    usage_count = Column(Integer, default=0, comment="使用回数")

    # ステータス
    is_default = Column(Boolean, default=False, comment="デフォルト")
    is_active = Column(Boolean, default=True, comment="有効")

    # タグ
    tags = Column(ARRAY(String(50)), nullable=True, comment="タグ")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")
