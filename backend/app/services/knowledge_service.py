"""
ナレッジサービス

ナレッジ管理のビジネスロジック
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.knowledge import Knowledge
from app.models.chat_session import ChatSession, ChatSessionStatus
from app.models.client import Client
from app.models.user import UserRole
from app.schemas.knowledge import (
    KnowledgeCreate,
    KnowledgeUpdate,
    ChatMessageRequest,
    ChatMessage,
)
from app.services.external import claude_client, gemini_client


class KnowledgeService:
    """ナレッジ管理サービス"""

    @staticmethod
    async def create_knowledge(
        db: AsyncSession,
        knowledge_data: KnowledgeCreate,
        current_user_role: str,
    ) -> Knowledge:
        """
        ナレッジを作成

        Args:
            db: データベースセッション
            knowledge_data: ナレッジ作成データ
            current_user_role: 実行者のロール

        Returns:
            Knowledge: 作成されたナレッジ

        Raises:
            HTTPException: 権限不足、クライアント未存在
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ナレッジ作成にはOwnerまたはTeamロールが必要です",
            )

        # クライアント存在チェック
        result = await db.execute(
            select(Client).where(Client.id == knowledge_data.client_id)
        )
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="クライアントが見つかりません",
            )

        # ナレッジ作成
        new_knowledge = Knowledge(
            client_id=knowledge_data.client_id,
            name=knowledge_data.name,
            type=knowledge_data.type,
        )
        db.add(new_knowledge)

        # クライアントのナレッジ数を更新
        client.knowledge_count += 1

        await db.commit()
        await db.refresh(new_knowledge)

        return new_knowledge

    @staticmethod
    async def get_knowledges(
        db: AsyncSession,
        current_user_role: str,
        page: int = 1,
        limit: int = 20,
        client_id: Optional[UUID] = None,
    ) -> tuple[list[Knowledge], int]:
        """
        ナレッジ一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            page: ページ番号
            limit: 1ページあたりの件数
            client_id: クライアントIDフィルタ

        Returns:
            tuple[list[Knowledge], int]: (ナレッジリスト, 総件数)

        Raises:
            HTTPException: 権限不足
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ナレッジ一覧取得にはOwnerまたはTeamロールが必要です",
            )

        # クエリ構築
        query = select(Knowledge)
        if client_id:
            query = query.where(Knowledge.client_id == client_id)

        # 総件数取得
        count_query = select(func.count()).select_from(Knowledge)
        if client_id:
            count_query = count_query.where(Knowledge.client_id == client_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ページネーション
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(Knowledge.created_at.desc())

        # データ取得
        result = await db.execute(query)
        knowledges = result.scalars().all()

        return list(knowledges), total

    @staticmethod
    async def get_knowledge_by_id(
        db: AsyncSession,
        knowledge_id: UUID,
        current_user_role: str,
    ) -> Knowledge:
        """
        ナレッジ詳細を取得

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            current_user_role: 実行者のロール

        Returns:
            Knowledge: ナレッジ情報

        Raises:
            HTTPException: 権限不足、ナレッジ未存在
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ナレッジ詳細取得にはOwnerまたはTeamロールが必要です",
            )

        # ナレッジ取得
        result = await db.execute(select(Knowledge).where(Knowledge.id == knowledge_id))
        knowledge = result.scalar_one_or_none()

        if not knowledge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ナレッジが見つかりません",
            )

        return knowledge

    @staticmethod
    async def update_knowledge(
        db: AsyncSession,
        knowledge_id: UUID,
        knowledge_data: KnowledgeUpdate,
        current_user_role: str,
    ) -> Knowledge:
        """
        ナレッジ情報を更新

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            knowledge_data: 更新データ
            current_user_role: 実行者のロール

        Returns:
            Knowledge: 更新されたナレッジ

        Raises:
            HTTPException: 権限不足、ナレッジ未存在
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ナレッジ更新にはOwnerまたはTeamロールが必要です",
            )

        # ナレッジ取得
        result = await db.execute(select(Knowledge).where(Knowledge.id == knowledge_id))
        knowledge = result.scalar_one_or_none()

        if not knowledge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ナレッジが見つかりません",
            )

        # 更新処理
        update_dict = knowledge_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(knowledge, key, value)

        await db.commit()
        await db.refresh(knowledge)

        return knowledge

    @staticmethod
    async def get_chat_session(
        db: AsyncSession,
        knowledge_id: UUID,
        current_user_role: str,
    ) -> ChatSession:
        """
        チャットセッションを取得（存在しない場合は作成）

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            current_user_role: 実行者のロール

        Returns:
            ChatSession: チャットセッション

        Raises:
            HTTPException: 権限不足、ナレッジ未存在
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャットセッション取得にはOwnerまたはTeamロールが必要です",
            )

        # ナレッジ存在チェック
        result = await db.execute(select(Knowledge).where(Knowledge.id == knowledge_id))
        knowledge = result.scalar_one_or_none()
        if not knowledge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ナレッジが見つかりません",
            )

        # 既存のチャットセッション取得
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.knowledge_id == knowledge_id)
            .order_by(ChatSession.created_at.desc())
        )
        chat_session = result.scalar_one_or_none()

        # 存在しない場合は作成
        if not chat_session:
            chat_session = ChatSession(
                client_id=knowledge.client_id,
                knowledge_id=knowledge_id,
                current_step=1,
                messages=[],
                status=ChatSessionStatus.IN_PROGRESS,
            )
            db.add(chat_session)
            await db.commit()
            await db.refresh(chat_session)

        return chat_session

    @staticmethod
    async def send_chat_message(
        db: AsyncSession,
        knowledge_id: UUID,
        message_data: ChatMessageRequest,
        current_user_role: str,
    ) -> ChatSession:
        """
        チャットメッセージを送信し、AI応答を取得

        Args:
            db: データベースセッション
            knowledge_id: ナレッジID
            message_data: メッセージデータ
            current_user_role: 実行者のロール

        Returns:
            ChatSession: 更新されたチャットセッション

        Raises:
            HTTPException: 権限不足、ナレッジ未存在
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャットメッセージ送信にはOwnerまたはTeamロールが必要です",
            )

        # チャットセッション取得
        chat_session = await KnowledgeService.get_chat_session(
            db, knowledge_id, current_user_role
        )

        # ナレッジ情報を取得
        result = await db.execute(select(Knowledge).where(Knowledge.id == knowledge_id))
        knowledge = result.scalar_one_or_none()

        # ユーザーメッセージを追加
        user_message = {
            "role": "user",
            "content": message_data.content,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # AI応答を生成
        ai_response = await KnowledgeService._generate_ai_response(
            chat_session, knowledge, message_data.content
        )

        assistant_message = {
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # messagesがNoneの場合は空リストで初期化
        if chat_session.messages is None:
            chat_session.messages = []

        # 新しいメッセージリストを作成（SQLAlchemyがJSONBの変更を検知するため）
        new_messages = list(chat_session.messages)
        new_messages.append(user_message)
        new_messages.append(assistant_message)
        chat_session.messages = new_messages

        # updated_atを更新
        chat_session.updated_at = datetime.utcnow()

        # SQLAlchemyにJSONBフィールドの変更を通知
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(chat_session, "messages")

        await db.commit()
        await db.refresh(chat_session)

        return chat_session

    @staticmethod
    async def _generate_ai_response(
        chat_session: ChatSession,
        knowledge: Optional[Knowledge],
        user_message: str,
    ) -> str:
        """
        AI応答を生成

        Claude/Gemini APIを使用（API未設定時はスタブ応答）

        Args:
            chat_session: チャットセッション
            knowledge: ナレッジ情報
            user_message: ユーザーメッセージ

        Returns:
            str: AI応答テキスト
        """
        # 8セクションの説明
        section_descriptions = {
            1: "メインターゲット像（年齢、性別、職業、悩み、ゴール）",
            2: "サブターゲット像（メイン以外のターゲット層）",
            3: "競合分析（Competitor）",
            4: "自社分析（Company）",
            5: "AHAコンセプト（独自の価値提案）",
            6: "コンセプトまとめ",
            7: "カスタマージャーニー",
            8: "プロモーション戦略 & 商品設計",
        }

        current_section = section_descriptions.get(chat_session.current_step, "ナレッジ構築")

        # システムプロンプト
        system_prompt = f"""あなたはナレッジ構築をサポートするAIアシスタントです。
