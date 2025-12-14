"""
シリーズ管理APIエンドポイント

シリーズと動画アイテムのCRUD操作
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.series import (
    Series,
    SeriesVideoItem,
    SeriesPerformanceLog,
    SeriesStatus,
    SeriesType,
)
from app.models.project import Video
from app.schemas.series import (
    SeriesCreate,
    SeriesUpdate,
    SeriesResponse,
    SeriesListResponse,
    SeriesWithVideosResponse,
    SeriesVideoItemCreate,
    SeriesVideoItemUpdate,
    SeriesVideoItemResponse,
    SeriesStats,
    SeriesPerformanceResponse,
    SeriesDailyStats,
    ReorderVideosRequest,
    BulkAddVideosRequest,
    VideoInfo,
)

router = APIRouter()


# ============================================================
# Helper Functions
# ============================================================

def video_to_info(video: Optional[Video]) -> Optional[VideoInfo]:
    """VideoモデルをVideoInfoに変換"""
    if not video:
        return None
    return VideoInfo(
        id=str(video.id),
        title=video.title,
        youtube_url=video.youtube_url,
        status=video.status.value if video.status else "unknown"
    )


# ============================================================
# Series CRUD Endpoints
# ============================================================

@router.get("/", response_model=SeriesListResponse)
async def get_series_list(
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    series_type: Optional[str] = Query(None, description="タイプでフィルタ"),
    project_id: Optional[str] = Query(None, description="プロジェクトIDでフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズ一覧を取得"""
    query = select(Series)

    if status:
        query = query.where(Series.status == status)
    if series_type:
        query = query.where(Series.series_type == series_type)
    if project_id:
        query = query.where(Series.project_id == UUID(project_id))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(Series.created_at.desc())
    result = await db.execute(query)
    series_list = result.scalars().all()

    series_responses = [
        SeriesResponse(
            id=str(s.id),
            name=s.name,
            description=s.description,
            series_type=s.series_type,
            project_id=str(s.project_id) if s.project_id else None,
            knowledge_id=str(s.knowledge_id) if s.knowledge_id else None,
            status=s.status,
            youtube_playlist_id=s.youtube_playlist_id,
            youtube_playlist_url=s.youtube_playlist_url,
            thumbnail_url=s.thumbnail_url,
            tags=s.tags,
            start_date=s.start_date,
            end_date=s.end_date,
            target_video_count=s.target_video_count,
            release_frequency=s.release_frequency,
            total_videos=s.total_videos,
            total_views=s.total_views,
            total_watch_time_hours=s.total_watch_time_hours,
            avg_view_duration_seconds=s.avg_view_duration_seconds,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in series_list
    ]

    return SeriesListResponse(series=series_responses, total=total)


@router.post("/", response_model=SeriesResponse)
async def create_series(
    data: SeriesCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """シリーズを作成"""
    series = Series(
        name=data.name,
        description=data.description,
        series_type=data.series_type,
        project_id=UUID(data.project_id) if data.project_id else None,
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        youtube_playlist_id=data.youtube_playlist_id,
        youtube_playlist_url=data.youtube_playlist_url,
        thumbnail_url=data.thumbnail_url,
        tags=data.tags,
        start_date=data.start_date,
        end_date=data.end_date,
        target_video_count=data.target_video_count,
        release_frequency=data.release_frequency,
        status=SeriesStatus.DRAFT,
        created_by=current_user.id if hasattr(current_user, 'id') else None,
    )
    db.add(series)
    await db.commit()
    await db.refresh(series)

    return SeriesResponse(
        id=str(series.id),
        name=series.name,
        description=series.description,
        series_type=series.series_type,
        project_id=str(series.project_id) if series.project_id else None,
        knowledge_id=str(series.knowledge_id) if series.knowledge_id else None,
        status=series.status,
        youtube_playlist_id=series.youtube_playlist_id,
        youtube_playlist_url=series.youtube_playlist_url,
        thumbnail_url=series.thumbnail_url,
        tags=series.tags,
        start_date=series.start_date,
        end_date=series.end_date,
        target_video_count=series.target_video_count,
        release_frequency=series.release_frequency,
        total_videos=series.total_videos,
        total_views=series.total_views,
        total_watch_time_hours=series.total_watch_time_hours,
        avg_view_duration_seconds=series.avg_view_duration_seconds,
        created_at=series.created_at,
        updated_at=series.updated_at,
    )


@router.get("/{series_id}", response_model=SeriesWithVideosResponse)
async def get_series(
    series_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズ詳細を取得（動画一覧含む）"""
    result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Get video items
    items_result = await db.execute(
        select(SeriesVideoItem)
        .where(SeriesVideoItem.series_id == UUID(series_id))
        .order_by(SeriesVideoItem.order_index)
    )
    items = items_result.scalars().all()

    # Build video item responses
    video_items = []
    for item in items:
        video_result = await db.execute(
            select(Video).where(Video.id == item.video_id)
        )
        video = video_result.scalar_one_or_none()

        video_items.append(SeriesVideoItemResponse(
            id=str(item.id),
            series_id=str(item.series_id),
            video_id=str(item.video_id),
            order_index=item.order_index,
            episode_number=item.episode_number,
            episode_title=item.episode_title,
            is_published=item.is_published,
            published_at=item.published_at,
            scheduled_at=item.scheduled_at,
            views=item.views,
            likes=item.likes,
            comments=item.comments,
            avg_view_duration_seconds=item.avg_view_duration_seconds,
            retention_rate=item.retention_rate,
            video=video_to_info(video),
            added_at=item.added_at,
            updated_at=item.updated_at,
        ))

    return SeriesWithVideosResponse(
        id=str(series.id),
        name=series.name,
        description=series.description,
        series_type=series.series_type,
        project_id=str(series.project_id) if series.project_id else None,
        knowledge_id=str(series.knowledge_id) if series.knowledge_id else None,
        status=series.status,
        youtube_playlist_id=series.youtube_playlist_id,
        youtube_playlist_url=series.youtube_playlist_url,
        thumbnail_url=series.thumbnail_url,
        tags=series.tags,
        start_date=series.start_date,
        end_date=series.end_date,
        target_video_count=series.target_video_count,
        release_frequency=series.release_frequency,
        total_videos=series.total_videos,
        total_views=series.total_views,
        total_watch_time_hours=series.total_watch_time_hours,
        avg_view_duration_seconds=series.avg_view_duration_seconds,
        created_at=series.created_at,
        updated_at=series.updated_at,
        video_items=video_items,
    )


@router.put("/{series_id}", response_model=SeriesResponse)
async def update_series(
    series_id: str,
    data: SeriesUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズを更新"""
    result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Update fields
    if data.name is not None:
        series.name = data.name
    if data.description is not None:
        series.description = data.description
    if data.series_type is not None:
        series.series_type = data.series_type
    if data.status is not None:
        series.status = data.status
    if data.youtube_playlist_id is not None:
        series.youtube_playlist_id = data.youtube_playlist_id
    if data.youtube_playlist_url is not None:
        series.youtube_playlist_url = data.youtube_playlist_url
    if data.thumbnail_url is not None:
        series.thumbnail_url = data.thumbnail_url
    if data.tags is not None:
        series.tags = data.tags
    if data.start_date is not None:
        series.start_date = data.start_date
    if data.end_date is not None:
        series.end_date = data.end_date
    if data.target_video_count is not None:
        series.target_video_count = data.target_video_count
    if data.release_frequency is not None:
        series.release_frequency = data.release_frequency

    series.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(series)

    return SeriesResponse(
        id=str(series.id),
        name=series.name,
        description=series.description,
        series_type=series.series_type,
        project_id=str(series.project_id) if series.project_id else None,
        knowledge_id=str(series.knowledge_id) if series.knowledge_id else None,
        status=series.status,
        youtube_playlist_id=series.youtube_playlist_id,
        youtube_playlist_url=series.youtube_playlist_url,
        thumbnail_url=series.thumbnail_url,
        tags=series.tags,
        start_date=series.start_date,
        end_date=series.end_date,
        target_video_count=series.target_video_count,
        release_frequency=series.release_frequency,
        total_videos=series.total_videos,
        total_views=series.total_views,
        total_watch_time_hours=series.total_watch_time_hours,
        avg_view_duration_seconds=series.avg_view_duration_seconds,
        created_at=series.created_at,
        updated_at=series.updated_at,
    )


@router.delete("/{series_id}")
async def delete_series(
    series_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズを削除"""
    result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    await db.delete(series)
    await db.commit()

    return {"success": True, "message": "シリーズを削除しました"}


# ============================================================
# Video Item Endpoints
# ============================================================

@router.post("/{series_id}/videos", response_model=SeriesVideoItemResponse)
async def add_video_to_series(
    series_id: str,
    data: SeriesVideoItemCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズに動画を追加"""
    # Verify series exists
    series_result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = series_result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Verify video exists
    video_result = await db.execute(
        select(Video).where(Video.id == UUID(data.video_id))
    )
    video = video_result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="動画が見つかりません")

    # Determine order index
    order_index = data.order_index
    if order_index is None:
        max_result = await db.execute(
            select(func.max(SeriesVideoItem.order_index))
            .where(SeriesVideoItem.series_id == UUID(series_id))
        )
        max_order = max_result.scalar() or -1
        order_index = max_order + 1

    item = SeriesVideoItem(
        series_id=UUID(series_id),
        video_id=UUID(data.video_id),
        order_index=order_index,
        episode_number=data.episode_number,
        episode_title=data.episode_title,
        scheduled_at=data.scheduled_at,
    )
    db.add(item)

    # Update series video count
    series.total_videos += 1
    series.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(item)

    return SeriesVideoItemResponse(
        id=str(item.id),
        series_id=str(item.series_id),
        video_id=str(item.video_id),
        order_index=item.order_index,
        episode_number=item.episode_number,
        episode_title=item.episode_title,
        is_published=item.is_published,
        published_at=item.published_at,
        scheduled_at=item.scheduled_at,
        views=item.views,
        likes=item.likes,
        comments=item.comments,
        avg_view_duration_seconds=item.avg_view_duration_seconds,
        retention_rate=item.retention_rate,
        video=video_to_info(video),
        added_at=item.added_at,
        updated_at=item.updated_at,
    )


@router.post("/{series_id}/videos/bulk", response_model=List[SeriesVideoItemResponse])
async def bulk_add_videos(
    series_id: str,
    data: BulkAddVideosRequest,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズに動画を一括追加"""
    # Verify series exists
    series_result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = series_result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Get max order index
    max_result = await db.execute(
        select(func.max(SeriesVideoItem.order_index))
        .where(SeriesVideoItem.series_id == UUID(series_id))
    )
    max_order = max_result.scalar() or -1

    items = []
    episode_num = data.start_episode_number or 1

    for i, video_id in enumerate(data.video_ids):
        # Verify video exists
        video_result = await db.execute(
            select(Video).where(Video.id == UUID(video_id))
        )
        video = video_result.scalar_one_or_none()
        if not video:
            continue

        item = SeriesVideoItem(
            series_id=UUID(series_id),
            video_id=UUID(video_id),
            order_index=max_order + i + 1,
            episode_number=episode_num + i if data.start_episode_number else None,
        )
        db.add(item)
        items.append((item, video))

    # Update series video count
    series.total_videos += len(items)
    series.updated_at = datetime.utcnow()

    await db.commit()

    responses = []
    for item, video in items:
        await db.refresh(item)
        responses.append(SeriesVideoItemResponse(
            id=str(item.id),
            series_id=str(item.series_id),
            video_id=str(item.video_id),
            order_index=item.order_index,
            episode_number=item.episode_number,
            episode_title=item.episode_title,
            is_published=item.is_published,
            published_at=item.published_at,
            scheduled_at=item.scheduled_at,
            views=item.views,
            likes=item.likes,
            comments=item.comments,
            avg_view_duration_seconds=item.avg_view_duration_seconds,
            retention_rate=item.retention_rate,
            video=video_to_info(video),
            added_at=item.added_at,
            updated_at=item.updated_at,
        ))

    return responses


@router.put("/{series_id}/videos/reorder")
async def reorder_videos(
    series_id: str,
    data: ReorderVideosRequest,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """動画の並び順を変更"""
    # Verify series exists
    series_result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = series_result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Update order indices
    for index, video_id in enumerate(data.video_ids):
        await db.execute(
            update(SeriesVideoItem)
            .where(SeriesVideoItem.series_id == UUID(series_id))
            .where(SeriesVideoItem.video_id == UUID(video_id))
            .values(order_index=index, updated_at=datetime.utcnow())
        )

    await db.commit()

    return {"success": True, "message": "並び順を更新しました"}


@router.delete("/{series_id}/videos/{video_id}")
async def remove_video_from_series(
    series_id: str,
    video_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズから動画を削除"""
    result = await db.execute(
        select(SeriesVideoItem)
        .where(SeriesVideoItem.series_id == UUID(series_id))
        .where(SeriesVideoItem.video_id == UUID(video_id))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="動画アイテムが見つかりません")

    # Update series video count
    series_result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = series_result.scalar_one_or_none()
    if series:
        series.total_videos = max(0, series.total_videos - 1)
        series.updated_at = datetime.utcnow()

    await db.delete(item)
    await db.commit()

    return {"success": True, "message": "動画をシリーズから削除しました"}


# ============================================================
# Stats & Performance Endpoints
# ============================================================

@router.get("/stats/summary", response_model=SeriesStats)
async def get_series_stats(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズ統計サマリーを取得"""
    # Total series
    total_result = await db.execute(
        select(func.count()).select_from(Series)
    )
    total_series = total_result.scalar() or 0

    # Active series
    active_result = await db.execute(
        select(func.count()).select_from(Series).where(
            Series.status == SeriesStatus.ACTIVE
        )
    )
    active_series = active_result.scalar() or 0

    # Total videos and views
    videos_result = await db.execute(
        select(func.sum(Series.total_videos))
    )
    total_videos = videos_result.scalar() or 0

    views_result = await db.execute(
        select(func.sum(Series.total_views))
    )
    total_views = views_result.scalar() or 0

    # Average videos per series
    avg_videos = total_videos / total_series if total_series > 0 else 0.0

    return SeriesStats(
        total_series=total_series,
        active_series=active_series,
        total_videos=total_videos,
        total_views=total_views,
        avg_videos_per_series=round(avg_videos, 1),
    )


@router.get("/{series_id}/performance", response_model=SeriesPerformanceResponse)
async def get_series_performance(
    series_id: str,
    days: int = Query(30, ge=1, le=90, description="分析期間（日数）"),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """シリーズのパフォーマンスを取得"""
    result = await db.execute(
        select(Series).where(Series.id == UUID(series_id))
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="シリーズが見つかりません")

    # Get performance logs
    since = datetime.utcnow() - timedelta(days=days)
    logs_result = await db.execute(
        select(SeriesPerformanceLog)
        .where(SeriesPerformanceLog.series_id == UUID(series_id))
        .where(SeriesPerformanceLog.recorded_date >= since)
        .order_by(SeriesPerformanceLog.recorded_date)
    )
    logs = logs_result.scalars().all()

    # Calculate totals
    total_views = sum(log.total_views for log in logs)
    subscriber_growth = sum(log.new_subscribers for log in logs)
    total_watch_time = sum(log.watch_time_minutes or 0 for log in logs) / 60  # hours

    # Daily stats
    daily_stats = [
        SeriesDailyStats(
            date=log.recorded_date.strftime("%Y-%m-%d"),
            views=log.total_views,
            new_subscribers=log.new_subscribers,
            watch_time_minutes=log.watch_time_minutes or 0,
        )
        for log in logs
    ]

    return SeriesPerformanceResponse(
        series_id=str(series.id),
        series_name=series.name,
        total_videos=series.total_videos,
        total_views=series.total_views or total_views,
        total_watch_time_hours=round(total_watch_time, 1),
        avg_view_duration_seconds=series.avg_view_duration_seconds or 0,
        subscriber_growth=subscriber_growth,
        daily_stats=daily_stats,
    )
