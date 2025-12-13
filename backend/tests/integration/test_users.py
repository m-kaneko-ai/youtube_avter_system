"""
ユーザー管理（スライス2-A）の統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する

テスト対象エンドポイント:
- POST /api/v1/users - ユーザー作成
- GET /api/v1/users - ユーザー一覧取得
- GET /api/v1/users/:id - ユーザー詳細取得
- PUT /api/v1/users/:id - ユーザー更新
- DELETE /api/v1/users/:id - ユーザー削除
"""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.core.security import create_access_token


@pytest.fixture
async def owner_token(db_session: AsyncSession) -> str:
    """Ownerロールのテストユーザーとトークンを作成"""
    import uuid
    # Ownerユーザーを作成（ユニークなメールアドレス）
    owner = User(
        email=f"owner-{uuid.uuid4()}@example.com",
        name="Test Owner",
        role=UserRole.OWNER,
    )
    db_session.add(owner)
    await db_session.flush()  # IDを取得するためflush

    # JWTトークンを生成
    token = create_access_token(
        data={"sub": str(owner.id), "role": UserRole.OWNER.value}
    )
    return token


@pytest.fixture
async def team_token(db_session: AsyncSession) -> str:
    """Teamロールのテストユーザーとトークンを作成"""
    import uuid
    # Teamユーザーを作成（ユニークなメールアドレス）
    team = User(
        email=f"team-{uuid.uuid4()}@example.com",
        name="Test Team",
        role=UserRole.TEAM,
    )
    db_session.add(team)
    await db_session.flush()

    # JWTトークンを生成
    token = create_access_token(
        data={"sub": str(team.id), "role": UserRole.TEAM.value}
    )
    return token


@pytest.fixture
async def basic_client_token(db_session: AsyncSession) -> tuple[str, str]:
    """Client Basicロールのテストユーザーとトークンを作成"""
    import uuid
    # Client Basicユーザーを作成（ユニークなメールアドレス）
    client = User(
        email=f"client-{uuid.uuid4()}@example.com",
        name="Test Client",
        role=UserRole.CLIENT_BASIC,
    )
    db_session.add(client)
    await db_session.flush()

    # JWTトークンを生成
    token = create_access_token(
        data={"sub": str(client.id), "role": UserRole.CLIENT_BASIC.value}
    )
    return token, str(client.id)


