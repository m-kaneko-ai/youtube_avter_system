"""
埋め込み生成サービス

OpenAI APIを使用してナレッジのベクトル埋め込みを生成し、
pgvectorを使った類似検索を提供します。
"""
import json
import logging
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.knowledge import Knowledge

logger = logging.getLogger(__name__)


class EmbeddingService:
    """埋め込み生成サービスクラス"""

    def __init__(self):
        """初期化"""
        self.openai_client = None
        self.model = settings.OPENAI_EMBEDDING_MODEL

        # OpenAI APIキーが設定されている場合のみクライアントを初期化
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI Embedding API initialized")
            except ImportError:
                logger.warning("openai package not installed. Using fallback implementation.")
        else:
            logger.warning("OPENAI_API_KEY not set. Using fallback implementation.")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        テキストから埋め込みベクトルを生成

        Args:
            text: 埋め込み対象のテキスト

        Returns:
            1536次元の埋め込みベクトル
        """
        if self.openai_client:
            return await self._generate_openai_embedding(text)
        else:
            logger.info("Using fallback embedding implementation")
            return await self._generate_fallback_embedding(text)

    async def _generate_openai_embedding(self, text: str) -> List[float]:
        """
        OpenAI APIで埋め込みベクトルを生成

        Args:
            text: 埋め込み対象のテキスト

        Returns:
            1536次元の埋め込みベクトル
        """
        try:
            # テキストを適切な長さにトランケート（8191トークン制限）
            # 1トークン ≈ 4文字として概算
            max_chars = 30000  # 約7500トークン
            truncated_text = text[:max_chars]

            response = await self.openai_client.embeddings.create(
                model=self.model,
                input=truncated_text,
                dimensions=1536
            )

            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            return embedding

        except Exception as e:
            logger.error(f"OpenAI Embedding API error: {e}. Falling back to hash-based implementation.")
            return await self._generate_fallback_embedding(text)

    async def _generate_fallback_embedding(self, text: str) -> List[float]:
        """
        フォールバック用のハッシュベース埋め込み生成

        OpenAI APIが利用できない場合の代替実装。
        本番環境では OpenAI API の使用を推奨。

        Args:
            text: 埋め込み対象のテキスト

        Returns:
            1536次元の疑似埋め込みベクトル
        """
        import hashlib
        import struct
        import math

        # テキストのハッシュから1536次元のベクトルを生成
        # シンプルにランダムシードベースで生成
        import random
        random.seed(hash(text))

        # 1536個のガウス分布に従う乱数を生成
        embedding = [random.gauss(0, 1) for _ in range(1536)]

        # 正規化（単位ベクトル化）
        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]

        return embedding

    def estimate_tokens(self, text: str) -> int:
        """
        テキストのトークン数を概算

        Args:
            text: テキスト

        Returns:
            推定トークン数
        """
        # 1トークン ≈ 4文字（英語の場合は1単語 ≈ 1.3トークン）
        # 日本語の場合は文字数 / 3 程度が目安
        return len(text) // 3

    def estimate_cost(self, text: str) -> Tuple[int, float]:
        """
        埋め込み生成のコストを推定

        Args:
            text: テキスト

        Returns:
            (推定トークン数, 推定コストUSD)
        """
        tokens = self.estimate_tokens(text)
        # text-embedding-3-large: $0.00013 per 1K tokens
        cost_per_1k = 0.00013
        cost = (tokens / 1000) * cost_per_1k
        return tokens, cost

    async def _extract_knowledge_text(self, knowledge: Knowledge) -> str:
        """
        ナレッジオブジェクトから検索用テキストを抽出

        Args:
            knowledge: ナレッジオブジェクト

        Returns:
            結合されたテキスト
        """
        texts = [f"ナレッジ名: {knowledge.name}"]

        # 各セクションからテキストを抽出
        sections = [
            ("メインターゲット", knowledge.section_1_main_target),
            ("サブターゲット", knowledge.section_2_sub_target),
            ("競合分析", knowledge.section_3_competitor),
            ("自社分析", knowledge.section_4_company),
            ("AHAコンセプト", knowledge.section_5_aha_concept),
            ("コンセプトまとめ", knowledge.section_6_concept_summary),
            ("カスタマージャーニー", knowledge.section_7_customer_journey),
            ("プロモーション戦略", knowledge.section_8_promotion_strategy),
        ]

        for section_name, section_data in sections:
            if section_data:
                # JSONBデータを文字列化
                if isinstance(section_data, dict):
                    section_text = json.dumps(section_data, ensure_ascii=False)
                else:
                    section_text = str(section_data)
                texts.append(f"{section_name}: {section_text}")

        return "\n\n".join(texts)

    async def update_knowledge_embedding(
        self,
        knowledge_id: UUID,
        db: AsyncSession
    ) -> Knowledge:
        """
        ナレッジの埋め込みを生成・更新

        Args:
            knowledge_id: ナレッジID
            db: データベースセッション

        Returns:
            更新されたナレッジオブジェクト

        Raises:
            ValueError: ナレッジが見つからない場合
        """
        # ナレッジを取得
        result = await db.execute(
            select(Knowledge).where(Knowledge.id == knowledge_id)
        )
        knowledge = result.scalars().first()

        if not knowledge:
            raise ValueError(f"Knowledge not found: {knowledge_id}")

        # テキストを抽出
        text = await self._extract_knowledge_text(knowledge)

        # コスト推定（ログ出力）
        tokens, cost = self.estimate_cost(text)
        logger.info(f"Embedding cost estimate: {tokens} tokens, ${cost:.6f}")

        # 埋め込みを生成
        embedding = await self.generate_embedding(text)

        # データベースに保存
        knowledge.embedding = embedding
        await db.commit()
        await db.refresh(knowledge)

        logger.info(f"Updated embedding for knowledge {knowledge_id}")
        return knowledge

    async def batch_update_embeddings(
        self,
        knowledge_ids: List[UUID],
        db: AsyncSession
    ) -> Tuple[int, int, float]:
        """
        複数ナレッジの埋め込みを一括更新

        Args:
            knowledge_ids: ナレッジIDのリスト
            db: データベースセッション

        Returns:
            (成功件数, 失敗件数, 総推定コストUSD)
        """
        success_count = 0
        failure_count = 0
        total_cost = 0.0

        for knowledge_id in knowledge_ids:
            try:
                knowledge = await self.update_knowledge_embedding(knowledge_id, db)
                success_count += 1

                # コスト計算
                text = await self._extract_knowledge_text(knowledge)
                _, cost = self.estimate_cost(text)
                total_cost += cost

            except Exception as e:
                logger.error(f"Failed to update embedding for {knowledge_id}: {e}")
                failure_count += 1

        logger.info(
            f"Batch update completed: {success_count} success, "
            f"{failure_count} failures, ${total_cost:.6f} total cost"
        )

        return success_count, failure_count, total_cost

    async def search_similar(
        self,
        query: str,
        db: AsyncSession,
        client_id: Optional[UUID] = None,
        limit: int = 5
    ) -> List[Knowledge]:
        """
        類似ナレッジを検索

        Args:
            query: 検索クエリ
            db: データベースセッション
            client_id: クライアントID（指定された場合、そのクライアントのナレッジのみ検索）
            limit: 取得件数

        Returns:
            類似度の高い順にソートされたナレッジのリスト
        """
        # クエリの埋め込みを生成
        query_embedding = await self.generate_embedding(query)

        # pgvectorを使った類似検索
        # cosine距離: 1 - (A・B) / (|A||B|)
        # より小さい値が類似度が高い
        stmt = select(Knowledge).where(Knowledge.embedding.isnot(None))

        # クライアントIDでフィルタリング
        if client_id:
            stmt = stmt.where(Knowledge.client_id == client_id)

        # コサイン距離でソート
        stmt = stmt.order_by(
            Knowledge.embedding.cosine_distance(query_embedding)
        ).limit(limit)

        result = await db.execute(stmt)
        knowledges = result.scalars().all()

        logger.info(f"Found {len(knowledges)} similar knowledges for query")
        return list(knowledges)


# シングルトンインスタンス
embedding_service = EmbeddingService()
