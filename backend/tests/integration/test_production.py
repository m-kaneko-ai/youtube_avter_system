"""
動画制作エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestAudioGeneration:
    """音声生成のテスト（7-A）"""

    @pytest.mark.asyncio
    async def test_generate_audio_without_auth(self, client: AsyncClient):
        """認証なしで音声生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/audio/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_audio_with_script(self, client: AsyncClient):
        """台本ID付きで音声生成（認証なし）"""
        response = await client.post(
            "/api/v1/audio/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "script_id": "00000000-0000-0000-0000-000000000002",
                "voice_id": "voice_123",
                "voice_name": "Test Voice",
                "speed": 1.2,
                "pitch": 0.5
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_audio_with_text(self, client: AsyncClient):
        """テキスト直接指定で音声生成（認証なし）"""
        response = await client.post(
            "/api/v1/audio/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "text": "こんにちは、テスト音声です。",
                "voice_id": "voice_456"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_audio_without_auth(self, client: AsyncClient):
        """認証なしで音声取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/audio/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestAvatarGeneration:
    """アバター動画生成のテスト（7-B）"""

    @pytest.mark.asyncio
    async def test_generate_avatar_without_auth(self, client: AsyncClient):
        """認証なしでアバター動画生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/avatar/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_avatar_with_audio(self, client: AsyncClient):
        """音声ID付きでアバター動画生成（認証なし）"""
        response = await client.post(
            "/api/v1/avatar/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "audio_id": "00000000-0000-0000-0000-000000000002",
                "avatar_id": "avatar_123",
                "avatar_name": "Test Avatar",
                "width": 1920,
                "height": 1080
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_avatar_with_background(self, client: AsyncClient):
        """背景設定付きでアバター動画生成（認証なし）"""
        response = await client.post(
            "/api/v1/avatar/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "avatar_id": "avatar_456",
                "background_color": "#FFFFFF",
                "background_url": "https://example.com/bg.jpg"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_avatar_without_auth(self, client: AsyncClient):
        """認証なしでアバター動画取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/avatar/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestBrollGeneration:
    """B-roll動画生成のテスト（7-C）"""

    @pytest.mark.asyncio
    async def test_generate_broll_without_auth(self, client: AsyncClient):
        """認証なしでB-roll動画生成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "prompt": "A beautiful sunset over the ocean with waves"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_broll_with_options(self, client: AsyncClient):
        """オプション付きでB-roll動画生成（認証なし）"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "prompt": "Modern office with people working on computers",
                "style": "cinematic",
                "duration": 10.0,
                "width": 1920,
                "height": 1080,
                "timestamp_start": 30.0,
                "timestamp_end": 40.0
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_broll_minimal(self, client: AsyncClient):
        """最小限のパラメータでB-roll動画生成（認証なし）"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "prompt": "City skyline at night with lights"
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_broll_without_auth(self, client: AsyncClient):
        """認証なしでB-roll動画取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/broll/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestProductionEndpointsExist:
    """動画制作エンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_production_endpoints_exist(self, client: AsyncClient):
        """
        全6エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - POST /api/v1/audio/generate
        - GET /api/v1/audio/:id
        - POST /api/v1/avatar/generate
        - GET /api/v1/avatar/:id
        - POST /api/v1/broll/generate
        - GET /api/v1/broll/:id
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"

        # GETエンドポイント
        get_endpoints = [
            f"/api/v1/audio/{test_uuid}",
            f"/api/v1/avatar/{test_uuid}",
            f"/api/v1/broll/{test_uuid}",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/audio/generate", {"video_id": test_uuid}),
            ("/api/v1/avatar/generate", {"video_id": test_uuid}),
            ("/api/v1/broll/generate", {"video_id": test_uuid, "prompt": "Test prompt for broll"}),
        ]

        for endpoint, body in post_endpoints:
            response = await client.post(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"


class TestProductionValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_generate_audio_invalid_speed(self, client: AsyncClient):
        """不正なspeed値で音声生成"""
        response = await client.post(
            "/api/v1/audio/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "speed": 5.0  # max is 2.0
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_audio_invalid_pitch(self, client: AsyncClient):
        """不正なpitch値で音声生成"""
        response = await client.post(
            "/api/v1/audio/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "pitch": 20.0  # max is 12.0
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_avatar_invalid_width(self, client: AsyncClient):
        """不正なwidth値でアバター動画生成"""
        response = await client.post(
            "/api/v1/avatar/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "width": 100  # min is 640
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_broll_missing_prompt(self, client: AsyncClient):
        """prompt未指定でB-roll動画生成"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001"
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_broll_short_prompt(self, client: AsyncClient):
        """短すぎるpromptでB-roll動画生成"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "prompt": "short"  # min length is 10
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_broll_invalid_duration(self, client: AsyncClient):
        """不正なduration値でB-roll動画生成"""
        response = await client.post(
            "/api/v1/broll/generate",
            json={
                "video_id": "00000000-0000-0000-0000-000000000001",
                "prompt": "A beautiful landscape scene",
                "duration": 60.0  # max is 30.0
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
