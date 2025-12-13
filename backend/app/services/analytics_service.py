"""
分析サービス

動画分析、チャンネル分析、レポート生成のビジネスロジック
"""
from datetime import datetime, date, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Video, Client
from app.models.analytics import (
    VideoAnalytics,
    ChannelAnalytics,
    AnalyticsReport,
    ReportType,
    ReportStatus,
)
from app.models.user import UserRole
from app.schemas.analytics import (
    VideoAnalyticsResponse,
    ChannelOverviewResponse,
    PerformanceReportResponse,
    TrendAnalysisResponse,
    ReportGenerateRequest,
    ReportResponse,
    ReportGenerateResponse,
)


class AnalyticsService:
    """分析サービス"""

    @staticmethod
    async def get_video_analytics(
        db: AsyncSession,
        current_user_role: str,
        video_id: UUID,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> VideoAnalyticsResponse:
        """
        動画分析を取得

        YouTube Analytics API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            video_id: 動画ID
            date_from: 開始日
            date_to: 終了日

        Returns:
            VideoAnalyticsResponse: 動画分析データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="動画分析取得にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # デフォルト期間（過去30日）
        if not date_to:
            date_to = date.today()
        if not date_from:
            date_from = date_to - timedelta(days=30)

        # スタブ：サンプルデータを返す
        return VideoAnalyticsResponse(
            video_id=video_id,
            date_from=date_from,
            date_to=date_to,
            total_views=15420,
            total_watch_time_minutes=45230.5,
            average_view_duration=176.3,
            total_likes=892,
            total_comments=156,
            total_shares=78,
            subscribers_gained=234,
            subscribers_lost=12,
            average_ctr=4.8,
            total_impressions=321500,
            traffic_sources={
                "youtube_search": 45.2,
                "suggested_videos": 32.1,
                "external": 12.5,
                "browse_features": 10.2,
            },
            demographics={
                "age": {
                    "18-24": 25.3,
                    "25-34": 42.1,
                    "35-44": 18.6,
                    "45-54": 9.2,
                    "55+": 4.8,
                },
                "gender": {
                    "male": 68.5,
                    "female": 31.5,
                },
            },
            daily_stats=[
                {"date": str(date_from + timedelta(days=i)), "views": 500 + i * 10}
                for i in range(7)
            ],
        )

    @staticmethod
    async def get_channel_overview(
        db: AsyncSession,
        current_user_role: str,
        client_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> ChannelOverviewResponse:
        """
        チャンネル概要を取得

        YouTube Analytics API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            client_id: クライアントID
            date_from: 開始日
            date_to: 終了日

        Returns:
            ChannelOverviewResponse: チャンネル概要データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="チャンネル分析取得にはOwnerまたはTeamロールが必要です",
            )

        # デフォルト期間（過去30日）
        if not date_to:
            date_to = date.today()
        if not date_from:
            date_from = date_to - timedelta(days=30)

        # スタブ：サンプルデータを返す
        return ChannelOverviewResponse(
            client_id=UUID(client_id) if isinstance(client_id, str) else client_id,
            date_from=date_from,
            date_to=date_to,
            total_views=125600,
            total_watch_time_minutes=378420.5,
            subscribers=45230,
            subscribers_change=1250,
            total_videos=85,
            average_ctr=5.2,
            estimated_revenue=12500.50,
            top_videos=[
                {"video_id": "video1", "title": "Top Video 1", "views": 25000},
                {"video_id": "video2", "title": "Top Video 2", "views": 18500},
                {"video_id": "video3", "title": "Top Video 3", "views": 15200},
            ],
            daily_stats=[
                {"date": str(date_from + timedelta(days=i)), "views": 4000 + i * 100}
                for i in range(7)
            ],
        )

    @staticmethod
    async def get_performance_report(
        db: AsyncSession,
        current_user_role: str,
        client_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> PerformanceReportResponse:
        """
        パフォーマンスレポートを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            client_id: クライアントID
            date_from: 開始日
            date_to: 終了日

        Returns:
            PerformanceReportResponse: パフォーマンスレポート
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="パフォーマンスレポート取得にはOwnerまたはTeamロールが必要です",
            )

        # デフォルト期間（過去30日）
        if not date_to:
            date_to = date.today()
        if not date_from:
            date_from = date_to - timedelta(days=30)

        # スタブ：サンプルデータを返す
        return PerformanceReportResponse(
            client_id=UUID(client_id) if isinstance(client_id, str) else client_id,
            date_from=date_from,
            date_to=date_to,
            summary={
                "total_views": 125600,
                "view_change_percent": 15.3,
                "total_subscribers": 45230,
                "subscriber_change_percent": 2.8,
                "average_engagement_rate": 6.5,
            },
            video_performance=[
                {
                    "video_id": "video1",
                    "title": "Best Performing Video",
                    "views": 25000,
                    "engagement_rate": 8.2,
                },
                {
                    "video_id": "video2",
                    "title": "Second Best Video",
                    "views": 18500,
                    "engagement_rate": 7.1,
                },
            ],
            growth_metrics={
                "subscribers_gained": 1250,
                "subscribers_lost": 120,
                "net_growth": 1130,
                "growth_rate": 2.5,
            },
            engagement_metrics={
                "total_likes": 8920,
                "total_comments": 1560,
                "total_shares": 780,
                "average_watch_time": 4.5,
            },
            comparison={
                "previous_period_views": 109000,
                "views_change": 16600,
                "views_change_percent": 15.2,
            },
        )

    @staticmethod
    async def get_trend_analysis(
        db: AsyncSession,
        current_user_role: str,
        client_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> TrendAnalysisResponse:
        """
        トレンド分析を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            client_id: クライアントID
            date_from: 開始日
            date_to: 終了日

        Returns:
            TrendAnalysisResponse: トレンド分析データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="トレンド分析取得にはOwnerまたはTeamロールが必要です",
            )

        # デフォルト期間（過去30日）
        if not date_to:
            date_to = date.today()
        if not date_from:
            date_from = date_to - timedelta(days=30)

        # スタブ：サンプルデータを返す
        return TrendAnalysisResponse(
            client_id=UUID(client_id) if isinstance(client_id, str) else client_id,
            date_from=date_from,
            date_to=date_to,
            view_trend=[
                {"date": str(date_from + timedelta(days=i)), "views": 4000 + i * 100, "trend": "up"}
                for i in range(7)
            ],
            subscriber_trend=[
                {"date": str(date_from + timedelta(days=i)), "count": 45000 + i * 40, "change": 40}
                for i in range(7)
            ],
            engagement_trend=[
                {"date": str(date_from + timedelta(days=i)), "rate": 5.5 + i * 0.1}
                for i in range(7)
            ],
            best_performing_time={
                "day_of_week": "Saturday",
                "hour": 18,
                "average_views": 6500,
            },
            content_performance=[
                {"category": "Tutorial", "average_views": 8500, "engagement_rate": 7.2},
                {"category": "Vlog", "average_views": 6200, "engagement_rate": 5.8},
                {"category": "Review", "average_views": 5800, "engagement_rate": 6.1},
            ],
        )


