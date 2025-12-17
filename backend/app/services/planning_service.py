"""
企画・計画サービス

企画・計画機能のビジネスロジック
"""
from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4
import math

from sqlalchemy import select, func, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models import (
    Project,
    ProjectStatus,
    Client,
    Knowledge,
)
from app.models.planning import (
    PlanningChatSession,
    PlanningSessionStatus,
    AISuggestion,
    SuggestionType,
    ProjectSchedule,
)
from app.models.user import UserRole
from app.schemas.planning import (
    CalendarResponse,
    CalendarProjectItem,
    ScheduleUpdateRequest,
    ScheduleUpdateResponse,
    PlanningProjectListResponse,
    PlanningProjectItem,
    PlanningProjectDetail,
    PlanningPagination,
    ProjectStatusUpdateRequest,
    ProjectDeleteResponse,
    ChatSessionCreateRequest,
    ChatSessionCreateResponse,
    ChatMessageSendRequest,
    ChatMessageResponse,
    ChatMessageItem,
    ChatHistoryResponse,
    AISuggestionItem,
    SuggestionAdoptRequest,
    SuggestionAdoptResponse,
    AdoptedSuggestionsResponse,
    AdoptedSuggestionItem,
    SuggestionUnadoptResponse,
    PlanningContextResponse,
    TrendItem,
    KnowledgeContext,
    RecentProjectItem,
    PlanningStatsResponse,
    StatusStats,
    TypeStats,
    MonthStats,
)


