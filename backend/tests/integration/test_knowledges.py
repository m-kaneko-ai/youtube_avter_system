"""
ナレッジ管理（スライス3-A）の統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する

テスト対象エンドポイント:
- POST /api/v1/knowledges - ナレッジ作成
- GET /api/v1/knowledges - ナレッジ一覧取得
- GET /api/v1/knowledges/:id - ナレッジ詳細取得
- PUT /api/v1/knowledges/:id - ナレッジ更新
- GET /api/v1/knowledges/:id/chat - チャットセッション取得
- POST /api/v1/knowledges/:id/chat - チャットメッセージ送信
"""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.client import Client, ClientPlan
from app.models.knowledge import Knowledge, KnowledgeType
from app.core.security import create_access_token


@pytest.fixture
async def owner_token(db_session: AsyncSession) -> str:
    """Ownerロールのテストユーザーとトークンを作成"""
    owner = User(
        email=f"owner-{uuid.uuid4()}@example.com",
        name="Test Owner",
        role=UserRole.OWNER,
    )
    db_session.add(owner)
    await db_session.flush()

    token = create_access_token(
        data={"sub": str(owner.id), "role": UserRole.OWNER.value}
    )
    return token


@pytest.fixture
async def team_token(db_session: AsyncSession) -> str:
    """Teamロールのテストユーザーとトークンを作成"""
    team = User(
        email=f"team-{uuid.uuid4()}@example.com",
        name="Test Team",
        role=UserRole.TEAM,
    )
    db_session.add(team)
    await db_session.flush()

    token = create_access_token(
        data={"sub": str(team.id), "role": UserRole.TEAM.value}
    )
    return token


@pytest.fixture
async def test_client(db_session: AsyncSession) -> Client:
    """テスト用クライアントを作成"""
    owner = User(
        email=f"clientowner-{uuid.uuid4()}@example.com",
        name="Client Owner",
        role=UserRole.OWNER,
    )
    db_session.add(owner)
    await db_session.flush()

    client = Client(
        user_id=owner.id,
        company_name=f"Test Company {uuid.uuid4()}",
        plan=ClientPlan.PREMIUM,
        knowledge_count=0,
    )
    db_session.add(client)
    await db_session.flush()
    return client


