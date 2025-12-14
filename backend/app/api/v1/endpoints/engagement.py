"""
ショート→長尺連携APIエンドポイント

エンゲージメント管理のCRUD操作とパフォーマンス分析
"""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.engagement import (
    ShortToLongLink,
    EngagementMetrics,
    ShortVideoClip,
    EngagementStatus,
)
from app.models.project import Video
from app.schemas.engagement import (
    ShortToLongLinkCreate,
    ShortToLongLinkUpdate,
    ShortToLongLinkResponse,
    ShortToLongLinkListResponse,
    EngagementMetricsCreate,
    EngagementMetricsResponse,
    ShortVideoClipCreate,
    ShortVideoClipUpdate,
    ShortVideoClipResponse,
    EngagementSummary,
    LinkPerformanceResponse,
    VideoSummary,
    EngagementDailyStats,
)

router = APIRouter()


# ============================================================
# Helper Functions
# ============================================================

def video_to_summary(video: Optional[Video]) -> Optional[VideoSummary]:
    """VideoモデルをVideoSummaryに変換"""
    if not video:
        return None
    return VideoSummary(
        id=str(video.id),
        title=video.title,
        youtube_url=video.youtube_url,
        status=video.status.value if video.status else "unknown"
    )


# ============================================================
# Short to Long Link Endpoints
# ============================================================

