"""
DNA抽出サービス

コンテンツからDNA（成功要素）を抽出するAIサービス
- 台本分析によるDNA要素抽出
- 動画パフォーマンスデータからの強度計算
- チャンネルDNAプロファイル生成
"""

import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.dna import (
    ContentDNA,
    DNAElement,
    DNATemplate,
    DNAComparison,
    ChannelDNAProfile,
    DNAElementType,
    DNAStrength,
    TemplateStatus,
)
from app.services.external.ai_clients import claude_client, gemini_client

logger = logging.getLogger(__name__)


# ============================================================
# DNA抽出プロンプト
# ============================================================

DNA_EXTRACTION_PROMPT = """あなたはYouTubeコンテンツ分析の専門家です。
以下の台本/トランスクリプトからコンテンツDNA（成功要素）を抽出してください。

【分析対象】
タイトル: {title}
動画タイプ: {video_type}

【台本/トランスクリプト】
{content}

【抽出するDNA要素】

1. **フック（hook）**: 冒頭の掴み要素
   - どのような手法で視聴者を引き込んでいるか
   - 最初の5秒の構成

2. **ストーリー構造（story_arc）**: 全体の構成
   - 導入→展開→結論の流れ
   - 情報の提示順序
   - テンションの変化

3. **ペルソナ（persona）**: キャラクター特性
   - 話し方のトーン
   - 専門性レベル
   - 親しみやすさ

4. **感情曲線（emotion）**: 感情的要素
   - 使用されている感情トリガー
   - 感情の起伏
   - 共感ポイント

5. **価値提案（value_prop）**: 視聴者へのベネフィット
   - 何を学べるか/得られるか
   - 差別化ポイント

6. **CTAパターン（cta_style）**: 行動喚起の手法
   - CTAのタイミング
   - CTAの表現方法

【出力形式】
以下のJSON形式で出力してください:
```json
{{
  "hook": {{
    "technique": "使用されている手法",
    "opening_line": "冒頭のセリフ/ナレーション",
    "strength": "strong/moderate/weak",
    "notes": "分析メモ"
  }},
  "story_arc": {{
    "structure": "使用されている構成パターン",
    "sections": ["セクション1", "セクション2", ...],
    "tension_curve": "high/medium/low の変化",
    "strength": "strong/moderate/weak"
  }},
  "persona": {{
    "tone": "話し方のトーン",
    "expertise_level": "expert/intermediate/beginner-friendly",
    "characteristics": ["特徴1", "特徴2"],
    "strength": "strong/moderate/weak"
  }},
  "emotion": {{
    "triggers": ["感情トリガー1", "感情トリガー2"],
    "empathy_points": ["共感ポイント1", "共感ポイント2"],
    "intensity": "high/medium/low",
    "strength": "strong/moderate/weak"
  }},
  "value_prop": {{
    "main_benefit": "主なベネフィット",
    "unique_angle": "ユニークな切り口",
    "takeaways": ["学び1", "学び2"],
    "strength": "strong/moderate/weak"
  }},
  "cta_style": {{
    "timing": "early/middle/end/multiple",
    "type": "subscribe/like/comment/link/none",
    "approach": "direct/subtle/none",
    "strength": "strong/moderate/weak"
  }},
  "overall_assessment": {{
    "uniqueness_score": 70,
    "consistency_score": 80,
    "signature_elements": ["このコンテンツの特徴的な要素"],
    "improvement_suggestions": ["改善提案"]
  }}
}}
```
"""

CHANNEL_DNA_PROFILE_PROMPT = """あなたはYouTubeチャンネル分析の専門家です。
以下の複数のコンテンツDNA情報から、チャンネル全体のDNAプロファイルを生成してください。

【チャンネル情報】
チャンネル名: {channel_name}
ニッチ/カテゴリ: {niche}

【分析済みDNA一覧】
{dna_list}

【出力形式】
以下のJSON形式で出力してください:
```json
{{
  "signature_elements": {{
    "hooks": ["この人/チャンネル特有のフック手法"],
    "storytelling": ["特徴的なストーリーテリング"],
    "personality": ["パーソナリティ特性"],
    "visual_style": ["ビジュアル特性"],
    "audio_style": ["音声/話し方特性"]
  }},
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱み1", "弱み2"],
  "content_style": {{
    "primary_format": "メインフォーマット",
    "tone": "全体的なトーン",
    "pacing": "ペース感",
    "complexity": "情報の複雑さ"
  }},
  "best_performing_elements": [
    {{"element": "要素名", "impact": "high/medium/low"}}
  ],
  "improvement_opportunities": [
    {{"area": "改善エリア", "suggestion": "具体的な提案"}}
  ],
  "recommendations": [
    "次のコンテンツへの推奨事項"
  ]
}}
```
"""


