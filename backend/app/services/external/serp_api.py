"""
SerpAPI クライアント

Google検索トレンド、ニュース検索を提供
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx

from app.core.config import settings


class SerpAPIClient:
    """SerpAPI クライアント"""

    BASE_URL = "https://serpapi.com/search"

    def __init__(self):
        """初期化"""
        self.api_key = settings.SERP_API_KEY
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """遅延初期化されたHTTPクライアント"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def search_google_trends(
        self,
        query: str,
        location: str = "Japan",
        language: str = "ja",
    ) -> List[Dict[str, Any]]:
        """
        Google Trendsで関連キーワードを検索

        Args:
            query: 検索クエリ
            location: 地域
            language: 言語

        Returns:
            List[Dict]: 関連キーワードリスト
        """
        if not self.is_available():
            return []

        try:
            params = {
                "engine": "google_trends",
                "q": query,
                "geo": "JP",
                "data_type": "RELATED_QUERIES",
                "api_key": self.api_key,
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []

            # Rising queries（急上昇）
            rising = data.get("related_queries", {}).get("rising", [])
            for item in rising[:10]:
                results.append({
                    "keyword": item.get("query", ""),
                    "trend_direction": "up",
                    "change_value": item.get("value", ""),
                })

            # Top queries（人気）
            top = data.get("related_queries", {}).get("top", [])
            for item in top[:10]:
                if not any(r["keyword"] == item.get("query") for r in results):
                    results.append({
                        "keyword": item.get("query", ""),
                        "trend_direction": "stable",
                        "search_volume": item.get("value", 0),
                    })

            return results

        except Exception as e:
            print(f"SerpAPI Error (trends): {e}")
            return []

    async def search_google(
        self,
        query: str,
        num_results: int = 10,
        location: str = "Japan",
        language: str = "ja",
    ) -> List[Dict[str, Any]]:
        """
        Google検索

        Args:
            query: 検索クエリ
            num_results: 結果数
            location: 地域
            language: 言語

        Returns:
            List[Dict]: 検索結果リスト
        """
        if not self.is_available():
            return []

        try:
            params = {
                "engine": "google",
                "q": query,
                "location": location,
                "hl": language,
                "gl": "jp",
                "num": num_results,
                "api_key": self.api_key,
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            organic_results = data.get("organic_results", [])

            for item in organic_results:
                results.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "position": item.get("position", 0),
                })

            return results

        except Exception as e:
            print(f"SerpAPI Error (search): {e}")
            return []

    async def search_google_news(
        self,
        query: Optional[str] = None,
        topic: Optional[str] = None,
        num_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Googleニュース検索

        Args:
            query: 検索クエリ
            topic: トピック（BUSINESS, TECHNOLOGY, etc.）
            num_results: 結果数

        Returns:
            List[Dict]: ニュース記事リスト
        """
        if not self.is_available():
            return []

        try:
            params = {
                "engine": "google_news",
                "gl": "jp",
                "hl": "ja",
                "api_key": self.api_key,
            }

            if query:
                params["q"] = query
            if topic:
                params["topic_token"] = topic

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            news_results = data.get("news_results", [])

            for item in news_results[:num_results]:
                results.append({
                    "title": item.get("title", ""),
                    "source": item.get("source", {}).get("name", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "published_at": item.get("date", ""),
                    "thumbnail": item.get("thumbnail", ""),
                })

            return results

        except Exception as e:
            print(f"SerpAPI Error (news): {e}")
            return []

    async def get_youtube_search(
        self,
        query: str,
        num_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        YouTube検索（SerpAPI経由）

        Args:
            query: 検索クエリ
            num_results: 結果数

        Returns:
            List[Dict]: 動画リスト
        """
        if not self.is_available():
            return []

        try:
            params = {
                "engine": "youtube",
                "search_query": query,
                "api_key": self.api_key,
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            video_results = data.get("video_results", [])

            for item in video_results[:num_results]:
                results.append({
                    "video_id": item.get("link", "").split("v=")[-1] if "v=" in item.get("link", "") else "",
                    "title": item.get("title", ""),
                    "channel": item.get("channel", {}).get("name", ""),
                    "views": item.get("views", 0),
                    "published_at": item.get("published_date", ""),
                    "thumbnail": item.get("thumbnail", {}).get("static", ""),
                })

            return results

        except Exception as e:
            print(f"SerpAPI Error (youtube): {e}")
            return []


# シングルトンインスタンス
serp_api = SerpAPIClient()
