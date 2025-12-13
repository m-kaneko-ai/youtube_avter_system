"""
ナレッジスキーマ

Pydanticスキーマによるリクエスト/レスポンスの型定義
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.knowledge import KnowledgeType


class KnowledgeBase(BaseModel):
    """ナレッジ基本情報"""
    name: str = Field(..., min_length=1, max_length=255, description="ナレッジ名")
    type: KnowledgeType = Field(default=KnowledgeType.BRAND, description="ナレッジタイプ")


class KnowledgeCreate(KnowledgeBase):
    """ナレッジ作成リクエスト"""
    client_id: UUID = Field(..., description="クライアントID")


class KnowledgeUpdate(BaseModel):
    """ナレッジ更新リクエスト"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="ナレッジ名")
    type: Optional[KnowledgeType] = Field(None, description="ナレッジタイプ")
    section_1_main_target: Optional[dict[str, Any]] = Field(None, description="セクション1: メインターゲット像")
    section_2_sub_target: Optional[dict[str, Any]] = Field(None, description="セクション2: サブターゲット像")
    section_3_competitor: Optional[dict[str, Any]] = Field(None, description="セクション3: 競合分析")
    section_4_company: Optional[dict[str, Any]] = Field(None, description="セクション4: 自社分析")
    section_5_aha_concept: Optional[dict[str, Any]] = Field(None, description="セクション5: AHAコンセプト")
    section_6_concept_summary: Optional[dict[str, Any]] = Field(None, description="セクション6: コンセプトまとめ")
    section_7_customer_journey: Optional[dict[str, Any]] = Field(None, description="セクション7: カスタマージャーニー")
    section_8_promotion_strategy: Optional[dict[str, Any]] = Field(None, description="セクション8: プロモーション戦略 & 商品設計")


class KnowledgeResponse(KnowledgeBase):
    """ナレッジレスポンス"""
    id: UUID = Field(..., description="ナレッジID")
    client_id: UUID = Field(..., description="クライアントID")
    section_1_main_target: Optional[dict[str, Any]] = Field(None, description="セクション1: メインターゲット像")
    section_2_sub_target: Optional[dict[str, Any]] = Field(None, description="セクション2: サブターゲット像")
    section_3_competitor: Optional[dict[str, Any]] = Field(None, description="セクション3: 競合分析")
    section_4_company: Optional[dict[str, Any]] = Field(None, description="セクション4: 自社分析")
    section_5_aha_concept: Optional[dict[str, Any]] = Field(None, description="セクション5: AHAコンセプト")
    section_6_concept_summary: Optional[dict[str, Any]] = Field(None, description="セクション6: コンセプトまとめ")
    section_7_customer_journey: Optional[dict[str, Any]] = Field(None, description="セクション7: カスタマージャーニー")
    section_8_promotion_strategy: Optional[dict[str, Any]] = Field(None, description="セクション8: プロモーション戦略 & 商品設計")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class KnowledgeListResponse(BaseModel):
    """ナレッジ一覧レスポンス"""
    data: list[KnowledgeResponse] = Field(..., description="ナレッジデータ")
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ")
    page_size: int = Field(..., description="1ページあたりの件数")
    total_pages: int = Field(..., description="総ページ数")


# チャットセッション関連のスキーマ

class ChatMessage(BaseModel):
    """チャットメッセージ"""
    role: str = Field(..., description="ロール（user/assistant）")
    content: str = Field(..., description="メッセージ内容")
    timestamp: str = Field(..., description="送信日時（ISO形式）")


class ChatSessionResponse(BaseModel):
    """チャットセッションレスポンス"""
    id: UUID = Field(..., description="セッションID")
    knowledge_id: UUID = Field(..., description="ナレッジID")
    current_step: int = Field(..., description="現在のステップ（1-8）")
    messages: list[ChatMessage] = Field(..., description="メッセージ履歴")
    status: str = Field(..., description="セッションステータス")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    """チャットメッセージ送信リクエスト"""
    content: str = Field(..., min_length=1, description="メッセージ内容")
