"""
Content DNA Models

コンテンツDNA抽出・管理のモデル定義
- 成功コンテンツの構成要素（DNA）を抽出
- DNA要素の組み合わせによる新コンテンツ生成支援
- クリエイターの強みの可視化
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
from pgvector.sqlalchemy import Vector as VECTOR
from sqlalchemy.orm import relationship

from app.core.database import Base


# ============================================================
# Enums
# ============================================================

class DNAElementType(str, PyEnum):
    """DNA要素タイプ"""
    HOOK = "hook"  # フック（冒頭の掴み）
    STORY_ARC = "story_arc"  # ストーリー構成
    PERSONA = "persona"  # キャラクター/ペルソナ
    VISUAL_STYLE = "visual_style"  # ビジュアルスタイル
    AUDIO_STYLE = "audio_style"  # 音声スタイル
    PACING = "pacing"  # ペース配分
    EMOTION = "emotion"  # 感情的要素
    VALUE_PROP = "value_prop"  # 価値提案
    CTA_STYLE = "cta_style"  # CTAスタイル
    FORMAT = "format"  # フォーマット


class DNAStrength(str, PyEnum):
    """DNA強度"""
    SIGNATURE = "signature"  # シグネチャー（特徴的）
    STRONG = "strong"  # 強い
    MODERATE = "moderate"  # 中程度
    WEAK = "weak"  # 弱い
    ABSENT = "absent"  # 欠如


class TemplateStatus(str, PyEnum):
    """テンプレートステータス"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


# ============================================================
# Content DNA Model
# ============================================================

class ContentDNA(Base):
    """コンテンツDNA"""
    __tablename__ = "content_dnas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="DNA ID")
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=True, comment="動画ID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID（チャンネル全体のDNA）")

    # DNA情報
    name = Column(String(255), nullable=True, comment="DNA名")
    description = Column(Text, nullable=True, comment="DNA説明")

    # DNA要素（構造化）
    hook_elements = Column(JSONB, nullable=True, comment="フック要素")
    story_structure = Column(JSONB, nullable=True, comment="ストーリー構造")
    persona_traits = Column(JSONB, nullable=True, comment="ペルソナ特性")
    visual_elements = Column(JSONB, nullable=True, comment="ビジュアル要素")
    audio_elements = Column(JSONB, nullable=True, comment="音声要素")
    pacing_data = Column(JSONB, nullable=True, comment="ペースデータ")
    emotional_arc = Column(JSONB, nullable=True, comment="感情曲線")
    value_propositions = Column(JSONB, nullable=True, comment="価値提案")
    cta_patterns = Column(JSONB, nullable=True, comment="CTAパターン")

    # DNA強度スコア
    overall_strength = Column(Float, nullable=True, comment="総合DNA強度（0-100）")
    uniqueness_score = Column(Float, nullable=True, comment="ユニークさスコア（0-100）")
    consistency_score = Column(Float, nullable=True, comment="一貫性スコア（0-100）")

    # ベクトル埋め込み（類似DNA検索用）
    embedding = Column(VECTOR(1536), nullable=True, comment="DNA埋め込みベクトル")

    # メタデータ
    source_videos_count = Column(Integer, default=1, comment="ソース動画数")
    last_analyzed_at = Column(DateTime, nullable=True, comment="最終分析日時")
    analysis_version = Column(String(20), nullable=True, comment="分析バージョン")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    elements = relationship("DNAElement", back_populates="content_dna", cascade="all, delete-orphan")


# ============================================================
# DNA Element Model
# ============================================================

class DNAElement(Base):
    """DNA要素"""
    __tablename__ = "dna_elements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="要素ID")
    content_dna_id = Column(UUID(as_uuid=True), ForeignKey("content_dnas.id", ondelete="CASCADE"), nullable=False, comment="DNA ID")

    # 要素情報
    element_type = Column(
        SQLAlchemyEnum(DNAElementType, name="dnaelementtype", create_type=False),
        nullable=False,
        comment="要素タイプ"
    )
    name = Column(String(255), nullable=False, comment="要素名")
    description = Column(Text, nullable=True, comment="要素説明")

    # 要素データ
    data = Column(JSONB, nullable=False, comment="要素データ（JSON）")
    examples = Column(JSONB, nullable=True, comment="例（JSON）")
    timestamps = Column(ARRAY(Float), nullable=True, comment="タイムスタンプ（秒）")

    # 強度
    strength = Column(
        SQLAlchemyEnum(DNAStrength, name="dnastrength", create_type=False),
        default=DNAStrength.MODERATE,
        comment="強度"
    )
    strength_score = Column(Float, nullable=True, comment="強度スコア（0-100）")

    # 効果測定
    impact_on_retention = Column(Float, nullable=True, comment="視聴維持への影響（%）")
    impact_on_engagement = Column(Float, nullable=True, comment="エンゲージメントへの影響（%）")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")

    # Relationships
    content_dna = relationship("ContentDNA", back_populates="elements")


# ============================================================
# DNA Template Model
# ============================================================

