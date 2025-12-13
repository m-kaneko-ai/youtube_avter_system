"""
企画・計画機能エンドポイント

カレンダー、企画一覧、AI提案チャット、統計情報のAPIエンドポイント
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db_session,
    get_current_user_id,
    get_current_user_role,
    get_current_client_id,
)
from app.schemas.planning import (
    CalendarResponse,
    ScheduleUpdateRequest,
    ScheduleUpdateResponse,
    PlanningProjectListResponse,
    PlanningProjectDetail,
    ProjectStatusUpdateRequest,
    ProjectDeleteResponse,
    ChatSessionCreateRequest,
    ChatSessionCreateResponse,
    ChatMessageSendRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    SuggestionAdoptRequest,
    SuggestionAdoptResponse,
    AdoptedSuggestionsResponse,
    SuggestionUnadoptResponse,
    PlanningContextResponse,
    PlanningStatsResponse,
)
from app.services.planning_service import PlanningService

router = APIRouter()


# ============================================================
# カレンダー関連エンドポイント
# ============================================================

@router.get(
    "/calendar",
    response_model=CalendarResponse,
    summary="カレンダーデータ取得",
    description="指定した年月のプロジェクトスケジュールを取得します。",
)
async def get_calendar(
    year: int = Query(..., ge=2020, le=2100, description="年"),
    month: int = Query(..., ge=1, le=12, description="月（1-12）"),
    knowledge_id: Optional[UUID] = Query(None, description="ナレッジIDでフィルタ"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> CalendarResponse:
    """カレンダーデータ取得エンドポイント"""
    return await PlanningService.get_calendar(
        db, current_user_role, year, month, knowledge_id
    )


@router.patch(
    "/calendar/schedule",
    response_model=ScheduleUpdateResponse,
    summary="スケジュール更新",
    description="プロジェクトのスケジュール日を設定・変更します。",
)
async def update_schedule(
    request: ScheduleUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScheduleUpdateResponse:
    """スケジュール更新エンドポイント"""
    return await PlanningService.update_schedule(db, current_user_role, request)


# ============================================================
# 企画一覧関連エンドポイント
# ============================================================

@router.get(
    "/projects",
    response_model=PlanningProjectListResponse,
    summary="企画一覧取得",
    description="企画一覧をフィルタ・ソート・ページネーション付きで取得します。",
)
async def get_planning_projects(
    status: Optional[str] = Query(None, description="ステータスフィルタ（all/planning/production/scheduled/published）"),
    type: Optional[str] = Query(None, description="種類フィルタ（all/short/long）"),
    search: Optional[str] = Query(None, description="タイトル検索"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    sort: Optional[str] = Query(None, description="ソート（scheduled_date_asc/scheduled_date_desc/created_at_desc）"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PlanningProjectListResponse:
    """企画一覧取得エンドポイント"""
    return await PlanningService.get_planning_projects(
        db, current_user_role, status, type, search, page, limit, sort
    )


@router.get(
    "/projects/{project_id}",
    response_model=PlanningProjectDetail,
    summary="企画詳細取得",
    description="指定したプロジェクトの詳細情報を取得します。",
)
async def get_planning_project_detail(
    project_id: UUID = Path(..., description="プロジェクトID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PlanningProjectDetail:
    """企画詳細取得エンドポイント"""
    return await PlanningService.get_planning_project_detail(
        db, current_user_role, project_id
    )


@router.patch(
    "/projects/{project_id}/status",
    response_model=PlanningProjectDetail,
    summary="企画ステータス更新",
    description="プロジェクトのステータスを更新します。",
)
async def update_project_status(
    project_id: UUID = Path(..., description="プロジェクトID"),
    request: ProjectStatusUpdateRequest = ...,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PlanningProjectDetail:
    """企画ステータス更新エンドポイント"""
    return await PlanningService.update_project_status(
        db, current_user_role, project_id, request
    )


@router.delete(
    "/projects/{project_id}",
    response_model=ProjectDeleteResponse,
    summary="企画削除",
    description="指定したプロジェクトを削除します。",
)
async def delete_planning_project(
    project_id: UUID = Path(..., description="プロジェクトID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ProjectDeleteResponse:
    """企画削除エンドポイント"""
    return await PlanningService.delete_planning_project(
        db, current_user_role, project_id
    )


# ============================================================
# AI提案チャット関連エンドポイント
# ============================================================

@router.post(
    "/chat/sessions",
    response_model=ChatSessionCreateResponse,
    summary="チャットセッション作成",
    description="新しいAI提案チャットセッションを作成します。",
)
async def create_chat_session(
    request: ChatSessionCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    current_client_id: UUID = Depends(get_current_client_id),
) -> ChatSessionCreateResponse:
    """チャットセッション作成エンドポイント"""
    return await PlanningService.create_chat_session(
        db, current_user_role, current_client_id, request
    )


@router.post(
    "/chat/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    summary="チャットメッセージ送信",
    description="チャットセッションにメッセージを送信し、AI応答を取得します。",
)
async def send_chat_message(
    session_id: UUID = Path(..., description="セッションID"),
    request: ChatMessageSendRequest = ...,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ChatMessageResponse:
    """チャットメッセージ送信エンドポイント"""
    return await PlanningService.send_chat_message(
        db, current_user_role, session_id, request
    )


@router.get(
    "/chat/sessions/{session_id}/messages",
    response_model=ChatHistoryResponse,
    summary="チャット履歴取得",
    description="チャットセッションのメッセージ履歴を取得します。",
)
async def get_chat_history(
    session_id: UUID = Path(..., description="セッションID"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    before: Optional[str] = Query(None, description="このメッセージID以前を取得"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ChatHistoryResponse:
    """チャット履歴取得エンドポイント"""
    return await PlanningService.get_chat_history(
        db, current_user_role, session_id, limit, before
    )


# ============================================================
# 提案採用関連エンドポイント
# ============================================================

@router.post(
    "/chat/suggestions/{suggestion_id}/adopt",
    response_model=SuggestionAdoptResponse,
    summary="提案採用",
    description="AI提案を採用し、新しいプロジェクトとして保存します。",
)
async def adopt_suggestion(
    suggestion_id: UUID = Path(..., description="提案ID"),
    request: SuggestionAdoptRequest = SuggestionAdoptRequest(),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    current_client_id: UUID = Depends(get_current_client_id),
) -> SuggestionAdoptResponse:
    """提案採用エンドポイント"""
    return await PlanningService.adopt_suggestion(
        db, current_user_role, suggestion_id, current_client_id, request
    )


@router.get(
    "/chat/suggestions/adopted",
    response_model=AdoptedSuggestionsResponse,
    summary="採用済み提案一覧取得",
    description="採用済みの提案一覧を取得します。",
)
async def get_adopted_suggestions(
    session_id: Optional[UUID] = Query(None, description="セッションIDでフィルタ"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> AdoptedSuggestionsResponse:
    """採用済み提案一覧取得エンドポイント"""
    return await PlanningService.get_adopted_suggestions(
        db, current_user_role, session_id, limit
    )


@router.delete(
    "/chat/suggestions/{suggestion_id}/adopt",
    response_model=SuggestionUnadoptResponse,
    summary="採用取り消し",
    description="提案の採用を取り消し、関連プロジェクトを削除します。",
)
async def unadopt_suggestion(
    suggestion_id: UUID = Path(..., description="提案ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> SuggestionUnadoptResponse:
    """採用取り消しエンドポイント"""
    return await PlanningService.unadopt_suggestion(
        db, current_user_role, suggestion_id
    )


# ============================================================
# コンテキスト・統計関連エンドポイント
# ============================================================

@router.get(
    "/chat/context",
    response_model=PlanningContextResponse,
    summary="AI提案用コンテキスト取得",
    description="AI提案に必要なトレンド・ナレッジ・過去実績のコンテキストを取得します。",
)
async def get_planning_context(
    knowledge_id: Optional[UUID] = Query(None, description="ナレッジID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PlanningContextResponse:
    """AI提案用コンテキスト取得エンドポイント"""
    return await PlanningService.get_planning_context(
        db, current_user_role, knowledge_id
    )


@router.get(
    "/stats",
    response_model=PlanningStatsResponse,
    summary="企画統計取得",
    description="企画の統計情報（ステータス別・種別・月間）を取得します。",
)
async def get_planning_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PlanningStatsResponse:
    """企画統計取得エンドポイント"""
    return await PlanningService.get_planning_stats(db, current_user_role)
