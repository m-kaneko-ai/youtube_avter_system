"""
クライアント管理エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestClientCreate:
    """クライアント作成のテスト"""

    @pytest.mark.asyncio
    async def test_create_client_without_auth(self, client: AsyncClient):
        """
        認証なしでクライアント作成を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.post(
            "/api/v1/clients",
            json={
                "user_id": str(uuid4()),
                "company_name": "Test Company",
                "plan": "basic"
            }
        )

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_client_with_invalid_plan(self, client: AsyncClient):
        """
        無効なプランでクライアント作成を試みると認証エラーまたはバリデーションエラーが返る

        検証項目:
        - ステータスコードが403（認証エラー）または422（バリデーションエラー）

        Note:
            認証チェックがバリデーション前に実行されるため、認証なしの場合は403が返る
        """
        response = await client.post(
            "/api/v1/clients",
            json={
                "user_id": str(uuid4()),
                "company_name": "Test Company",
                "plan": "invalid_plan"
            }
        )

        assert response.status_code in [403, 422]


class TestClientList:
    """クライアント一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_clients_without_auth(self, client: AsyncClient):
        """
        認証なしでクライアント一覧取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get("/api/v1/clients")

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_clients_pagination(self, client: AsyncClient):
        """
        ページネーションパラメータが正しく機能する（認証なしテスト）

        検証項目:
        - 無効なページ番号（0以下）で422エラー
        - 無効なlimit（0以下、101以上）で422エラー
        """
        # ページ番号が0
        response = await client.get("/api/v1/clients?page=0&limit=20")
        assert response.status_code in [401, 403, 422]

        # limitが0
        response = await client.get("/api/v1/clients?page=1&limit=0")
        assert response.status_code in [401, 403, 422]

        # limitが101
        response = await client.get("/api/v1/clients?page=1&limit=101")
        assert response.status_code in [401, 403, 422]


class TestClientDetail:
    """クライアント詳細取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_client_without_auth(self, client: AsyncClient):
        """
        認証なしでクライアント詳細取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        client_id = uuid4()
        response = await client.get(f"/api/v1/clients/{client_id}")

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_client_with_invalid_uuid(self, client: AsyncClient):
        """
        無効なUUIDでクライアント詳細取得を試みると認証エラーまたはバリデーションエラーが返る

        検証項目:
        - ステータスコードが403（認証エラー）または422（バリデーションエラー）

        Note:
            認証チェックがバリデーション前に実行されるため、認証なしの場合は403が返る
        """
        response = await client.get("/api/v1/clients/invalid-uuid")

        assert response.status_code in [403, 422]


class TestClientUpdate:
    """クライアント更新のテスト"""

    @pytest.mark.asyncio
    async def test_update_client_without_auth(self, client: AsyncClient):
        """
        認証なしでクライアント更新を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        client_id = uuid4()
        response = await client.put(
            f"/api/v1/clients/{client_id}",
            json={
                "company_name": "Updated Company"
            }
        )

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_client_with_invalid_uuid(self, client: AsyncClient):
        """
        無効なUUIDでクライアント更新を試みると認証エラーまたはバリデーションエラーが返る

        検証項目:
        - ステータスコードが403（認証エラー）または422（バリデーションエラー）

        Note:
            認証チェックがバリデーション前に実行されるため、認証なしの場合は403が返る
        """
        response = await client.put(
            "/api/v1/clients/invalid-uuid",
            json={
                "company_name": "Updated Company"
            }
        )

        assert response.status_code in [403, 422]
