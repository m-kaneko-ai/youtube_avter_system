"""
ナレッジ管理エンドポイント

ナレッジCRUD操作とチャットセッション管理のAPIエンドポイント
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import math

from app.api.deps import get_db_session, get_current_user_role
from app.schemas.knowledge import (
    KnowledgeCreate,
    KnowledgeUpdate,
    KnowledgeResponse,
    KnowledgeListResponse,
    ChatSessionResponse,
    ChatMessageRequest,
    ChatMessage,
)
from app.services.knowledge_service import KnowledgeService

router = APIRouter()


@router.post(
    "",
    response_model=KnowledgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="ナレッジ作成",
    description="新しいナレッジを作成します。Owner/Teamのみ実行可能です。",
)
async def create_knowledge(
    knowledge_data: KnowledgeCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> KnowledgeResponse:
    """
    ナレッジ作成エンドポイント

    Args:
        knowledge_data: ナレッジ作成データ
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        KnowledgeResponse: 作成されたナレッジ情報
    """
    knowledge = await KnowledgeService.create_knowledge(db, knowledge_data, current_user_role)
    return KnowledgeResponse.model_validate(knowledge)


@router.get(
    "",
    response_model=KnowledgeListResponse,
    summary="ナレッジ一覧取得",
    description="ナレッジ一覧を取得します。ページネーション、クライアントIDフィルタに対応。Owner/Teamのみ実行可能です。",
)
async def get_knowledges(
    page: int = 1,
    limit: int = 20,
    client_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> KnowledgeListResponse:
    """
    ナレッジ一覧取得エンドポイント

    Args:
        page: ページ番号（デフォルト: 1）
        limit: 1ページあたりの件数（デフォルト: 20）
        client_id: クライアントIDフィルタ（オプション）
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        KnowledgeListResponse: ナレッジ一覧データ
    """
    knowledges, total = await KnowledgeService.get_knowledges(
        db, current_user_role, page, limit, client_id
    )

    # ページ情報計算
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return KnowledgeListResponse(
        data=[KnowledgeResponse.model_validate(knowledge) for knowledge in knowledges],
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get(
    "/{knowledge_id}",
    response_model=KnowledgeResponse,
    summary="ナレッジ詳細取得",
    description="特定のナレッジの詳細情報を取得します。Owner/Teamのみ実行可能です。",
)
async def get_knowledge(
    knowledge_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> KnowledgeResponse:
    """
    ナレッジ詳細取得エンドポイント

    Args:
        knowledge_id: ナレッジID
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        KnowledgeResponse: ナレッジ詳細情報
    """
    knowledge = await KnowledgeService.get_knowledge_by_id(
        db, knowledge_id, current_user_role
    )
    return KnowledgeResponse.model_validate(knowledge)


@router.put(
    "/{knowledge_id}",
    response_model=KnowledgeResponse,
    summary="ナレッジ更新",
    description="ナレッジ情報を更新します。Owner/Teamのみ実行可能です。",
)
async def update_knowledge(
    knowledge_id: UUID,
    knowledge_data: KnowledgeUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> KnowledgeResponse:
    """
    ナレッジ更新エンドポイント

    Args:
        knowledge_id: ナレッジID
        knowledge_data: 更新データ
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        KnowledgeResponse: 更新されたナレッジ情報
    """
    knowledge = await KnowledgeService.update_knowledge(
        db, knowledge_id, knowledge_data, current_user_role
    )
    return KnowledgeResponse.model_validate(knowledge)


@router.get(
    "/{knowledge_id}/chat",
    response_model=ChatSessionResponse,
    summary="チャットセッション取得",
    description="ナレッジ構築用のチャットセッションを取得します（存在しない場合は作成）。Owner/Teamのみ実行可能です。",
)
async def get_chat_session(
    knowledge_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> ChatSessionResponse:
    """
    チャットセッション取得エンドポイント

    Args:
        knowledge_id: ナレッジID
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        ChatSessionResponse: チャットセッション情報
    """
    chat_session = await KnowledgeService.get_chat_session(
        db, knowledge_id, current_user_role
    )

    # messagesをChatMessageのリストに変換
    messages = [
        ChatMessage(
            role=msg["role"],
            content=msg["content"],
            timestamp=msg["timestamp"]
        )
        for msg in (chat_session.messages or [])
    ]

    return ChatSessionResponse(
        id=chat_session.id,
        knowledge_id=chat_session.knowledge_id,
        current_step=chat_session.current_step,
        messages=messages,
        status=chat_session.status.value,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
    )


@router.post(
    "/{knowledge_id}/chat",
    response_model=ChatSessionResponse,
    summary="チャットメッセージ送信",
    description="チャットメッセージを送信し、AI応答を取得します。Owner/Teamのみ実行可能です。",
)
async def send_chat_message(
    knowledge_id: UUID,
    message_data: ChatMessageRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_role: str = Depends(get_current_user_role),
) -> ChatSessionResponse:
    """
    チャットメッセージ送信エンドポイント

    Args:
        knowledge_id: ナレッジID
        message_data: メッセージデータ
        db: データベースセッション
        current_user_role: 実行者のロール

    Returns:
        ChatSessionResponse: 更新されたチャットセッション情報
    """
    chat_session = await KnowledgeService.send_chat_message(
        db, knowledge_id, message_data, current_user_role
    )

    # messagesをChatMessageのリストに変換
    messages = [
        ChatMessage(
            role=msg["role"],
            content=msg["content"],
            timestamp=msg["timestamp"]
        )
        for msg in (chat_session.messages or [])
    ]

    return ChatSessionResponse(
        id=chat_session.id,
        knowledge_id=chat_session.knowledge_id,
        current_step=chat_session.current_step,
        messages=messages,
        status=chat_session.status.value,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
    )
