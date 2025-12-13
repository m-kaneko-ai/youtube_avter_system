"""
管理エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestSystemSettings:
    """システム設定のテスト"""

    @pytest.mark.asyncio
    async def test_list_settings_without_auth(self, client: AsyncClient):
        """認証なしでシステム設定一覧取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/admin/settings")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_list_settings_with_include_private(self, client: AsyncClient):
        """include_private付きでシステム設定一覧取得（認証なし）"""
        response = await client.get("/api/v1/admin/settings?include_private=true")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_setting_without_auth(self, client: AsyncClient):
        """認証なしでシステム設定取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/admin/settings/test_key")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_setting_without_auth(self, client: AsyncClient):
        """認証なしでシステム設定更新を試みると401/403エラーが返る"""
        response = await client.put(
            "/api/v1/admin/settings/test_key",
            json={"value": "new_value"}
        )
        assert response.status_code in [401, 403]


class TestApiConnections:
    """API連携のテスト"""

    @pytest.mark.asyncio
    async def test_list_connections_without_auth(self, client: AsyncClient):
        """認証なしでAPI連携一覧取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/admin/connections")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_connection_without_auth(self, client: AsyncClient):
        """認証なしでAPI連携作成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/admin/connections",
            json={
                "name": "YouTube API",
                "service": "youtube"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_connection_with_full_data(self, client: AsyncClient):
        """全データ付きでAPI連携作成（認証なし）"""
        response = await client.post(
            "/api/v1/admin/connections",
            json={
                "name": "HeyGen API",
                "service": "heygen",
                "client_id": "00000000-0000-0000-0000-000000000001",
                "credentials": {"api_key": "test_key"},
                "settings": {"timeout": 30, "retry": 3}
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_connection_without_auth(self, client: AsyncClient):
        """認証なしでAPI連携更新を試みると401/403エラーが返る"""
        response = await client.put(
            "/api/v1/admin/connections/00000000-0000-0000-0000-000000000001",
            json={"name": "Updated Connection"}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_test_connection_without_auth(self, client: AsyncClient):
        """認証なしでAPI連携テストを試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/admin/connections/00000000-0000-0000-0000-000000000001/test"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_delete_connection_without_auth(self, client: AsyncClient):
        """認証なしでAPI連携削除を試みると401/403エラーが返る"""
        response = await client.delete(
            "/api/v1/admin/connections/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestAuditLogs:
    """監査ログのテスト"""

    @pytest.mark.asyncio
    async def test_list_audit_logs_without_auth(self, client: AsyncClient):
        """認証なしで監査ログ一覧取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/admin/audit-logs")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_list_audit_logs_with_pagination(self, client: AsyncClient):
        """ページネーション付きで監査ログ一覧取得（認証なし）"""
        response = await client.get("/api/v1/admin/audit-logs?page=2&page_size=25")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_list_audit_logs_with_action_filter(self, client: AsyncClient):
        """アクションフィルター付きで監査ログ一覧取得（認証なし）"""
        response = await client.get("/api/v1/admin/audit-logs?action=create")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_list_audit_logs_with_resource_filter(self, client: AsyncClient):
        """リソースフィルター付きで監査ログ一覧取得（認証なし）"""
        response = await client.get("/api/v1/admin/audit-logs?resource_type=user")
        assert response.status_code in [401, 403]


class TestSystemHealth:
    """システムヘルスのテスト"""

    @pytest.mark.asyncio
    async def test_get_system_health_without_auth(self, client: AsyncClient):
        """認証なしでシステムヘルス取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/admin/health")
        assert response.status_code in [401, 403]


class TestAdminEndpointsExist:
    """管理エンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_admin_endpoints_exist(self, client: AsyncClient):
        """
        全8エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - GET /api/v1/admin/settings
        - GET /api/v1/admin/settings/:key
        - PUT /api/v1/admin/settings/:key
        - GET /api/v1/admin/connections
        - POST /api/v1/admin/connections
        - PUT /api/v1/admin/connections/:id
        - POST /api/v1/admin/connections/:id/test
        - DELETE /api/v1/admin/connections/:id
        - GET /api/v1/admin/audit-logs
        - GET /api/v1/admin/health
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"

        # GETエンドポイント
        get_endpoints = [
            "/api/v1/admin/settings",
            "/api/v1/admin/settings/test_key",
            "/api/v1/admin/connections",
            "/api/v1/admin/audit-logs",
            "/api/v1/admin/health",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # PUTエンドポイント
        put_endpoints = [
            ("/api/v1/admin/settings/test_key", {"value": "test_value"}),
            (f"/api/v1/admin/connections/{test_uuid}", {"name": "Updated"}),
        ]

        for endpoint, body in put_endpoints:
            response = await client.put(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"PUT {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/admin/connections", {"name": "Test", "service": "test"}),
            (f"/api/v1/admin/connections/{test_uuid}/test", None),
        ]

        for endpoint, body in post_endpoints:
            if body:
                response = await client.post(endpoint, json=body)
            else:
                response = await client.post(endpoint)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"

        # DELETEエンドポイント
        response = await client.delete(f"/api/v1/admin/connections/{test_uuid}")
        assert response.status_code in [401, 403], \
            f"DELETE /api/v1/admin/connections/{test_uuid} returned unexpected status: {response.status_code}"


class TestAdminValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_create_connection_missing_name(self, client: AsyncClient):
        """name未指定でAPI連携作成"""
        response = await client.post(
            "/api/v1/admin/connections",
            json={"service": "youtube"}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_create_connection_missing_service(self, client: AsyncClient):
        """service未指定でAPI連携作成"""
        response = await client.post(
            "/api/v1/admin/connections",
            json={"name": "Test Connection"}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_update_setting_missing_value(self, client: AsyncClient):
        """value未指定でシステム設定更新"""
        response = await client.put(
            "/api/v1/admin/settings/test_key",
            json={}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_list_audit_logs_invalid_page(self, client: AsyncClient):
        """無効なpage値で監査ログ一覧取得"""
        response = await client.get("/api/v1/admin/audit-logs?page=0")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_list_audit_logs_page_size_too_large(self, client: AsyncClient):
        """page_sizeが上限超過で監査ログ一覧取得"""
        response = await client.get("/api/v1/admin/audit-logs?page_size=200")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_update_connection_invalid_uuid(self, client: AsyncClient):
        """無効なUUIDでAPI連携更新"""
        response = await client.put(
            "/api/v1/admin/connections/invalid-uuid",
            json={"name": "Updated"}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_delete_connection_invalid_uuid(self, client: AsyncClient):
        """無効なUUIDでAPI連携削除"""
        response = await client.delete("/api/v1/admin/connections/invalid-uuid")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_test_connection_invalid_uuid(self, client: AsyncClient):
        """無効なUUIDでAPI連携テスト"""
        response = await client.post("/api/v1/admin/connections/invalid-uuid/test")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
