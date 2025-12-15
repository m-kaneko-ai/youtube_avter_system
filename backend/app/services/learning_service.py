"""
パフォーマンス学習サービス

動画パフォーマンスの分析・学習・インサイト生成
- パフォーマンス記録の分析
- 成功パターンの自動抽出
- 推奨事項の生成
"""

import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.learning import (
    PerformanceRecord,
    LearningInsight,
    SuccessPattern,
    Recommendation,
    LearningHistory,
    PerformanceLevel,
    LearningCategory,
    InsightType,
)
from app.services.external.ai_clients import claude_client, gemini_client

logger = logging.getLogger(__name__)


# ============================================================
# 分析プロンプト
# ============================================================

PATTERN_ANALYSIS_PROMPT = """あなたはYouTube動画パフォーマンス分析の専門家です。
以下のパフォーマンスデータから成功パターンを特定してください。

【パフォーマンスデータ】
{performance_data}

【分析観点】
1. タイトルの特徴（長さ、数字の有無、疑問符、絵文字）
2. 投稿タイミング（曜日、時間）
3. 動画の長さ
4. タグの使用パターン
5. 高パフォーマンス動画に共通する要素

【出力形式】
以下のJSON形式で出力してください:
```json
{{
  "success_patterns": [
    {{
      "category": "title/thumbnail/hook/content_structure/cta/timing/length/tags",
      "name": "パターン名",
      "description": "パターンの説明",
      "pattern_data": {{}},
      "confidence": 0.8,
      "impact_estimate": "high/medium/low"
    }}
  ],
  "insights": [
    {{
      "type": "success_pattern/failure_pattern/trend/correlation",
      "category": "title/thumbnail/hook/content_structure/cta/timing/length/tags",
      "title": "インサイトタイトル",
      "description": "詳細説明",
      "confidence": 0.8
    }}
  ],
  "recommendations": [
    {{
      "category": "title/thumbnail/hook/content_structure/cta/timing/length/tags",
      "title": "推奨タイトル",
      "description": "推奨内容",
      "expected_impact": "high/medium/low"
    }}
  ]
}}
```
"""

RECOMMENDATION_PROMPT = """あなたはYouTubeコンテンツ最適化の専門家です。
以下の情報に基づいて、次の動画への具体的な推奨事項を生成してください。

【チャンネル情報】
ナレッジID: {knowledge_id}

【成功パターン】
{success_patterns}

【直近のパフォーマンス】
{recent_performance}

【出力形式】
以下のJSON形式で5つの推奨事項を出力してください:
```json
{{
  "recommendations": [
    {{
      "category": "title/thumbnail/hook/content_structure/cta/timing/length/tags",
      "title": "推奨タイトル",
      "description": "具体的なアクション内容",
      "action_items": ["アクション1", "アクション2"],
      "expected_impact_score": 80,
      "expected_improvement": "期待される改善（例: CTR +15%）"
    }}
  ]
}}
```
"""


