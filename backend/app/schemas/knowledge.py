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


# ============================================================
# RAG解析関連のスキーマ
# ============================================================

class RAGMissingField(BaseModel):
    """RAG解析で検出された不足フィールド"""
    step: str = Field(..., description="ステップID（例: business_info, main_target）")
    field: str = Field(..., description="フィールド名")
    field_label: str = Field(..., description="フィールドの日本語ラベル")


class RAGNeedsConfirmation(BaseModel):
    """RAG解析で確認が必要なフィールド"""
    step: str = Field(..., description="ステップID")
    field: str = Field(..., description="フィールド名")
    value: Optional[str] = Field(None, description="抽出された値")
    reason: Optional[str] = Field(None, description="確認が必要な理由")


class RAGExtractedData(BaseModel):
    """RAG解析で抽出されたデータ"""
    business_info: Optional[dict[str, Any]] = Field(None, description="ビジネス基本情報")
    main_target: Optional[dict[str, Any]] = Field(None, description="メインターゲット")
    sub_target: Optional[dict[str, Any]] = Field(None, description="サブターゲット")
    competitor: Optional[dict[str, Any]] = Field(None, description="競合分析")
    company: Optional[dict[str, Any]] = Field(None, description="自社分析")
    aha_concept: Optional[dict[str, Any]] = Field(None, description="AHAコンセプト")
    concept_story: Optional[dict[str, Any]] = Field(None, description="コンセプト・ストーリー")
    product_design: Optional[dict[str, Any]] = Field(None, description="商品設計")


class RAGAnalysisRequest(BaseModel):
    """RAG解析リクエスト"""
    content: str = Field(..., min_length=1, description="解析するテキストコンテンツ")
    file_name: Optional[str] = Field(None, description="元ファイル名")


class RAGAnalysisResponse(BaseModel):
    """RAG解析レスポンス"""
    extracted_data: RAGExtractedData = Field(..., description="抽出されたデータ")
    missing_fields: list[RAGMissingField] = Field(..., description="不足フィールド一覧")
    needs_confirmation: list[RAGNeedsConfirmation] = Field(..., description="確認が必要なフィールド")
    confidence: float = Field(..., ge=0.0, le=1.0, description="全体の信頼度（0.0-1.0）")
    total_fields: int = Field(..., description="全フィールド数")
    extracted_fields: int = Field(..., description="抽出済みフィールド数")


class RAGHearingRequest(BaseModel):
    """RAGヒアリングリクエスト"""
    missing_field: RAGMissingField = Field(..., description="ヒアリング対象のフィールド")
    user_answer: str = Field(..., min_length=1, description="ユーザーの回答")
    previous_context: Optional[str] = Field(None, description="前回のコンテキスト")


class RAGHearingResponse(BaseModel):
    """RAGヒアリングレスポンス"""
    extracted_value: str = Field(..., description="抽出された値")
    follow_up_question: Optional[str] = Field(None, description="フォローアップ質問（必要な場合）")
    is_complete: bool = Field(..., description="このフィールドの回答が完了したか")
    next_field: Optional[RAGMissingField] = Field(None, description="次の不足フィールド")
