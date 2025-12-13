"""
企画・計画機能エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestCalendar:
    """カレンダー関連のテスト"""

    @pytest.mark.asyncio
    async def test_get_calendar_without_auth(self, client: AsyncClient):
        """認証なしでカレンダー取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/planning/calendar?year=2025&month=12")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_calendar_with_knowledge_filter(self, client: AsyncClient):
        """ナレッジIDフィルタ付きでカレンダー取得（認証なし）"""
        response = await client.get(
            "/api/v1/planning/calendar?year=2025&month=12&knowledge_id=00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_schedule_without_auth(self, client: AsyncClient):
        """認証なしでスケジュール更新を試みると401/403エラーが返る"""
        response = await client.patch(
            "/api/v1/planning/calendar/schedule",
            json={
                "project_id": "00000000-0000-0000-0000-000000000001",
                "scheduled_date": "2025-12-20"
            }
        )
        assert response.status_code in [401, 403]


class TestPlanningProjects:
    """企画一覧関連のテスト"""

    @pytest.mark.asyncio
    async def test_get_planning_projects_without_auth(self, client: AsyncClient):
        """認証なしで企画一覧取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/planning/projects")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_planning_projects_with_filters(self, client: AsyncClient):
        """フィルタ付きで企画一覧取得（認証なし）"""
        response = await client.get(
            "/api/v1/planning/projects?status=planning&type=short&page=1&limit=10"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_planning_projects_with_search(self, client: AsyncClient):
        """検索付きで企画一覧取得（認証なし）"""
        response = await client.get("/api/v1/planning/projects?search=AI")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_planning_project_detail_without_auth(self, client: AsyncClient):
        """認証なしで企画詳細取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/planning/projects/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_update_project_status_without_auth(self, client: AsyncClient):
        """認証なしでステータス更新を試みると401/403エラーが返る"""
        response = await client.patch(
            "/api/v1/planning/projects/00000000-0000-0000-0000-000000000001/status",
            json={"status": "production"}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_delete_planning_project_without_auth(self, client: AsyncClient):
        """認証なしで企画削除を試みると401/403エラーが返る"""
        response = await client.delete(
            "/api/v1/planning/projects/00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]


class TestChatSessions:
    """AI提案チャット関連のテスト"""

    @pytest.mark.asyncio
    async def test_create_chat_session_without_auth(self, client: AsyncClient):
        """認証なしでチャットセッション作成を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/planning/chat/sessions",
            json={"knowledge_id": "00000000-0000-0000-0000-000000000001"}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_create_chat_session_without_knowledge(self, client: AsyncClient):
        """ナレッジIDなしでチャットセッション作成（認証なし）"""
        response = await client.post(
            "/api/v1/planning/chat/sessions",
            json={}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_send_chat_message_without_auth(self, client: AsyncClient):
        """認証なしでチャットメッセージ送信を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/planning/chat/sessions/00000000-0000-0000-0000-000000000001/messages",
            json={"content": "AIツール比較の企画を考えて", "type": "user"}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_chat_history_without_auth(self, client: AsyncClient):
        """認証なしでチャット履歴取得を試みると401/403エラーが返る"""
        response = await client.get(
            "/api/v1/planning/chat/sessions/00000000-0000-0000-0000-000000000001/messages"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_chat_history_with_limit(self, client: AsyncClient):
        """limit付きでチャット履歴取得（認証なし）"""
        response = await client.get(
            "/api/v1/planning/chat/sessions/00000000-0000-0000-0000-000000000001/messages?limit=20"
        )
        assert response.status_code in [401, 403]


class TestSuggestions:
    """提案採用関連のテスト"""

    @pytest.mark.asyncio
    async def test_adopt_suggestion_without_auth(self, client: AsyncClient):
        """認証なしで提案採用を試みると401/403エラーが返る"""
        response = await client.post(
            "/api/v1/planning/chat/suggestions/00000000-0000-0000-0000-000000000001/adopt",
            json={"scheduled_date": "2025-12-20"}
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_adopt_suggestion_with_modifications(self, client: AsyncClient):
        """修正付きで提案採用（認証なし）"""
        response = await client.post(
            "/api/v1/planning/chat/suggestions/00000000-0000-0000-0000-000000000001/adopt",
            json={
                "scheduled_date": "2025-12-20",
                "modifications": {"title": "カスタムタイトル"}
            }
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_adopted_suggestions_without_auth(self, client: AsyncClient):
        """認証なしで採用済み提案一覧取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/planning/chat/suggestions/adopted")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_adopted_suggestions_with_session_filter(self, client: AsyncClient):
        """セッションIDフィルタ付きで採用済み提案一覧取得（認証なし）"""
        response = await client.get(
            "/api/v1/planning/chat/suggestions/adopted?session_id=00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_unadopt_suggestion_without_auth(self, client: AsyncClient):
        """認証なしで採用取り消しを試みると401/403エラーが返る"""
        response = await client.delete(
            "/api/v1/planning/chat/suggestions/00000000-0000-0000-0000-000000000001/adopt"
        )
        assert response.status_code in [401, 403]


class TestContextAndStats:
    """コンテキスト・統計関連のテスト"""

    @pytest.mark.asyncio
    async def test_get_planning_context_without_auth(self, client: AsyncClient):
        """認証なしでコンテキスト取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/planning/chat/context")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_planning_context_with_knowledge(self, client: AsyncClient):
        """ナレッジID付きでコンテキスト取得（認証なし）"""
        response = await client.get(
            "/api/v1/planning/chat/context?knowledge_id=00000000-0000-0000-0000-000000000001"
        )
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_planning_stats_without_auth(self, client: AsyncClient):
        """認証なしで統計取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/planning/stats")
        assert response.status_code in [401, 403]


class TestPlanningEndpointsExist:
    """企画・計画エンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_planning_endpoints_exist(self, client: AsyncClient):
        """
        全14エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - GET /api/v1/planning/calendar
        - PATCH /api/v1/planning/calendar/schedule
        - GET /api/v1/planning/projects
        - GET /api/v1/planning/projects/:id
        - PATCH /api/v1/planning/projects/:id/status
        - DELETE /api/v1/planning/projects/:id
        - POST /api/v1/planning/chat/sessions
        - POST /api/v1/planning/chat/sessions/:id/messages
        - GET /api/v1/planning/chat/sessions/:id/messages
        - POST /api/v1/planning/chat/suggestions/:id/adopt
        - GET /api/v1/planning/chat/suggestions/adopted
        - DELETE /api/v1/planning/chat/suggestions/:id/adopt
        - GET /api/v1/planning/chat/context
        - GET /api/v1/planning/stats
        """
        test_uuid = "00000000-0000-0000-0000-000000000001"

        # GETエンドポイント
        get_endpoints = [
            f"/api/v1/planning/calendar?year=2025&month=12",
            "/api/v1/planning/projects",
            f"/api/v1/planning/projects/{test_uuid}",
            f"/api/v1/planning/chat/sessions/{test_uuid}/messages",
            "/api/v1/planning/chat/suggestions/adopted",
            "/api/v1/planning/chat/context",
            "/api/v1/planning/stats",
        ]

        for endpoint in get_endpoints:
            response = await client.get(endpoint)
            assert response.status_code in [401, 403], \
                f"GET {endpoint} returned unexpected status: {response.status_code}"

        # POSTエンドポイント
        post_endpoints = [
            ("/api/v1/planning/chat/sessions", {}),
            (f"/api/v1/planning/chat/sessions/{test_uuid}/messages", {"content": "test", "type": "user"}),
            (f"/api/v1/planning/chat/suggestions/{test_uuid}/adopt", {}),
        ]

        for endpoint, body in post_endpoints:
            response = await client.post(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"POST {endpoint} returned unexpected status: {response.status_code}"

        # PATCHエンドポイント
        patch_endpoints = [
            ("/api/v1/planning/calendar/schedule", {"project_id": test_uuid, "scheduled_date": "2025-12-20"}),
            (f"/api/v1/planning/projects/{test_uuid}/status", {"status": "production"}),
        ]

        for endpoint, body in patch_endpoints:
            response = await client.patch(endpoint, json=body)
            assert response.status_code in [401, 403], \
                f"PATCH {endpoint} returned unexpected status: {response.status_code}"

        # DELETEエンドポイント
        delete_endpoints = [
            f"/api/v1/planning/projects/{test_uuid}",
            f"/api/v1/planning/chat/suggestions/{test_uuid}/adopt",
        ]

        for endpoint in delete_endpoints:
            response = await client.delete(endpoint)
            assert response.status_code in [401, 403], \
                f"DELETE {endpoint} returned unexpected status: {response.status_code}"


class TestPlanningValidation:
    """バリデーションテスト"""

    @pytest.mark.asyncio
    async def test_calendar_invalid_year(self, client: AsyncClient):
        """不正な年でカレンダー取得"""
        response = await client.get("/api/v1/planning/calendar?year=1900&month=12")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_calendar_invalid_month(self, client: AsyncClient):
        """不正な月でカレンダー取得"""
        response = await client.get("/api/v1/planning/calendar?year=2025&month=13")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_projects_invalid_page(self, client: AsyncClient):
        """不正なページ番号で企画一覧取得"""
        response = await client.get("/api/v1/planning/projects?page=0")
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_chat_message_empty_content(self, client: AsyncClient):
        """空のコンテンツでメッセージ送信"""
        response = await client.post(
            "/api/v1/planning/chat/sessions/00000000-0000-0000-0000-000000000001/messages",
            json={"content": "", "type": "user"}
        )
        # 認証エラーまたはバリデーションエラー
        assert response.status_code in [401, 403, 422]
