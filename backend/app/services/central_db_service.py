"""
Central DB連携サービス

Central DBとの連携によるナレッジ管理・RAG検索
- ナレッジの追加・検索
- カテゴリ管理
- 台本生成へのナレッジ注入
"""

import logging
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


# ============================================================
# Central DB カテゴリ定義
# ============================================================

class CentralDBCategory:
    """Central DBのカテゴリ"""
    METHODS = "methods"  # メソッド（金子式など）
    QUESTIONS = "questions"  # 質問パターン
    CLIENTS = "clients"  # 顧客情報
    BUSINESS = "business"  # 営業
    CONTENT = "content"  # コンテンツ
    TECH = "tech"  # 技術


# ============================================================
# Central DB Service
# ============================================================

class CentralDBService:
    """
    Central DB連携サービス

    MCP経由でCentral DBにアクセスし、ナレッジの追加・検索を行う
    """

    def __init__(self, mcp_endpoint: Optional[str] = None):
        """
        初期化

        Args:
            mcp_endpoint: MCP サーバーエンドポイント（内部連携用）
        """
        self.mcp_endpoint = mcp_endpoint
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        """HTTPクライアント（遅延初期化）"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    # ============================================================
    # ナレッジ管理
    # ============================================================

    async def add_knowledge(
        self,
        title: str,
        content: str,
        category: str,
        subcategory: Optional[str] = None,
        tags: Optional[List[str]] = None,
        summary: Optional[str] = None,
        source: Optional[str] = None,
        source_type: str = "manual",
    ) -> Dict[str, Any]:
        """
        ナレッジを追加

        Args:
            title: タイトル
            content: 内容
            category: カテゴリ（methods/questions/clients/business/content/tech）
            subcategory: サブカテゴリ
            tags: タグリスト
            summary: 要約
            source: ソース元
            source_type: ソースタイプ（notion/manual/import）

        Returns:
            追加結果
        """
        logger.info(f"Adding knowledge to Central DB: {title}")

        # 実際のMCP連携は別途実装
        # ここではローカルストレージとして動作
        knowledge_entry = {
            "id": f"knowledge_{datetime.utcnow().timestamp()}",
            "title": title,
            "content": content,
            "category": category,
            "subcategory": subcategory,
            "tags": tags or [],
            "summary": summary,
            "source": source,
            "source_type": source_type,
            "created_at": datetime.utcnow().isoformat(),
        }

        return {
            "status": "success",
            "knowledge": knowledge_entry,
        }

    async def search_knowledge(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        ナレッジをRAG検索

        Args:
            query: 検索クエリ
            category: カテゴリで絞り込み
            limit: 取得件数

        Returns:
            検索結果リスト
        """
        logger.info(f"Searching Central DB: {query}")

        # モック検索結果
        # 実際のMCP連携では search_knowledge ツールを使用
        return [
            {
                "id": "mock_1",
                "title": f"検索結果: {query}",
                "content": "関連するナレッジコンテンツ...",
                "category": category or "content",
                "relevance_score": 0.85,
            }
        ]

    async def list_categories(self) -> Dict[str, int]:
        """
        カテゴリ一覧と件数を取得

        Returns:
            カテゴリ別件数
        """
        # モックデータ
        return {
            CentralDBCategory.METHODS: 25,
            CentralDBCategory.QUESTIONS: 50,
            CentralDBCategory.CLIENTS: 10,
            CentralDBCategory.BUSINESS: 15,
            CentralDBCategory.CONTENT: 100,
            CentralDBCategory.TECH: 30,
        }

    async def get_recent(
        self,
        category: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        最近追加されたナレッジを取得

        Args:
            category: カテゴリで絞り込み
            limit: 取得件数

        Returns:
            ナレッジリスト
        """
        # モックデータ
        return []

    # ============================================================
    # 台本生成向けナレッジ注入
    # ============================================================

    async def get_knowledge_context_for_script(
        self,
        topic: str,
        target_audience: Optional[str] = None,
        video_type: str = "long",
        knowledge_ids: Optional[List[str]] = None,
    ) -> str:
        """
        台本生成用のナレッジコンテキストを取得

        Args:
            topic: 動画のトピック
            target_audience: ターゲット視聴者
            video_type: 動画タイプ
            knowledge_ids: 特定のナレッジIDリスト

        Returns:
            フォーマットされたナレッジコンテキスト
        """
        context_parts = []

        # トピックに関連するナレッジを検索
        relevant_knowledge = await self.search_knowledge(
            query=topic,
            category=CentralDBCategory.CONTENT,
            limit=3,
        )

        if relevant_knowledge:
            context_parts.append("【関連コンテンツナレッジ】")
            for k in relevant_knowledge:
                context_parts.append(f"- {k.get('title', '')}: {k.get('content', '')[:200]}...")

        # メソッド/フレームワークを検索
        method_knowledge = await self.search_knowledge(
            query=f"{topic} 手法 フレームワーク",
            category=CentralDBCategory.METHODS,
            limit=2,
        )

        if method_knowledge:
            context_parts.append("\n【関連メソッド】")
            for k in method_knowledge:
                context_parts.append(f"- {k.get('title', '')}")

        # ターゲット視聴者に関するナレッジ
        if target_audience:
            audience_knowledge = await self.search_knowledge(
                query=target_audience,
                category=CentralDBCategory.CLIENTS,
                limit=2,
            )

            if audience_knowledge:
                context_parts.append("\n【ターゲット情報】")
                for k in audience_knowledge:
                    context_parts.append(f"- {k.get('content', '')[:200]}...")

        # 質問パターンを取得
        question_knowledge = await self.search_knowledge(
            query=topic,
            category=CentralDBCategory.QUESTIONS,
            limit=3,
        )

        if question_knowledge:
            context_parts.append("\n【よくある質問パターン】")
            for k in question_knowledge:
                context_parts.append(f"- {k.get('title', '')}")

        return "\n".join(context_parts) if context_parts else ""

    async def save_script_to_knowledge(
        self,
        title: str,
        script_content: str,
        video_type: str,
        performance_score: Optional[float] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        台本をナレッジとして保存（将来の学習用）

        Args:
            title: 動画タイトル
            script_content: 台本内容
            video_type: 動画タイプ
            performance_score: パフォーマンススコア
            tags: タグリスト

        Returns:
            保存結果
        """
        summary = f"動画タイプ: {video_type}"
        if performance_score:
            summary += f", パフォーマンス: {performance_score:.1f}"

        return await self.add_knowledge(
            title=f"台本: {title}",
            content=script_content,
            category=CentralDBCategory.CONTENT,
            subcategory="scripts",
            tags=tags or [video_type],
            summary=summary,
            source_type="import",
        )

    # ============================================================
    # 台本専門家レビュー連携
    # ============================================================

    async def save_expert_review_score(
        self,
        script_id: str,
        video_title: str,
        overall_score: int,
        grade: str,
        expert_scores: Dict[str, int],
        source_ai_type: str,
        knowledge_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        専門家レビューのスコアをナレッジとして保存

        Args:
            script_id: 台本ID
            video_title: 動画タイトル
            overall_score: 総合スコア（0-100）
            grade: グレード（S/A/B/C/D）
            expert_scores: 専門家別スコア
            source_ai_type: 元のAIタイプ（gemini/claude）
            knowledge_id: 関連ナレッジID

        Returns:
            保存結果
        """
        import json

        content = json.dumps({
            "script_id": script_id,
            "overall_score": overall_score,
            "grade": grade,
            "expert_scores": expert_scores,
            "source_ai_type": source_ai_type,
            "knowledge_id": knowledge_id,
            "reviewed_at": datetime.utcnow().isoformat(),
        }, ensure_ascii=False, indent=2)

        summary = f"総合スコア: {overall_score}点 ({grade}グレード)"

        return await self.add_knowledge(
            title=f"台本スコア - {video_title}",
            content=content,
            category=CentralDBCategory.CONTENT,
            subcategory="script_quality",
            tags=["expert_review", grade, source_ai_type],
            summary=summary,
            source=f"script:{script_id}",
            source_type="import",
        )

    async def save_adopted_script(
        self,
        script_id: str,
        video_title: str,
        script_content: str,
        overall_score: int,
        grade: str,
        source_ai_type: str,
        adopted_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        採用された台本をナレッジとして保存

        Args:
            script_id: 台本ID
            video_title: 動画タイトル
            script_content: 台本内容
            overall_score: 最終スコア
            grade: 最終グレード
            source_ai_type: 元のAIタイプ
            adopted_at: 採用日時

        Returns:
            保存結果
        """
        import json

        metadata = {
            "script_id": script_id,
            "overall_score": overall_score,
            "grade": grade,
            "source_ai_type": source_ai_type,
            "adopted_at": adopted_at or datetime.utcnow().isoformat(),
        }

        content = f"""【台本メタデータ】
{json.dumps(metadata, ensure_ascii=False, indent=2)}

【台本内容】
{script_content}
"""

        summary = f"スコア: {overall_score}点 ({grade}), AI: {source_ai_type}"

        return await self.add_knowledge(
            title=f"採用台本 - {video_title}",
            content=content,
            category=CentralDBCategory.CONTENT,
            subcategory="adopted_scripts",
            tags=["adopted", grade, source_ai_type],
            summary=summary,
            source=f"script:{script_id}",
            source_type="import",
        )

    async def save_improvement_pattern(
        self,
        pattern_type: str,
        original_text: str,
        improved_text: str,
        improvement_reason: str,
        expert_type: str,
        score_improvement: int,
    ) -> Dict[str, Any]:
        """
        改善パターンをナレッジとして保存（学習用）

        Args:
            pattern_type: パターンタイプ（hook/structure/entertainment/target/cta）
            original_text: 改善前のテキスト
            improved_text: 改善後のテキスト
            improvement_reason: 改善理由
            expert_type: 専門家タイプ
            score_improvement: スコア向上値

        Returns:
            保存結果
        """
        import json

        content = json.dumps({
            "pattern_type": pattern_type,
            "original": original_text,
            "improved": improved_text,
            "reason": improvement_reason,
            "expert": expert_type,
            "score_boost": score_improvement,
            "recorded_at": datetime.utcnow().isoformat(),
        }, ensure_ascii=False, indent=2)

        summary = f"タイプ: {pattern_type}, 向上: +{score_improvement}点"

        return await self.add_knowledge(
            title=f"改善パターン - {pattern_type}",
            content=content,
            category=CentralDBCategory.CONTENT,
            subcategory="improvement_patterns",
            tags=["improvement", pattern_type, expert_type],
            summary=summary,
            source_type="import",
        )

    async def get_similar_scripts(
        self,
        topic: str,
        min_score: int = 80,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        類似の高スコア台本を取得

        Args:
            topic: トピック
            min_score: 最低スコア
            limit: 取得件数

        Returns:
            類似台本リスト
        """
        return await self.search_knowledge(
            query=f"{topic} 採用台本 {min_score}点以上",
            category=CentralDBCategory.CONTENT,
            limit=limit,
        )

    async def get_improvement_patterns_by_expert(
        self,
        expert_type: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        専門家タイプ別の改善パターンを取得

        Args:
            expert_type: 専門家タイプ
            limit: 取得件数

        Returns:
            改善パターンリスト
        """
        return await self.search_knowledge(
            query=f"改善パターン {expert_type}",
            category=CentralDBCategory.CONTENT,
            limit=limit,
        )

    # ============================================================
    # DNA・学習連携
    # ============================================================

    async def save_dna_to_knowledge(
        self,
        dna_name: str,
        dna_elements: Dict[str, Any],
        knowledge_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        抽出したDNAをナレッジとして保存

        Args:
            dna_name: DNA名
            dna_elements: DNA要素
            knowledge_id: 関連ナレッジID

        Returns:
            保存結果
        """
        import json

        content = json.dumps(dna_elements, ensure_ascii=False, indent=2)

        return await self.add_knowledge(
            title=f"DNA: {dna_name}",
            content=content,
            category=CentralDBCategory.CONTENT,
            subcategory="dna",
            tags=["dna", "success_pattern"],
            source=knowledge_id,
            source_type="import",
        )

    async def save_success_pattern_to_knowledge(
        self,
        pattern_name: str,
        pattern_data: Dict[str, Any],
        category: str,
        avg_performance_boost: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        成功パターンをナレッジとして保存

        Args:
            pattern_name: パターン名
            pattern_data: パターンデータ
            category: カテゴリ
            avg_performance_boost: 平均パフォーマンス向上率

        Returns:
            保存結果
        """
        import json

        summary = f"カテゴリ: {category}"
        if avg_performance_boost:
            summary += f", 向上率: +{avg_performance_boost:.1f}%"

        return await self.add_knowledge(
            title=f"成功パターン: {pattern_name}",
            content=json.dumps(pattern_data, ensure_ascii=False, indent=2),
            category=CentralDBCategory.METHODS,
            subcategory="success_patterns",
            tags=["success_pattern", category],
            summary=summary,
            source_type="import",
        )

    async def get_success_patterns_for_category(
        self,
        category: str,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        カテゴリの成功パターンを取得

        Args:
            category: カテゴリ
            limit: 取得件数

        Returns:
            成功パターンリスト
        """
        return await self.search_knowledge(
            query=f"成功パターン {category}",
            category=CentralDBCategory.METHODS,
            limit=limit,
        )

    # ============================================================
    # Notion連携
    # ============================================================

    async def import_from_notion(
        self,
        page_id: str,
        title: str,
        content: str,
        category: str,
    ) -> Dict[str, Any]:
        """
        NotionページをCentral DBにインポート

        Args:
            page_id: NotionページID
            title: タイトル
            content: 内容
            category: カテゴリ

        Returns:
            インポート結果
        """
        return await self.add_knowledge(
            title=title,
            content=content,
            category=category,
            source=f"notion:{page_id}",
            source_type="notion",
        )

    # ============================================================
    # クリーンアップ
    # ============================================================

    async def close(self) -> None:
        """クライアントをクローズ"""
        if self._client:
            await self._client.aclose()
            self._client = None


# シングルトンインスタンス
central_db_service = CentralDBService()
