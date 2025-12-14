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
    RAGAnalysisRequest,
    RAGAnalysisResponse,
    RAGExtractedData,
    RAGMissingField,
    RAGNeedsConfirmation,
    RAGHearingRequest,
    RAGHearingResponse,
)
from app.services.external import claude_client, gemini_client
import json


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

    # ============================================================
    # RAG解析機能
    # ============================================================

    # フィールドラベル定義
    FIELD_LABELS = {
        "business_info": {
            "industry": "業種・業態",
            "annual_revenue": "年商規模",
            "years_in_business": "事業年数",
            "services": "主なサービス",
            "business_model": "ビジネスモデル",
        },
        "main_target": {
            "attributes": "ターゲット属性",
            "situation": "現在の状況",
            "frustrations": "挫折経験",
            "pain_points": "悩み・痛み",
            "desires": "本当の欲求",
            "insights": "インサイト",
        },
        "sub_target": {
            "attributes": "サブターゲット属性",
            "situation": "現在の状況",
            "frustrations": "挫折経験",
            "pain_points": "悩み・痛み",
            "desires": "本当の欲求",
            "insights": "インサイト",
        },
        "competitor": {
            "main_competitors": "主な競合",
            "competitor_value": "競合の価値",
            "customer_complaints": "顧客の不満",
            "differentiation": "差別化ポイント",
        },
        "company": {
            "strengths": "強み",
            "mission": "ミッション",
            "achievements": "成果事例",
            "unique_method": "独自メソッド",
        },
        "aha_concept": {
            "common_sense": "業界の常識",
            "destruction": "常識破壊",
            "insight": "インサイト",
            "naming": "ネーミング",
        },
        "concept_story": {
            "character": "キャラクター設定",
            "before_story": "Beforeストーリー",
            "transformation_story": "変容のきっかけ",
            "after_story": "Afterストーリー",
        },
        "product_design": {
            "price_range": "価格帯",
            "curriculum": "カリキュラム",
            "deliverables": "提供物",
            "support": "サポート",
        },
    }

    # 必須ステップ（sub_targetとproduct_designは任意）
    REQUIRED_STEPS = [
        "business_info",
        "main_target",
        "competitor",
        "company",
        "aha_concept",
        "concept_story",
    ]

    @staticmethod
    async def analyze_rag_content(
        content: str,
        file_name: Optional[str] = None,
    ) -> RAGAnalysisResponse:
        """
        アップロードされたコンテンツをRAG解析

        Args:
            content: 解析するテキストコンテンツ
            file_name: 元ファイル名（オプション）

        Returns:
            RAGAnalysisResponse: 解析結果
        """
        # システムプロンプト
        system_prompt = """あなたはビジネスナレッジ抽出の専門家です。
提供されたドキュメントから、以下の8セクションに該当する情報を抽出してください。

【抽出セクション】

1. ビジネス基本情報 (business_info)
   - industry: 業種・業態
   - annual_revenue: 年商規模
   - years_in_business: 事業年数
   - services: 主なサービス
   - business_model: ビジネスモデル（コンサル/コーチング/講座など）

2. メインターゲット (main_target)
   - attributes: ターゲット属性（年齢、性別、職業）
   - situation: 現在の状況
   - frustrations: 過去の挫折経験
   - pain_points: 主な悩み・痛み
   - desires: 本当に欲しいもの
   - insights: 本人が気づいていない真の課題

3. サブターゲット (sub_target) ※任意
   - （メインターゲットと同じ構造）

4. 競合分析 (competitor)
   - main_competitors: 主な競合
   - competitor_value: 競合が提供している価値
   - customer_complaints: 顧客の競合への不満
   - differentiation: 差別化ポイント

5. 自社分析 (company)
   - strengths: 強み
   - mission: ミッション・なぜこのビジネスをしているか
   - achievements: 成果事例
   - unique_method: 独自メソッド・手法

6. AHAコンセプト (aha_concept)
   - common_sense: 業界の常識
   - destruction: 常識破壊
   - insight: インサイト（気づき）
   - naming: コンセプトのネーミング

7. コンセプト・ストーリー (concept_story)
   - character: キャラクター設定
   - before_story: Beforeストーリー（変容前）
   - transformation_story: 変容のきっかけ
   - after_story: Afterストーリー（変容後）

8. 商品設計 (product_design) ※任意
   - price_range: 価格帯
   - curriculum: カリキュラム構成
   - deliverables: 提供物
   - support: サポート内容

【出力形式】
JSON形式で出力してください。

{
  "extracted_data": {
    "business_info": { ... },
    "main_target": { ... },
    "sub_target": null または { ... },
    "competitor": { ... },
    "company": { ... },
    "aha_concept": { ... },
    "concept_story": { ... },
    "product_design": null または { ... }
  },
  "confidence": 0.0〜1.0,
  "needs_confirmation": [
    { "step": "main_target", "field": "insights", "value": "抽出した値", "reason": "推測を含むため確認が必要" }
  ]
}

【抽出ルール】
1. 明確に記載されている情報のみ抽出（推測しない）
2. 複数解釈可能な場合はneeds_confirmationに追加
3. 見つからない項目はnullにする
4. 抽象的な記述は具体化の確認が必要としてマーク
5. JSONのみを出力し、説明文は含めない"""

        user_prompt = f"""以下のドキュメントからナレッジ情報を抽出してください。

【ドキュメント内容】
{content[:15000]}"""  # 最大15000文字まで

        # Claude APIで解析
        if claude_client.is_available():
            try:
                response = await KnowledgeService._call_claude_for_rag(
                    system_prompt, user_prompt
                )
                if response:
                    return KnowledgeService._parse_rag_response(response)
            except Exception as e:
                print(f"Claude RAG analysis error: {e}")

        # Gemini APIでフォールバック
        if gemini_client.is_available():
            try:
                response = await KnowledgeService._call_gemini_for_rag(
                    system_prompt + "\n\n" + user_prompt
                )
                if response:
                    return KnowledgeService._parse_rag_response(response)
            except Exception as e:
                print(f"Gemini RAG analysis error: {e}")

        # フォールバック: 空の解析結果
        return KnowledgeService._create_empty_rag_response()

    @staticmethod
    async def _call_claude_for_rag(system_prompt: str, user_prompt: str) -> Optional[str]:
        """Claude APIを使用してRAG解析"""
        if not claude_client.is_available():
            return None

        try:
            message = claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            return message.content[0].text
        except Exception as e:
            print(f"Claude API call error: {e}")
            return None

    @staticmethod
    async def _call_gemini_for_rag(prompt: str) -> Optional[str]:
        """Gemini APIを使用してRAG解析"""
        if not gemini_client.is_available():
            return None

        try:
            response = gemini_client.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API call error: {e}")
            return None

    @staticmethod
    def _parse_rag_response(response: str) -> RAGAnalysisResponse:
        """RAG解析レスポンスをパース"""
        try:
            # JSON部分を抽出
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start == -1 or json_end == 0:
                return KnowledgeService._create_empty_rag_response()

            json_str = response[json_start:json_end]
            data = json.loads(json_str)

            extracted = data.get("extracted_data", {})
            confidence = data.get("confidence", 0.0)
            needs_confirmation = data.get("needs_confirmation", [])

            # 不足フィールドを計算
            missing_fields = KnowledgeService._calculate_missing_fields(extracted)

            # 抽出済みフィールド数を計算
            total_fields = 0
            extracted_fields = 0
            for step, fields in KnowledgeService.FIELD_LABELS.items():
                if step in KnowledgeService.REQUIRED_STEPS:
                    total_fields += len(fields)
                    step_data = extracted.get(step, {}) or {}
                    for field in fields:
                        if step_data.get(field):
                            extracted_fields += 1

            return RAGAnalysisResponse(
                extracted_data=RAGExtractedData(**{
                    k: v for k, v in extracted.items() if v is not None
                }),
                missing_fields=missing_fields,
                needs_confirmation=[
                    RAGNeedsConfirmation(**nc) for nc in needs_confirmation
                ],
                confidence=min(max(confidence, 0.0), 1.0),
                total_fields=total_fields,
                extracted_fields=extracted_fields,
            )

        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            return KnowledgeService._create_empty_rag_response()

    @staticmethod
    def _calculate_missing_fields(extracted: dict) -> list[RAGMissingField]:
        """不足フィールドを計算"""
        missing = []

        for step, fields in KnowledgeService.FIELD_LABELS.items():
            # 任意ステップはスキップ
            if step not in KnowledgeService.REQUIRED_STEPS:
                continue

            step_data = extracted.get(step, {}) or {}

            for field, label in fields.items():
                if not step_data.get(field):
                    missing.append(RAGMissingField(
                        step=step,
                        field=field,
                        field_label=label,
                    ))

        return missing

    @staticmethod
    def _create_empty_rag_response() -> RAGAnalysisResponse:
        """空のRAG解析レスポンスを作成"""
        missing_fields = []
        total_fields = 0

        for step, fields in KnowledgeService.FIELD_LABELS.items():
            if step in KnowledgeService.REQUIRED_STEPS:
                total_fields += len(fields)
                for field, label in fields.items():
                    missing_fields.append(RAGMissingField(
                        step=step,
                        field=field,
                        field_label=label,
                    ))

        return RAGAnalysisResponse(
            extracted_data=RAGExtractedData(),
            missing_fields=missing_fields,
            needs_confirmation=[],
            confidence=0.0,
            total_fields=total_fields,
            extracted_fields=0,
        )

    @staticmethod
    async def generate_hearing_question(
        missing_field: RAGMissingField,
        previous_answer: Optional[str] = None,
    ) -> str:
        """不足フィールドに対するヒアリング質問を生成"""
        question_templates = {
            # business_info
            ("business_info", "industry"): "どんな業種・業態でビジネスをされていますか？",
            ("business_info", "annual_revenue"): "年商規模はどのくらいですか？（目安で構いません）",
            ("business_info", "years_in_business"): "お仕事は何年目ですか？",
            ("business_info", "services"): "主にどんなサービスを提供されていますか？",
            ("business_info", "business_model"): "ビジネスモデルは主にどのような形ですか？（コンサル、コーチング、講座販売など）",

            # main_target
            ("main_target", "attributes"): "ターゲット顧客の属性（年齢、性別、職業など）を教えてください。",
            ("main_target", "situation"): "ターゲット顧客は現在どんな状況にいますか？",
            ("main_target", "frustrations"): "ターゲット顧客の過去の挫折経験を教えてください。",
            ("main_target", "pain_points"): "ターゲット顧客の主な悩みは何ですか？",
            ("main_target", "desires"): "ターゲット顧客が本当に欲しいものは何だと思いますか？",
            ("main_target", "insights"): "ターゲット顧客が気づいていない本当の課題は何ですか？",

            # competitor
            ("competitor", "main_competitors"): "主な競合は誰ですか？",
            ("competitor", "competitor_value"): "競合が提供している価値は何ですか？",
            ("competitor", "customer_complaints"): "顧客が競合に対して持っている不満は何ですか？",
            ("competitor", "differentiation"): "あなたと競合の違いは何ですか？",

            # company
            ("company", "strengths"): "あなたの強みは何ですか？",
            ("company", "mission"): "なぜこのビジネスをしているのですか？",
            ("company", "achievements"): "これまでの成果事例を教えてください。",
            ("company", "unique_method"): "独自のメソッドや手法はありますか？",

            # aha_concept
            ("aha_concept", "common_sense"): "業界で「常識」とされていることは何ですか？",
            ("aha_concept", "destruction"): "その常識に対して、あなたはどう考えていますか？",
            ("aha_concept", "insight"): "顧客に気づいてほしい「真実」は何ですか？",
            ("aha_concept", "naming"): "あなたのコンセプトに名前をつけるとしたら？",

            # concept_story
            ("concept_story", "character"): "あなた自身のキャラクター設定を教えてください。",
            ("concept_story", "before_story"): "変容前の状態（Beforeストーリー）を教えてください。",
            ("concept_story", "transformation_story"): "変容のきっかけは何でしたか？",
            ("concept_story", "after_story"): "変容後の状態（Afterストーリー）を教えてください。",
        }

        key = (missing_field.step, missing_field.field)
        base_question = question_templates.get(
            key,
            f"{missing_field.field_label}について教えてください。"
        )

        # 前回の回答がある場合はフォローアップ
        if previous_answer:
            return f"「{previous_answer}」についてもう少し詳しく教えてください。具体的なエピソードや例があれば教えてください。"

        return base_question
