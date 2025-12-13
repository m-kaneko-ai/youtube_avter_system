"""
クライアント関連のPydanticスキーマ

リクエスト/レスポンスのバリデーションに使用
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.client import ClientPlan


# ベーススキーマ
class ClientBase(BaseModel):
    """クライアント基本スキーマ"""
    company_name: str = Field(..., min_length=1, max_length=255, description="会社名")
    plan: ClientPlan = Field(default=ClientPlan.BASIC, description="契約プラン")


# リクエストスキーマ
class ClientCreate(ClientBase):
    """クライアント作成リクエスト"""
    user_id: UUID = Field(..., description="ユーザーID")


class ClientUpdate(BaseModel):
    """クライアント更新リクエスト"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=255, description="会社名")
    plan: Optional[ClientPlan] = Field(None, description="契約プラン")
    knowledge_count: Optional[int] = Field(None, ge=0, description="ナレッジ数")


# レスポンススキーマ
class ClientResponse(ClientBase):
    """クライアント詳細レスポンス"""
    id: UUID
    user_id: UUID
    knowledge_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ページネーションレスポンス
class ClientListResponse(BaseModel):
    """クライアント一覧レスポンス"""
    data: list[ClientResponse]
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ", ge=1)
    page_size: int = Field(..., description="ページサイズ", ge=1)

    class Config:
        from_attributes = True