現在、「{current_section}」のセクションについてヒアリングを行っています。

ヒアリングのポイント:
- 具体的なエピソードや事例を聞く
- 「分からない」という回答には別の角度から質問する
- 回答を整理して次のステップに導く
- 専門用語は避け、わかりやすい言葉で説明する

ナレッジ名: {knowledge.name if knowledge else '未設定'}
ナレッジタイプ: {knowledge.type.value if knowledge else '未設定'}
"""

        # 会話履歴を構築
        conversation_history = ""
        if chat_session.messages:
            for msg in chat_session.messages[-10:]:  # 直近10件のみ
                role = "ユーザー" if msg["role"] == "user" else "アシスタント"
                conversation_history += f"{role}: {msg['content']}\n"

        full_prompt = f"{system_prompt}\n\n会話履歴:\n{conversation_history}\nユーザー: {user_message}\n\n上記に基づいて、適切な応答を生成してください。"

        # Claude APIが利用可能な場合
        if claude_client.is_available():
            try:
                response = await claude_client.generate_text(
                    prompt=full_prompt,
                    max_tokens=1000,
                    temperature=0.7,
                )
                if response:
                    return response
            except Exception as e:
                print(f"Claude API error: {e}")

        # Gemini APIが利用可能な場合
        if gemini_client.is_available():
            try:
                response = await gemini_client.generate_text(
                    prompt=full_prompt,
                    max_tokens=1000,
                    temperature=0.7,
                )
                if response:
                    return response
            except Exception as e:
                print(f"Gemini API error: {e}")

        # フォールバック: スタブ応答
        return f"""「{current_section}」についてお聞かせいただきありがとうございます。

{user_message}というお話ですね。

もう少し詳しく教えていただけますか？例えば：
- 具体的にどのような状況でそう感じましたか？
- それに関連する具体的なエピソードはありますか？
- 理想的な状態はどのようなイメージですか？

お気軽にお聞かせください。"""
