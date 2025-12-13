"""
認証基盤の統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestHealthAndConfig:
    """ヘルスチェックと設定情報のテスト"""

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """
        ヘルスチェックエンドポイントが正常に動作する

        検証項目:
        - ステータスコードが200
        - レスポンスに status: "ok" が含まれる
        """
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "message" in data

    @pytest.mark.asyncio
    async def test_config_endpoint(self, client: AsyncClient):
        """
        設定情報エンドポイントが正常に動作する

        検証項目:
        - ステータスコードが200
        - 必要な設定項目（version, environment）が含まれる
        """
        response = await client.get("/api/v1/config")

        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "environment" in data


class TestGoogleAuth:
    """Google OAuth認証のテスト"""

    @pytest.mark.asyncio
    async def test_google_auth_with_invalid_token(self, client: AsyncClient):
        """
        無効なGoogle ID tokenで認証を試みると401エラーが返る

        検証項目:
        - ステータスコードが401
        - エラーメッセージが適切
        """
        response = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "invalid_token_string"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_google_auth_with_empty_token(self, client: AsyncClient):
        """
        空のID tokenで認証を試みると422エラーが返る

        検証項目:
        - ステータスコードが422（バリデーションエラー）
        """
        response = await client.post(
            "/api/v1/auth/google",
            json={"id_token": ""}
        )

        assert response.status_code == 422


class TestTokenRefresh:
    """トークンリフレッシュのテスト"""

    @pytest.mark.asyncio
    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        """
        無効なリフレッシュトークンで新しいアクセストークンを取得しようとすると401エラーが返る

        検証項目:
        - ステータスコードが401
        - エラーメッセージが適切
        """
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_refresh_token"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_refresh_with_empty_token(self, client: AsyncClient):
        """
        空のリフレッシュトークンで認証を試みると401エラーが返る

        検証項目:
        - ステータスコードが401（認証エラー）

        Note:
            空文字列は構造的には有効なので422（バリデーションエラー）ではなく、
            トークンとして無効なので401（認証エラー）が返る
        """
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": ""}
        )

        assert response.status_code == 401


class TestLogout:
    """ログアウトのテスト"""

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient):
        """
        ログアウトエンドポイントが正常に動作する

        検証項目:
        - ステータスコードが200
        - 成功メッセージが返る

        Note:
            JWTトークンはステートレスなため、認証なしでログアウトできる仕様
        """
        response = await client.post("/api/v1/auth/logout")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message" in data


class TestCurrentUser:
    """現在のユーザー情報取得のテスト"""

    @pytest.mark.asyncio
    async def test_me_without_token(self, client: AsyncClient):
        """
        トークンなしで現在のユーザー情報を取得しようとすると401エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get("/api/v1/auth/me")

        # 認証なしの場合は401または403
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_me_with_invalid_token(self, client: AsyncClient):
        """
        無効なトークンで現在のユーザー情報を取得しようとすると401エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        # 無効なトークンの場合は401または403
        assert response.status_code in [401, 403]
