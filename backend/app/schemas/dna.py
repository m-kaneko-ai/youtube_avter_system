"""
DNA Schemas

コンテンツDNA抽出・管理のPydanticスキーマ
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================
# Enums
# ============================================================

class DNAElementType(str, Enum):
    HOOK = "hook"
    STORY_ARC = "story_arc"
    PERSONA = "persona"
    VISUAL_STYLE = "visual_style"
    AUDIO_STYLE = "audio_style"
    PACING = "pacing"
    EMOTION = "emotion"
    VALUE_PROP = "value_prop"
    CTA_STYLE = "cta_style"
    FORMAT = "format"


class DNAStrength(str, Enum):
    SIGNATURE = "signature"
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    ABSENT = "absent"


class TemplateStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


# ============================================================
# Content DNA Schemas
# ============================================================

class ContentDNABase(BaseModel):
    """コンテンツDNAベース"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    hook_elements: Optional[Dict[str, Any]] = None
    story_structure: Optional[Dict[str, Any]] = None
    persona_traits: Optional[Dict[str, Any]] = None
    visual_elements: Optional[Dict[str, Any]] = None
    audio_elements: Optional[Dict[str, Any]] = None
    pacing_data: Optional[Dict[str, Any]] = None
    emotional_arc: Optional[Dict[str, Any]] = None
    value_propositions: Optional[Dict[str, Any]] = None
    cta_patterns: Optional[Dict[str, Any]] = None


class ContentDNACreate(ContentDNABase):
    """コンテンツDNA作成"""
    video_id: Optional[str] = None
    knowledge_id: Optional[str] = None


class ContentDNAUpdate(BaseModel):
    """コンテンツDNA更新"""
    name: Optional[str] = None
    description: Optional[str] = None
    hook_elements: Optional[Dict[str, Any]] = None
    story_structure: Optional[Dict[str, Any]] = None
    persona_traits: Optional[Dict[str, Any]] = None
    visual_elements: Optional[Dict[str, Any]] = None
    audio_elements: Optional[Dict[str, Any]] = None
    pacing_data: Optional[Dict[str, Any]] = None
    emotional_arc: Optional[Dict[str, Any]] = None
    value_propositions: Optional[Dict[str, Any]] = None
    cta_patterns: Optional[Dict[str, Any]] = None
    overall_strength: Optional[float] = None
    uniqueness_score: Optional[float] = None
    consistency_score: Optional[float] = None


class ContentDNAResponse(ContentDNABase):
    """コンテンツDNAレスポンス"""
    id: str
    video_id: Optional[str] = None
    knowledge_id: Optional[str] = None
    overall_strength: Optional[float] = None
    uniqueness_score: Optional[float] = None
    consistency_score: Optional[float] = None
    source_videos_count: int
    last_analyzed_at: Optional[datetime] = None
    analysis_version: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentDNAListResponse(BaseModel):
    """コンテンツDNAリストレスポンス"""
    dnas: List[ContentDNAResponse]
    total: int


# ============================================================
# DNA Element Schemas
# ============================================================

class DNAElementBase(BaseModel):
    """DNA要素ベース"""
    element_type: DNAElementType
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    data: Dict[str, Any]
    examples: Optional[Dict[str, Any]] = None
    timestamps: Optional[List[float]] = None
    strength: DNAStrength = DNAStrength.MODERATE
    strength_score: Optional[float] = None
    impact_on_retention: Optional[float] = None
    impact_on_engagement: Optional[float] = None


class DNAElementCreate(DNAElementBase):
    """DNA要素作成"""
    content_dna_id: str


class DNAElementResponse(DNAElementBase):
    """DNA要素レスポンス"""
    id: str
    content_dna_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# DNA Template Schemas
# ============================================================

