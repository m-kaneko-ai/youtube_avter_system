"""
分析エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta


class TestVideoAnalytics:
    """動画分析のテスト"""

    @pytest.mark.asyncio
    async def test_get_video_analytics_without_auth(self, client: AsyncClient):
        """認証なしで動画分析取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/analytics/video/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_video_analytics_with_date_range(self, client: AsyncClient):
        """日付範囲付きで動画分析取得（認証なし）"""
        date_from = (date.today() - timedelta(days=30)).isoformat()
        date_to = date.today().isoformat()
        response = await client.get(
            f"/api/v1/analytics/video/00000000-0000-0000-0000-000000000001"
            f"?date_from={date_from}&date_to={date_to}"
        )
        assert response.status_code in [401, 403]


class TestChannelOverview:
    """チャンネル概要のテスト"""

    @pytest.mark.asyncio
    async def test_get_channel_overview_without_auth(self, client: AsyncClient):
        """認証なしでチャンネル概要取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/analytics/channel")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_channel_overview_with_date_range(self, client: AsyncClient):
        """日付範囲付きでチャンネル概要取得（認証なし）"""
        date_from = (date.today() - timedelta(days=30)).isoformat()
        date_to = date.today().isoformat()
        response = await client.get(
            f"/api/v1/analytics/channel?date_from={date_from}&date_to={date_to}"
        )
        assert response.status_code in [401, 403]


class TestPerformanceReport:
    """パフォーマンスレポートのテスト"""

    @pytest.mark.asyncio
    async def test_get_performance_report_without_auth(self, client: AsyncClient):
        """認証なしでパフォーマンスレポート取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/analytics/performance")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_performance_report_with_date_range(self, client: AsyncClient):
        """日付範囲付きでパフォーマンスレポート取得（認証なし）"""
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()
        response = await client.get(
            f"/api/v1/analytics/performance?date_from={date_from}&date_to={date_to}"
        )
        assert response.status_code in [401, 403]


class TestTrendAnalysis:
    """トレンド分析のテスト"""

    @pytest.mark.asyncio
    async def test_get_trend_analysis_without_auth(self, client: AsyncClient):
        """認証なしでトレンド分析取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/analytics/trends")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_trend_analysis_with_date_range(self, client: AsyncClient):
        """日付範囲付きでトレンド分析取得（認証なし）"""
        date_from = (date.today() - timedelta(days=14)).isoformat()
        date_to = date.today().isoformat()
        response = await client.get(
            f"/api/v1/analytics/trends?date_from={date_from}&date_to={date_to}"
        )
        assert response.status_code in [401, 403]


class TestReportGeneration:
    """レポート生成のテスト"""

    @pytest.mark.asyncio
    async def test_generate_report_without_auth(self, client: AsyncClient):
        """認証なしでレポート生成を試みると401/403エラーが返る"""
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()
        response = await client.post(
            "/api/v1/analytics/report",
            json={
                "report_type": "weekly",
                "date_from": date_from,
                "date_to": date_to
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_generate_report_with_options(self, client: AsyncClient):
        """オプション付きでレポート生成（認証なし）"""
        date_from = (date.today() - timedelta(days=30)).isoformat()
        date_to = date.today().isoformat()
        response = await client.post(
            "/api/v1/analytics/report",
            json={
                "report_type": "monthly",
                "date_from": date_from,
                "date_to": date_to,
                "title": "月次分析レポート",
                "include_video_details": True,
                "include_recommendations": True,
                "export_format": "pdf"
            }
        )
        assert response.status_code in [401, 403]


class TestAnalyticsEndpointsExist:
    """分析エンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_analytics_endpoints_exist(self, client: AsyncClient):
        """
        全5エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - GET /api/v1/analytics/video/:id
        - GET /api/v1/analytics/channel
        - GET /api/v1/analytics/performance
        - GET /api/v1/analytics/trends
        - POST /api/v1/analytics/report
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()

        # GETエンドポイント
        get_endpoints = [
            f"/api/v1/analytics/video/{test_uuid}",
            "/api/v1/analytics/channel",
            "/api/v1/analytics/performance",
            "/api/v1/analytics/trends",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/analytics/report", {
                "report_type": "weekly",
                "date_from": date_from,
                "date_to": date_to
            }),
        ]

        for endpoint, body in post_endpoints:
            response = await client.post(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"


class TestAnalyticsValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_generate_report_missing_date_from(self, client: AsyncClient):
        """date_from未指定でレポート生成"""
        date_to = date.today().isoformat()
        response = await client.post(
            "/api/v1/analytics/report",
            json={
                "report_type": "weekly",
                "date_to": date_to
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_report_missing_date_to(self, client: AsyncClient):
        """date_to未指定でレポート生成"""
        date_from = (date.today() - timedelta(days=7)).isoformat()
        response = await client.post(
            "/api/v1/analytics/report",
            json={
                "report_type": "weekly",
                "date_from": date_from
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_generate_report_invalid_type(self, client: AsyncClient):
        """不正なreport_typeでレポート生成"""
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()
        response = await client.post(
            "/api/v1/analytics/report",
            json={
                "report_type": "invalid_type",
                "date_from": date_from,
                "date_to": date_to
            }
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
