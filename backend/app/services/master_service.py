"""
マスターデータ管理サービス

カテゴリ、タグのCRUD操作ビジネスロジック
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category, Tag
from app.core.cache import cached


class MasterService:
    """マスターデータ管理サービス"""

    @staticmethod
    @cached("master:categories", ttl=3600)  # 1時間キャッシュ
    async def get_categories(db: AsyncSession) -> list[dict]:
        """
        カテゴリ一覧取得

        Args:
            db: データベースセッション

        Returns:
            カテゴリリスト（辞書形式）
        """
        query = select(Category).order_by(Category.name)
        result = await db.execute(query)
        categories = result.scalars().all()
        # SQLAlchemyモデルをJSONシリアライズ可能な辞書に変換
        return [
            {
                "id": str(cat.id),
                "name": cat.name,
                "description": cat.description,
                "created_at": cat.created_at.isoformat(),
            }
            for cat in categories
        ]

    @staticmethod
    @cached("master:tags", ttl=3600)  # 1時間キャッシュ
    async def get_tags(db: AsyncSession) -> list[dict]:
        """
        タグ一覧取得

        Args:
            db: データベースセッション

        Returns:
            タグリスト（辞書形式）
        """
        query = select(Tag).order_by(Tag.name)
        result = await db.execute(query)
        tags = result.scalars().all()
        # SQLAlchemyモデルをJSONシリアライズ可能な辞書に変換
        return [
            {
                "id": str(tag.id),
                "name": tag.name,
                "created_at": tag.created_at.isoformat(),
            }
            for tag in tags
        ]