class PlanningService:
    """企画・計画サービス"""

    # ============================================================
    # カレンダー関連メソッド
    # ============================================================

    @staticmethod
    async def get_calendar(
        db: AsyncSession,
        current_user_role: str,
        year: int,
        month: int,
        knowledge_id: Optional[UUID] = None,
    ) -> CalendarResponse:
        """
        カレンダーデータを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            year: 年
            month: 月
            knowledge_id: ナレッジIDでフィルタ（オプション）

        Returns:
            CalendarResponse: カレンダーデータ
        """
        # 権限チェック（Owner/Teamのみ）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="カレンダー取得にはOwnerまたはTeamロールが必要です",
            )

        # スケジュールがある企画を取得
        stmt = (
            select(Project, ProjectSchedule)
            .outerjoin(ProjectSchedule, Project.id == ProjectSchedule.project_id)
            .where(
                and_(
                    ProjectSchedule.scheduled_date.isnot(None),
                    extract("year", ProjectSchedule.scheduled_date) == year,
                    extract("month", ProjectSchedule.scheduled_date) == month,
                )
            )
        )

        if knowledge_id:
            stmt = stmt.where(Project.knowledge_id == knowledge_id)

        result = await db.execute(stmt)
        rows = result.all()

        projects = []
        for project, schedule in rows:
            projects.append(
                CalendarProjectItem(
                    id=project.id,
                    title=project.name,
                    type="short",  # TODO: プロジェクトにtype属性追加
                    status=project.status,
                    scheduled_date=schedule.scheduled_date if schedule else None,
                    published_date=schedule.published_date if schedule else None,
                )
            )

        return CalendarResponse(year=year, month=month, projects=projects)

    @staticmethod
    async def update_schedule(
        db: AsyncSession,
        current_user_role: str,
        request: ScheduleUpdateRequest,
    ) -> ScheduleUpdateResponse:
        """
        プロジェクトのスケジュールを更新

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: スケジュール更新リクエスト

        Returns:
            ScheduleUpdateResponse: 更新結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="スケジュール更新にはOwnerまたはTeamロールが必要です",
            )

        # プロジェクト存在確認
        project = await db.get(Project, request.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="プロジェクトが見つかりません",
            )

        # 既存スケジュールを取得or作成
        stmt = select(ProjectSchedule).where(
            ProjectSchedule.project_id == request.project_id
        )
        result = await db.execute(stmt)
        schedule = result.scalar_one_or_none()

        if schedule:
            schedule.scheduled_date = request.scheduled_date
            schedule.updated_at = datetime.utcnow()
        else:
            schedule = ProjectSchedule(
                project_id=request.project_id,
                scheduled_date=request.scheduled_date,
            )
            db.add(schedule)

        await db.commit()
        await db.refresh(schedule)

        return ScheduleUpdateResponse(
            success=True,
            project={
                "id": str(project.id),
                "scheduled_date": request.scheduled_date.isoformat(),
            },
        )

    # ============================================================
    # 企画一覧関連メソッド
    # ============================================================

    @staticmethod
    async def get_planning_projects(
        db: AsyncSession,
        current_user_role: str,
        status_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        sort: Optional[str] = None,
    ) -> PlanningProjectListResponse:
        """
        企画一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            status_filter: ステータスフィルタ
            type_filter: 種別フィルタ
            search: 検索クエリ
            page: ページ番号
            limit: 取得件数
            sort: ソート

        Returns:
            PlanningProjectListResponse: 企画一覧
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="企画一覧取得にはOwnerまたはTeamロールが必要です",
            )

        # ベースクエリ
        stmt = select(Project).outerjoin(
            ProjectSchedule, Project.id == ProjectSchedule.project_id
        )

        # ステータスフィルタ
        if status_filter and status_filter != "all":
            try:
                status_enum = ProjectStatus(status_filter)
                stmt = stmt.where(Project.status == status_enum)
            except ValueError:
                pass

        # 検索フィルタ
        if search:
            stmt = stmt.where(Project.name.ilike(f"%{search}%"))

        # カウント取得
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # ソート
        if sort == "scheduled_date_asc":
            stmt = stmt.order_by(ProjectSchedule.scheduled_date.asc().nullslast())
        elif sort == "scheduled_date_desc":
            stmt = stmt.order_by(ProjectSchedule.scheduled_date.desc().nullsfirst())
        else:
            stmt = stmt.order_by(Project.created_at.desc())

        # ページネーション
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await db.execute(stmt)
        projects_db = result.scalars().all()

        # スケジュール情報を取得
        project_ids = [p.id for p in projects_db]
        if project_ids:
            schedule_stmt = select(ProjectSchedule).where(
                ProjectSchedule.project_id.in_(project_ids)
            )
            schedule_result = await db.execute(schedule_stmt)
            schedules = {s.project_id: s for s in schedule_result.scalars().all()}
        else:
            schedules = {}

        projects = []
        for project in projects_db:
            schedule = schedules.get(project.id)
            projects.append(
                PlanningProjectItem(
                    id=project.id,
                    title=project.name,
                    category=None,  # TODO: カテゴリ追加
                    type="short",  # TODO: タイプ追加
                    status=project.status,
                    scheduled_date=schedule.scheduled_date if schedule else None,
                    created_at=project.created_at,
                )
            )

        total_pages = math.ceil(total / limit) if total > 0 else 1

        return PlanningProjectListResponse(
            projects=projects,
            pagination=PlanningPagination(
                total=total,
                page=page,
                limit=limit,
                total_pages=total_pages,
            ),
        )

    @staticmethod
    async def get_planning_project_detail(
        db: AsyncSession,
        current_user_role: str,
        project_id: UUID,
    ) -> PlanningProjectDetail:
        """
        企画詳細を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            project_id: プロジェクトID

        Returns:
            PlanningProjectDetail: 企画詳細
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="企画詳細取得にはOwnerまたはTeamロールが必要です",
            )

        project = await db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="プロジェクトが見つかりません",
            )

        # スケジュール取得
        schedule_stmt = select(ProjectSchedule).where(
            ProjectSchedule.project_id == project_id
        )
        schedule_result = await db.execute(schedule_stmt)
        schedule = schedule_result.scalar_one_or_none()

        # AI提案ID取得
        suggestion_stmt = select(AISuggestion).where(
            AISuggestion.adopted_project_id == project_id
        )
        suggestion_result = await db.execute(suggestion_stmt)
        suggestion = suggestion_result.scalar_one_or_none()

        return PlanningProjectDetail(
            id=project.id,
            title=project.name,
            category=None,
            description=project.description,
            type="short",
            status=project.status,
            scheduled_date=schedule.scheduled_date if schedule else None,
            knowledge_id=project.knowledge_id,
            ai_suggestion_id=suggestion.id if suggestion else None,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    @staticmethod
    async def update_project_status(
        db: AsyncSession,
        current_user_role: str,
        project_id: UUID,
        request: ProjectStatusUpdateRequest,
    ) -> PlanningProjectDetail:
        """
        企画ステータスを更新

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            project_id: プロジェクトID
            request: ステータス更新リクエスト

        Returns:
            PlanningProjectDetail: 更新後の企画詳細
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ステータス更新にはOwnerまたはTeamロールが必要です",
            )

        project = await db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="プロジェクトが見つかりません",
            )

        project.status = request.status
        project.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(project)

        return await PlanningService.get_planning_project_detail(
            db, current_user_role, project_id
        )

    @staticmethod
    async def delete_planning_project(
        db: AsyncSession,
        current_user_role: str,
        project_id: UUID,
    ) -> ProjectDeleteResponse:
        """
        企画を削除

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            project_id: プロジェクトID

        Returns:
            ProjectDeleteResponse: 削除結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="企画削除にはOwnerまたはTeamロールが必要です",
            )

        project = await db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="プロジェクトが見つかりません",
            )

        await db.delete(project)
        await db.commit()

        return ProjectDeleteResponse(
            success=True,
            message="プロジェクトを削除しました",
        )

    # ============================================================
    # AI提案チャット関連メソッド
    # ============================================================

    @staticmethod
    async def create_chat_session(
        db: AsyncSession,
        current_user_role: str,
        client_id: UUID,
        request: ChatSessionCreateRequest,
    ) -> ChatSessionCreateResponse:
        """
        チャットセッションを作成

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            client_id: クライアントID
            request: セッション作成リクエスト

        Returns:
            ChatSessionCreateResponse: 作成されたセッション情報
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャットセッション作成にはOwnerまたはTeamロールが必要です",
            )

        session = PlanningChatSession(
            client_id=client_id,
            knowledge_id=request.knowledge_id,
            status=PlanningSessionStatus.ACTIVE,
            messages=[],
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        return ChatSessionCreateResponse(
            session_id=session.id,
            created_at=session.created_at,
        )

    @staticmethod
    async def send_chat_message(
        db: AsyncSession,
        current_user_role: str,
        session_id: UUID,
        request: ChatMessageSendRequest,
    ) -> ChatMessageResponse:
        """
        チャットメッセージを送信（AI応答生成）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            session_id: セッションID
            request: メッセージ送信リクエスト

        Returns:
            ChatMessageResponse: AI応答
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャットメッセージ送信にはOwnerまたはTeamロールが必要です",
            )

        session = await db.get(PlanningChatSession, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="チャットセッションが見つかりません",
            )

        # ユーザーメッセージを追加
        user_message_id = uuid4()
        user_message = {
            "message_id": str(user_message_id),
            "type": "user",
            "content": request.content,
            "suggestions": [],
            "created_at": datetime.utcnow().isoformat(),
        }

        # TODO: AI応答生成（Claude/Gemini API連携）
        # 現在はスタブ実装
        assistant_message_id = uuid4()
        stub_suggestions = [
            AISuggestion(
                id=uuid4(),
                session_id=session_id,
                title=f"【2025年版】{request.content}完全ガイド",
                description=f"{request.content}に関する包括的な解説動画の企画",
                suggestion_type=SuggestionType.SHORT,
                tags=["解説", "2025", "ガイド"],
                estimated_views="50K-100K",
                confidence=0.85,
            ),
            AISuggestion(
                id=uuid4(),
                session_id=session_id,
                title=f"初心者向け{request.content}入門",
                description=f"{request.content}を始める人向けの基礎解説",
                suggestion_type=SuggestionType.SHORT,
                tags=["初心者", "入門", "基礎"],
                estimated_views="30K-50K",
                confidence=0.75,
            ),
        ]

        # 提案をDBに保存
        for suggestion in stub_suggestions:
            db.add(suggestion)

        assistant_message = {
            "message_id": str(assistant_message_id),
            "type": "assistant",
            "content": f"「{request.content}」についての企画案を考えました！ナレッジを参照すると、ターゲット層に合った以下の企画が効果的です。",
            "suggestions": [
                {
                    "id": str(s.id),
                    "title": s.title,
                    "description": s.description,
                    "type": s.suggestion_type.value,
                    "tags": s.tags,
                    "estimated_views": s.estimated_views,
                    "confidence": s.confidence,
                }
                for s in stub_suggestions
            ],
            "created_at": datetime.utcnow().isoformat(),
        }

        # メッセージ履歴を更新
        messages = list(session.messages) if session.messages else []
        messages.append(user_message)
        messages.append(assistant_message)
        session.messages = messages
        session.updated_at = datetime.utcnow()

        await db.commit()

        return ChatMessageResponse(
            message_id=assistant_message_id,
            type="assistant",
            content=assistant_message["content"],
            suggestions=[
                AISuggestionItem(
                    id=s.id,
                    title=s.title,
                    description=s.description,
                    type=s.suggestion_type,
                    tags=s.tags,
                    estimated_views=s.estimated_views,
                    confidence=s.confidence,
                )
                for s in stub_suggestions
            ],
            created_at=datetime.utcnow(),
        )

    @staticmethod
    async def get_chat_history(
        db: AsyncSession,
        current_user_role: str,
        session_id: UUID,
        limit: int = 50,
        before: Optional[str] = None,
    ) -> ChatHistoryResponse:
        """
        チャット履歴を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            session_id: セッションID
            limit: 取得件数
            before: このメッセージID以前を取得

        Returns:
            ChatHistoryResponse: チャット履歴
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャット履歴取得にはOwnerまたはTeamロールが必要です",
            )

        session = await db.get(PlanningChatSession, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="チャットセッションが見つかりません",
            )

        messages = session.messages if session.messages else []

        # beforeでフィルタ
        if before:
            filtered = []
            found = False
            for msg in reversed(messages):
                if found:
                    filtered.insert(0, msg)
                if msg.get("message_id") == before:
                    found = True
            messages = filtered

        # limitで制限
        has_more = len(messages) > limit
        messages = messages[-limit:]

        return ChatHistoryResponse(
            session_id=session_id,
            messages=[
                ChatMessageItem(
                    message_id=UUID(msg["message_id"]),
                    type=msg["type"],
                    content=msg["content"],
                    suggestions=[
                        AISuggestionItem(
                            id=UUID(s["id"]),
                            title=s["title"],
                            description=s.get("description"),
                            type=SuggestionType(s["type"]),
                            tags=s.get("tags"),
                            estimated_views=s.get("estimated_views"),
                            confidence=s.get("confidence"),
                        )
                        for s in msg.get("suggestions", [])
                    ],
                    created_at=datetime.fromisoformat(msg["created_at"]),
                )
                for msg in messages
            ],
            has_more=has_more,
        )

    # ============================================================
    # 提案採用関連メソッド
    # ============================================================

    @staticmethod
    async def adopt_suggestion(
        db: AsyncSession,
        current_user_role: str,
        suggestion_id: UUID,
        client_id: UUID,
        request: SuggestionAdoptRequest,
    ) -> SuggestionAdoptResponse:
        """
        提案を採用（企画として保存）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            suggestion_id: 提案ID
            client_id: クライアントID
            request: 採用リクエスト

        Returns:
            SuggestionAdoptResponse: 採用結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="提案採用にはOwnerまたはTeamロールが必要です",
            )

        suggestion = await db.get(AISuggestion, suggestion_id)
        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="提案が見つかりません",
            )

        if suggestion.is_adopted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この提案は既に採用されています",
            )

        # 明示的なトランザクション管理
        try:
            async with db.begin():
                # プロジェクト作成
                title = request.modifications.get("title", suggestion.title) if request.modifications else suggestion.title
                project = Project(
                    client_id=client_id,
                    name=title,
                    description=suggestion.description,
                    status=ProjectStatus.PLANNING,
                )
                db.add(project)
                await db.flush()

                # スケジュール作成
                if request.scheduled_date:
                    schedule = ProjectSchedule(
                        project_id=project.id,
                        scheduled_date=request.scheduled_date,
                    )
                    db.add(schedule)

                # 提案を更新
                suggestion.is_adopted = True
                suggestion.adopted_project_id = project.id
                suggestion.adopted_at = datetime.utcnow()

            # トランザクション完了後にリフレッシュ
            await db.refresh(project)

            return SuggestionAdoptResponse(
                success=True,
                project={
                    "id": str(project.id),
                    "title": project.name,
                    "status": project.status.value,
                    "scheduled_date": request.scheduled_date.isoformat() if request.scheduled_date else None,
                },
            )
        except HTTPException:
            # HTTPExceptionは再スローする
            raise
        except Exception as e:
            # その他のエラーはロールバックして例外を投げる
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"提案の採用に失敗しました: {str(e)}",
            )

    @staticmethod
    async def get_adopted_suggestions(
        db: AsyncSession,
        current_user_role: str,
        session_id: Optional[UUID] = None,
        limit: int = 50,
    ) -> AdoptedSuggestionsResponse:
        """
        採用済み提案一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            session_id: セッションIDでフィルタ
            limit: 取得件数

        Returns:
            AdoptedSuggestionsResponse: 採用済み提案一覧
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="採用済み提案取得にはOwnerまたはTeamロールが必要です",
            )

        stmt = (
            select(AISuggestion)
            .options(joinedload(AISuggestion.adopted_project))
            .where(AISuggestion.is_adopted == True)
            .order_by(AISuggestion.adopted_at.desc())
        )

        if session_id:
            stmt = stmt.where(AISuggestion.session_id == session_id)

        stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        suggestions = result.scalars().unique().all()

        # スケジュール情報を取得
        project_ids = [s.adopted_project_id for s in suggestions if s.adopted_project_id]
        schedules = {}
        if project_ids:
            schedule_stmt = select(ProjectSchedule).where(
                ProjectSchedule.project_id.in_(project_ids)
            )
            schedule_result = await db.execute(schedule_stmt)
            schedules = {s.project_id: s for s in schedule_result.scalars().all()}

        items = []
        for suggestion in suggestions:
            if suggestion.adopted_project:
                schedule = schedules.get(suggestion.adopted_project_id)
                items.append(
                    AdoptedSuggestionItem(
                        suggestion_id=suggestion.id,
                        title=suggestion.title,
                        type=suggestion.suggestion_type,
                        project_id=suggestion.adopted_project_id,
                        project_status=suggestion.adopted_project.status,
                        scheduled_date=schedule.scheduled_date if schedule else None,
                        adopted_at=suggestion.adopted_at,
                    )
                )

        return AdoptedSuggestionsResponse(
            suggestions=items,
            total=len(items),
        )

    @staticmethod
    async def unadopt_suggestion(
        db: AsyncSession,
        current_user_role: str,
        suggestion_id: UUID,
    ) -> SuggestionUnadoptResponse:
        """
        提案の採用を取り消し

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            suggestion_id: 提案ID

        Returns:
            SuggestionUnadoptResponse: 取り消し結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="採用取り消しにはOwnerまたはTeamロールが必要です",
            )

        suggestion = await db.get(AISuggestion, suggestion_id)
        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="提案が見つかりません",
            )

        if not suggestion.is_adopted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この提案は採用されていません",
            )

        # プロジェクトも削除
        if suggestion.adopted_project_id:
            project = await db.get(Project, suggestion.adopted_project_id)
            if project:
                await db.delete(project)

        # 提案の採用状態をリセット
        suggestion.is_adopted = False
        suggestion.adopted_project_id = None
        suggestion.adopted_at = None

        await db.commit()

        return SuggestionUnadoptResponse(
            success=True,
            message="提案の採用を取り消しました",
        )

    # ============================================================
    # コンテキスト・統計関連メソッド
    # ============================================================

    @staticmethod
    async def get_planning_context(
        db: AsyncSession,
        current_user_role: str,
        knowledge_id: Optional[UUID] = None,
    ) -> PlanningContextResponse:
        """
        AI提案用コンテキストを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            knowledge_id: ナレッジID

        Returns:
            PlanningContextResponse: コンテキスト情報
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="コンテキスト取得にはOwnerまたはTeamロールが必要です",
            )

        # TODO: 実際のトレンドデータ取得（SerpAPI連携）
        trends = [
            TrendItem(keyword="AI効率化", volume=15000, growth=25),
            TrendItem(keyword="YouTube Shorts", volume=45000, growth=18),
            TrendItem(keyword="動画マーケティング", volume=8000, growth=12),
        ]

        knowledge_context = None
        if knowledge_id:
            knowledge = await db.get(Knowledge, knowledge_id)
            if knowledge:
                # TODO: ナレッジから実際のコンテキストを抽出
                knowledge_context = KnowledgeContext(
                    target_persona="30-40代ビジネスパーソン",
                    insights=["時短を求めている", "実践的な内容を好む"],
                    successful_patterns=["How-to形式", "比較形式"],
                )

        # 最近のプロジェクト取得
        recent_stmt = (
            select(Project)
            .where(Project.status == ProjectStatus.PUBLISHED)
            .order_by(Project.updated_at.desc())
            .limit(5)
        )
        result = await db.execute(recent_stmt)
        recent_projects_db = result.scalars().all()

        recent_projects = [
            RecentProjectItem(
                title=p.name,
                performance="good",  # TODO: 実際のパフォーマンス算出
            )
            for p in recent_projects_db
        ]

        return PlanningContextResponse(
            trends=trends,
            knowledge=knowledge_context,
            recent_projects=recent_projects,
        )

    @staticmethod
    async def get_planning_stats(
        db: AsyncSession,
        current_user_role: str,
    ) -> PlanningStatsResponse:
        """
        企画統計を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール

        Returns:
            PlanningStatsResponse: 統計情報
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="統計取得にはOwnerまたはTeamロールが必要です",
            )

        # 総数
        total_stmt = select(func.count()).select_from(Project)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar() or 0

        # ステータス別
        status_stats = StatusStats()
        for status_enum in ProjectStatus:
            stmt = select(func.count()).select_from(Project).where(
                Project.status == status_enum
            )
            result = await db.execute(stmt)
            count = result.scalar() or 0
            setattr(status_stats, status_enum.value, count)

        # 種別（TODO: プロジェクトにtype属性追加後に実装）
        type_stats = TypeStats(short=total, long=0)

        # 今月の統計
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)

        created_stmt = select(func.count()).select_from(Project).where(
            Project.created_at >= month_start
        )
        created_result = await db.execute(created_stmt)
        created = created_result.scalar() or 0

        published_stmt = select(func.count()).select_from(Project).where(
            and_(
                Project.status == ProjectStatus.PUBLISHED,
                Project.updated_at >= month_start,
            )
        )
        published_result = await db.execute(published_stmt)
        published = published_result.scalar() or 0

        return PlanningStatsResponse(
            total_projects=total,
            by_status=status_stats,
            by_type=type_stats,
            this_month=MonthStats(created=created, published=published),
        )
