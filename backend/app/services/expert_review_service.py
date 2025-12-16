"""
専門家レビューサービス

5人のAI専門家が台本を添削し、最高版と安心セットを生成
"""
import logging
import time
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.schemas.expert_review import (
    ExpertType,
    ExpertReviewRequest,
    ExpertReviewResponse,
    RevisedSectionResponse,
    ExpertFeedbackResponse,
    PublishReadinessResponse,
    ChecklistItemResponse,
    BeforeAfterComparison,
    ScoreComparison,
    ImprovementReasonResponse,
    PersonaReactionResponse,
    ExpertContribution,
    PublishGrade,
    DirectionSuggestionResponse,
    TimelineWarningResponse,
    SlideSuggestionResponse,
    VisualInsertType,
    AvatarPositionType,
    TimelineWarningType,
)

logger = logging.getLogger(__name__)


# 専門家設定
EXPERT_CONFIG: Dict[ExpertType, Dict[str, str]] = {
    ExpertType.HOOK_MASTER: {
        "label": "フックマスター",
        "icon": "🎣",
        "description": "冒頭30秒の鬼",
        "prompt_template": """あなたは「フックマスター」として、冒頭30秒の改善を専門とします。

【分析対象】
{section_content}

【評価基準】
1. 3秒以内にインパクトがあるか
2. 視聴者の問題提起が明確か
3. 続きが気になる仕掛けがあるか
4. ターゲットが「自分ごと化」できるか

【タスク】
- スコア（0-100）を採点
- 改善版を提案
- 改善理由を説明
- 具体的な提案を3つ"""
    },
    ExpertType.STORY_ARCHITECT: {
        "label": "ストーリーアーキテクト",
        "icon": "🎬",
        "description": "構成全体の設計士",
        "prompt_template": """あなたは「ストーリーアーキテクト」として、台本全体の構成を評価します。

【分析対象】
{section_content}

【評価基準】
1. 起承転結が明確か
2. 論理展開がスムーズか
3. 情報の順序が最適か
4. 視聴者が理解しやすいか

【タスク】
- スコア（0-100）を採点
- 改善版を提案
- 改善理由を説明
- 具体的な提案を3つ"""
    },
    ExpertType.ENTERTAINMENT_PRODUCER: {
        "label": "エンタメプロデューサー",
        "icon": "🎭",
        "description": "演出とリズムの魔術師",
        "prompt_template": """あなたは「エンタメプロデューサー」として、演出とテンポを評価します。

【分析対象】
{section_content}

【評価基準】
1. テンポに緩急があるか
2. エンタメ要素が組み込まれているか
3. 視聴者を飽きさせない工夫があるか
4. 感情に訴えるポイントがあるか

【タスク】
- スコア（0-100）を採点
- 改善版を提案
- 改善理由を説明
- 具体的な提案を3つ"""
    },
    ExpertType.TARGET_INSIGHT: {
        "label": "ターゲットインサイター",
        "icon": "🎯",
        "description": "ペルソナ共感の専門家",
        "prompt_template": """あなたは「ターゲットインサイター」として、ターゲット適合性を評価します。

【分析対象】
{section_content}

【ナレッジDB情報】
{knowledge_context}

【評価基準】
1. ターゲットの悩みに刺さっているか
2. ペルソナが共感できる言葉選びか
3. インサイトを捉えているか
4. ナレッジDBとの一貫性があるか

【タスク】
- スコア（0-100）を採点
- 改善版を提案
- 改善理由を説明
- 具体的な提案を3つ"""
    },
    ExpertType.CTA_STRATEGIST: {
        "label": "CTAストラテジスト",
        "icon": "📣",
        "description": "行動喚起の戦略家",
        "prompt_template": """あなたは「CTAストラテジスト」として、行動喚起の明確性を評価します。

【分析対象】
{section_content}

【評価基準】
1. CTAが明確か
2. 次のアクションが具体的か
3. 誘導が自然か
4. 視聴者にメリットが伝わるか

【タスク】
- スコア（0-100）を採点
- 改善版を提案
- 改善理由を説明
- 具体的な提案を3つ"""
    },
}