class DNATemplateBase(BaseModel):
    """DNAテンプレートベース"""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    video_type: Optional[str] = None
    structure: Dict[str, Any]
    required_elements: Optional[List[str]] = None
    optional_elements: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class DNATemplateCreate(DNATemplateBase):
    """DNAテンプレート作成"""
    knowledge_id: Optional[str] = None
    source_dna_ids: Optional[List[str]] = None


class DNATemplateUpdate(BaseModel):
    """DNAテンプレート更新"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    video_type: Optional[str] = None
    structure: Optional[Dict[str, Any]] = None
    required_elements: Optional[List[str]] = None
    optional_elements: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    status: Optional[TemplateStatus] = None


class DNATemplateResponse(DNATemplateBase):
    """DNAテンプレートレスポンス"""
    id: str
    knowledge_id: Optional[str] = None
    source_dna_ids: Optional[List[str]] = None
    avg_performance_score: Optional[float] = None
    status: TemplateStatus
    usage_count: int
    success_rate: Optional[float] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DNATemplateListResponse(BaseModel):
    """DNAテンプレートリストレスポンス"""
    templates: List[DNATemplateResponse]
    total: int


# ============================================================
# DNA Comparison Schemas
# ============================================================

class DNAComparisonRequest(BaseModel):
    """DNA比較リクエスト"""
    source_dna_id: str
    target_dna_id: str


class DNAComparisonResponse(BaseModel):
    """DNA比較レスポンス"""
    id: str
    source_dna_id: str
    target_dna_id: str
    overall_similarity: float
    hook_similarity: Optional[float] = None
    structure_similarity: Optional[float] = None
    style_similarity: Optional[float] = None
    comparison_details: Optional[Dict[str, Any]] = None
    shared_elements: Optional[List[str]] = None
    unique_to_source: Optional[List[str]] = None
    unique_to_target: Optional[List[str]] = None
    recommendations: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Channel DNA Profile Schemas
# ============================================================

class ChannelDNAProfileBase(BaseModel):
    """チャンネルDNAプロファイルベース"""
    channel_name: Optional[str] = None
    niche: Optional[str] = None
    signature_elements: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    content_style: Optional[Dict[str, Any]] = None
    visual_identity: Optional[Dict[str, Any]] = None
    voice_identity: Optional[Dict[str, Any]] = None
    best_performing_elements: Optional[Dict[str, Any]] = None
    underperforming_elements: Optional[Dict[str, Any]] = None
    improvement_opportunities: Optional[Dict[str, Any]] = None


class ChannelDNAProfileCreate(ChannelDNAProfileBase):
    """チャンネルDNAプロファイル作成"""
    knowledge_id: str


class ChannelDNAProfileUpdate(ChannelDNAProfileBase):
    """チャンネルDNAプロファイル更新"""
    pass


class ChannelDNAProfileResponse(ChannelDNAProfileBase):
    """チャンネルDNAプロファイルレスポンス"""
    id: str
    knowledge_id: str
    videos_analyzed: int
    avg_dna_consistency: Optional[float] = None
    last_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# DNA Analysis Schemas
# ============================================================

class DNAExtractionRequest(BaseModel):
    """DNA抽出リクエスト"""
    video_id: Optional[str] = None
    knowledge_id: Optional[str] = None
    video_ids: Optional[List[str]] = None
    include_transcript: bool = True
    include_visual_analysis: bool = False
    include_audio_analysis: bool = False


class DNAExtractionResponse(BaseModel):
    """DNA抽出レスポンス"""
    dna_id: str
    status: str
    elements_extracted: int
    processing_time_seconds: float
    summary: Dict[str, Any]


class DNASummary(BaseModel):
    """DNAサマリー"""
    total_dnas: int
    total_templates: int
    total_profiles: int
    avg_strength_score: Optional[float] = None
    most_common_elements: List[str]
    top_performing_patterns: List[Dict[str, Any]]


class DNARecommendation(BaseModel):
    """DNA推奨"""
    element_type: DNAElementType
    recommendation: str
    based_on: str
    expected_impact: str
    confidence: float
