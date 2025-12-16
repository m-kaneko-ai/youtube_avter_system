"""
専門家レビュー機能のスキーマ定義

5人のAI専門家による台本添削システムのPydanticスキーマ
"""
from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ExpertType(str, Enum):
    """専門家タイプ"""
    HOOK_MASTER = "hook_master"
    STORY_ARCHITECT = "story_architect"
    ENTERTAINMENT_PRODUCER = "entertainment_producer"
    TARGET_INSIGHT = "target_insight"
    CTA_STRATEGIST = "cta_strategist"


class PublishGrade(str, Enum):
    """公開判定ランク"""
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class VisualInsertType(str, Enum):
    """差し込みビジュアルの種類"""
    NUMBER_SLIDE = "number_slide"      # 数字スライド
    BULLET_SLIDE = "bullet_slide"      # 箇条書きスライド
    IMAGE = "image"                    # イメージ画像
    CHART = "chart"                    # 図解・チャート
    BROLL = "broll"                    # B-roll動画
    CAPTION = "caption"                # テロップ強調
    QUESTION = "question"              # 問いかけ画面
    AVATAR_ONLY = "avatar_only"        # アバターのみ


class AvatarPositionType(str, Enum):
    """差し込み時のアバター位置"""
    HIDDEN = "hidden"                  # 完全切り替え
    PIP_RIGHT = "pip_right"            # 右下PiP
    PIP_LEFT = "pip_left"              # 左下PiP
    PIP_BOTTOM = "pip_bottom"          # 下部PiP
    SPLIT_LEFT = "split_left"          # 画面分割（左）
    SPLIT_RIGHT = "split_right"        # 画面分割（右）


class TimelineWarningType(str, Enum):
    """タイムライン警告タイプ"""
    AVATAR_TOO_LONG = "avatar_too_long"
    NO_VISUAL_CHANGE = "no_visual_change"
    LOW_ENGAGEMENT = "low_engagement"


class ScriptSectionInput(BaseModel):
    """台本セクション入力"""
    id: str
    label: str
    timestamp: str
    content: str


class ExpertReviewRequest(BaseModel):
    """専門家レビューリクエスト"""
    script_id: str
    sections: List[ScriptSectionInput]
    source_ai_type: str = Field(..., pattern="^(gemini|claude)$")
    knowledge_id: Optional[str] = None


class ScoreComparison(BaseModel):
    """スコア比較"""
    before: int
    after: int


class BeforeAfterComparison(BaseModel):
    """ビフォーアフター比較"""
    hook_score: ScoreComparison
    retention_score: ScoreComparison
    cta_score: ScoreComparison
    overall_score: ScoreComparison


class ChecklistItemResponse(BaseModel):
    """チェックリストアイテム"""
    id: str
    label: str
    passed: bool
    comment: Optional[str] = None


class PublishReadinessResponse(BaseModel):
    """公開OK判定"""
    ready: bool
    score: int
    grade: PublishGrade
    message: str


class PersonaReactionResponse(BaseModel):
    """ペルソナ反応予測"""
    persona_type: str
    persona_name: str
    reaction_score: int
    reaction_emoji: str
    reason: str


class ExpertFeedbackResponse(BaseModel):
    """専門家フィードバック"""
    expert_type: ExpertType
    score: int
    original_text: str
    revised_text: str
    improvement_reason: str
    suggestions: List[str]


class ImprovementReasonResponse(BaseModel):
    """改善の根拠"""
    expert_type: ExpertType
    reason: str


class ExpertContribution(BaseModel):
    """専門家の貢献"""
    expert_type: ExpertType
    contribution: str


class RevisedSectionResponse(BaseModel):
    """改善された台本セクション"""
    id: str
    label: str
    timestamp: str
    original_content: str
    revised_content: str
    is_improved: bool
    improvements_by_expert: List[ExpertContribution]


class SlideSuggestionResponse(BaseModel):
    """スライド内容提案"""
    title: Optional[str] = None
    points: Optional[List[str]] = None
    main_number: Optional[str] = None
    sub_text: Optional[str] = None


class DirectionSuggestionResponse(BaseModel):
    """演出提案"""
    section_id: str
    section_label: str
    timestamp: str
    urgency: int = Field(..., ge=1, le=5)
    urgency_reason: str
    suggested_type: VisualInsertType
    avatar_position: AvatarPositionType
    reason: str
    slide_suggestion: Optional[SlideSuggestionResponse] = None
    search_keywords: Optional[List[str]] = None
    recommended_colors: Optional[List[str]] = None
    display_duration: Optional[int] = None
    suggested_by: ExpertType


class TimelineWarningResponse(BaseModel):
    """タイムライン警告"""
    start_time: str
    end_time: str
    duration_seconds: int
    warning_type: TimelineWarningType
    message: str
    recommendation: str


class ExpertReviewResponse(BaseModel):
    """専門家レビュー結果"""
    id: str
    script_id: str
    revised_sections: List[RevisedSectionResponse]
    expert_feedbacks: List[ExpertFeedbackResponse]
    publish_readiness: PublishReadinessResponse
    checklist: List[ChecklistItemResponse]
    before_after: BeforeAfterComparison
    improvement_reasons: List[ImprovementReasonResponse]
    persona_reactions: List[PersonaReactionResponse]
    direction_suggestions: List[DirectionSuggestionResponse]
    timeline_warnings: List[TimelineWarningResponse]
    source_ai_type: str
    created_at: str
    processing_time_ms: int


class ExpertReviewProgressResponse(BaseModel):
    """専門家レビュー進捗"""
    status: str
    current_expert: Optional[ExpertType] = None
    completed_experts: List[ExpertType]
    progress: int
    error_message: Optional[str] = None