class DNAExtractionService:
    """DNA抽出サービス"""

    async def extract_dna_from_script(
        self,
        content: str,
        title: str = "",
        video_type: str = "long",
        use_claude: bool = True,
    ) -> Dict[str, Any]:
        """
        台本/トランスクリプトからDNAを抽出

        Args:
            content: 台本またはトランスクリプト
            title: 動画タイトル
            video_type: 動画タイプ（short/long）
            use_claude: Claudeを使用するか（FalseならGemini）

        Returns:
            抽出されたDNA情報
        """
        prompt = DNA_EXTRACTION_PROMPT.format(
            title=title or "未設定",
            video_type=video_type,
            content=content[:10000],  # 長すぎる場合は切り詰め
        )

        try:
            if use_claude and claude_client.is_available():
                message = claude_client.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}],
                )
                response_text = message.content[0].text
            elif gemini_client.is_available():
                response = gemini_client.model.generate_content(prompt)
                response_text = response.text
            else:
                logger.warning("No AI client available for DNA extraction")
                return self._get_fallback_dna()

            # JSONを抽出
            dna_data = self._parse_json_response(response_text)
            return dna_data

        except Exception as e:
            logger.error(f"DNA extraction failed: {e}")
            return self._get_fallback_dna()

    async def save_extracted_dna(
        self,
        db: AsyncSession,
        dna_data: Dict[str, Any],
        video_id: Optional[UUID] = None,
        knowledge_id: Optional[UUID] = None,
        name: Optional[str] = None,
    ) -> ContentDNA:
        """
        抽出したDNAをデータベースに保存

        Args:
            db: データベースセッション
            dna_data: 抽出されたDNAデータ
            video_id: 動画ID
            knowledge_id: ナレッジID
            name: DNA名

        Returns:
            保存されたContentDNA
        """
        # 強度スコアを計算
        overall_strength = self._calculate_overall_strength(dna_data)
        uniqueness_score = dna_data.get("overall_assessment", {}).get("uniqueness_score", 50)
        consistency_score = dna_data.get("overall_assessment", {}).get("consistency_score", 50)

        content_dna = ContentDNA(
            video_id=video_id,
            knowledge_id=knowledge_id,
            name=name,
            description=f"DNA extracted at {datetime.utcnow().isoformat()}",
            hook_elements=dna_data.get("hook"),
            story_structure=dna_data.get("story_arc"),
            persona_traits=dna_data.get("persona"),
            emotional_arc=dna_data.get("emotion"),
            value_propositions=dna_data.get("value_prop"),
            cta_patterns=dna_data.get("cta_style"),
            overall_strength=overall_strength,
            uniqueness_score=uniqueness_score,
            consistency_score=consistency_score,
            last_analyzed_at=datetime.utcnow(),
            analysis_version="1.0",
        )

        db.add(content_dna)
        await db.flush()

        # DNA要素を個別に保存
        await self._save_dna_elements(db, content_dna.id, dna_data)

        await db.commit()
        await db.refresh(content_dna)

        return content_dna

    async def _save_dna_elements(
        self,
        db: AsyncSession,
        content_dna_id: UUID,
        dna_data: Dict[str, Any],
    ) -> None:
        """DNA要素を個別に保存"""
        element_mappings = [
            ("hook", DNAElementType.HOOK, "フック要素"),
            ("story_arc", DNAElementType.STORY_ARC, "ストーリー構造"),
            ("persona", DNAElementType.PERSONA, "ペルソナ特性"),
            ("emotion", DNAElementType.EMOTION, "感情曲線"),
            ("value_prop", DNAElementType.VALUE_PROP, "価値提案"),
            ("cta_style", DNAElementType.CTA_STYLE, "CTAスタイル"),
        ]

        for key, element_type, name in element_mappings:
            if key in dna_data and dna_data[key]:
                element_data = dna_data[key]
                strength_str = element_data.get("strength", "moderate")
                strength = self._map_strength(strength_str)
                strength_score = self._strength_to_score(strength)

                element = DNAElement(
                    content_dna_id=content_dna_id,
                    element_type=element_type,
                    name=name,
                    description=element_data.get("notes", ""),
                    data=element_data,
                    strength=strength,
                    strength_score=strength_score,
                )
                db.add(element)

    async def generate_channel_profile(
        self,
        db: AsyncSession,
        knowledge_id: UUID,
        channel_name: str = "",
        niche: str = "",
    ) -> ChannelDNAProfile:
        """
        チャンネルDNAプロファイルを生成

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            channel_name: チャンネル名
            niche: ニッチ/カテゴリ

        Returns:
            生成されたプロファイル
        """
        # 既存のDNAを取得
        result = await db.execute(
            select(ContentDNA).where(ContentDNA.knowledge_id == knowledge_id)
        )
        dnas = result.scalars().all()

        if not dnas:
            # DNAがない場合はデフォルトプロファイルを作成
            profile = ChannelDNAProfile(
                knowledge_id=knowledge_id,
                channel_name=channel_name,
                niche=niche,
                videos_analyzed=0,
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            return profile

        # DNA情報を集約
        dna_list = []
        for dna in dnas:
            dna_info = {
                "hook": dna.hook_elements,
                "story": dna.story_structure,
                "persona": dna.persona_traits,
                "emotion": dna.emotional_arc,
                "value": dna.value_propositions,
                "cta": dna.cta_patterns,
                "strength": dna.overall_strength,
            }
            dna_list.append(json.dumps(dna_info, ensure_ascii=False, default=str))

        # AIでプロファイルを生成
        prompt = CHANNEL_DNA_PROFILE_PROMPT.format(
            channel_name=channel_name or "不明",
            niche=niche or "不明",
            dna_list="\n\n".join(dna_list[:10]),  # 最大10件
        )

        try:
            if claude_client.is_available():
                message = claude_client.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}],
                )
                response_text = message.content[0].text
            elif gemini_client.is_available():
                response = gemini_client.model.generate_content(prompt)
                response_text = response.text
            else:
                response_text = "{}"

            profile_data = self._parse_json_response(response_text)

        except Exception as e:
            logger.error(f"Channel profile generation failed: {e}")
            profile_data = {}

        # 既存プロファイルを確認
        result = await db.execute(
            select(ChannelDNAProfile).where(
                ChannelDNAProfile.knowledge_id == knowledge_id
            )
        )
        existing_profile = result.scalar_one_or_none()

        if existing_profile:
            # 更新
            existing_profile.channel_name = channel_name or existing_profile.channel_name
            existing_profile.niche = niche or existing_profile.niche
            existing_profile.signature_elements = profile_data.get("signature_elements")
            existing_profile.strengths = profile_data.get("strengths", [])
            existing_profile.weaknesses = profile_data.get("weaknesses", [])
            existing_profile.content_style = profile_data.get("content_style")
            existing_profile.best_performing_elements = profile_data.get("best_performing_elements")
            existing_profile.improvement_opportunities = profile_data.get("improvement_opportunities")
            existing_profile.videos_analyzed = len(dnas)
            existing_profile.last_updated_at = datetime.utcnow()
            profile = existing_profile
        else:
            # 新規作成
            profile = ChannelDNAProfile(
                knowledge_id=knowledge_id,
                channel_name=channel_name,
                niche=niche,
                signature_elements=profile_data.get("signature_elements"),
                strengths=profile_data.get("strengths", []),
                weaknesses=profile_data.get("weaknesses", []),
                content_style=profile_data.get("content_style"),
                best_performing_elements=profile_data.get("best_performing_elements"),
                improvement_opportunities=profile_data.get("improvement_opportunities"),
                videos_analyzed=len(dnas),
                last_updated_at=datetime.utcnow(),
            )
            db.add(profile)

        await db.commit()
        await db.refresh(profile)
        return profile

    async def compare_dnas(
        self,
        db: AsyncSession,
        source_dna_id: UUID,
        target_dna_id: UUID,
    ) -> DNAComparison:
        """
        2つのDNAを比較

        Args:
            db: データベースセッション
            source_dna_id: 比較元DNA ID
            target_dna_id: 比較先DNA ID

        Returns:
            比較結果
        """
        # DNAを取得
        source_result = await db.execute(
            select(ContentDNA).where(ContentDNA.id == source_dna_id)
        )
        source_dna = source_result.scalar_one_or_none()

        target_result = await db.execute(
            select(ContentDNA).where(ContentDNA.id == target_dna_id)
        )
        target_dna = target_result.scalar_one_or_none()

        if not source_dna or not target_dna:
            raise ValueError("DNA not found")

        # 類似度を計算
        hook_sim = self._calculate_element_similarity(
            source_dna.hook_elements, target_dna.hook_elements
        )
        structure_sim = self._calculate_element_similarity(
            source_dna.story_structure, target_dna.story_structure
        )
        style_sim = self._calculate_element_similarity(
            source_dna.persona_traits, target_dna.persona_traits
        )

        overall_sim = (hook_sim + structure_sim + style_sim) / 3

        # 共通要素と固有要素を特定
        shared, unique_source, unique_target = self._find_element_differences(
            source_dna, target_dna
        )

        comparison = DNAComparison(
            source_dna_id=source_dna_id,
            target_dna_id=target_dna_id,
            overall_similarity=overall_sim,
            hook_similarity=hook_sim,
            structure_similarity=structure_sim,
            style_similarity=style_sim,
            shared_elements=shared,
            unique_to_source=unique_source,
            unique_to_target=unique_target,
            comparison_details={
                "source_strength": source_dna.overall_strength,
                "target_strength": target_dna.overall_strength,
            },
        )

        db.add(comparison)
        await db.commit()
        await db.refresh(comparison)

        return comparison

    async def create_template_from_dna(
        self,
        db: AsyncSession,
        source_dna_ids: List[UUID],
        name: str,
        description: str = "",
        category: str = "",
        video_type: str = "long",
        knowledge_id: Optional[UUID] = None,
        created_by: Optional[UUID] = None,
    ) -> DNATemplate:
        """
        複数のDNAからテンプレートを作成

        Args:
            db: データベースセッション
            source_dna_ids: ソースDNA IDリスト
            name: テンプレート名
            description: 説明
            category: カテゴリ
            video_type: 動画タイプ
            knowledge_id: ナレッジID
            created_by: 作成者ID

        Returns:
            作成されたテンプレート
        """
        # DNAを取得
        dnas = []
        for dna_id in source_dna_ids:
            result = await db.execute(
                select(ContentDNA).where(ContentDNA.id == dna_id)
            )
            dna = result.scalar_one_or_none()
            if dna:
                dnas.append(dna)

        if not dnas:
            raise ValueError("No valid DNAs found")

        # 共通構造を抽出
        structure = self._extract_common_structure(dnas)

        # 必須/オプション要素を決定
        required_elements = []
        optional_elements = []

        element_counts: Dict[str, int] = {}
        for dna in dnas:
            if dna.hook_elements:
                element_counts["hook"] = element_counts.get("hook", 0) + 1
            if dna.story_structure:
                element_counts["story_arc"] = element_counts.get("story_arc", 0) + 1
            if dna.persona_traits:
                element_counts["persona"] = element_counts.get("persona", 0) + 1
            if dna.emotional_arc:
                element_counts["emotion"] = element_counts.get("emotion", 0) + 1
            if dna.value_propositions:
                element_counts["value_prop"] = element_counts.get("value_prop", 0) + 1
            if dna.cta_patterns:
                element_counts["cta_style"] = element_counts.get("cta_style", 0) + 1

        threshold = len(dnas) * 0.7
        for element, count in element_counts.items():
            if count >= threshold:
                required_elements.append(element)
            else:
                optional_elements.append(element)

        # 平均パフォーマンススコア
        avg_strength = sum(
            dna.overall_strength or 0 for dna in dnas
        ) / len(dnas) if dnas else 0

        template = DNATemplate(
            knowledge_id=knowledge_id,
            name=name,
            description=description,
            category=category,
            video_type=video_type,
            structure=structure,
            required_elements=required_elements,
            optional_elements=optional_elements,
            source_dna_ids=source_dna_ids,
            avg_performance_score=avg_strength,
            status=TemplateStatus.DRAFT,
            created_by=created_by,
        )

        db.add(template)
        await db.commit()
        await db.refresh(template)

        return template

    # ============================================================
    # ヘルパーメソッド
    # ============================================================

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """AIレスポンスからJSONを抽出"""
        import re

        # ```json ... ``` ブロックを探す
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # ブロックがない場合は全体をJSONとして試す
            json_str = response_text

        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON response")
            return {}

    def _get_fallback_dna(self) -> Dict[str, Any]:
        """フォールバックDNAデータ"""
        return {
            "hook": {"technique": "unknown", "strength": "moderate"},
            "story_arc": {"structure": "unknown", "strength": "moderate"},
            "persona": {"tone": "neutral", "strength": "moderate"},
            "emotion": {"triggers": [], "strength": "moderate"},
            "value_prop": {"main_benefit": "unknown", "strength": "moderate"},
            "cta_style": {"timing": "end", "strength": "moderate"},
            "overall_assessment": {
                "uniqueness_score": 50,
                "consistency_score": 50,
            },
        }

    def _map_strength(self, strength_str: str) -> DNAStrength:
        """文字列をDNAStrengthに変換"""
        mapping = {
            "signature": DNAStrength.SIGNATURE,
            "strong": DNAStrength.STRONG,
            "moderate": DNAStrength.MODERATE,
            "weak": DNAStrength.WEAK,
            "absent": DNAStrength.ABSENT,
        }
        return mapping.get(strength_str.lower(), DNAStrength.MODERATE)

    def _strength_to_score(self, strength: DNAStrength) -> float:
        """強度をスコアに変換"""
        mapping = {
            DNAStrength.SIGNATURE: 100,
            DNAStrength.STRONG: 80,
            DNAStrength.MODERATE: 60,
            DNAStrength.WEAK: 40,
            DNAStrength.ABSENT: 0,
        }
        return mapping.get(strength, 50)

    def _calculate_overall_strength(self, dna_data: Dict[str, Any]) -> float:
        """総合強度を計算"""
        strengths = []
        for key in ["hook", "story_arc", "persona", "emotion", "value_prop", "cta_style"]:
            if key in dna_data and dna_data[key]:
                strength_str = dna_data[key].get("strength", "moderate")
                strength = self._map_strength(strength_str)
                strengths.append(self._strength_to_score(strength))

        return sum(strengths) / len(strengths) if strengths else 50

    def _calculate_element_similarity(
        self,
        element1: Optional[Dict],
        element2: Optional[Dict],
    ) -> float:
        """要素間の類似度を計算（簡易版）"""
        if not element1 or not element2:
            return 0.0

        # キーの一致度
        keys1 = set(element1.keys())
        keys2 = set(element2.keys())
        key_similarity = len(keys1 & keys2) / max(len(keys1 | keys2), 1)

        # 値の一致度（文字列のみ）
        value_matches = 0
        total_values = 0
        for key in keys1 & keys2:
            if isinstance(element1.get(key), str) and isinstance(element2.get(key), str):
                total_values += 1
                if element1[key].lower() == element2[key].lower():
                    value_matches += 1

        value_similarity = value_matches / max(total_values, 1)

        return (key_similarity + value_similarity) / 2

    def _find_element_differences(
        self,
        source: ContentDNA,
        target: ContentDNA,
    ) -> tuple[List[str], List[str], List[str]]:
        """共通要素と固有要素を特定"""
        shared = []
        unique_source = []
        unique_target = []

        elements = [
            ("hook", source.hook_elements, target.hook_elements),
            ("story_arc", source.story_structure, target.story_structure),
            ("persona", source.persona_traits, target.persona_traits),
            ("emotion", source.emotional_arc, target.emotional_arc),
            ("value_prop", source.value_propositions, target.value_propositions),
            ("cta_style", source.cta_patterns, target.cta_patterns),
        ]

        for name, source_elem, target_elem in elements:
            if source_elem and target_elem:
                shared.append(name)
            elif source_elem:
                unique_source.append(name)
            elif target_elem:
                unique_target.append(name)

        return shared, unique_source, unique_target

    def _extract_common_structure(self, dnas: List[ContentDNA]) -> Dict[str, Any]:
        """複数DNAから共通構造を抽出"""
        structure = {
            "hook_patterns": [],
            "story_structures": [],
            "persona_traits": [],
            "emotional_elements": [],
            "value_propositions": [],
            "cta_patterns": [],
        }

        for dna in dnas:
            if dna.hook_elements:
                structure["hook_patterns"].append(dna.hook_elements)
            if dna.story_structure:
                structure["story_structures"].append(dna.story_structure)
            if dna.persona_traits:
                structure["persona_traits"].append(dna.persona_traits)
            if dna.emotional_arc:
                structure["emotional_elements"].append(dna.emotional_arc)
            if dna.value_propositions:
                structure["value_propositions"].append(dna.value_propositions)
            if dna.cta_patterns:
                structure["cta_patterns"].append(dna.cta_patterns)

        return structure


# シングルトンインスタンス
dna_extraction_service = DNAExtractionService()
