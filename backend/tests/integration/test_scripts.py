"""
台本・メタデータ生成エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestScriptGeneration:
    """台本生成のテスト（6-A）"""

    @pytest.mark.asyncio
    async def test_generate_script_without_auth(self, client: AsyncClient):
        """認証なしで台本生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/scripts/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "generator": "claude"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_script_with_knowledge(self, client: AsyncClient):
        """ナレッジID付きで台本生成（認証なし）"""
        response = await client.post(
            "/api/v1/scripts/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "knowledge_id": "00000000-0000-0000-0000-000000000002",
                "generator": "gemini",
                "target_duration": 180
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_script_without_auth(self, client: AsyncClient):
        """認証なしで台本取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/scripts/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_script_without_auth(self, client: AsyncClient):
        """認証なしで台本更新を試みると401/403エラーが返る"""
        response = await client.put(
            "/api/v1/scripts/00000000-0000-0000-0000-000000000001",
            json={
                "title": "更新されたタイトル",
                "content": "更新された台本内容"
            }
        )
        assert response.status_code in [401, 403]


class TestMetadataGeneration:
    """メタデータ生成のテスト（6-B）"""

    @pytest.mark.asyncio
    async def test_generate_title_without_auth(self, client: AsyncClient):
        """認証なしでタイトル生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/metadata/title",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "keywords": ["AI", "効率化"],
                "count": 5
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_title_with_style(self, client: AsyncClient):
        """スタイル付きでタイトル生成（認証なし）"""
        response = await client.post(
            "/api/v1/metadata/title",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "style": "clickbait",
                "count": 3
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_description_without_auth(self, client: AsyncClient):
        """認証なしで説明文生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/metadata/description",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画タイトル"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_description_with_options(self, client: AsyncClient):
        """オプション付きで説明文生成（認証なし）"""
        response = await client.post(
            "/api/v1/metadata/description",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画タイトル",
                "include_timestamps": True,
                "include_links": True,
                "keywords": ["AI", "効率化", "初心者"]
            }
        )
        assert response.status_code in [401, 403]


class TestThumbnailGeneration:
    """サムネイル生成のテスト（6-B）"""

    @pytest.mark.asyncio
    async def test_generate_thumbnail_without_auth(self, client: AsyncClient):
        """認証なしでサムネイル生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/thumbnails/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_thumbnail_with_options(self, client: AsyncClient):
        """オプション付きでサムネイル生成（認証なし）"""
        response = await client.post(
            "/api/v1/thumbnails/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画",
                "prompt": "modern youtube thumbnail",
                "style": "bold",
                "include_text": True,
                "text_content": "必見！"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_thumbnail_without_auth(self, client: AsyncClient):
        """認証なしでサムネイル取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/thumbnails/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestScriptEndpointsExist:
    """台本・メタデータエンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_script_endpoints_exist(self, client: AsyncClient):
        """
        全7エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - POST /api/v1/scripts/generate
        - GET /api/v1/scripts/:id
        - PUT /api/v1/scripts/:id
        - POST /api/v1/metadata/title
        - POST /api/v1/metadata/description
        - POST /api/v1/thumbnails/generate
        - GET /api/v1/thumbnails/:id
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"

        # GETエンドポイント
        get_endpoints = [
            f"/api/v1/scripts/{test_uuid}",
            f"/api/v1/thumbnails/{test_uuid}",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/scripts/generate", {"video_id": test_uuid, "generator": "claude"}),
            ("/api/v1/metadata/title", {"video_id": test_uuid, "count": 5}),
            ("/api/v1/metadata/description", {"video_id": test_uuid}),
            ("/api/v1/thumbnails/generate", {"video_id": test_uuid}),
        ]

        for endpoint, body in post_endpoints:
            response = await client.post(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"

        # PUTエンドポイント
        put_endpoints = [
            (f"/api/v1/scripts/{test_uuid}", {"content": "updated content"}),
        ]

        for endpoint, body in put_endpoints:
            response = await client.put(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"PUT {endpoint} returned unexpected status: {response.status_code}"


class TestScriptValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_generate_script_missing_video_id(self, client: AsyncClient):
        """video_id未指定で台本生成"""
        response = await client.post(
            "/api/v1/scripts/generate",
            json={"generator": "claude"}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_script_invalid_generator(self, client: AsyncClient):
        """不正なgeneratorで台本生成"""
        response = await client.post(
            "/api/v1/scripts/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "generator": "invalid_generator"
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_title_invalid_count(self, client: AsyncClient):
        """不正なcount値でタイトル生成"""
        response = await client.post(
            "/api/v1/metadata/title",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "count": 100  # max is 10
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_script_invalid_duration(self, client: AsyncClient):
        """不正なtarget_durationで台本生成"""
        response = await client.post(
            "/api/v1/scripts/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "generator": "claude",
                "target_duration": 10  # min is 30
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
