"""
ユーザースキーマ

Pydanticスキーマによるリクエスト/レスポンスの型定義
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    """ユーザー基本情報"""
    email: EmailStr = Field(..., description="メールアドレス")
    name: str = Field(..., min_length=1, max_length=255, description="ユーザー名")


class UserCreate(UserBase):
    """ユーザー作成リクエスト"""
    role: UserRole = Field(default=UserRole.CLIENT_BASIC, description="ロール")


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="ユーザー名")
    role: Optional[UserRole] = Field(None, description="ロール")
    avatar_url: Optional[str] = Field(None, max_length=500, description="アバター画像URL")


class UserResponse(UserBase):
    """ユーザーレスポンス"""
    id: UUID = Field(..., description="ユーザーID")
    role: UserRole = Field(..., description="ロール")
    avatar_url: Optional[str] = Field(None, description="アバター画像URL")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """ユーザー一覧レスポンス"""
    data: list[UserResponse] = Field(..., description="ユーザーデータ")
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ")
    page_size: int = Field(..., description="1ページあたりの件数")
    total_pages: int = Field(..., description="総ページ数")
