"""
YouTube Analytics API連携サービス

機能:
- チャンネル分析データ取得
- 動画パフォーマンスデータ取得
- リテンション曲線データ取得
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings


class YouTubeAnalyticsService:
    """YouTube Analytics API連携サービス"""

    def __init__(self):
        """初期化"""
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET

    def _build_client(self, access_token: str):
        """
        YouTube Analytics APIクライアントを構築

        Args:
            access_token: アクセストークン

        Returns:
            Resource: YouTube Analytics APIクライアント
        """
        credentials = Credentials(token=access_token)
        return build("youtubeAnalytics", "v2", credentials=credentials)

    async def get_channel_analytics(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str,
        metrics: Optional[List[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        チャンネル分析データを取得

        Args:
            access_token: アクセストークン
            channel_id: チャンネルID
            start_date: 開始日（YYYY-MM-DD）
            end_date: 終了日（YYYY-MM-DD）
            metrics: 取得するメトリクス（デフォルト: views, estimatedMinutesWatched, averageViewDuration, subscribersGained）

        Returns:
            Optional[Dict]: チャンネル分析データ
        """
        if metrics is None:
            metrics = [
                "views",
                "estimatedMinutesWatched",
                "averageViewDuration",
                "subscribersGained",
                "subscribersLost",
                "likes",
                "dislikes",
                "shares",
                "comments",
            ]

        try:
            analytics = self._build_client(access_token)

            # チャンネル分析データを取得
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics=",".join(metrics),
                dimensions="day",
                sort="day",
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return {
                "channel_id": channel_id,
                "start_date": start_date,
                "end_date": end_date,
                "metrics": metrics,
                "data": results,
            }

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    async def get_video_analytics(
        self,
        access_token: str,
        video_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        動画パフォーマンスデータを取得

        Args:
            access_token: アクセストークン
            video_id: 動画ID
            start_date: 開始日（YYYY-MM-DD）デフォルト: 30日前
            end_date: 終了日（YYYY-MM-DD）デフォルト: 今日

        Returns:
            Optional[Dict]: 動画分析データ
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")

        try:
            analytics = self._build_client(access_token)

            # 動画分析データを取得
            response = analytics.reports().query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,dislikes,shares,comments,subscribersGained",
                dimensions="day",
                filters=f"video=={video_id}",
                sort="day",
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return {
                "video_id": video_id,
                "start_date": start_date,
                "end_date": end_date,
                "data": results,
            }

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    async def get_audience_retention(
        self,
        access_token: str,
        video_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        リテンション曲線データを取得

        Args:
            access_token: アクセストークン
            video_id: 動画ID

        Returns:
            Optional[Dict]: リテンション曲線データ
        """
        try:
            analytics = self._build_client(access_token)

            # リテンション曲線データを取得
            response = analytics.reports().query(
                ids="channel==MINE",
                startDate="2024-01-01",
                endDate=datetime.now().strftime("%Y-%m-%d"),
                metrics="audienceWatchRatio,relativeRetentionPerformance",
                dimensions="elapsedVideoTimeRatio",
                filters=f"video=={video_id}",
                sort="elapsedVideoTimeRatio",
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return {
                "video_id": video_id,
                "retention_data": results,
            }

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    async def get_traffic_sources(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str,
    ) -> Optional[Dict[str, Any]]:
        """
        トラフィックソース分析

        Args:
            access_token: アクセストークン
            channel_id: チャンネルID
            start_date: 開始日（YYYY-MM-DD）
            end_date: 終了日（YYYY-MM-DD）

        Returns:
            Optional[Dict]: トラフィックソース分析データ
        """
        try:
            analytics = self._build_client(access_token)

            # トラフィックソース分析
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched",
                dimensions="insightTrafficSourceType",
                sort="-views",
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return {
                "channel_id": channel_id,
                "start_date": start_date,
                "end_date": end_date,
                "traffic_sources": results,
            }

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    async def get_demographics(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str,
    ) -> Optional[Dict[str, Any]]:
        """
        視聴者属性分析

        Args:
            access_token: アクセストークン
            channel_id: チャンネルID
            start_date: 開始日（YYYY-MM-DD）
            end_date: 終了日（YYYY-MM-DD）

        Returns:
            Optional[Dict]: 視聴者属性分析データ
        """
        try:
            analytics = self._build_client(access_token)

            # 性別・年齢層別の分析
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="viewerPercentage",
                dimensions="ageGroup,gender",
                sort="-viewerPercentage",
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return {
                "channel_id": channel_id,
                "start_date": start_date,
                "end_date": end_date,
                "demographics": results,
            }

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    async def get_top_videos(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str,
        max_results: int = 10,
    ) -> Optional[List[Dict[str, Any]]]:
        """
        人気動画ランキング取得

        Args:
            access_token: アクセストークン
            channel_id: チャンネルID
            start_date: 開始日（YYYY-MM-DD）
            end_date: 終了日（YYYY-MM-DD）
            max_results: 最大取得件数

        Returns:
            Optional[List[Dict]]: 人気動画リスト
        """
        try:
            analytics = self._build_client(access_token)

            # 人気動画取得
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration,likes,shares,comments",
                dimensions="video",
                sort="-views",
                maxResults=max_results,
            ).execute()

            # レスポンスを整形
            column_headers = [header["name"] for header in response.get("columnHeaders", [])]
            rows = response.get("rows", [])

            results = []
            for row in rows:
                data = dict(zip(column_headers, row))
                results.append(data)

            return results

        except HttpError as e:
            print(f"YouTube Analytics API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None


# シングルトンインスタンス
youtube_analytics_service = YouTubeAnalyticsService()
