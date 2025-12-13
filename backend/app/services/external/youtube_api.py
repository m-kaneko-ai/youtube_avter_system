"""
YouTube Data API v3 クライアント

YouTube Data API v3を使用した競合調査・人気動画取得機能
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings


class YouTubeAPIClient:
    """YouTube Data API v3 クライアント"""

    def __init__(self):
        """初期化"""
        self.api_key = settings.YOUTUBE_API_KEY
        self._client = None

    @property
    def client(self):
        """遅延初期化されたAPIクライアント"""
        if self._client is None and self.api_key:
            self._client = build("youtube", "v3", developerKey=self.api_key)
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def search_channels(
        self,
        query: str,
        max_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        チャンネル検索

        Args:
            query: 検索キーワード
            max_results: 最大取得件数

        Returns:
            List[Dict]: チャンネル情報リスト
        """
        if not self.is_available():
            return []

        try:
            # チャンネル検索
            search_response = self.client.search().list(
                q=query,
                part="snippet",
                type="channel",
                maxResults=max_results,
                order="relevance",
            ).execute()

            channel_ids = [
                item["snippet"]["channelId"]
                for item in search_response.get("items", [])
            ]

            if not channel_ids:
                return []

            # チャンネル詳細情報取得
            channels_response = self.client.channels().list(
                part="snippet,statistics,contentDetails",
                id=",".join(channel_ids),
            ).execute()

            results = []
            for channel in channels_response.get("items", []):
                snippet = channel.get("snippet", {})
                statistics = channel.get("statistics", {})

                results.append({
                    "channel_id": channel["id"],
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                    "subscriber_count": int(statistics.get("subscriberCount", 0)),
                    "video_count": int(statistics.get("videoCount", 0)),
                    "view_count": int(statistics.get("viewCount", 0)),
                    "published_at": snippet.get("publishedAt"),
                })

            return results

        except HttpError as e:
            print(f"YouTube API Error: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error: {e}")
            return []

    async def get_channel_videos(
        self,
        channel_id: str,
        max_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        チャンネルの最新動画取得

        Args:
            channel_id: チャンネルID
            max_results: 最大取得件数

        Returns:
            List[Dict]: 動画情報リスト
        """
        if not self.is_available():
            return []

        try:
            # チャンネルの動画検索
            search_response = self.client.search().list(
                channelId=channel_id,
                part="snippet",
                type="video",
                maxResults=max_results,
                order="date",
            ).execute()

            video_ids = [
                item["id"]["videoId"]
                for item in search_response.get("items", [])
            ]

            if not video_ids:
                return []

            # 動画詳細情報取得
            videos_response = self.client.videos().list(
                part="snippet,statistics",
                id=",".join(video_ids),
            ).execute()

            results = []
            for video in videos_response.get("items", []):
                snippet = video.get("snippet", {})
                statistics = video.get("statistics", {})

                results.append({
                    "video_id": video["id"],
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                    "view_count": int(statistics.get("viewCount", 0)),
                    "like_count": int(statistics.get("likeCount", 0)),
                    "comment_count": int(statistics.get("commentCount", 0)),
                    "published_at": snippet.get("publishedAt"),
                })

            return results

        except HttpError as e:
            print(f"YouTube API Error: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error: {e}")
            return []

    async def search_popular_videos(
        self,
        query: Optional[str] = None,
        category_id: Optional[str] = None,
        max_results: int = 20,
        region_code: str = "JP",
    ) -> List[Dict[str, Any]]:
        """
        人気動画検索

        Args:
            query: 検索キーワード（オプション）
            category_id: カテゴリID（オプション）
            max_results: 最大取得件数
            region_code: 地域コード

        Returns:
            List[Dict]: 人気動画リスト
        """
        if not self.is_available():
            return []

        try:
            params = {
                "part": "snippet",
                "type": "video",
                "maxResults": max_results,
                "order": "viewCount",
                "regionCode": region_code,
                "publishedAfter": "2024-01-01T00:00:00Z",  # 直近1年
            }

            if query:
                params["q"] = query
            if category_id:
                params["videoCategoryId"] = category_id

            search_response = self.client.search().list(**params).execute()

            video_ids = [
                item["id"]["videoId"]
                for item in search_response.get("items", [])
            ]

            if not video_ids:
                return []

            # 動画詳細情報取得
            videos_response = self.client.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(video_ids),
            ).execute()

            results = []
            for video in videos_response.get("items", []):
                snippet = video.get("snippet", {})
                statistics = video.get("statistics", {})

                results.append({
                    "video_id": video["id"],
                    "channel_id": snippet.get("channelId", ""),
                    "channel_title": snippet.get("channelTitle", ""),
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                    "view_count": int(statistics.get("viewCount", 0)),
                    "like_count": int(statistics.get("likeCount", 0)),
                    "comment_count": int(statistics.get("commentCount", 0)),
                    "published_at": snippet.get("publishedAt"),
                })

            return results

        except HttpError as e:
            print(f"YouTube API Error: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error: {e}")
            return []

    async def get_video_comments(
        self,
        video_id: str,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        動画のコメント取得

        Args:
            video_id: 動画ID
            max_results: 最大取得件数

        Returns:
            List[Dict]: コメントリスト
        """
        if not self.is_available():
            return []

        try:
            comments_response = self.client.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=max_results,
                order="relevance",
                textFormat="plainText",
            ).execute()

            results = []
            for item in comments_response.get("items", []):
                comment = item["snippet"]["topLevelComment"]["snippet"]
                results.append({
                    "comment_id": item["id"],
                    "text": comment.get("textDisplay", ""),
                    "author": comment.get("authorDisplayName", ""),
                    "author_channel_id": comment.get("authorChannelId", {}).get("value"),
                    "like_count": comment.get("likeCount", 0),
                    "published_at": comment.get("publishedAt"),
                })

            return results

        except HttpError as e:
            # コメントが無効な動画の場合
            if "commentsDisabled" in str(e):
                return []
            print(f"YouTube API Error: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error: {e}")
            return []


# シングルトンインスタンス
youtube_api = YouTubeAPIClient()