class TestUserCreation:
    """ユーザー作成のテスト"""

    @pytest.mark.asyncio
    async def test_create_user_as_owner_success(
        self, client: AsyncClient, owner_token: str
    ):
        """
        Ownerとして有効なデータでユーザー作成が成功する

        検証項目:
        - ステータスコードが201
        - 作成されたユーザー情報が返る
        - メールアドレス、名前、ロールが一致する
        """
        import uuid
        email = f"newuser-{uuid.uuid4()}@example.com"

        response = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "New User",
                "role": UserRole.CLIENT_BASIC.value,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == email
        assert data["name"] == "New User"
        assert data["role"] == UserRole.CLIENT_BASIC.value
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_user_as_team_success(
        self, client: AsyncClient, team_token: str
    ):
        """
        Teamとして有効なデータでユーザー作成が成功する

        検証項目:
        - ステータスコードが201
        - 作成されたユーザー情報が返る
        """
        import uuid
        email = f"teamuser-{uuid.uuid4()}@example.com"

        response = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "Team User",
                "role": UserRole.TEAM.value,
            },
            headers={"Authorization": f"Bearer {team_token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == email
        assert data["role"] == UserRole.TEAM.value

    @pytest.mark.asyncio
    async def test_create_user_with_duplicate_email(
        self, client: AsyncClient, owner_token: str
    ):
        """
        重複したメールアドレスでユーザー作成すると400エラーが返る

        検証項目:
        - ステータスコードが400
        - エラーメッセージが適切
        """
        import uuid
        email = f"duplicate-{uuid.uuid4()}@example.com"

        # 1人目を作成
        await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "User 1",
                "role": UserRole.CLIENT_BASIC.value,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        # 同じメールアドレスで2人目を作成しようとする
        response = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "User 2",
                "role": UserRole.CLIENT_BASIC.value,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "メールアドレス" in data["detail"]

    @pytest.mark.asyncio
    async def test_create_user_as_client_forbidden(
        self, client: AsyncClient, basic_client_token: tuple[str, str]
    ):
        """
        Client Basicロールでユーザー作成すると403エラーが返る

        検証項目:
        - ステータスコードが403
        - エラーメッセージが適切
        """
        import uuid
        token, _ = basic_client_token
        email = f"forbidden-{uuid.uuid4()}@example.com"

        response = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "Forbidden User",
                "role": UserRole.CLIENT_BASIC.value,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        data = response.json()
        assert "detail" in data


class TestUserList:
    """ユーザー一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_users_as_owner_success(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        Ownerとしてユーザー一覧取得が成功する

        検証項目:
        - ステータスコードが200
        - ユーザーリストが返る
        - ページネーション情報が正しい
        """
        # テストユーザーを複数作成
        for i in range(5):
            user = User(
                email=f"listuser-{uuid.uuid4()}-{i}@example.com",
                name=f"List User {i}",
                role=UserRole.CLIENT_BASIC,
            )
            db_session.add(user)
        await db_session.flush()

        response = await client.get(
            "/api/v1/users?page=1&limit=10",
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
    async def test_get_users_with_role_filter(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        ロールフィルタが正しく動作する

        検証項目:
        - ステータスコードが200
        - 指定されたロールのユーザーのみが返る
        """
        # 異なるロールのユーザーを作成
        team_user = User(
            email=f"teamfilter-{uuid.uuid4()}@example.com",
            name="Team Filter",
            role=UserRole.TEAM,
        )
        client_user = User(
            email=f"clientfilter-{uuid.uuid4()}@example.com",
            name="Client Filter",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(team_user)
        db_session.add(client_user)
        await db_session.flush()

        # Teamロールでフィルタ
        response = await client.get(
            f"/api/v1/users?role={UserRole.TEAM.value}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        # 全てのユーザーがTeamロール
        for user in data["data"]:
            assert user["role"] == UserRole.TEAM.value

    @pytest.mark.asyncio
    async def test_get_users_as_client_forbidden(
        self, client: AsyncClient, basic_client_token: tuple[str, str]
    ):
        """
        Client Basicロールでユーザー一覧取得すると403エラーが返る

        検証項目:
        - ステータスコードが403
        """
        token, _ = basic_client_token

        response = await client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403


class TestUserDetail:
    """ユーザー詳細取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_user_as_owner_success(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        Ownerとして他のユーザーの詳細取得が成功する

        検証項目:
        - ステータスコードが200
        - ユーザー詳細情報が返る
        """
        # テストユーザーを作成
        target_user = User(
            email=f"detail-{uuid.uuid4()}@example.com",
            name="Detail User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()
        target_email = target_user.email

        response = await client.get(
            f"/api/v1/users/{target_user.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(target_user.id)
        assert data["email"] == target_email
        assert data["name"] == "Detail User"

    @pytest.mark.asyncio
    async def test_get_user_self_as_client_success(
        self, client: AsyncClient, basic_client_token: tuple[str, str]
    ):
        """
        Client Basicロールとして自分自身の詳細取得が成功する

        検証項目:
        - ステータスコードが200
        - 自分のユーザー情報が返る
        """
        token, user_id = basic_client_token

        response = await client.get(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id

    @pytest.mark.asyncio
    async def test_get_user_other_as_client_forbidden(
        self,
        client: AsyncClient,
        basic_client_token: tuple[str, str],
        db_session: AsyncSession,
    ):
        """
        Client Basicロールとして他人の詳細取得すると403エラーが返る

        検証項目:
        - ステータスコードが403
        """
        token, _ = basic_client_token

        # 別のユーザーを作成
        other_user = User(
            email=f"other-{uuid.uuid4()}@example.com",
            name="Other User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(other_user)
        await db_session.flush()

        response = await client.get(
            f"/api/v1/users/{other_user.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_user_not_found(
        self, client: AsyncClient, owner_token: str
    ):
        """
        存在しないユーザーIDで詳細取得すると404エラーが返る

        検証項目:
        - ステータスコードが404
        """
        import uuid

        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/v1/users/{fake_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 404


class TestUserUpdate:
    """ユーザー更新のテスト"""

    @pytest.mark.asyncio
    async def test_update_user_name_as_owner_success(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        Ownerとしてユーザーの名前を更新できる

        検証項目:
        - ステータスコードが200
        - 名前が更新される
        """
        # テストユーザーを作成
        target_user = User(
            email=f"updatename-{uuid.uuid4()}@example.com",
            name="Old Name",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()

        response = await client.put(
            f"/api/v1/users/{target_user.id}",
            json={"name": "New Name"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"

    @pytest.mark.asyncio
    async def test_update_user_role_as_owner_success(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        Ownerとしてユーザーのロールを更新できる

        検証項目:
        - ステータスコードが200
        - ロールが更新される
        """
        # テストユーザーを作成
        target_user = User(
            email=f"updaterole-{uuid.uuid4()}@example.com",
            name="Role User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()

        response = await client.put(
            f"/api/v1/users/{target_user.id}",
            json={"role": UserRole.TEAM.value},
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == UserRole.TEAM.value

    @pytest.mark.asyncio
    async def test_update_user_role_as_team_forbidden(
        self, client: AsyncClient, team_token: str, db_session: AsyncSession
    ):
        """
        Teamロールとしてユーザーのロールを更新すると403エラーが返る

        検証項目:
        - ステータスコードが403
        - ロール変更はOwnerのみ可能
        """
        # テストユーザーを作成
        target_user = User(
            email=f"teamupdate-{uuid.uuid4()}@example.com",
            name="Team Update User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()

        response = await client.put(
            f"/api/v1/users/{target_user.id}",
            json={"role": UserRole.TEAM.value},
            headers={"Authorization": f"Bearer {team_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_user_self_as_client_success(
        self, client: AsyncClient, basic_client_token: tuple[str, str]
    ):
        """
        Client Basicロールとして自分自身の名前を更新できる

        検証項目:
        - ステータスコードが200
        - 名前が更新される
        """
        token, user_id = basic_client_token

        response = await client.put(
            f"/api/v1/users/{user_id}",
            json={"name": "Updated Self Name"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Self Name"


class TestUserDeletion:
    """ユーザー削除のテスト"""

    @pytest.mark.asyncio
    async def test_delete_user_as_owner_success(
        self, client: AsyncClient, owner_token: str, db_session: AsyncSession
    ):
        """
        Ownerとしてユーザー削除が成功する

        検証項目:
        - ステータスコードが200
        - 削除されたユーザー情報が返る
        """
        # テストユーザーを作成
        target_user = User(
            email=f"delete-{uuid.uuid4()}@example.com",
            name="Delete User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()
        user_id = target_user.id

        response = await client.delete(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user_id)

    @pytest.mark.asyncio
    async def test_delete_user_as_team_forbidden(
        self, client: AsyncClient, team_token: str, db_session: AsyncSession
    ):
        """
        Teamロールとしてユーザー削除すると403エラーが返る

        検証項目:
        - ステータスコードが403
        - 削除はOwnerのみ可能
        """
        # テストユーザーを作成
        target_user = User(
            email=f"teamdelete-{uuid.uuid4()}@example.com",
            name="Team Delete User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()

        response = await client.delete(
            f"/api/v1/users/{target_user.id}",
            headers={"Authorization": f"Bearer {team_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_user_as_client_forbidden(
        self,
        client: AsyncClient,
        basic_client_token: tuple[str, str],
        db_session: AsyncSession,
    ):
        """
        Client Basicロールとしてユーザー削除すると403エラーが返る

        検証項目:
        - ステータスコードが403
        """
        token, _ = basic_client_token

        # 別のユーザーを作成
        target_user = User(
            email=f"clientdelete-{uuid.uuid4()}@example.com",
            name="Client Delete User",
            role=UserRole.CLIENT_BASIC,
        )
        db_session.add(target_user)
        await db_session.flush()

        response = await client.delete(
            f"/api/v1/users/{target_user.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
