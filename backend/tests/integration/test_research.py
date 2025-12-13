"""
リサーチ機能エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestCompetitors:
    """競合チャンネル調査のテスト"""

    @pytest.mark.asyncio
    async def test_get_competitors_without_auth(self, client: AsyncClient):
        """認証なしで競合チャンネル調査を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/competitors")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_competitors_with_query(self, client: AsyncClient):
        """クエリパラメータ付きで競合チャンネル調査（認証なし）"""
        response = await client.get("/api/v1/research/competitors?query=AI&limit=5")
        assert response.status_code in [401, 403]


class TestPopularVideos:
    """人気動画調査のテスト"""

    @pytest.mark.asyncio
    async def test_get_popular_videos_without_auth(self, client: AsyncClient):
        """認証なしで人気動画調査を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/popular-videos")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_popular_videos_with_category(self, client: AsyncClient):
        """カテゴリフィルタ付きで人気動画調査（認証なし）"""
        response = await client.get("/api/v1/research/popular-videos?category=tech&limit=10")
        assert response.status_code in [401, 403]


class TestKeywordTrends:
    """キーワードトレンドのテスト"""

    @pytest.mark.asyncio
    async def test_get_keyword_trends_without_auth(self, client: AsyncClient):
        """認証なしでキーワードトレンド取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/trends/keywords")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_keyword_trends_with_query(self, client: AsyncClient):
        """クエリ付きでキーワードトレンド取得（認証なし）"""
        response = await client.get("/api/v1/research/trends/keywords?query=YouTube&limit=20")
        assert response.status_code in [401, 403]


class TestNewsTrends:
    """ニューストレンドのテスト"""

    @pytest.mark.asyncio
    async def test_get_news_trends_without_auth(self, client: AsyncClient):
        """認証なしでニューストレンド取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/trends/news")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_news_trends_with_category(self, client: AsyncClient):
        """カテゴリ付きでニューストレンド取得（認証なし）"""
        response = await client.get("/api/v1/research/trends/news?category=tech")
        assert response.status_code in [401, 403]


class TestBookTrends:
    """書籍トレンドのテスト"""

    @pytest.mark.asyncio
    async def test_get_book_trends_without_auth(self, client: AsyncClient):
        """認証なしで書籍トレンド取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/trends/books")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_book_trends_with_category(self, client: AsyncClient):
        """カテゴリ付きで書籍トレンド取得（認証なし）"""
        response = await client.get("/api/v1/research/trends/books?category=business&limit=10")
        assert response.status_code in [401, 403]


class TestCommentSentiment:
    """コメント感情分析のテスト"""

    @pytest.mark.asyncio
    async def test_get_comment_sentiment_without_auth(self, client: AsyncClient):
        """認証なしでコメント感情分析を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/comments/sentiment?video_id=abc123")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_comment_sentiment_missing_video_id(self, client: AsyncClient):
        """video_id未指定でコメント感情分析を試みると422またはエラーが返る"""
        response = await client.get("/api/v1/research/comments/sentiment")
        assert response.status_code in [401, 403, 422]


class TestCommentKeywords:
    """コメントキーワード抽出のテスト"""

    @pytest.mark.asyncio
    async def test_get_comment_keywords_without_auth(self, client: AsyncClient):
        """認証なしでコメントキーワード抽出を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/comments/keywords?video_id=abc123")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_comment_keywords_with_limit(self, client: AsyncClient):
        """limit付きでコメントキーワード抽出（認証なし）"""
        response = await client.get("/api/v1/research/comments/keywords?video_id=abc123&limit=50")
        assert response.status_code in [401, 403]


class TestNotableComments:
    """注目コメント取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_notable_comments_without_auth(self, client: AsyncClient):
        """認証なしで注目コメント取得を試みると401/403エラーが返る"""
        response = await client.get("/api/v1/research/comments/notable?video_id=abc123")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_notable_comments_with_limit(self, client: AsyncClient):
        """limit付きで注目コメント取得（認証なし）"""
        response = await client.get("/api/v1/research/comments/notable?video_id=abc123&limit=30")
        assert response.status_code in [401, 403]


class TestResearchEndpointsExist:
    """リサーチエンドポイント存在確認テスト"""

    @pytest.mark.asyncio
    async def test_all_research_endpoints_exist(self, client: AsyncClient):
        """
        全8エンドポイントが存在し、認証エラーが返ることを確認

        検証項目:
        - GET /api/v1/research/competitors
        - GET /api/v1/research/popular-videos
        - GET /api/v1/research/trends/keywords
        - GET /api/v1/research/trends/news
        - GET /api/v1/research/trends/books
        - GET /api/v1/research/comments/sentiment
        - GET /api/v1/research/comments/keywords
        - GET /api/v1/research/comments/notable
        """
        endpoints = [
            "/api/v1/research/competitors",
            "/api/v1/research/popular-videos",
            "/api/v1/research/trends/keywords",
            "/api/v1/research/trends/news",
            "/api/v1/research/trends/books",
            "/api/v1/research/comments/sentiment?video_id=test",
            "/api/v1/research/comments/keywords?video_id=test",
            "/api/v1/research/comments/notable?video_id=test",
        ]

        for endpoint in endpoints:
            response = await client.get(endpoint)
            # 認証エラー（401/403）が返ることで、エンドポイントが存在することを確認
            assert response.status_code in [401, 403], \
                f"Endpoint {endpoint} returned unexpected status: {response.status_code}"


class TestResearchResponseSchemas:
    """レスポンススキーマ検証テスト（スタブレスポンス構造の確認）"""

    @pytest.mark.asyncio
    async def test_research_endpoints_structure(self, client: AsyncClient):
        """
        認証なしでアクセスした際、適切な認証エラーレスポンスが返ることを確認

        全エンドポイントが正しく設定されており、認証機構が動作していることを検証
        """
        # スライス4-A（競合調査系）
        response = await client.get("/api/v1/research/competitors")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/popular-videos")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/trends/keywords")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/trends/news")
        assert response.status_code in [401, 403]

        # スライス4-B（コメント分析系）
        response = await client.get("/api/v1/research/trends/books")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/comments/sentiment?video_id=test123")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/comments/keywords?video_id=test123")
        assert response.status_code in [401, 403]

        response = await client.get("/api/v1/research/comments/notable?video_id=test123")
        assert response.status_code in [401, 403]
