"""
マスターデータ管理サービス

カテゴリ、タグのCRUD操作ビジネスロジック
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category, Tag


class MasterService:
    """マスターデータ管理サービス"""

    @staticmethod
    async def get_categories(db: AsyncSession) -> list[Category]:
        """
        カテゴリ一覧取得

        Args:
            db: データベースセッション

        Returns:
            カテゴリリスト
        """
        query = select(Category).order_by(Category.name)
        result = await db.execute(query)
        categories = result.scalars().all()
        return list(categories)

    @staticmethod
    async def get_tags(db: AsyncSession) -> list[Tag]:
        """
        タグ一覧取得

        Args:
            db: データベースセッション

        Returns:
            タグリスト
        """
        query = select(Tag).order_by(Tag.name)
        result = await db.execute(query)
        tags = result.scalars().all()
        return list(tags)