class DNATemplate(Base):
    """DNAテンプレート（成功パターンから生成）"""
    __tablename__ = "dna_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="テンプレートID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=True, comment="ナレッジID")

    # テンプレート情報
    name = Column(String(255), nullable=False, comment="テンプレート名")
    description = Column(Text, nullable=True, comment="テンプレート説明")
    category = Column(String(100), nullable=True, comment="カテゴリ")
    video_type = Column(String(20), nullable=True, comment="動画タイプ（short/long）")

    # テンプレート構造
    structure = Column(JSONB, nullable=False, comment="テンプレート構造（JSON）")
    required_elements = Column(ARRAY(String(50)), nullable=True, comment="必須要素")
    optional_elements = Column(ARRAY(String(50)), nullable=True, comment="オプション要素")

    # DNA参照
    source_dna_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True, comment="ソースDNA ID")
    avg_performance_score = Column(Float, nullable=True, comment="平均パフォーマンススコア")

    # ステータス
    status = Column(
        SQLAlchemyEnum(TemplateStatus, name="templatestatus", create_type=False),
        default=TemplateStatus.DRAFT,
        comment="ステータス"
    )
    usage_count = Column(Integer, default=0, comment="使用回数")
    success_rate = Column(Float, nullable=True, comment="成功率（%）")

    # メタデータ
    tags = Column(ARRAY(String(50)), nullable=True, comment="タグ")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="作成者ID")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")


# ============================================================
# DNA Comparison Model
# ============================================================

class DNAComparison(Base):
    """DNA比較結果"""
    __tablename__ = "dna_comparisons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="比較ID")

    # 比較対象
    source_dna_id = Column(UUID(as_uuid=True), ForeignKey("content_dnas.id", ondelete="CASCADE"), nullable=False, comment="ソースDNA ID")
    target_dna_id = Column(UUID(as_uuid=True), ForeignKey("content_dnas.id", ondelete="CASCADE"), nullable=False, comment="ターゲットDNA ID")

    # 類似度スコア
    overall_similarity = Column(Float, nullable=False, comment="総合類似度（0-1）")
    hook_similarity = Column(Float, nullable=True, comment="フック類似度")
    structure_similarity = Column(Float, nullable=True, comment="構造類似度")
    style_similarity = Column(Float, nullable=True, comment="スタイル類似度")

    # 詳細比較
    comparison_details = Column(JSONB, nullable=True, comment="比較詳細（JSON）")
    shared_elements = Column(ARRAY(String(100)), nullable=True, comment="共通要素")
    unique_to_source = Column(ARRAY(String(100)), nullable=True, comment="ソース固有要素")
    unique_to_target = Column(ARRAY(String(100)), nullable=True, comment="ターゲット固有要素")

    # 推奨
    recommendations = Column(JSONB, nullable=True, comment="推奨事項（JSON）")

    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")

    # Relationships
    source_dna = relationship("ContentDNA", foreign_keys=[source_dna_id])
    target_dna = relationship("ContentDNA", foreign_keys=[target_dna_id])


# ============================================================
# Channel DNA Profile Model
# ============================================================

class ChannelDNAProfile(Base):
    """チャンネルDNAプロファイル"""
    __tablename__ = "channel_dna_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="プロファイルID")
    knowledge_id = Column(UUID(as_uuid=True), nullable=False, unique=True, comment="ナレッジID")

    # プロファイル情報
    channel_name = Column(String(255), nullable=True, comment="チャンネル名")
    niche = Column(String(100), nullable=True, comment="ニッチ/カテゴリ")

    # 強み分析
    signature_elements = Column(JSONB, nullable=True, comment="シグネチャー要素（JSON）")
    strengths = Column(ARRAY(String(100)), nullable=True, comment="強み")
    weaknesses = Column(ARRAY(String(100)), nullable=True, comment="弱み")

    # スタイル
    content_style = Column(JSONB, nullable=True, comment="コンテンツスタイル（JSON）")
    visual_identity = Column(JSONB, nullable=True, comment="ビジュアルアイデンティティ（JSON）")
    voice_identity = Column(JSONB, nullable=True, comment="ボイスアイデンティティ（JSON）")

    # パフォーマンス傾向
    best_performing_elements = Column(JSONB, nullable=True, comment="最高パフォーマンス要素")
    underperforming_elements = Column(JSONB, nullable=True, comment="低パフォーマンス要素")
    improvement_opportunities = Column(JSONB, nullable=True, comment="改善機会")

    # 統計
    videos_analyzed = Column(Integer, default=0, comment="分析動画数")
    avg_dna_consistency = Column(Float, nullable=True, comment="平均DNA一貫性（%）")

    # ベクトル埋め込み
    embedding = Column(VECTOR(1536), nullable=True, comment="プロファイル埋め込みベクトル")

    last_updated_at = Column(DateTime, nullable=True, comment="最終更新日時")
    created_at = Column(DateTime, default=datetime.utcnow, comment="作成日時")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新日時")