class ReportService:
    """レポート生成サービス"""

    @staticmethod
    async def generate_report(
        db: AsyncSession,
        current_user_role: str,
        client_id: str,
        request: ReportGenerateRequest,
    ) -> ReportGenerateResponse:
        """
        レポートを生成

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            client_id: クライアントID
            request: レポート生成リクエスト

        Returns:
            ReportGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="レポート生成にはOwnerまたはTeamロールが必要です",
            )

        # レポート作成（スタブ：即座に完了）
        report = AnalyticsReport(
            client_id=UUID(client_id) if isinstance(client_id, str) else client_id,
            report_type=request.report_type,
            status=ReportStatus.COMPLETED,
            title=request.title or f"{request.report_type.value}レポート",
            date_from=request.date_from,
            date_to=request.date_to,
            summary=f"{request.date_from}から{request.date_to}までの分析レポート",
            data={
                "views": 125600,
                "subscribers": 45230,
                "engagement_rate": 6.5,
                "top_videos": ["video1", "video2", "video3"],
                "recommendations": [
                    "投稿頻度を週3回に増やすことを推奨",
                    "土曜日18時の投稿がパフォーマンス良好",
                    "チュートリアル系コンテンツが人気",
                ],
            },
            file_url="https://example.com/reports/report_stub.pdf",
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        return ReportGenerateResponse(
            report_id=report.id,
            status=report.status,
            message="レポートの生成が完了しました",
            estimated_completion=0,
        )

    @staticmethod
    async def get_report(
        db: AsyncSession,
        current_user_role: str,
        report_id: UUID,
    ) -> ReportResponse:
        """
        レポートを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            report_id: レポートID

        Returns:
            ReportResponse: レポートデータ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="レポート取得にはOwnerまたはTeamロールが必要です",
            )

        report = await db.get(AnalyticsReport, report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="レポートが見つかりません",
            )

        return ReportResponse(
            id=report.id,
            client_id=report.client_id,
            report_type=report.report_type,
            status=report.status,
            title=report.title,
            date_from=report.date_from,
            date_to=report.date_to,
            summary=report.summary,
            data=report.data,
            file_url=report.file_url,
            error_message=report.error_message,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )
