"""
分析エンドポイント

動画分析、チャンネル分析、レポート生成API
"""
from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role, get_current_client_id
from app.schemas.analytics import (
    VideoAnalyticsResponse,
    ChannelOverviewResponse,
    PerformanceReportResponse,
    TrendAnalysisResponse,
    ReportGenerateRequest,
    ReportResponse,
    ReportGenerateResponse,
)
from app.services.analytics_service import AnalyticsService, ReportService

router = APIRouter()


@router.get(
    "/video/{video_id}",
    response_model=VideoAnalyticsResponse,
    summary="動画分析取得",
    description="指定した動画の分析データを取得します。",
)
async def get_video_analytics(
    video_id: UUID = Path(..., description="動画ID"),
    date_from: Optional[date] = Query(None, description="開始日"),
    date_to: Optional[date] = Query(None, description="終了日"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> VideoAnalyticsResponse:
    """動画分析取得エンドポイント"""
    return await AnalyticsService.get_video_analytics(
        db, current_user_role, video_id, date_from, date_to
    )


@router.get(
    "/channel",
    response_model=ChannelOverviewResponse,
    summary="チャンネル概要取得",
    description="チャンネル全体の概要分析データを取得します。",
)
async def get_channel_overview(
    date_from: Optional[date] = Query(None, description="開始日"),
    date_to: Optional[date] = Query(None, description="終了日"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    client_id: str = Depends(get_current_client_id),
) -> ChannelOverviewResponse:
    """チャンネル概要取得エンドポイント"""
    return await AnalyticsService.get_channel_overview(
        db, current_user_role, client_id, date_from, date_to
    )


@router.get(
    "/performance",
    response_model=PerformanceReportResponse,
    summary="パフォーマンスレポート取得",
    description="チャンネルのパフォーマンスレポートを取得します。",
)
async def get_performance_report(
    date_from: Optional[date] = Query(None, description="開始日"),
    date_to: Optional[date] = Query(None, description="終了日"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    client_id: str = Depends(get_current_client_id),
) -> PerformanceReportResponse:
    """パフォーマンスレポート取得エンドポイント"""
    return await AnalyticsService.get_performance_report(
        db, current_user_role, client_id, date_from, date_to
    )


@router.get(
    "/trends",
    response_model=TrendAnalysisResponse,
    summary="トレンド分析取得",
    description="チャンネルのトレンド分析データを取得します。",
)
async def get_trend_analysis(
    date_from: Optional[date] = Query(None, description="開始日"),
    date_to: Optional[date] = Query(None, description="終了日"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    client_id: str = Depends(get_current_client_id),
) -> TrendAnalysisResponse:
    """トレンド分析取得エンドポイント"""
    return await AnalyticsService.get_trend_analysis(
        db, current_user_role, client_id, date_from, date_to
    )


@router.post(
    "/report",
    response_model=ReportGenerateResponse,
    summary="レポート生成",
    description="分析レポートを生成します。",
)
async def generate_report(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
    client_id: str = Depends(get_current_client_id),
) -> ReportGenerateResponse:
    """レポート生成エンドポイント"""
    return await ReportService.generate_report(db, current_user_role, client_id, request)