# チェックリスト項目
CHECKLIST_ITEMS = [
    {"id": "hook_3sec", "label": "冒頭3秒のインパクト"},
    {"id": "hook_30sec", "label": "冒頭30秒のフック"},
    {"id": "story_structure", "label": "起承転結の明確さ"},
    {"id": "target_match", "label": "ターゲット適合性"},
    {"id": "tempo_rhythm", "label": "テンポと緩急"},
    {"id": "entertainment", "label": "エンタメ要素"},
    {"id": "cta_clarity", "label": "CTA明確性"},
    {"id": "logic_flow", "label": "論理展開のスムーズさ"},
    {"id": "emotion_appeal", "label": "感情への訴求"},
    {"id": "knowledge_consistency", "label": "ナレッジ一貫性"},
]


class ExpertReviewService:
    """専門家レビューサービス"""

    @staticmethod
    async def review_script(
        request: ExpertReviewRequest,
        knowledge_context: Optional[str] = None,
    ) -> ExpertReviewResponse:
        """
        台本を5人の専門家がレビュー

        Args:
            request: レビューリクエスト
            knowledge_context: ナレッジコンテキスト

        Returns:
            ExpertReviewResponse: レビュー結果
        """
        start_time = time.time()

        logger.info(f"専門家レビュー開始: script_id={request.script_id}, source={request.source_ai_type}")

        # TODO: 実際のAI API呼び出し（Phase 2で実装）
        # 現在はスタブデータを返す

        result = ExpertReviewService._generate_stub_review(request, knowledge_context)

        processing_time_ms = int((time.time() - start_time) * 1000)
        result.processing_time_ms = processing_time_ms

        logger.info(f"専門家レビュー完了: {processing_time_ms}ms")

        return result

    @staticmethod
    def _generate_stub_review(
        request: ExpertReviewRequest,
        knowledge_context: Optional[str] = None
    ) -> ExpertReviewResponse:
        """スタブデータを生成（開発用）"""

        review_id = str(uuid.uuid4())

        # 改善後のセクション（スタブ）
        revised_sections = []
        for section in request.sections:
            revised_sections.append(RevisedSectionResponse(
                id=section.id,
                label=section.label,
                timestamp=section.timestamp,
                original_content=section.content,
                revised_content=f"【改善版】{section.content}\n\n（5人の専門家により改善された台本がここに表示されます）",
                is_improved=True,
                improvements_by_expert=[
                    ExpertContribution(
                        expert_type=ExpertType.HOOK_MASTER,
                        contribution="冒頭のインパクトを強化"
                    ),
                    ExpertContribution(
                        expert_type=ExpertType.STORY_ARCHITECT,
                        contribution="論理展開をスムーズに"
                    ),
                ]
            ))

        # 専門家フィードバック（スタブ）
        expert_feedbacks = [
            ExpertFeedbackResponse(
                expert_type=ExpertType.HOOK_MASTER,
                score=85,
                original_text="元の冒頭文",
                revised_text="改善後の冒頭文（インパクト強化）",
                improvement_reason="3秒以内のインパクトが不足していたため、数字と問題提起を明確化",
                suggestions=[
                    "数字を使って具体性を出す",
                    "視聴者の悩みを冒頭で明示する",
                    "「あなた」を主語にして自分ごと化させる",
                ]
            ),
            ExpertFeedbackResponse(
                expert_type=ExpertType.STORY_ARCHITECT,
                score=80,
                original_text="元の展開部分",
                revised_text="改善後の展開部分（論理的に整理）",
                improvement_reason="起承転結が不明瞭だったため、構成を再設計",
                suggestions=[
                    "問題提起→原因→解決策の順序を明確に",
                    "トランジション語句を追加",
                    "各パートの役割を明確化",
                ]
            ),
            ExpertFeedbackResponse(
                expert_type=ExpertType.ENTERTAINMENT_PRODUCER,
                score=75,
                original_text="元の演出部分",
                revised_text="改善後の演出部分（テンポ強化）",
                improvement_reason="単調なテンポだったため、緩急を追加",
                suggestions=[
                    "短文と長文を交互に配置",
                    "感情的なポイントを強調",
                    "リズム感のある言葉選び",
                ]
            ),
            ExpertFeedbackResponse(
                expert_type=ExpertType.TARGET_INSIGHT,
                score=88,
                original_text="元のターゲット向けメッセージ",
                revised_text="改善後のターゲット向けメッセージ（共感強化）",
                improvement_reason="ターゲットの悩みに対する共感表現が弱かったため強化",
                suggestions=[
                    "ペルソナの言葉で語りかける",
                    "具体的な悩みのシーンを描写",
                    "インサイトを刺激する質問を追加",
                ]
            ),
            ExpertFeedbackResponse(
                expert_type=ExpertType.CTA_STRATEGIST,
                score=82,
                original_text="元のCTA部分",
                revised_text="改善後のCTA部分（行動喚起明確化）",
                improvement_reason="次のアクションが曖昧だったため具体化",
                suggestions=[
                    "CTAを1つに絞る",
                    "行動のメリットを明示",
                    "ハードルを下げる表現を追加",
                ]
            ),
        ]

        # ビフォーアフター比較
        before_after = BeforeAfterComparison(
            hook_score=ScoreComparison(before=65, after=85),
            retention_score=ScoreComparison(before=70, after=82),
            cta_score=ScoreComparison(before=72, after=88),
            overall_score=ScoreComparison(before=69, after=84)
        )

        # 総合スコア計算
        overall_score = before_after.overall_score.after

        # 公開OK判定
        readiness = ExpertReviewService._calculate_publish_readiness(overall_score)
        publish_readiness = PublishReadinessResponse(**readiness)

        # チェックリスト
        checklist = [
            ChecklistItemResponse(
                id=item["id"],
                label=item["label"],
                passed=overall_score >= 70,
                comment=f"スコア: {overall_score}" if overall_score >= 70 else "改善が必要です"
            )
            for item in CHECKLIST_ITEMS
        ]

        # 改善の根拠
        improvement_reasons = [
            ImprovementReasonResponse(
                expert_type=feedback.expert_type,
                reason=feedback.improvement_reason
            )
            for feedback in expert_feedbacks
        ]

        # ペルソナ反応予測
        persona_reactions = [
            PersonaReactionResponse(
                persona_type="main_target",
                persona_name="メインターゲット",
                reaction_score=85,
                reaction_emoji="😊",
                reason="悩みに共感し、解決策に興味を持つ"
            ),
            PersonaReactionResponse(
                persona_type="sub_target",
                persona_name="サブターゲット",
                reaction_score=78,
                reaction_emoji="🤔",
                reason="一部共感するが、さらなる具体例が欲しい"
            ),
        ]

        # 演出提案
        direction_suggestions = []
        for i, section in enumerate(request.sections):
            if i == 0:  # 冒頭
                direction_suggestions.append(DirectionSuggestionResponse(
                    section_id=section.id,
                    section_label=section.label,
                    timestamp=section.timestamp,
                    urgency=5,
                    urgency_reason="冒頭の「掴み」なので視覚的インパクトが必須",
                    suggested_type=VisualInsertType.QUESTION,
                    avatar_position=AvatarPositionType.SPLIT_RIGHT,
                    reason="問いかけ画面で視聴者の注意を引き、続きを見たくさせる",
                    slide_suggestion=SlideSuggestionResponse(
                        title="まだ〇〇してる？",
                        sub_text="その常識が変わります"
                    ),
                    search_keywords=["時計", "時間", "ストップウォッチ"],
                    recommended_colors=["#EF4444", "#F97316"],
                    display_duration=3,
                    suggested_by=ExpertType.HOOK_MASTER
                ))
            elif i == len(request.sections) - 1:  # CTA
                direction_suggestions.append(DirectionSuggestionResponse(
                    section_id=section.id,
                    section_label=section.label,
                    timestamp=section.timestamp,
                    urgency=4,
                    urgency_reason="行動喚起には明確な視覚的指示が効果的",
                    suggested_type=VisualInsertType.BULLET_SLIDE,
                    avatar_position=AvatarPositionType.PIP_LEFT,
                    reason="具体的なアクションを箇条書きで示し、行動を促す",
                    slide_suggestion=SlideSuggestionResponse(
                        title="今すぐ始める3ステップ",
                        points=["① 概要欄をチェック", "② 無料特典をゲット", "③ チャンネル登録"]
                    ),
                    recommended_colors=["#3B82F6", "#6366F1"],
                    display_duration=5,
                    suggested_by=ExpertType.CTA_STRATEGIST
                ))
            elif "数字" in section.content or "%" in section.content:  # 数字が含まれる
                direction_suggestions.append(DirectionSuggestionResponse(
                    section_id=section.id,
                    section_label=section.label,
                    timestamp=section.timestamp,
                    urgency=5,
                    urgency_reason="数字が多いセクション。視覚化しないと情報が流れてしまう",
                    suggested_type=VisualInsertType.NUMBER_SLIDE,
                    avatar_position=AvatarPositionType.PIP_RIGHT,
                    reason="数字を視覚的に強調し、インパクトを最大化",
                    slide_suggestion=SlideSuggestionResponse(
                        main_number="70%",
                        sub_text="削減"
                    ),
                    recommended_colors=["#10B981", "#059669"],
                    display_duration=5,
                    suggested_by=ExpertType.ENTERTAINMENT_PRODUCER
                ))

        # タイムライン警告
        timeline_warnings = [
            TimelineWarningResponse(
                start_time="0:30",
                end_time="0:50",
                duration_seconds=20,
                warning_type=TimelineWarningType.AVATAR_TOO_LONG,
                message="アバターのみが20秒継続しています",
                recommendation="0:40付近で差し込み画像を入れると視聴維持率が向上します"
            )
        ]

        return ExpertReviewResponse(
            id=review_id,
            script_id=request.script_id,
            revised_sections=revised_sections,
            expert_feedbacks=expert_feedbacks,
            publish_readiness=publish_readiness,
            checklist=checklist,
            before_after=before_after,
            improvement_reasons=improvement_reasons,
            persona_reactions=persona_reactions,
            direction_suggestions=direction_suggestions,
            timeline_warnings=timeline_warnings,
            source_ai_type=request.source_ai_type,
            created_at=datetime.utcnow().isoformat(),
            processing_time_ms=0  # 後で上書きされる
        )

    @staticmethod
    def _calculate_publish_readiness(score: int) -> Dict[str, Any]:
        """公開OK判定を計算"""
        if score >= 90:
            return {
                "grade": PublishGrade.S,
                "message": "🎉 バズる可能性が高いです！自信を持って公開してください",
                "ready": True,
                "score": score
            }
        elif score >= 80:
            return {
                "grade": PublishGrade.A,
                "message": "✨ 自信を持って公開してください！",
                "ready": True,
                "score": score
            }
        elif score >= 70:
            return {
                "grade": PublishGrade.B,
                "message": "👍 公開OK。さらに改善の余地あり",
                "ready": True,
                "score": score
            }
        elif score >= 60:
            return {
                "grade": PublishGrade.C,
                "message": "⚠️ 公開可能ですが、改善推奨",
                "ready": True,
                "score": score
            }
        else:
            return {
                "grade": PublishGrade.D,
                "message": "❌ 再添削を推奨します",
                "ready": False,
                "score": score
            }


expert_review_service = ExpertReviewService()
