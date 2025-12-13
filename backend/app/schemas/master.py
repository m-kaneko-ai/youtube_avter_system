"""
マスターデータ関連のPydanticスキーマ

カテゴリ、タグのリクエスト/レスポンスバリデーション
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# カテゴリスキーマ
class CategoryBase(BaseModel):
    """カテゴリ基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=100, description="カテゴリ名")
    description: Optional[str] = Field(None, description="説明")


class CategoryResponse(CategoryBase):
    """カテゴリレスポンス"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """カテゴリ一覧レスポンス"""
    data: list[CategoryResponse]

    class Config:
        from_attributes = True


# タグスキーマ
class TagBase(BaseModel):
    """タグ基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=50, description="タグ名")


class TagResponse(TagBase):
    """タグレスポンス"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    """タグ一覧レスポンス"""
    data: list[TagResponse]

    class Config:
        from_attributes = True
