"""
マスターデータ管理エンドポイントの統合テスト

実際のFastAPIアプリケーションとPostgreSQLを使用した統合テスト
モックは一切使用せず、実データで検証する
"""
import pytest
from httpx import AsyncClient


class TestCategories:
    """カテゴリ一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_categories_without_auth(self, client: AsyncClient):
        """
        認証なしでカテゴリ一覧取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get("/api/v1/master/categories")

        assert response.status_code in [401, 403]


class TestTags:
    """タグ一覧取得のテスト"""

    @pytest.mark.asyncio
    async def test_get_tags_without_auth(self, client: AsyncClient):
        """
        認証なしでタグ一覧取得を試みると401/403エラーが返る

        検証項目:
        - ステータスコードが401または403
        """
        response = await client.get("/api/v1/master/tags")

        assert response.status_code in [401, 403]