class TestKnowledgeCreation:
    """ナレッジ作成のテスト"""

    @pytest.mark.asyncio
    async def test_create_knowledge_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client
    ):
        """
        Ownerとして有効なデータでナレッジ作成が成功する

        検証項目:
        - ステータスコードが201
        - 作成されたナレッジ情報が返る
        - 名前、タイプ、クライアントIDが一致する
        """
        response = await client.post(
            "/api/v1/knowledges",
            json={
                "name": "Test Knowledge",
                "type": KnowledgeType.BRAND.value,
                "client_id": str(test_client.id),
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Knowledge"
        assert data["type"] == KnowledgeType.BRAND.value
        assert data["client_id"] == str(test_client.id)
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_knowledge_as_team_success(
        self, client: AsyncClient, team_token: str, test_client: Client
    ):
        """
        Teamとして有効なデータでナレッジ作成が成功する

        検証項目:
        - ステータスコードが201
        - 作成されたナレッジ情報が返る
        """
        response = await client.post(
            "/api/v1/knowledges",
            json={
                "name": "Team Knowledge",
                "type": KnowledgeType.CONTENT_SERIES.value,
                "client_id": str(test_client.id),
            },
            headers={"Authorization": f"Bearer {team_token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Team Knowledge"
        assert data["type"] == KnowledgeType.CONTENT_SERIES.value

    @pytest.mark.asyncio
    async def test_create_knowledge_with_invalid_client(
        self, client: AsyncClient, owner_token: str
    ):
        """
        存在しないクライアントIDでナレッジ作成すると404エラーが返る

        検証項目:
        - ステータスコードが404
        - エラーメッセージが適切
        """
        fake_client_id = uuid.uuid4()

        response = await client.post(
            "/api/v1/knowledges",
            json={
                "name": "Invalid Knowledge",
                "type": KnowledgeType.BRAND.value,
                "client_id": str(fake_client_id),
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "クライアント" in data["detail"]


class TestKnowledgeList:
    """ナレッジ一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_knowledges_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてナレッジ一覧取得が成功する

        検証項目:
        - ステータスコードが200
        - ナレッジリストが返る
        - ページネーション情報が正しい
        """
        # テストナレッジを複数作成
        for i in range(5):
            knowledge = Knowledge(
                client_id=test_client.id,
                name=f"List Knowledge {i}",
                type=KnowledgeType.BRAND,
            )
            db_session.add(knowledge)
        await db_session.flush()

        response = await client.get(
            "/api/v1/knowledges?page=1&limit=10",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert len(data["data"]) > 0

    @pytest.mark.asyncio
    async def test_get_knowledges_with_client_filter(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        クライアントIDフィルタが正しく動作する

        検証項目:
        - ステータスコードが200
        - 指定されたクライアントのナレッジのみが返る
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Filtered Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        response = await client.get(
            f"/api/v1/knowledges?client_id={test_client.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        # 全てのナレッジが指定されたクライアントのもの
        for knowledge in data["data"]:
            assert knowledge["client_id"] == str(test_client.id)


class TestKnowledgeDetail:
    """ナレッジ詳細取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_knowledge_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてナレッジ詳細取得が成功する

        検証項目:
        - ステータスコードが200
        - ナレッジ詳細情報が返る
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Detail Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        response = await client.get(
            f"/api/v1/knowledges/{knowledge.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(knowledge.id)
        assert data["name"] == "Detail Knowledge"

    @pytest.mark.asyncio
    async def test_get_knowledge_not_found(
        self, client: AsyncClient, owner_token: str
    ):
        """
        存在しないナレッジIDで詳細取得すると404エラーが返る

        検証項目:
        - ステータスコードが404
        """
        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/v1/knowledges/{fake_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 404


class TestKnowledgeUpdate:
    """ナレッジ更新のテスト"""

    @pytest.mark.asyncio
    async def test_update_knowledge_name_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてナレッジの名前を更新できる

        検証項目:
        - ステータスコードが200
        - 名前が更新される
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Old Name",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        response = await client.put(
            f"/api/v1/knowledges/{knowledge.id}",
            json={"name": "New Name"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"

    @pytest.mark.asyncio
    async def test_update_knowledge_section_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてナレッジのセクションを更新できる

        検証項目:
        - ステータスコードが200
        - セクションデータが更新される
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Section Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        section_data = {
            "target": "30代ビジネスパーソン",
            "pain_point": "時間管理に課題",
        }

        response = await client.put(
            f"/api/v1/knowledges/{knowledge.id}",
            json={"section_1_main_target": section_data},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["section_1_main_target"] == section_data


class TestChatSession:
    """チャットセッションのテスト"""

    @pytest.mark.asyncio
    async def test_get_chat_session_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてチャットセッション取得が成功する（存在しない場合は作成）

        検証項目:
        - ステータスコードが200
        - チャットセッション情報が返る
        - 初期状態が正しい
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Chat Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        response = await client.get(
            f"/api/v1/knowledges/{knowledge.id}/chat",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["knowledge_id"] == str(knowledge.id)
        assert data["current_step"] == 1
        assert data["status"] == "in_progress"
        assert isinstance(data["messages"], list)

    @pytest.mark.asyncio
    async def test_send_chat_message_as_owner_success(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        Ownerとしてチャットメッセージ送信が成功する

        検証項目:
        - ステータスコードが200
        - メッセージが追加される
        - AI応答が返る
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="Message Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        # メッセージ送信
        response = await client.post(
            f"/api/v1/knowledges/{knowledge.id}/chat",
            json={"content": "ターゲットは30代のビジネスパーソンです"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) >= 2  # ユーザーメッセージ + AI応答

        # 最後のメッセージがAI応答
        last_message = data["messages"][-1]
        assert last_message["role"] == "assistant"
        assert len(last_message["content"]) > 0

    @pytest.mark.asyncio
    async def test_chat_session_preserves_history(
        self, client: AsyncClient, owner_token: str, test_client: Client, db_session: AsyncSession
    ):
        """
        チャットセッションの履歴が保持される

        検証項目:
        - 複数回のメッセージ送信で履歴が蓄積される
        """
        # テストナレッジを作成
        knowledge = Knowledge(
            client_id=test_client.id,
            name="History Knowledge",
            type=KnowledgeType.BRAND,
        )
        db_session.add(knowledge)
        await db_session.flush()

        # 1回目のメッセージ送信
        await client.post(
            f"/api/v1/knowledges/{knowledge.id}/chat",
            json={"content": "最初のメッセージ"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        # 2回目のメッセージ送信
        response = await client.post(
            f"/api/v1/knowledges/{knowledge.id}/chat",
            json={"content": "2番目のメッセージ"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        # 2回の送信 × 2（ユーザー + AI）= 4メッセージ
        assert len(data["messages"]) >= 4