@router.get("/", response_model=ShortToLongLinkListResponse)
async def get_links(
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    is_active: Optional[bool] = Query(None, description="有効/無効でフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート→長尺連携一覧を取得"""
    query = select(ShortToLongLink)

    if status:
        query = query.where(ShortToLongLink.status == status)
    if is_active is not None:
        query = query.where(ShortToLongLink.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(ShortToLongLink.created_at.desc())
    result = await db.execute(query)
    links = result.scalars().all()

    # Load related videos
    link_responses = []
    for link in links:
        # Get short video
        short_result = await db.execute(
            select(Video).where(Video.id == link.short_video_id)
        )
        short_video = short_result.scalar_one_or_none()

        # Get long video
        long_result = await db.execute(
            select(Video).where(Video.id == link.long_video_id)
        )
        long_video = long_result.scalar_one_or_none()

        link_responses.append(ShortToLongLinkResponse(
            id=str(link.id),
            short_video_id=str(link.short_video_id),
            long_video_id=str(link.long_video_id),
            link_type=link.link_type,
            link_text=link.link_text,
            link_position=link.link_position,
            status=link.status,
            is_active=link.is_active,
            short_video=video_to_summary(short_video),
            long_video=video_to_summary(long_video),
            created_at=link.created_at,
            updated_at=link.updated_at,
        ))

    return ShortToLongLinkListResponse(links=link_responses, total=total)


@router.post("/", response_model=ShortToLongLinkResponse)
async def create_link(
    data: ShortToLongLinkCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート→長尺連携を作成"""
    # Verify videos exist
    short_result = await db.execute(
        select(Video).where(Video.id == UUID(data.short_video_id))
    )
    short_video = short_result.scalar_one_or_none()
    if not short_video:
        raise HTTPException(status_code=404, detail="ショート動画が見つかりません")

    long_result = await db.execute(
        select(Video).where(Video.id == UUID(data.long_video_id))
    )
    long_video = long_result.scalar_one_or_none()
    if not long_video:
        raise HTTPException(status_code=404, detail="長尺動画が見つかりません")

    # Create link
    link = ShortToLongLink(
        short_video_id=UUID(data.short_video_id),
        long_video_id=UUID(data.long_video_id),
        link_type=data.link_type,
        link_text=data.link_text,
        link_position=data.link_position,
        is_active=data.is_active,
        status=EngagementStatus.ACTIVE if data.is_active else EngagementStatus.DRAFT,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return ShortToLongLinkResponse(
        id=str(link.id),
        short_video_id=str(link.short_video_id),
        long_video_id=str(link.long_video_id),
        link_type=link.link_type,
        link_text=link.link_text,
        link_position=link.link_position,
        status=link.status,
        is_active=link.is_active,
        short_video=video_to_summary(short_video),
        long_video=video_to_summary(long_video),
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


@router.get("/{link_id}", response_model=ShortToLongLinkResponse)
async def get_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート→長尺連携を取得"""
    result = await db.execute(
        select(ShortToLongLink).where(ShortToLongLink.id == UUID(link_id))
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="連携が見つかりません")

    # Get videos
    short_result = await db.execute(
        select(Video).where(Video.id == link.short_video_id)
    )
    short_video = short_result.scalar_one_or_none()

    long_result = await db.execute(
        select(Video).where(Video.id == link.long_video_id)
    )
    long_video = long_result.scalar_one_or_none()

    return ShortToLongLinkResponse(
        id=str(link.id),
        short_video_id=str(link.short_video_id),
        long_video_id=str(link.long_video_id),
        link_type=link.link_type,
        link_text=link.link_text,
        link_position=link.link_position,
        status=link.status,
        is_active=link.is_active,
        short_video=video_to_summary(short_video),
        long_video=video_to_summary(long_video),
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


@router.put("/{link_id}", response_model=ShortToLongLinkResponse)
async def update_link(
    link_id: str,
    data: ShortToLongLinkUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート→長尺連携を更新"""
    result = await db.execute(
        select(ShortToLongLink).where(ShortToLongLink.id == UUID(link_id))
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="連携が見つかりません")

    # Update fields
    if data.link_type is not None:
        link.link_type = data.link_type
    if data.link_text is not None:
        link.link_text = data.link_text
    if data.link_position is not None:
        link.link_position = data.link_position
    if data.status is not None:
        link.status = data.status
    if data.is_active is not None:
        link.is_active = data.is_active

    link.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(link)

    # Get videos
    short_result = await db.execute(
        select(Video).where(Video.id == link.short_video_id)
    )
    short_video = short_result.scalar_one_or_none()

    long_result = await db.execute(
        select(Video).where(Video.id == link.long_video_id)
    )
    long_video = long_result.scalar_one_or_none()

    return ShortToLongLinkResponse(
        id=str(link.id),
        short_video_id=str(link.short_video_id),
        long_video_id=str(link.long_video_id),
        link_type=link.link_type,
        link_text=link.link_text,
        link_position=link.link_position,
        status=link.status,
        is_active=link.is_active,
        short_video=video_to_summary(short_video),
        long_video=video_to_summary(long_video),
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


@router.delete("/{link_id}")
async def delete_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート→長尺連携を削除"""
    result = await db.execute(
        select(ShortToLongLink).where(ShortToLongLink.id == UUID(link_id))
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="連携が見つかりません")

    await db.delete(link)
    await db.commit()

    return {"success": True, "message": "連携を削除しました"}


# ============================================================
# Performance & Stats Endpoints
# ============================================================

@router.get("/stats/summary", response_model=EngagementSummary)
async def get_engagement_summary(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エンゲージメントサマリーを取得"""
    # Total links
    total_result = await db.execute(
        select(func.count()).select_from(ShortToLongLink)
    )
    total_links = total_result.scalar() or 0

    # Active links
    active_result = await db.execute(
        select(func.count()).select_from(ShortToLongLink).where(
            ShortToLongLink.is_active == True
        )
    )
    active_links = active_result.scalar() or 0

    # Total clicks
    clicks_result = await db.execute(
        select(func.sum(EngagementMetrics.click_through_count))
    )
    total_clicks = clicks_result.scalar() or 0

    # Total conversions
    conv_result = await db.execute(
        select(func.sum(EngagementMetrics.conversion_count))
    )
    total_conversions = conv_result.scalar() or 0

    # Calculate averages
    avg_ctr = 0.0
    avg_conv_rate = 0.0

    if total_links > 0:
        ctr_result = await db.execute(
            select(func.avg(EngagementMetrics.click_through_rate))
        )
        avg_ctr = ctr_result.scalar() or 0.0

        conv_rate_result = await db.execute(
            select(func.avg(EngagementMetrics.conversion_rate))
        )
        avg_conv_rate = conv_rate_result.scalar() or 0.0

    return EngagementSummary(
        total_links=total_links,
        active_links=active_links,
        total_clicks=total_clicks,
        avg_ctr=round(avg_ctr, 2),
        total_conversions=total_conversions,
        avg_conversion_rate=round(avg_conv_rate, 2),
    )


@router.get("/{link_id}/performance", response_model=LinkPerformanceResponse)
async def get_link_performance(
    link_id: str,
    days: int = Query(30, ge=1, le=90, description="分析期間（日数）"),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """連携のパフォーマンスを取得"""
    result = await db.execute(
        select(ShortToLongLink).where(ShortToLongLink.id == UUID(link_id))
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="連携が見つかりません")

    # Get videos
    short_result = await db.execute(
        select(Video).where(Video.id == link.short_video_id)
    )
    short_video = short_result.scalar_one_or_none()

    long_result = await db.execute(
        select(Video).where(Video.id == link.long_video_id)
    )
    long_video = long_result.scalar_one_or_none()

    # Get metrics for the period
    since = datetime.utcnow() - timedelta(days=days)
    metrics_result = await db.execute(
        select(EngagementMetrics)
        .where(EngagementMetrics.link_id == UUID(link_id))
        .where(EngagementMetrics.recorded_date >= since)
        .order_by(EngagementMetrics.recorded_date)
    )
    metrics_list = metrics_result.scalars().all()

    # Calculate totals
    total_short_views = sum(m.short_views for m in metrics_list)
    total_clicks = sum(m.click_through_count for m in metrics_list)
    total_conversions = sum(m.conversion_count for m in metrics_list)

    ctr = (total_clicks / total_short_views * 100) if total_short_views > 0 else 0.0
    conv_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0.0

    # Daily stats
    daily_stats = [
        EngagementDailyStats(
            date=m.recorded_date.strftime("%Y-%m-%d"),
            short_views=m.short_views,
            long_views=m.long_views,
            clicks=m.click_through_count,
            conversions=m.conversion_count,
        )
        for m in metrics_list
    ]

    return LinkPerformanceResponse(
        link_id=str(link.id),
        short_video_title=short_video.title if short_video else None,
        long_video_title=long_video.title if long_video else None,
        total_short_views=total_short_views,
        total_clicks=total_clicks,
        ctr=round(ctr, 2),
        total_conversions=total_conversions,
        conversion_rate=round(conv_rate, 2),
        daily_stats=daily_stats,
    )


# ============================================================
# Metrics Endpoints
# ============================================================

@router.post("/{link_id}/metrics", response_model=EngagementMetricsResponse)
async def record_metrics(
    link_id: str,
    data: EngagementMetricsCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """エンゲージメント指標を記録"""
    # Verify link exists
    result = await db.execute(
        select(ShortToLongLink).where(ShortToLongLink.id == UUID(link_id))
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="連携が見つかりません")

    # Calculate rates
    ctr = None
    if data.short_views > 0:
        ctr = data.click_through_count / data.short_views * 100

    conv_rate = None
    if data.click_through_count > 0:
        conv_rate = data.conversion_count / data.click_through_count * 100

    metrics = EngagementMetrics(
        link_id=UUID(link_id),
        recorded_date=data.recorded_date,
        short_views=data.short_views,
        short_likes=data.short_likes,
        short_comments=data.short_comments,
        short_shares=data.short_shares,
        long_views=data.long_views,
        long_likes=data.long_likes,
        long_comments=data.long_comments,
        long_watch_time_minutes=data.long_watch_time_minutes,
        click_through_count=data.click_through_count,
        click_through_rate=ctr,
        conversion_count=data.conversion_count,
        conversion_rate=conv_rate,
    )
    db.add(metrics)
    await db.commit()
    await db.refresh(metrics)

    return EngagementMetricsResponse(
        id=str(metrics.id),
        link_id=str(metrics.link_id),
        recorded_date=metrics.recorded_date,
        short_views=metrics.short_views,
        short_likes=metrics.short_likes,
        short_comments=metrics.short_comments,
        short_shares=metrics.short_shares,
        long_views=metrics.long_views,
        long_likes=metrics.long_likes,
        long_comments=metrics.long_comments,
        long_watch_time_minutes=metrics.long_watch_time_minutes,
        click_through_count=metrics.click_through_count,
        click_through_rate=metrics.click_through_rate,
        conversion_count=metrics.conversion_count,
        conversion_rate=metrics.conversion_rate,
        created_at=metrics.created_at,
    )


# ============================================================
# Short Video Clip Endpoints
# ============================================================

@router.post("/clips", response_model=ShortVideoClipResponse)
async def create_clip(
    data: ShortVideoClipCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート動画切り抜きを作成"""
    # Verify short video exists
    short_result = await db.execute(
        select(Video).where(Video.id == UUID(data.short_video_id))
    )
    short_video = short_result.scalar_one_or_none()
    if not short_video:
        raise HTTPException(status_code=404, detail="ショート動画が見つかりません")

    source_video = None
    if data.source_video_id:
        source_result = await db.execute(
            select(Video).where(Video.id == UUID(data.source_video_id))
        )
        source_video = source_result.scalar_one_or_none()

    clip = ShortVideoClip(
        short_video_id=UUID(data.short_video_id),
        source_video_id=UUID(data.source_video_id) if data.source_video_id else None,
        start_time_seconds=data.start_time_seconds,
        end_time_seconds=data.end_time_seconds,
        clip_title=data.clip_title,
        clip_description=data.clip_description,
    )
    db.add(clip)
    await db.commit()
    await db.refresh(clip)

    return ShortVideoClipResponse(
        id=str(clip.id),
        short_video_id=str(clip.short_video_id),
        source_video_id=str(clip.source_video_id) if clip.source_video_id else None,
        start_time_seconds=clip.start_time_seconds,
        end_time_seconds=clip.end_time_seconds,
        clip_title=clip.clip_title,
        clip_description=clip.clip_description,
        is_published=clip.is_published,
        published_at=clip.published_at,
        short_video=video_to_summary(short_video),
        source_video=video_to_summary(source_video),
        created_at=clip.created_at,
        updated_at=clip.updated_at,
    )


@router.get("/clips/{clip_id}", response_model=ShortVideoClipResponse)
async def get_clip(
    clip_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """ショート動画切り抜きを取得"""
    result = await db.execute(
        select(ShortVideoClip).where(ShortVideoClip.id == UUID(clip_id))
    )
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="切り抜きが見つかりません")

    # Get videos
    short_result = await db.execute(
        select(Video).where(Video.id == clip.short_video_id)
    )
    short_video = short_result.scalar_one_or_none()

    source_video = None
    if clip.source_video_id:
        source_result = await db.execute(
            select(Video).where(Video.id == clip.source_video_id)
        )
        source_video = source_result.scalar_one_or_none()

    return ShortVideoClipResponse(
        id=str(clip.id),
        short_video_id=str(clip.short_video_id),
        source_video_id=str(clip.source_video_id) if clip.source_video_id else None,
        start_time_seconds=clip.start_time_seconds,
        end_time_seconds=clip.end_time_seconds,
        clip_title=clip.clip_title,
        clip_description=clip.clip_description,
        is_published=clip.is_published,
        published_at=clip.published_at,
        short_video=video_to_summary(short_video),
        source_video=video_to_summary(source_video),
        created_at=clip.created_at,
        updated_at=clip.updated_at,
    )
