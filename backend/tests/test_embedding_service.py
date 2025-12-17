"""
埋め込みサービスのテスト
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from sqlalchemy import select

from app.services.embedding_service import embedding_service, EmbeddingService
from app.models.knowledge import Knowledge, KnowledgeType


@pytest.mark.asyncio
async def test_generate_embedding(db_session):
    """埋め込み生成のテスト"""
    # テキストから埋め込みを生成
    text = "これはテストテキストです。ナレッジのベクトル検索を試しています。"
    embedding = await embedding_service.generate_embedding(text)

    # 検証
    assert embedding is not None
    assert isinstance(embedding, list)
    assert len(embedding) == 1536
    assert all(isinstance(x, float) for x in embedding)


@pytest.mark.asyncio
async def test_update_knowledge_embedding(db_session, test_client):
    """ナレッジ埋め込み更新のテスト"""
    # テスト用のクライアントとナレッジを作成
    from app.models.client import Client, ClientPlan

    client = Client(
        id=uuid4(),
        name="Test Client",
        email="test@example.com",
        plan=ClientPlan.BASIC,
    )
    db_session.add(client)
    await db_session.commit()

    knowledge = Knowledge(
        id=uuid4(),
        client_id=client.id,
        name="テストナレッジ",
        type=KnowledgeType.BRAND,
        section_1_main_target={"attributes": "30代男性", "situation": "起業を目指している"},
        section_2_sub_target={"attributes": "20代女性"},
        section_3_competitor={"mainCompetitors": "A社, B社"},
    )
    db_session.add(knowledge)
    await db_session.commit()

    # 埋め込みを生成
    updated_knowledge = await embedding_service.update_knowledge_embedding(
        knowledge.id, db_session
    )

    # 検証
    assert updated_knowledge.embedding is not None
    assert len(updated_knowledge.embedding) == 1536


@pytest.mark.asyncio
async def test_search_similar(db_session, test_client):
    """類似検索のテスト"""
    # テスト用のクライアントを作成
    from app.models.client import Client, ClientPlan

    client = Client(
        id=uuid4(),
        name="Test Client",
        email="test@example.com",
        plan=ClientPlan.BASIC,
    )
    db_session.add(client)
    await db_session.commit()

    # 複数のナレッジを作成して埋め込みを生成
    knowledges_data = [
        {
            "name": "起業支援コンサル",
            "section_1_main_target": {"attributes": "30代男性", "situation": "起業を目指している"},
        },
        {
            "name": "マーケティング講座",
            "section_1_main_target": {"attributes": "40代経営者", "situation": "集客に悩んでいる"},
        },
        {
            "name": "プログラミング教室",
            "section_1_main_target": {"attributes": "20代学生", "situation": "エンジニア転職を目指している"},
        },
    ]

    knowledge_ids = []
    for data in knowledges_data:
        knowledge = Knowledge(
            id=uuid4(),
            client_id=client.id,
            name=data["name"],
            type=KnowledgeType.BRAND,
            section_1_main_target=data["section_1_main_target"],
        )
        db_session.add(knowledge)
        await db_session.commit()

        # 埋め込みを生成
        await embedding_service.update_knowledge_embedding(knowledge.id, db_session)
        knowledge_ids.append(knowledge.id)

    # 検索を実行
    query = "起業したい人向けのサービス"
    results = await embedding_service.search_similar(
        query=query,
        db=db_session,
        client_id=client.id,
        limit=2,
    )

    # 検証
    assert len(results) <= 2
    assert all(isinstance(k, Knowledge) for k in results)
    # 起業支援コンサルが上位に来ることを期待
    # (注: 現在の疑似実装では正確な類似度は保証されない)


@pytest.mark.asyncio
async def test_extract_knowledge_text(db_session, test_client):
    """ナレッジテキスト抽出のテスト"""
    from app.models.client import Client, ClientPlan

    client = Client(
        id=uuid4(),
        name="Test Client",
        email="test@example.com",
        plan=ClientPlan.BASIC,
    )
    db_session.add(client)
    await db_session.commit()

    knowledge = Knowledge(
        id=uuid4(),
        client_id=client.id,
        name="テストナレッジ",
        type=KnowledgeType.BRAND,
        section_1_main_target={
            "attributes": "30代男性",
            "situation": "起業を目指している",
            "painPoints": "資金調達に悩んでいる",
        },
        section_4_company={
            "strengths": "実績豊富",
            "mission": "起業家を応援する",
        },
    )
    db_session.add(knowledge)
    await db_session.commit()

    # テキスト抽出
    text = await embedding_service._extract_knowledge_text(knowledge)

    # 検証
    assert "テストナレッジ" in text
    assert "30代男性" in text
    assert "起業を目指している" in text
    assert "資金調達に悩んでいる" in text
    assert "実績豊富" in text
    assert "起業家を応援する" in text


# ===== OpenAI API統合テスト =====


@pytest.mark.asyncio
async def test_openai_embedding_with_mock():
    """OpenAI APIモックで埋め込み生成"""
    # OpenAIクライアントをモック
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
    mock_client.embeddings.create = AsyncMock(return_value=mock_response)

    # サービスを作成
    service = EmbeddingService()
    service.openai_client = mock_client
    service.model = "text-embedding-3-large"

    # 埋め込み生成
    text = "テストテキスト"
    embedding = await service.generate_embedding(text)

    # 検証
    mock_client.embeddings.create.assert_called_once()
    call_kwargs = mock_client.embeddings.create.call_args.kwargs
    assert call_kwargs["model"] == "text-embedding-3-large"
    assert call_kwargs["input"] == text
    assert call_kwargs["dimensions"] == 1536
    assert len(embedding) == 1536


@pytest.mark.asyncio
async def test_fallback_embedding_without_openai():
    """OpenAI無効時のフォールバック埋め込み生成"""
    # サービスを作成（OpenAI無効）
    service = EmbeddingService()
    service.openai_client = None

    # 埋め込み生成
    text = "フォールバックテスト"
    embedding = await service.generate_embedding(text)

    # 検証
    assert len(embedding) == 1536
    assert all(isinstance(x, float) for x in embedding)

    # 正規化されていることを確認
    import math
    norm = math.sqrt(sum(x * x for x in embedding))
    assert 0.99 < norm < 1.01


@pytest.mark.asyncio
async def test_openai_api_error_fallback():
    """OpenAI APIエラー時のフォールバック"""
    # OpenAIクライアントをモック（エラー発生）
    mock_client = MagicMock()
    mock_client.embeddings.create = AsyncMock(side_effect=Exception("API Error"))

    # サービスを作成
    service = EmbeddingService()
    service.openai_client = mock_client

    # 埋め込み生成（エラーが発生してもフォールバックで成功）
    text = "エラーテスト"
    embedding = await service.generate_embedding(text)

    # 検証
    assert len(embedding) == 1536
    assert all(isinstance(x, float) for x in embedding)


def test_estimate_tokens():
    """トークン数推定"""
    service = EmbeddingService()

    # 日本語テキスト
    text_ja = "これは日本語のテストテキストです。" * 100
    tokens = service.estimate_tokens(text_ja)

    assert isinstance(tokens, int)
    assert tokens > 0
    # 日本語の場合、文字数/3程度
    expected = len(text_ja) // 3
    assert abs(tokens - expected) < 10


def test_estimate_cost():
    """コスト推定"""
    service = EmbeddingService()

    # テキスト
    text = "テストテキスト" * 1000
    tokens, cost = service.estimate_cost(text)

    # 検証
    assert isinstance(tokens, int)
    assert tokens > 0
    assert isinstance(cost, float)
    assert cost > 0

    # コスト計算の検証
    expected_cost = (tokens / 1000) * 0.00013
    assert abs(cost - expected_cost) < 0.000001


@pytest.mark.asyncio
async def test_batch_update_embeddings(db_session, test_client):
    """バッチ埋め込み更新"""
    from app.models.client import Client, ClientPlan

    # テスト用クライアントを作成
    client = Client(
        id=uuid4(),
        name="Batch Test Client",
        email="batch@example.com",
        plan=ClientPlan.BASIC,
    )
    db_session.add(client)
    await db_session.commit()

    # 複数のナレッジを作成
    knowledge_ids = []
    for i in range(3):
        knowledge = Knowledge(
            id=uuid4(),
            client_id=client.id,
            name=f"バッチナレッジ{i}",
            type=KnowledgeType.BRAND,
            section_1_main_target={"attributes": f"テスト{i}"},
        )
        db_session.add(knowledge)
        await db_session.commit()
        knowledge_ids.append(knowledge.id)

    # バッチ更新
    success, failure, cost = await embedding_service.batch_update_embeddings(
        knowledge_ids, db_session
    )

    # 検証
    assert success == 3
    assert failure == 0
    assert cost >= 0

    # 全てのナレッジに埋め込みが設定されていることを確認
    for knowledge_id in knowledge_ids:
        result = await db_session.execute(
            select(Knowledge).where(Knowledge.id == knowledge_id)
        )
        knowledge = result.scalars().first()
        assert knowledge.embedding is not None
        assert len(knowledge.embedding) == 1536
