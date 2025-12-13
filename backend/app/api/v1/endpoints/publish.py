"""
公開・配信エンドポイント

YouTube/TikTok/Instagram公開API
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.schemas.publish import (
    YouTubePublishRequest,
    YouTubePublishResponse,
    TikTokPublishRequest,
    TikTokPublishResponse,
    InstagramPublishRequest,
    InstagramPublishResponse,
    PublicationResponse,
    ScheduleCreateRequest,
    ScheduleResponse,
    ScheduleCreateResponse,
)
from app.services.publish_service import PublishService, ScheduleService

router = APIRouter()


@router.post(
    "/youtube",
    response_model=YouTubePublishResponse,
    summary="YouTube公開",
    description="動画をYouTubeに公開します。",
)
async def publish_to_youtube(
    request: YouTubePublishRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> YouTubePublishResponse:
    """YouTube公開エンドポイント"""
    return await PublishService.publish_to_youtube(db, current_user_role, request)


@router.post(
    "/tiktok",
    response_model=TikTokPublishResponse,
    summary="TikTok公開",
    description="動画をTikTokに公開します。",
)
async def publish_to_tiktok(
    request: TikTokPublishRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> TikTokPublishResponse:
    """TikTok公開エンドポイント"""
    return await PublishService.publish_to_tiktok(db, current_user_role, request)


@router.post(
    "/instagram",
    response_model=InstagramPublishResponse,
    summary="Instagram公開",
    description="動画をInstagramに公開します。",
)
async def publish_to_instagram(
    request: InstagramPublishRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> InstagramPublishResponse:
    """Instagram公開エンドポイント"""
    return await PublishService.publish_to_instagram(db, current_user_role, request)


@router.get(
    "/{publication_id}",
    response_model=PublicationResponse,
    summary="公開情報取得",
    description="指定した公開情報の詳細を取得します。",
)
async def get_publication(
    publication_id: UUID = Path(..., description="公開ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PublicationResponse:
    """公開情報取得エンドポイント"""
    return await PublishService.get_publication(db, current_user_role, publication_id)


@router.post(
    "/schedule",
    response_model=ScheduleCreateResponse,
    summary="スケジュール作成",
    description="複数プラットフォームへの公開スケジュールを作成します。",
)
async def create_schedule(
    request: ScheduleCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScheduleCreateResponse:
    """スケジュール作成エンドポイント"""
    return await ScheduleService.create_schedule(db, current_user_role, request)


@router.get(
    "/schedule/{schedule_id}",
    response_model=ScheduleResponse,
    summary="スケジュール取得",
    description="指定したスケジュールの詳細を取得します。",
)
async def get_schedule(
    schedule_id: UUID = Path(..., description="スケジュールID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ScheduleResponse:
    """スケジュール取得エンドポイント"""
    return await ScheduleService.get_schedule(db, current_user_role, schedule_id)
