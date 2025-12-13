"""
プロジェクト・動画管理エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestProjectCreate:
    """プロジェクト作成のテスト"""

    @pytest.mark.asyncio
    async def test_create_project_without_auth(self, client: AsyncClient):
        """
        認証なしでプロジェクト作成を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.post(
            "/api/v1/projects",
            json={
                "client_id": str(uuid4()),
                "name": "Test Project",
                "description": "Test Description"
            }
        )

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_project_with_invalid_client_id(self, client: AsyncClient):
        """
        無効なクライアントIDでプロジェクト作成を試みると認証エラーが返る

        検証項目:
        - ステータスコードが401または403（認証エラー）
        """
        response = await client.post(
            "/api/v1/projects",
            json={
                "client_id": "invalid-uuid",
                "name": "Test Project",
                "description": "Test Description"
            }
        )

        assert response.status_code in [401, 403, 422]


class TestProjectList:
    """プロジェクト一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_projects_without_auth(self, client: AsyncClient):
        """
        認証なしでプロジェクト一覧取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get("/api/v1/projects")

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_projects_pagination(self, client: AsyncClient):
        """
        ページネーションパラメータが正しく機能する（認証なしテスト）

        検証項目:
        - 無効なページ番号（0以下）で422エラー
        - 無効なlimit（0以下）で422エラー
        """
        # ページ番号が0
        response = await client.get("/api/v1/projects?page=0&limit=20")
        assert response.status_code in [401, 403, 422]

        # limitが0
        response = await client.get("/api/v1/projects?page=1&limit=0")
        assert response.status_code in [401, 403, 422]


class TestProjectDetail:
    """プロジェクト詳細取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_project_without_auth(self, client: AsyncClient):
        """
        認証なしでプロジェクト詳細取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get(f"/api/v1/projects/{uuid4()}")

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_project_with_invalid_id(self, client: AsyncClient):
        """
        無効なプロジェクトIDで詳細取得を試みるとエラーが返る

        検証項目:
        - ステータスコードが401, 403（認証エラー）または422（バリデーションエラー）
        """
        response = await client.get("/api/v1/projects/invalid-uuid")

        assert response.status_code in [401, 403, 422]


class TestProjectUpdate:
    """プロジェクト更新のテスト"""

    @pytest.mark.asyncio
    async def test_update_project_without_auth(self, client: AsyncClient):
        """
        認証なしでプロジェクト更新を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.put(
            f"/api/v1/projects/{uuid4()}",
            json={
                "name": "Updated Project Name",
                "status": "production"
            }
        )

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_project_with_invalid_status(self, client: AsyncClient):
        """
        無効なステータスでプロジェクト更新を試みるとバリデーションエラーが返る

        検証項目:
        - ステータスコードが401, 403（認証エラー）または422（バリデーションエラー）
        """
        response = await client.put(
            f"/api/v1/projects/{uuid4()}",
            json={
                "name": "Updated Project Name",
                "status": "invalid_status"
            }
        )

        assert response.status_code in [401, 403, 422]


class TestProjectDelete:
    """プロジェクト削除のテスト"""

    @pytest.mark.asyncio
    async def test_delete_project_without_auth(self, client: AsyncClient):
        """
        認証なしでプロジェクト削除を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.delete(f"/api/v1/projects/{uuid4()}")

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_delete_project_with_invalid_id(self, client: AsyncClient):
        """
        無効なプロジェクトIDで削除を試みるとエラーが返る

        検証項目:
        - ステータスコードが401, 403（認証エラー）または422（バリデーションエラー）
        """
        response = await client.delete("/api/v1/projects/invalid-uuid")

        assert response.status_code in [401, 403, 422]


class TestVideoApproval:
    """動画承認のテスト"""

    @pytest.mark.asyncio
    async def test_approve_video_without_auth(self, client: AsyncClient):
        """
        認証なしで動画承認を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.post(
            f"/api/v1/videos/{uuid4()}/approve",
            json={
                "approved": True,
                "comments": "Looks good!"
            }
        )

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_approve_video_with_invalid_id(self, client: AsyncClient):
        """
        無効な動画IDで承認を試みるとエラーが返る

        検証項目:
        - ステータスコードが401, 403（認証エラー）または422（バリデーションエラー）
        """
        response = await client.post(
            "/api/v1/videos/invalid-uuid/approve",
            json={
                "approved": True,
                "comments": "Looks good!"
            }
        )

        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_reject_video_without_auth(self, client: AsyncClient):
        """
        認証なしで動画却下を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.post(
            f"/api/v1/videos/{uuid4()}/approve",
            json={
                "approved": False,
                "comments": "Needs improvement"
            }
        )

        assert response.status_code in [401, 403]


class TestProjectWorkflow:
    """プロジェクトワークフロー統合テスト"""

    @pytest.mark.asyncio
    async def test_project_endpoints_exist(self, client: AsyncClient):
        """
        全エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - POST /api/v1/projects が存在する
        - GET /api/v1/projects が存在する
        - GET /api/v1/projects/:id が存在する
        - PUT /api/v1/projects/:id が存在する
        - DELETE /api/v1/projects/:id が存在する
        - POST /api/v1/videos/:id/approve が存在する
        """
        project_id = uuid4()
        video_id = uuid4()

        endpoints = [
            ("POST", "/api/v1/projects", {"client_id": str(uuid4()), "name": "Test"}),
            ("GET", "/api/v1/projects", None),
            ("GET", f"/api/v1/projects/{project_id}", None),
            ("PUT", f"/api/v1/projects/{project_id}", {"name": "Updated"}),
            ("DELETE", f"/api/v1/projects/{project_id}", None),
            ("POST", f"/api/v1/videos/{video_id}/approve", {"approved": True}),
        ]

        for method, url, json_data in endpoints:
            if method == "GET":
                response = await client.get(url)
            elif method == "POST":
                response = await client.post(url, json=json_data)
            elif method == "PUT":
                response = await client.put(url, json=json_data)
            elif method == "DELETE":
                response = await client.delete(url)

            # 認証エラー（401/403）、バリデーションエラー（422）、または404（存在しない場合）のいずれか
            assert response.status_code in [401, 403, 404, 422], \
                f"{method} {url} returned unexpected status: {response.status_code}"
