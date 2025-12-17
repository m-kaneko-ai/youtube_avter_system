"""
YouTube Analytics API用OAuth認証サービス

機能:
- OAuth認証URL生成
- コールバック処理（認可コード → アクセストークン交換）
- トークンリフレッシュ
- トークン保存/取得（DBまたはRedis）
"""
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings


class YouTubeOAuthService:
    """YouTube Analytics API用OAuth認証サービス"""

    # OAuth2スコープ
    SCOPES = [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
    ]

    def __init__(self):
        """初期化"""
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.BACKEND_URL}/api/v1/youtube/callback"

    def is_available(self) -> bool:
        """OAuth機能が利用可能かどうか"""
        return bool(self.client_id and self.client_secret)

    def get_auth_url(self, state: Optional[str] = None) -> str:
        """
        OAuth認証URLを生成

        Args:
            state: CSRF対策用のstateパラメータ

        Returns:
            str: OAuth認証URL
        """
        if not self.is_available():
            raise ValueError("Google OAuth credentials not configured")

        # OAuth Flowを作成
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                }
            },
            scopes=self.SCOPES,
        )
        flow.redirect_uri = self.redirect_uri

        # 認証URLを生成
        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            state=state or "",
            prompt="consent",  # 常にリフレッシュトークンを取得
        )

        return authorization_url

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """
        認可コードをアクセストークンに交換

        Args:
            code: 認可コード

        Returns:
            Dict: トークン情報
                - access_token: アクセストークン
                - refresh_token: リフレッシュトークン
                - expires_at: 有効期限（UNIX timestamp）
                - scopes: 許可されたスコープ
        """
        if not self.is_available():
            raise ValueError("Google OAuth credentials not configured")

        # OAuth Flowを作成
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                }
            },
            scopes=self.SCOPES,
        )
        flow.redirect_uri = self.redirect_uri

        # トークン取得
        flow.fetch_token(code=code)

        credentials = flow.credentials

        # トークン情報を辞書形式で返す
        expires_at = datetime.utcnow() + timedelta(seconds=credentials.expiry.timestamp() if credentials.expiry else 3600)

        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "expires_at": int(expires_at.timestamp()),
            "scopes": list(credentials.scopes) if credentials.scopes else self.SCOPES,
        }

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        トークンをリフレッシュ

        Args:
            refresh_token: リフレッシュトークン

        Returns:
            Dict: 新しいトークン情報
                - access_token: アクセストークン
                - expires_at: 有効期限（UNIX timestamp）
        """
        if not self.is_available():
            raise ValueError("Google OAuth credentials not configured")

        # Credentialsオブジェクトを作成
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.SCOPES,
        )

        # トークンをリフレッシュ
        from google.auth.transport.requests import Request
        credentials.refresh(Request())

        expires_at = datetime.utcnow() + timedelta(seconds=3600)

        return {
            "access_token": credentials.token,
            "expires_at": int(expires_at.timestamp()),
        }

    async def get_valid_token(
        self,
        access_token: str,
        refresh_token: str,
        expires_at: int,
    ) -> Dict[str, Any]:
        """
        有効なトークンを取得（必要に応じてリフレッシュ）

        Args:
            access_token: 現在のアクセストークン
            refresh_token: リフレッシュトークン
            expires_at: 有効期限（UNIX timestamp）

        Returns:
            Dict: トークン情報
                - access_token: アクセストークン
                - expires_at: 有効期限（UNIX timestamp）
                - refreshed: リフレッシュされたかどうか
        """
        # 有効期限チェック（5分の余裕を持たせる）
        now = int(datetime.utcnow().timestamp())
        if expires_at - now > 300:
            return {
                "access_token": access_token,
                "expires_at": expires_at,
                "refreshed": False,
            }

        # トークンをリフレッシュ
        new_token = await self.refresh_token(refresh_token)
        return {
            "access_token": new_token["access_token"],
            "expires_at": new_token["expires_at"],
            "refreshed": True,
        }

    async def verify_token(self, access_token: str) -> bool:
        """
        トークンの有効性を検証

        Args:
            access_token: アクセストークン

        Returns:
            bool: トークンが有効かどうか
        """
        try:
            credentials = Credentials(token=access_token)
            youtube = build("youtube", "v3", credentials=credentials)

            # チャンネル情報を取得してトークンを検証
            youtube.channels().list(part="snippet", mine=True).execute()

            return True
        except HttpError:
            return False
        except Exception:
            return False

    async def get_channel_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        認証されたユーザーのチャンネル情報を取得

        Args:
            access_token: アクセストークン

        Returns:
            Optional[Dict]: チャンネル情報
                - channel_id: チャンネルID
                - title: チャンネル名
                - description: 説明
                - thumbnail_url: サムネイルURL
        """
        try:
            credentials = Credentials(token=access_token)
            youtube = build("youtube", "v3", credentials=credentials)

            # チャンネル情報を取得
            response = youtube.channels().list(
                part="snippet,statistics",
                mine=True,
            ).execute()

            if not response.get("items"):
                return None

            channel = response["items"][0]
            snippet = channel.get("snippet", {})
            statistics = channel.get("statistics", {})

            return {
                "channel_id": channel["id"],
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "thumbnail_url": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                "subscriber_count": int(statistics.get("subscriberCount", 0)),
                "video_count": int(statistics.get("videoCount", 0)),
                "view_count": int(statistics.get("viewCount", 0)),
            }

        except HttpError as e:
            print(f"YouTube API Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None


# シングルトンインスタンス
youtube_oauth_service = YouTubeOAuthService()
