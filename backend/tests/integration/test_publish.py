"""
公開・配信エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


class TestYouTubePublish:
    """YouTube公開のテスト"""

    @pytest.mark.asyncio
    async def test_publish_to_youtube_without_auth(self, client: AsyncClient):
        """認証なしでYouTube公開を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/publish/youtube",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画タイトル"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_publish_to_youtube_with_options(self, client: AsyncClient):
        """オプション付きでYouTube公開（認証なし）"""
        response = await client.post(
            "/api/v1/publish/youtube",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画タイトル",
                "description": "これはテスト動画の説明文です",
                "tags": ["テスト", "サンプル", "動画"],
                "category_id": "22",
                "privacy_status": "public"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_publish_to_youtube_scheduled(self, client: AsyncClient):
        """スケジュール付きでYouTube公開（認証なし）"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        response = await client.post(
            "/api/v1/publish/youtube",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "スケジュール公開テスト",
                "privacy_status": "private",
                "scheduled_at": scheduled_time
            }
        )
        assert response.status_code in [401, 403]


class TestTikTokPublish:
    """TikTok公開のテスト"""

    @pytest.mark.asyncio
    async def test_publish_to_tiktok_without_auth(self, client: AsyncClient):
        """認証なしでTikTok公開を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/publish/tiktok",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画 #TikTok"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_publish_to_tiktok_with_options(self, client: AsyncClient):
        """オプション付きでTikTok公開（認証なし）"""
        response = await client.post(
            "/api/v1/publish/tiktok",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "title": "テスト動画 #TikTok #テスト",
                "tags": ["TikTok", "テスト", "動画"],
                "allow_comments": True,
                "allow_duet": False,
                "allow_stitch": True
            }
        )
        assert response.status_code in [401, 403]


class TestInstagramPublish:
    """Instagram公開のテスト"""

    @pytest.mark.asyncio
    async def test_publish_to_instagram_without_auth(self, client: AsyncClient):
        """認証なしでInstagram公開を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/publish/instagram",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "caption": "テスト投稿 #Instagram"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_publish_to_instagram_with_options(self, client: AsyncClient):
        """オプション付きでInstagram公開（認証なし）"""
        response = await client.post(
            "/api/v1/publish/instagram",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "caption": "テスト投稿です #Instagram #テスト #動画",
                "tags": ["Instagram", "テスト", "動画"],
                "location_id": "123456789",
                "share_to_feed": True
            }
        )
        assert response.status_code in [401, 403]


class TestPublicationGet:
    """公開情報取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_publication_without_auth(self, client: AsyncClient):
        """認証なしで公開情報取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/publish/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestPublishSchedule:
    """公開スケジュールのテスト"""

    @pytest.mark.asyncio
    async def test_create_schedule_without_auth(self, client: AsyncClient):
        """認証なしでスケジュール作成を試みると401/403エラーが返る"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        response = await client.post(
            "/api/v1/publish/schedule",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "platforms": ["youtube"],
                "scheduled_at": scheduled_time
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_schedule_multi_platform(self, client: AsyncClient):
        """複数プラットフォームでスケジュール作成（認証なし）"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        response = await client.post(
            "/api/v1/publish/schedule",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "platforms": ["youtube", "tiktok", "instagram"],
                "scheduled_at": scheduled_time,
                "recurrence": "weekly"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_schedule_without_auth(self, client: AsyncClient):
        """認証なしでスケジュール取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/publish/schedule/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestPublishEndpointsExist:
    """公開エンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_publish_endpoints_exist(self, client: AsyncClient):
        """
        全6エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - POST /api/v1/publish/youtube
        - POST /api/v1/publish/tiktok
        - POST /api/v1/publish/instagram
        - GET /api/v1/publish/:id
        - POST /api/v1/publish/schedule
        - GET /api/v1/publish/schedule/:id
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()

        # GETエンドポイント
        get_endpoints = [
            f"/api/v1/publish/{test_uuid}",
            f"/api/v1/publish/schedule/{test_uuid}",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/publish/youtube", {"video_id": test_uuid, "title": "Test"}),
            ("/api/v1/publish/tiktok", {"video_id": test_uuid, "title": "Test"}),
            ("/api/v1/publish/instagram", {"video_id": test_uuid, "caption": "Test"}),
            ("/api/v1/publish/schedule", {
                "video_id": test_uuid,
                "platforms": ["youtube"],
                "scheduled_at": scheduled_time
            }),
        ]

        for endpoint, body in post_endpoints:
            response = await client.post(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"


class TestPublishValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_publish_youtube_missing_title(self, client: AsyncClient):
        """title未指定でYouTube公開"""
        response = await client.post(
            "/api/v1/publish/youtube",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001"
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_publish_tiktok_missing_title(self, client: AsyncClient):
        """title未指定でTikTok公開"""
        response = await client.post(
            "/api/v1/publish/tiktok",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001"
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_publish_instagram_missing_caption(self, client: AsyncClient):
        """caption未指定でInstagram公開"""
        response = await client.post(
            "/api/v1/publish/instagram",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001"
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_create_schedule_missing_platforms(self, client: AsyncClient):
        """platforms未指定でスケジュール作成"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        response = await client.post(
            "/api/v1/publish/schedule",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "scheduled_at": scheduled_time
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_create_schedule_empty_platforms(self, client: AsyncClient):
        """空のplatformsでスケジュール作成"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        response = await client.post(
            "/api/v1/publish/schedule",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "platforms": [],
                "scheduled_at": scheduled_time
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_create_schedule_missing_scheduled_at(self, client: AsyncClient):
        """scheduled_at未指定でスケジュール作成"""
        response = await client.post(
            "/api/v1/publish/schedule",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "platforms": ["youtube"]
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
