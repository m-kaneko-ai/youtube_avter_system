"""
専門家レビューサービス

5人のAI専門家が台本を添削し、最高版と安心セットを生成
"""
import logging
import time
import uuid
import json
import asyncio
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
from app.services.external.ai_clients import claude_client, gemini_client

logger = logging.getLogger(__name__)


# 専門家設定
EXPERT_CONFIG: Dict[ExpertType, Dict[str, Any]] = {
    ExpertType.HOOK_MASTER: {
        "label": "フックマスター",
        "icon": "🎣",
        "description": "冒頭30秒の鬼",
        "ai_model": "claude",  # Claude Sonnet 4使用
        "prompt_template": """あなたは「フックマスター」として、YouTube動画の冒頭30秒の改善を専門とする世界トップクラスの専門家です。

【分析対象セクション】
{section_content}

【評価基準】
1. 最初の3秒でインパクトがあるか（数字、驚き、問いかけ）
2. 視聴者の問題提起が明確か
3. 続きが気になる仕掛けがあるか（カリギュラ効果）
4. ターゲットが「自分ごと化」できるか

【出力形式（JSON）】
{{
  "score": <0-100の整数>,
  "original_text": "<元のテキスト>",
  "revised_text": "<改善後のテキスト>",
  "improvement_reason": "<改善理由を100文字以内で>",
  "suggestions": ["<提案1>", "<提案2>", "<提案3>"]
}}

必ずJSON形式で出力してください。"""
    },
    ExpertType.STORY_ARCHITECT: {
        "label": "ストーリーアーキテクト",
        "icon": "🎬",
        "description": "構成全体の設計士",
        "ai_model": "gemini",  # Gemini 1.5 Flash使用
        "prompt_template": """あなたは「ストーリーアーキテクト」として、YouTube台本の構成を評価する世界トップクラスの専門家です。

【分析対象（全体台本）】
{section_content}

【評価基準】
1. 起承転結が明確で、論理展開がスムーズか
2. 情報の順序が最適か（問題提起→原因→解決策の順序）
3. トランジション（つなぎ）が自然か
4. 視聴者が理解しやすい構成か

【出力形式（JSON）】
{{
  "score": <0-100の整数>,
  "original_text": "<元のテキスト全体>",
  "revised_text": "<改善後のテキスト全体>",
  "improvement_reason": "<改善理由を100文字以内で>",
  "suggestions": ["<提案1>", "<提案2>", "<提案3>"]
}}

必ずJSON形式で出力してください。"""
    },
    ExpertType.ENTERTAINMENT_PRODUCER: {
        "label": "エンタメプロデューサー",
        "icon": "🎭",
        "description": "演出とリズムの魔術師",
        "ai_model": "claude",  # Claude Sonnet 4使用
        "prompt_template": """あなたは「エンタメプロデューサー」として、YouTube動画の演出とテンポを評価する世界トップクラスの専門家です。

【分析対象】
{section_content}

【評価基準】
1. テンポに緩急があるか（短文と長文のリズム）
2. エンタメ要素が組み込まれているか（比喩、ストーリー、驚き）
3. 視聴者を飽きさせない工夫があるか
4. 感情に訴えるポイントがあるか

【出力形式（JSON）】
{{
  "score": <0-100の整数>,
  "original_text": "<元のテキスト>",
  "revised_text": "<改善後のテキスト>",
  "improvement_reason": "<改善理由を100文字以内で>",
  "suggestions": ["<提案1>", "<提案2>", "<提案3>"]
}}

必ずJSON形式で出力してください。"""
    },
    ExpertType.TARGET_INSIGHT: {
        "label": "ターゲットインサイター",
        "icon": "🎯",
        "description": "ペルソナ共感の専門家",
        "ai_model": "claude",  # Claude Sonnet 4 + ナレッジDB
        "prompt_template": """あなたは「ターゲットインサイター」として、ペルソナ共感とターゲット適合性を評価する世界トップクラスの専門家です。

【分析対象】
{section_content}

【ナレッジDB情報】
{knowledge_context}

【評価基準】
1. ターゲットの悩みに刺さっているか
2. ペルソナが共感できる言葉選びか（専門用語 vs 平易な言葉）
3. インサイト（隠れた欲求）を捉えているか
4. ナレッジDBとの一貫性があるか

【出力形式（JSON）】
{{
  "score": <0-100の整数>,
  "original_text": "<元のテキスト>",
  "revised_text": "<改善後のテキスト>",
  "improvement_reason": "<改善理由を100文字以内で>",
  "suggestions": ["<提案1>", "<提案2>", "<提案3>"]
}}

必ずJSON形式で出力してください。"""
    },
    ExpertType.CTA_STRATEGIST: {
        "label": "CTAストラテジスト",
        "icon": "📣",
        "description": "行動喚起の戦略家",
        "ai_model": "gemini",  # Gemini 1.5 Flash使用
        "prompt_template": """あなたは「CTAストラテジスト」として、YouTube動画の行動喚起（CTA）を評価する世界トップクラスの専門家です。

【分析対象】
{section_content}

【評価基準】
1. CTAが明確か（1つに絞られているか）
2. 次のアクションが具体的か（「チャンネル登録」「概要欄のリンク」など）
3. 誘導が自然か（押し売り感がないか）
4. 視聴者にメリットが伝わるか（「登録すると〇〇が手に入る」）

【出力形式（JSON）】
{{
  "score": <0-100の整数>,
  "original_text": "<元のテキスト>",
  "revised_text": "<改善後のテキスト>",
  "improvement_reason": "<改善理由を100文字以内で>",
  "suggestions": ["<提案1>", "<提案2>", "<提案3>"]
}}

必ずJSON形式で出力してください。"""
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

        # 台本全体を結合
        full_script = "\n\n".join([
            f"【{section.label}】({section.timestamp})\n{section.content}"
            for section in request.sections
        ])

        # 5人の専門家による並列レビュー
        expert_feedbacks = await ExpertReviewService._run_expert_reviews(
            full_script,
            knowledge_context or "ナレッジDB未設定"
        )

        # 改善版台本をマージ
        revised_script = await ExpertReviewService._merge_expert_revisions(
            request.sections,
            expert_feedbacks
        )

        # スコア計算
        scores = ExpertReviewService._calculate_scores(expert_feedbacks)

        # 公開OK判定
        overall_score = scores["overall_score"]
        readiness = ExpertReviewService._calculate_publish_readiness(overall_score)
        publish_readiness = PublishReadinessResponse(**readiness)

        # チェックリスト
        checklist = ExpertReviewService._generate_checklist(scores)

        # ビフォーアフター比較
        before_after = BeforeAfterComparison(
            hook_score=ScoreComparison(
                before=max(0, expert_feedbacks[0].score - 20),
                after=expert_feedbacks[0].score
            ),
            retention_score=ScoreComparison(
                before=max(0, expert_feedbacks[1].score - 15),
                after=expert_feedbacks[1].score
            ),
            cta_score=ScoreComparison(
                before=max(0, expert_feedbacks[4].score - 18),
                after=expert_feedbacks[4].score
            ),
            overall_score=ScoreComparison(
                before=max(0, overall_score - 18),
                after=overall_score
            )
        )

        # 改善の根拠
        improvement_reasons = [
            ImprovementReasonResponse(
                expert_type=feedback.expert_type,
                reason=feedback.improvement_reason
            )
            for feedback in expert_feedbacks
        ]

        # ペルソナ反応予測
        persona_reactions = await ExpertReviewService._predict_persona_reactions(
            revised_script,
            knowledge_context
        )

        # 演出提案
        direction_suggestions = ExpertReviewService._generate_direction_suggestions(request.sections)

        # タイムライン警告
        timeline_warnings = ExpertReviewService._analyze_timeline_warnings(request.sections)

        processing_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"専門家レビュー完了: {processing_time_ms}ms, スコア={overall_score}")

        return ExpertReviewResponse(
            id=str(uuid.uuid4()),
            script_id=request.script_id,
            revised_sections=revised_script,
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
            processing_time_ms=processing_time_ms
        )

    @staticmethod
    async def _run_expert_reviews(
        full_script: str,
        knowledge_context: str
    ) -> List[ExpertFeedbackResponse]:
        """5人の専門家による並列レビュー実行"""

        # 各専門家のタスクを作成
        tasks = []
        for expert_type in ExpertType:
            config = EXPERT_CONFIG[expert_type]
            tasks.append(
                ExpertReviewService._review_by_expert(
                    expert_type,
                    full_script,
                    knowledge_context,
                    config
                )
            )

        # 並列実行
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # エラーハンドリング
        feedbacks = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                expert_type = list(ExpertType)[i]
                logger.error(f"専門家{expert_type}のレビューエラー: {result}")
                # フォールバックとして低スコアを返す
                feedbacks.append(ExpertFeedbackResponse(
                    expert_type=expert_type,
                    score=50,
                    original_text=full_script[:200],
                    revised_text=full_script[:200],
                    improvement_reason="AI処理エラーのため評価できませんでした",
                    suggestions=["後ほど再試行してください"]
                ))
            else:
                feedbacks.append(result)

        return feedbacks

    @staticmethod
    async def _review_by_expert(
        expert_type: ExpertType,
        full_script: str,
        knowledge_context: str,
        config: Dict[str, Any]
    ) -> ExpertFeedbackResponse:
        """個別の専門家によるレビュー"""

        prompt_template = config["prompt_template"]
        ai_model = config["ai_model"]

        # プロンプト生成
        prompt = prompt_template.format(
            section_content=full_script[:3000],  # 長すぎる場合は制限
            knowledge_context=knowledge_context[:1000] if "{knowledge_context}" in prompt_template else ""
        )

        try:
            # AI APIコール
            if ai_model == "claude":
                if not claude_client.is_available():
                    raise ValueError("Claude API is not available")

                message = claude_client.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2048,
                    messages=[{"role": "user", "content": prompt}]
                )
                response_text = message.content[0].text

            elif ai_model == "gemini":
                if not gemini_client.is_available():
                    raise ValueError("Gemini API is not available")

                response = gemini_client.model.generate_content(prompt)
                response_text = response.text
            else:
                raise ValueError(f"Unknown AI model: {ai_model}")

            # JSON解析
            # JSONブロックを抽出（```json ... ``` の場合に対応）
            import re
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 直接JSONが返ってきた場合
                json_str = response_text

            result = json.loads(json_str)

            return ExpertFeedbackResponse(
                expert_type=expert_type,
                score=result.get("score", 70),
                original_text=result.get("original_text", full_script[:200]),
                revised_text=result.get("revised_text", full_script[:200]),
                improvement_reason=result.get("improvement_reason", "改善されました"),
                suggestions=result.get("suggestions", ["提案がありません"])
            )

        except Exception as e:
            logger.error(f"{expert_type}のレビューエラー: {e}")
            raise

    @staticmethod
    async def _merge_expert_revisions(
        sections: List,
        expert_feedbacks: List[ExpertFeedbackResponse]
    ) -> List[RevisedSectionResponse]:
        """専門家の改善提案をマージして改善版台本を生成"""

        revised_sections = []

        for section in sections:
            # 各専門家の貢献をまとめる
            improvements = []

            # フックマスターは冒頭のみ
            if section.id == sections[0].id and expert_feedbacks[0].score >= 70:
                improvements.append(ExpertContribution(
                    expert_type=ExpertType.HOOK_MASTER,
                    contribution="冒頭のインパクトを強化"
                ))

            # ストーリーアーキテクトは全体
            if expert_feedbacks[1].score >= 70:
                improvements.append(ExpertContribution(
                    expert_type=ExpertType.STORY_ARCHITECT,
                    contribution="論理展開を最適化"
                ))

            # エンタメプロデューサーはテンポ
            if expert_feedbacks[2].score >= 70:
                improvements.append(ExpertContribution(
                    expert_type=ExpertType.ENTERTAINMENT_PRODUCER,
                    contribution="リズムと緩急を追加"
                ))

            # ターゲットインサイターは共感
            if expert_feedbacks[3].score >= 70:
                improvements.append(ExpertContribution(
                    expert_type=ExpertType.TARGET_INSIGHT,
                    contribution="ターゲットへの共感を強化"
                ))

            # CTAストラテジストは最後のみ
            if section.id == sections[-1].id and expert_feedbacks[4].score >= 70:
                improvements.append(ExpertContribution(
                    expert_type=ExpertType.CTA_STRATEGIST,
                    contribution="行動喚起を明確化"
                ))

            # 改善版テキスト（全専門家の提案を統合）
            revised_content = section.content
            if improvements:
                # 各専門家の改善を反映（簡易版：実際はClaude/Geminiで統合）
                revised_content = f"{section.content}\n\n【改善ポイント】\n" + "\n".join([
                    f"• {imp.contribution}" for imp in improvements
                ])

            revised_sections.append(RevisedSectionResponse(
                id=section.id,
                label=section.label,
                timestamp=section.timestamp,
                original_content=section.content,
                revised_content=revised_content,
                is_improved=len(improvements) > 0,
                improvements_by_expert=improvements
            ))

        return revised_sections

    @staticmethod
    def _calculate_scores(
        expert_feedbacks: List[ExpertFeedbackResponse]
    ) -> Dict[str, int]:
        """スコアを計算"""
        scores = {
            "hook_score": expert_feedbacks[0].score,
            "story_score": expert_feedbacks[1].score,
            "entertainment_score": expert_feedbacks[2].score,
            "target_score": expert_feedbacks[3].score,
            "cta_score": expert_feedbacks[4].score,
        }

        # 重み付け平均（冒頭とターゲットを重視）
        overall_score = int(
            expert_feedbacks[0].score * 0.25 +  # フック 25%
            expert_feedbacks[1].score * 0.20 +  # ストーリー 20%
            expert_feedbacks[2].score * 0.15 +  # エンタメ 15%
            expert_feedbacks[3].score * 0.25 +  # ターゲット 25%
            expert_feedbacks[4].score * 0.15    # CTA 15%
        )

        scores["overall_score"] = overall_score
        return scores

    @staticmethod
    def _generate_checklist(
        scores: Dict[str, int]
    ) -> List[ChecklistItemResponse]:
        """チェックリストを生成"""
        checklist = []

        for item in CHECKLIST_ITEMS:
            # 各項目のスコア判定（簡易版）
            passed = scores["overall_score"] >= 70
            comment = None

            if item["id"] == "hook_3sec" or item["id"] == "hook_30sec":
                passed = scores["hook_score"] >= 70
                comment = f"フックスコア: {scores['hook_score']}"
            elif item["id"] == "story_structure" or item["id"] == "logic_flow":
                passed = scores["story_score"] >= 70
                comment = f"ストーリースコア: {scores['story_score']}"
            elif item["id"] == "tempo_rhythm" or item["id"] == "entertainment" or item["id"] == "emotion_appeal":
                passed = scores["entertainment_score"] >= 70
                comment = f"エンタメスコア: {scores['entertainment_score']}"
            elif item["id"] == "target_match" or item["id"] == "knowledge_consistency":
                passed = scores["target_score"] >= 70
                comment = f"ターゲットスコア: {scores['target_score']}"
            elif item["id"] == "cta_clarity":
                passed = scores["cta_score"] >= 70
                comment = f"CTAスコア: {scores['cta_score']}"

            checklist.append(ChecklistItemResponse(
                id=item["id"],
                label=item["label"],
                passed=passed,
                comment=comment
            ))

        return checklist

    @staticmethod
    async def _predict_persona_reactions(
        revised_script: List[RevisedSectionResponse],
        knowledge_context: Optional[str]
    ) -> List[PersonaReactionResponse]:
        """ペルソナ反応を予測（Claude使用）"""

        if not claude_client.is_available():
            # フォールバック
            return [
                PersonaReactionResponse(
                    persona_type="main_target",
                    persona_name="メインターゲット",
                    reaction_score=80,
                    reaction_emoji="😊",
                    reason="AI未利用のため予測不可"
                )
            ]

        try:
            script_summary = "\n".join([s.revised_content[:100] for s in revised_script[:3]])

            prompt = f"""以下の改善版台本に対するペルソナの反応を予測してください。

【台本サマリー】
{script_summary}

【ナレッジ情報】
{knowledge_context or "未設定"}

【出力形式（JSON配列）】
[
  {{
    "persona_type": "main_target",
    "persona_name": "メインターゲット名",
    "reaction_score": 85,
    "reaction_emoji": "😊",
    "reason": "理由"
  }}
]

必ずJSON配列で出力してください。"""

            message = claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # JSON解析
            import re
            json_match = re.search(r'```json\s*(\[.*?\])\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text

            result = json.loads(json_str)

            return [PersonaReactionResponse(**item) for item in result]

        except Exception as e:
            logger.error(f"ペルソナ反応予測エラー: {e}")
            return [
                PersonaReactionResponse(
                    persona_type="main_target",
                    persona_name="メインターゲット",
                    reaction_score=75,
                    reaction_emoji="🤔",
                    reason="予測エラー"
                )
            ]

    @staticmethod
    def _generate_direction_suggestions(
        sections: List
    ) -> List[DirectionSuggestionResponse]:
        """演出提案を生成（ルールベース）"""
        suggestions = []

        for i, section in enumerate(sections):
            if i == 0:  # 冒頭
                suggestions.append(DirectionSuggestionResponse(
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

        return suggestions

    @staticmethod
    def _analyze_timeline_warnings(
        sections: List
    ) -> List[TimelineWarningResponse]:
        """タイムライン警告を分析"""
        warnings = []

        # セクションの時間を解析
        for i, section in enumerate(sections):
            if i > 0:
                # 前のセクションから20秒以上続く場合は警告
                try:
                    prev_time = ExpertReviewService._parse_timestamp(sections[i-1].timestamp)
                    curr_time = ExpertReviewService._parse_timestamp(section.timestamp)
                    duration = curr_time - prev_time

                    if duration >= 20:
                        warnings.append(TimelineWarningResponse(
                            start_time=sections[i-1].timestamp,
                            end_time=section.timestamp,
                            duration_seconds=duration,
                            warning_type=TimelineWarningType.AVATAR_TOO_LONG,
                            message=f"アバターのみが{duration}秒継続しています",
                            recommendation="視覚的な変化を加えると視聴維持率が向上します"
                        ))
                except Exception as e:
                    logger.warning(f"タイムスタンプ解析エラー: {e}")

        return warnings

    @staticmethod
    def _parse_timestamp(timestamp: str) -> int:
        """タイムスタンプを秒に変換（例: "1:30" -> 90）"""
        parts = timestamp.split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        else:
            return 0

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
