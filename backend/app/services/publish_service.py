"""
公開・配信サービス

YouTube/TikTok/Instagram公開のビジネスロジック
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Video
from app.models.publish import (
    Publication,
    PublishSchedule,
    PublishPlatform,
    PublishStatus,
)
from app.models.user import UserRole
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


class PublishService:
    """公開サービス"""

    @staticmethod
    async def publish_to_youtube(
        db: AsyncSession,
        current_user_role: str,
        request: YouTubePublishRequest,
    ) -> YouTubePublishResponse:
        """
        YouTubeに動画を公開

        YouTube Data API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: YouTube公開リクエスト

        Returns:
            YouTubePublishResponse: 公開結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="YouTube公開にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # 公開レコード作成（スタブ：即座に完了）
        publication = Publication(
            video_id=request.video_id,
            platform=PublishPlatform.YOUTUBE,
            status=PublishStatus.PUBLISHED,
            title=request.title,
            description=request.description,
            tags=request.tags,
            platform_video_id="yt_stub_video_12345",
            platform_url="https://www.youtube.com/watch?v=yt_stub_video_12345",
            scheduled_at=request.scheduled_at,
            published_at=datetime.utcnow() if not request.scheduled_at else None,
            publish_options={
                "category_id": request.category_id,
                "privacy_status": request.privacy_status,
            },
        )
        db.add(publication)
        await db.commit()
        await db.refresh(publication)

        return YouTubePublishResponse(
            publication_id=publication.id,
            platform=publication.platform,
            status=publication.status,
            youtube_video_id=publication.platform_video_id,
            youtube_url=publication.platform_url,
            message="YouTubeへの公開が完了しました",
        )

    @staticmethod
    async def publish_to_tiktok(
        db: AsyncSession,
        current_user_role: str,
        request: TikTokPublishRequest,
    ) -> TikTokPublishResponse:
        """
        TikTokに動画を公開

        TikTok API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: TikTok公開リクエスト

        Returns:
            TikTokPublishResponse: 公開結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="TikTok公開にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # 公開レコード作成（スタブ：即座に完了）
        publication = Publication(
            video_id=request.video_id,
            platform=PublishPlatform.TIKTOK,
            status=PublishStatus.PUBLISHED,
            title=request.title,
            tags=request.tags,
            platform_video_id="tt_stub_video_67890",
            platform_url="https://www.tiktok.com/@user/video/tt_stub_video_67890",
            scheduled_at=request.scheduled_at,
            published_at=datetime.utcnow() if not request.scheduled_at else None,
            publish_options={
                "allow_comments": request.allow_comments,
                "allow_duet": request.allow_duet,
                "allow_stitch": request.allow_stitch,
            },
        )
        db.add(publication)
        await db.commit()
        await db.refresh(publication)

        return TikTokPublishResponse(
            publication_id=publication.id,
            platform=publication.platform,
            status=publication.status,
            tiktok_video_id=publication.platform_video_id,
            tiktok_url=publication.platform_url,
            message="TikTokへの公開が完了しました",
        )

    @staticmethod
    async def publish_to_instagram(
        db: AsyncSession,
        current_user_role: str,
        request: InstagramPublishRequest,
    ) -> InstagramPublishResponse:
        """
        Instagramに動画を公開

        Instagram Graph API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: Instagram公開リクエスト

        Returns:
            InstagramPublishResponse: 公開結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Instagram公開にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # 公開レコード作成（スタブ：即座に完了）
        publication = Publication(
            video_id=request.video_id,
            platform=PublishPlatform.INSTAGRAM,
            status=PublishStatus.PUBLISHED,
            description=request.caption,
            tags=request.tags,
            platform_video_id="ig_stub_media_11111",
            platform_url="https://www.instagram.com/p/ig_stub_media_11111/",
            scheduled_at=request.scheduled_at,
            published_at=datetime.utcnow() if not request.scheduled_at else None,
            publish_options={
                "location_id": request.location_id,
                "share_to_feed": request.share_to_feed,
            },
        )
        db.add(publication)
        await db.commit()
        await db.refresh(publication)

        return InstagramPublishResponse(
            publication_id=publication.id,
            platform=publication.platform,
            status=publication.status,
            instagram_media_id=publication.platform_video_id,
            instagram_url=publication.platform_url,
            message="Instagramへの公開が完了しました",
        )

    @staticmethod
    async def get_publication(
        db: AsyncSession,
        current_user_role: str,
        publication_id: UUID,
    ) -> PublicationResponse:
        """
        公開情報を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            publication_id: 公開ID

        Returns:
            PublicationResponse: 公開情報
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="公開情報取得にはOwnerまたはTeamロールが必要です",
            )

        publication = await db.get(Publication, publication_id)
        if not publication:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="公開情報が見つかりません",
            )

        return PublicationResponse(
            id=publication.id,
            video_id=publication.video_id,
            platform=publication.platform,
            status=publication.status,
            title=publication.title,
            description=publication.description,
            tags=publication.tags,
            platform_video_id=publication.platform_video_id,
            platform_url=publication.platform_url,
            scheduled_at=publication.scheduled_at,
            published_at=publication.published_at,
            publish_options=publication.publish_options,
            error_message=publication.error_message,
            created_at=publication.created_at,
            updated_at=publication.updated_at,
        )


class ScheduleService:
    """スケジュール公開サービス"""

    @staticmethod
    async def create_schedule(
        db: AsyncSession,
        current_user_role: str,
        request: ScheduleCreateRequest,
    ) -> ScheduleCreateResponse:
        """
        公開スケジュールを作成

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: スケジュール作成リクエスト

        Returns:
            ScheduleCreateResponse: 作成結果
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="スケジュール作成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # スケジュール作成
        schedule = PublishSchedule(
            video_id=request.video_id,
            platforms=[p.value for p in request.platforms],
            scheduled_at=request.scheduled_at,
            status=PublishStatus.SCHEDULED,
            recurrence=request.recurrence,
            schedule_options=request.schedule_options,
        )
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)

        return ScheduleCreateResponse(
            schedule_id=schedule.id,
            status=schedule.status,
            message=f"公開スケジュールを作成しました（{schedule.scheduled_at}）",
        )

    @staticmethod
    async def get_schedule(
        db: AsyncSession,
        current_user_role: str,
        schedule_id: UUID,
    ) -> ScheduleResponse:
        """
        スケジュールを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            schedule_id: スケジュールID

        Returns:
            ScheduleResponse: スケジュール情報
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="スケジュール取得にはOwnerまたはTeamロールが必要です",
            )

        schedule = await db.get(PublishSchedule, schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="スケジュールが見つかりません",
            )

        return ScheduleResponse(
            id=schedule.id,
            video_id=schedule.video_id,
            platforms=schedule.platforms,
            scheduled_at=schedule.scheduled_at,
            status=schedule.status,
            recurrence=schedule.recurrence,
            schedule_options=schedule.schedule_options,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at,
        )
