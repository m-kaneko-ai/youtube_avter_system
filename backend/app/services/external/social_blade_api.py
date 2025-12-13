"""
Social Blade API クライアント

YouTubeチャンネルの履歴データ、統計、ランキングを提供
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import httpx

from app.core.config import settings


class SocialBladeClient:
    """Social Blade API クライアント"""

    BASE_URL = "https://matrix.sbapis.com/b"

    def __init__(self):
        """初期化"""
        self.api_key = settings.SOCIAL_BLADE_API_KEY
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """遅延初期化されたHTTPクライアント"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={
                    "clientid": self.api_key,
                    "Content-Type": "application/json",
                }
            )
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def get_youtube_channel_stats(
        self,
        channel_id: str,
    ) -> Dict[str, Any]:
        """
        YouTubeチャンネルの統計を取得

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: チャンネル統計データ
        """
        if not self.is_available():
            return {"error": "Social Blade API is not available"}

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/youtube/statistics",
                params={"query": channel_id}
            )
            response.raise_for_status()
            data = response.json()

            return {
                "channel_id": channel_id,
                "username": data.get("data", {}).get("username", ""),
                "subscriber_count": data.get("data", {}).get("subscribers", 0),
                "video_count": data.get("data", {}).get("uploads", 0),
                "total_views": data.get("data", {}).get("views", 0),
                "grade": data.get("data", {}).get("sbrank", ""),
                "subscriber_rank": data.get("data", {}).get("subscriberrank", 0),
                "video_views_rank": data.get("data", {}).get("viewsrank", 0),
                "country_rank": data.get("data", {}).get("countryrank", 0),
                "created_at": data.get("data", {}).get("created_at", ""),
            }

        except httpx.HTTPStatusError as e:
            print(f"Social Blade API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"Social Blade API Error (get_channel_stats): {e}")
            return {"error": str(e)}

    async def get_youtube_channel_history(
        self,
        channel_id: str,
        days: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        YouTubeチャンネルの履歴データを取得

        Args:
            channel_id: YouTubeチャンネルID
            days: 取得する日数（デフォルト30日）

        Returns:
            List[Dict]: 日別統計データリスト
        """
        if not self.is_available():
            return []

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/youtube/history/subscribers",
                params={
                    "query": channel_id,
                    "days": min(days, 180),  # 最大180日
                }
            )
            response.raise_for_status()
            data = response.json()

            history = []
            for item in data.get("data", []):
                history.append({
                    "date": item.get("date", ""),
                    "subscriber_count": item.get("subs", 0),
                    "subscriber_change": item.get("subs_diff", 0),
                })

            return history

        except Exception as e:
            print(f"Social Blade API Error (get_channel_history): {e}")
            return []

    async def get_youtube_channel_growth(
        self,
        channel_id: str,
    ) -> Dict[str, Any]:
        """
        チャンネルの成長率を取得

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: 成長率データ
        """
        if not self.is_available():
            return {"error": "Social Blade API is not available"}

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/youtube/growth",
                params={"query": channel_id}
            )
            response.raise_for_status()
            data = response.json()

            growth_data = data.get("data", {})
            return {
                "channel_id": channel_id,
                "subscriber_growth_30d": growth_data.get("subs_30d", 0),
                "subscriber_growth_14d": growth_data.get("subs_14d", 0),
                "subscriber_growth_7d": growth_data.get("subs_7d", 0),
                "views_growth_30d": growth_data.get("views_30d", 0),
                "views_growth_14d": growth_data.get("views_14d", 0),
                "views_growth_7d": growth_data.get("views_7d", 0),
                "avg_daily_subs": growth_data.get("avg_daily_subs", 0),
                "avg_daily_views": growth_data.get("avg_daily_views", 0),
            }

        except Exception as e:
            print(f"Social Blade API Error (get_channel_growth): {e}")
            return {"error": str(e)}

    async def get_youtube_future_projections(
        self,
        channel_id: str,
    ) -> Dict[str, Any]:
        """
        チャンネルの将来予測を取得

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: 将来予測データ
        """
        if not self.is_available():
            return {"error": "Social Blade API is not available"}

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/youtube/future",
                params={"query": channel_id}
            )
            response.raise_for_status()
            data = response.json()

            future_data = data.get("data", {})
            return {
                "channel_id": channel_id,
                "projected_subs_1_year": future_data.get("subs_1y", 0),
                "projected_subs_5_years": future_data.get("subs_5y", 0),
                "projected_views_1_year": future_data.get("views_1y", 0),
                "projected_views_5_years": future_data.get("views_5y", 0),
                "estimated_monthly_earnings_min": future_data.get("monthly_earnings_min", 0),
                "estimated_monthly_earnings_max": future_data.get("monthly_earnings_max", 0),
                "estimated_yearly_earnings_min": future_data.get("yearly_earnings_min", 0),
                "estimated_yearly_earnings_max": future_data.get("yearly_earnings_max", 0),
            }

        except Exception as e:
            print(f"Social Blade API Error (get_future_projections): {e}")
            return {"error": str(e)}

    async def get_youtube_top_channels(
        self,
        sort_by: str = "sbrank",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        トップYouTubeチャンネルランキングを取得

        Args:
            sort_by: ソート基準（sbrank, subscribers, views, videos）
            limit: 取得件数

        Returns:
            List[Dict]: チャンネルランキング
        """
        if not self.is_available():
            return []

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/youtube/top",
                params={
                    "sort": sort_by,
                    "limit": min(limit, 100),
                }
            )
            response.raise_for_status()
            data = response.json()

            channels = []
            for idx, item in enumerate(data.get("data", [])[:limit], 1):
                channels.append({
                    "rank": idx,
                    "channel_id": item.get("id", ""),
                    "username": item.get("username", ""),
                    "subscriber_count": item.get("subscribers", 0),
                    "video_count": item.get("uploads", 0),
                    "total_views": item.get("views", 0),
                    "grade": item.get("sbrank", ""),
                })

            return channels

        except Exception as e:
            print(f"Social Blade API Error (get_top_channels): {e}")
            return []

    async def compare_channels(
        self,
        channel_ids: List[str],
    ) -> List[Dict[str, Any]]:
        """
        複数チャンネルを比較

        Args:
            channel_ids: 比較するチャンネルIDリスト

        Returns:
            List[Dict]: 各チャンネルの統計データ
        """
        if not self.is_available():
            return []

        results = []
        for channel_id in channel_ids[:5]:  # 最大5チャンネル
            stats = await self.get_youtube_channel_stats(channel_id)
            if "error" not in stats:
                growth = await self.get_youtube_channel_growth(channel_id)
                stats["growth"] = growth if "error" not in growth else {}
                results.append(stats)

        return results


# シングルトンインスタンス
social_blade_api = SocialBladeClient()