class LearningService:
    """パフォーマンス学習サービス"""

    # ============================================================
    # パフォーマンス分析
    # ============================================================

    async def calculate_performance_score(
        self,
        record: PerformanceRecord,
        baseline_stats: Optional[Dict[str, float]] = None,
    ) -> float:
        """
        パフォーマンススコアを計算

        Args:
            record: パフォーマンス記録
            baseline_stats: ベースライン統計（平均値）

        Returns:
            スコア（0-100）
        """
        if not baseline_stats:
            baseline_stats = {
                "avg_views": 1000,
                "avg_likes": 50,
                "avg_comments": 10,
                "avg_ctr": 5.0,
                "avg_view_percentage": 30.0,
            }

        # 各指標のスコアを計算
        scores = []

        # 再生回数スコア
        if record.views > 0:
            view_score = min(100, (record.views / baseline_stats["avg_views"]) * 50)
            scores.append(view_score * 0.3)  # 30%ウェイト

        # いいね率スコア
        if record.views > 0:
            like_rate = (record.likes / record.views) * 100
            baseline_like_rate = (baseline_stats["avg_likes"] / baseline_stats["avg_views"]) * 100
            like_score = min(100, (like_rate / baseline_like_rate) * 50)
            scores.append(like_score * 0.2)  # 20%ウェイト

        # コメント率スコア
        if record.views > 0:
            comment_rate = (record.comments / record.views) * 100
            baseline_comment_rate = (baseline_stats["avg_comments"] / baseline_stats["avg_views"]) * 100
            if baseline_comment_rate > 0:
                comment_score = min(100, (comment_rate / baseline_comment_rate) * 50)
                scores.append(comment_score * 0.15)  # 15%ウェイト

        # CTRスコア
        if record.ctr and baseline_stats["avg_ctr"] > 0:
            ctr_score = min(100, (record.ctr / baseline_stats["avg_ctr"]) * 50)
            scores.append(ctr_score * 0.2)  # 20%ウェイト

        # 視聴維持率スコア
        if record.avg_view_percentage and baseline_stats["avg_view_percentage"] > 0:
            retention_score = min(100, (record.avg_view_percentage / baseline_stats["avg_view_percentage"]) * 50)
            scores.append(retention_score * 0.15)  # 15%ウェイト

        return sum(scores) if scores else 50.0

    def determine_performance_level(self, score: float) -> PerformanceLevel:
        """スコアからパフォーマンスレベルを決定"""
        if score >= 80:
            return PerformanceLevel.EXCEPTIONAL
        elif score >= 65:
            return PerformanceLevel.HIGH
        elif score >= 45:
            return PerformanceLevel.AVERAGE
        elif score >= 30:
            return PerformanceLevel.BELOW_AVERAGE
        else:
            return PerformanceLevel.LOW

    # ============================================================
    # パターン分析
    # ============================================================

    async def analyze_patterns(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID] = None,
        min_sample_size: int = 10,
    ) -> Dict[str, Any]:
        """
        パフォーマンスパターンを分析

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID（特定チャンネルに限定）
            min_sample_size: 最小サンプルサイズ

        Returns:
            分析結果
        """
        # パフォーマンス記録を取得
        query = select(PerformanceRecord)
        if knowledge_id:
            query = query.where(PerformanceRecord.knowledge_id == knowledge_id)

        result = await db.execute(query)
        records = result.scalars().all()

        if len(records) < min_sample_size:
            return {
                "status": "insufficient_data",
                "sample_size": len(records),
                "min_required": min_sample_size,
            }

        # データを準備
        performance_data = self._prepare_performance_data(records)

        # AIで分析
        analysis_result = await self._analyze_with_ai(performance_data)

        # 結果を保存
        if analysis_result:
            await self._save_analysis_results(db, knowledge_id, analysis_result)

        return analysis_result

    def _prepare_performance_data(self, records: List[PerformanceRecord]) -> str:
        """パフォーマンスデータをAI分析用に準備"""
        data = []
        for record in records:
            data.append({
                "video_type": record.video_type,
                "views": record.views,
                "likes": record.likes,
                "comments": record.comments,
                "ctr": record.ctr,
                "avg_view_percentage": record.avg_view_percentage,
                "performance_level": record.performance_level.value if record.performance_level else None,
                "performance_score": record.performance_score,
                "title_length": record.title_length,
                "has_number_in_title": record.has_number_in_title,
                "has_question_in_title": record.has_question_in_title,
                "has_emoji_in_title": record.has_emoji_in_title,
                "video_length_seconds": record.video_length_seconds,
                "publish_day_of_week": record.publish_day_of_week,
                "publish_hour": record.publish_hour,
                "tags": record.tags,
            })

        return json.dumps(data[:50], ensure_ascii=False, default=str)  # 最大50件

    async def _analyze_with_ai(self, performance_data: str) -> Dict[str, Any]:
        """AIでパターン分析"""
        prompt = PATTERN_ANALYSIS_PROMPT.format(performance_data=performance_data)

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
                return {"status": "no_ai_available"}

            return self._parse_json_response(response_text)

        except Exception as e:
            logger.error(f"Pattern analysis failed: {e}")
            return {"status": "error", "message": str(e)}

    async def _save_analysis_results(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID],
        analysis_result: Dict[str, Any],
    ) -> None:
        """分析結果を保存"""
        # 成功パターンを保存
        patterns_created = 0
        for pattern_data in analysis_result.get("success_patterns", []):
            pattern = SuccessPattern(
                knowledge_id=knowledge_id,
                name=pattern_data.get("name", "Unknown Pattern"),
                description=pattern_data.get("description"),
                category=self._map_category(pattern_data.get("category")),
                pattern_data=pattern_data.get("pattern_data", {}),
                avg_performance_boost=self._map_impact_to_score(pattern_data.get("impact_estimate")),
            )
            db.add(pattern)
            patterns_created += 1

        # インサイトを保存
        insights_created = 0
        for insight_data in analysis_result.get("insights", []):
            insight = LearningInsight(
                knowledge_id=knowledge_id,
                insight_type=self._map_insight_type(insight_data.get("type")),
                category=self._map_category(insight_data.get("category")),
                title=insight_data.get("title", "Unknown Insight"),
                description=insight_data.get("description"),
                confidence_score=insight_data.get("confidence", 0.5),
            )
            db.add(insight)
            insights_created += 1

        # 推奨を保存
        recommendations_created = 0
        for rec_data in analysis_result.get("recommendations", []):
            recommendation = Recommendation(
                knowledge_id=knowledge_id,
                category=self._map_category(rec_data.get("category")),
                title=rec_data.get("title", "Unknown Recommendation"),
                description=rec_data.get("description"),
                expected_impact_score=self._map_impact_to_score(rec_data.get("expected_impact")),
            )
            db.add(recommendation)
            recommendations_created += 1

        # 履歴を記録
        history = LearningHistory(
            knowledge_id=knowledge_id,
            learning_type="pattern_analysis",
            output_summary=analysis_result,
            patterns_discovered=patterns_created,
            insights_generated=insights_created,
            recommendations_created=recommendations_created,
            model_version="1.0",
        )
        db.add(history)

        await db.commit()

    # ============================================================
    # 推奨事項生成
    # ============================================================

    async def generate_recommendations(
        self,
        db: AsyncSession,
        knowledge_id: UUID,
        video_id: Optional[UUID] = None,
        count: int = 5,
    ) -> List[Recommendation]:
        """
        推奨事項を生成

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            video_id: 対象動画ID（特定動画向けの推奨）
            count: 生成する推奨数

        Returns:
            推奨事項リスト
        """
        # 成功パターンを取得
        patterns_result = await db.execute(
            select(SuccessPattern)
            .where(SuccessPattern.knowledge_id == knowledge_id)
            .where(SuccessPattern.is_active == True)
            .order_by(SuccessPattern.avg_performance_boost.desc().nullslast())
            .limit(10)
        )
        patterns = patterns_result.scalars().all()

        # 直近のパフォーマンスを取得
        records_result = await db.execute(
            select(PerformanceRecord)
            .where(PerformanceRecord.knowledge_id == knowledge_id)
            .order_by(PerformanceRecord.recorded_at.desc())
            .limit(5)
        )
        recent_records = records_result.scalars().all()

        # AIで推奨を生成
        patterns_text = json.dumps(
            [{"name": p.name, "category": p.category.value, "data": p.pattern_data} for p in patterns],
            ensure_ascii=False,
            default=str,
        )
        performance_text = json.dumps(
            [{"views": r.views, "ctr": r.ctr, "performance_score": r.performance_score} for r in recent_records],
            ensure_ascii=False,
            default=str,
        )

        prompt = RECOMMENDATION_PROMPT.format(
            knowledge_id=str(knowledge_id),
            success_patterns=patterns_text,
            recent_performance=performance_text,
        )

        try:
            if claude_client.is_available():
                message = claude_client.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2048,
                    messages=[{"role": "user", "content": prompt}],
                )
                response_text = message.content[0].text
            elif gemini_client.is_available():
                response = gemini_client.model.generate_content(prompt)
                response_text = response.text
            else:
                return []

            result = self._parse_json_response(response_text)
            recommendations = []

            for rec_data in result.get("recommendations", [])[:count]:
                recommendation = Recommendation(
                    video_id=video_id,
                    knowledge_id=knowledge_id,
                    category=self._map_category(rec_data.get("category")),
                    title=rec_data.get("title", "推奨事項"),
                    description=rec_data.get("description"),
                    action_items=rec_data.get("action_items"),
                    expected_impact_score=rec_data.get("expected_impact_score"),
                    expected_improvement=rec_data.get("expected_improvement"),
                )
                db.add(recommendation)
                recommendations.append(recommendation)

            await db.commit()
            return recommendations

        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return []

    # ============================================================
    # サマリー・トレンド
    # ============================================================

    async def get_summary(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        学習サマリーを取得

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID

        Returns:
            サマリー情報
        """
        # 各テーブルのカウント
        records_count = await self._count_records(db, PerformanceRecord, knowledge_id)
        insights_count = await self._count_records(db, LearningInsight, knowledge_id)
        patterns_count = await self._count_records(db, SuccessPattern, knowledge_id)
        recommendations_count = await self._count_active_recommendations(db, knowledge_id)

        # 平均パフォーマンススコア
        avg_score = await self._get_average_score(db, knowledge_id)

        # 最も成功しているカテゴリ
        top_category = await self._get_top_performing_category(db, knowledge_id)

        # 最も一般的な成功パターン
        top_pattern = await self._get_most_common_pattern(db, knowledge_id)

        return {
            "total_records": records_count,
            "total_insights": insights_count,
            "total_patterns": patterns_count,
            "total_recommendations": recommendations_count,
            "avg_performance_score": avg_score,
            "top_performing_category": top_category,
            "most_common_success_pattern": top_pattern,
            "active_recommendations": recommendations_count,
        }

    async def get_trends(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID] = None,
        days: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        学習トレンドを取得

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            days: 期間（日数）

        Returns:
            日別トレンドリスト
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        # 日別のパフォーマンス集計
        query = (
            select(
                func.date(PerformanceRecord.recorded_at).label("date"),
                func.avg(PerformanceRecord.performance_score).label("avg_performance"),
            )
            .where(PerformanceRecord.recorded_at >= start_date)
            .group_by(func.date(PerformanceRecord.recorded_at))
            .order_by(func.date(PerformanceRecord.recorded_at))
        )

        if knowledge_id:
            query = query.where(PerformanceRecord.knowledge_id == knowledge_id)

        result = await db.execute(query)
        rows = result.all()

        # 日別のインサイト/パターン生成数を取得
        insights_query = (
            select(
                func.date(LearningInsight.created_at).label("date"),
                func.count(LearningInsight.id).label("count"),
            )
            .where(LearningInsight.created_at >= start_date)
            .group_by(func.date(LearningInsight.created_at))
        )
        if knowledge_id:
            insights_query = insights_query.where(LearningInsight.knowledge_id == knowledge_id)

        insights_result = await db.execute(insights_query)
        insights_by_date = {str(row.date): row.count for row in insights_result.all()}

        patterns_query = (
            select(
                func.date(SuccessPattern.created_at).label("date"),
                func.count(SuccessPattern.id).label("count"),
            )
            .where(SuccessPattern.created_at >= start_date)
            .group_by(func.date(SuccessPattern.created_at))
        )
        if knowledge_id:
            patterns_query = patterns_query.where(SuccessPattern.knowledge_id == knowledge_id)

        patterns_result = await db.execute(patterns_query)
        patterns_by_date = {str(row.date): row.count for row in patterns_result.all()}

        trends = []
        for row in rows:
            date_str = str(row.date)
            trends.append({
                "date": date_str,
                "avg_performance": row.avg_performance or 0,
                "insights_generated": insights_by_date.get(date_str, 0),
                "patterns_discovered": patterns_by_date.get(date_str, 0),
            })

        return trends

    # ============================================================
    # ヘルパーメソッド
    # ============================================================

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """AIレスポンスからJSONを抽出"""
        import re

        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = response_text

        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON response")
            return {}

    def _map_category(self, category_str: Optional[str]) -> LearningCategory:
        """文字列をLearningCategoryに変換"""
        if not category_str:
            return LearningCategory.CONTENT_STRUCTURE

        mapping = {
            "title": LearningCategory.TITLE,
            "thumbnail": LearningCategory.THUMBNAIL,
            "hook": LearningCategory.HOOK,
            "content_structure": LearningCategory.CONTENT_STRUCTURE,
            "cta": LearningCategory.CTA,
            "timing": LearningCategory.TIMING,
            "length": LearningCategory.LENGTH,
            "tags": LearningCategory.TAGS,
        }
        return mapping.get(category_str.lower(), LearningCategory.CONTENT_STRUCTURE)

    def _map_insight_type(self, type_str: Optional[str]) -> InsightType:
        """文字列をInsightTypeに変換"""
        if not type_str:
            return InsightType.RECOMMENDATION

        mapping = {
            "success_pattern": InsightType.SUCCESS_PATTERN,
            "failure_pattern": InsightType.FAILURE_PATTERN,
            "trend": InsightType.TREND,
            "recommendation": InsightType.RECOMMENDATION,
            "correlation": InsightType.CORRELATION,
        }
        return mapping.get(type_str.lower(), InsightType.RECOMMENDATION)

    def _map_impact_to_score(self, impact: Optional[str]) -> float:
        """影響度をスコアに変換"""
        if not impact:
            return 50.0

        mapping = {
            "high": 80.0,
            "medium": 60.0,
            "low": 40.0,
        }
        return mapping.get(impact.lower(), 50.0)

    async def _count_records(
        self,
        db: AsyncSession,
        model,
        knowledge_id: Optional[UUID],
    ) -> int:
        """レコード数をカウント"""
        query = select(func.count(model.id))
        if knowledge_id and hasattr(model, "knowledge_id"):
            query = query.where(model.knowledge_id == knowledge_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def _count_active_recommendations(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID],
    ) -> int:
        """アクティブな推奨をカウント"""
        query = select(func.count(Recommendation.id)).where(
            Recommendation.is_applied == False
        )
        if knowledge_id:
            query = query.where(Recommendation.knowledge_id == knowledge_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def _get_average_score(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID],
    ) -> Optional[float]:
        """平均パフォーマンススコアを取得"""
        query = select(func.avg(PerformanceRecord.performance_score))
        if knowledge_id:
            query = query.where(PerformanceRecord.knowledge_id == knowledge_id)
        result = await db.execute(query)
        return result.scalar()

    async def _get_top_performing_category(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID],
    ) -> Optional[str]:
        """最も成功しているカテゴリを取得"""
        query = (
            select(
                SuccessPattern.category,
                func.avg(SuccessPattern.avg_performance_boost).label("avg_boost"),
            )
            .where(SuccessPattern.is_active == True)
            .group_by(SuccessPattern.category)
            .order_by(func.avg(SuccessPattern.avg_performance_boost).desc().nullslast())
            .limit(1)
        )
        if knowledge_id:
            query = query.where(SuccessPattern.knowledge_id == knowledge_id)

        result = await db.execute(query)
        row = result.first()
        return row.category.value if row and row.category else None

    async def _get_most_common_pattern(
        self,
        db: AsyncSession,
        knowledge_id: Optional[UUID],
    ) -> Optional[str]:
        """最も一般的な成功パターンを取得"""
        query = (
            select(SuccessPattern.name)
            .where(SuccessPattern.is_active == True)
            .order_by(SuccessPattern.application_count.desc())
            .limit(1)
        )
        if knowledge_id:
            query = query.where(SuccessPattern.knowledge_id == knowledge_id)

        result = await db.execute(query)
        row = result.first()
        return row.name if row else None


# シングルトンインスタンス
learning_service = LearningService()
