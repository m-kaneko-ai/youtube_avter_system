"""
HeyGen API クライアント

AIアバター動画生成を提供

公式ドキュメント: https://docs.heygen.com/
V2 API: Create Avatar Video (V2) + Retrieve Video Status
"""
from typing import Optional, List, Dict, Any
import httpx

from app.core.config import settings


class HeyGenClient:
    """HeyGen API クライアント"""

    BASE_URL = "https://api.heygen.com/v2"

    def __init__(self):
        """初期化"""
        self.api_key = settings.HEYGEN_API_KEY
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """遅延初期化されたHTTPクライアント"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=60.0,
                headers={
                    "X-Api-Key": self.api_key,
                    "Content-Type": "application/json",
                }
            )
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def list_avatars(self) -> List[Dict[str, Any]]:
        """
        利用可能なアバター一覧を取得

        Returns:
            List[Dict]: アバターリスト
        """
        if not self.is_available():
            return []

        try:
            response = await self.client.get(f"{self.BASE_URL}/avatars")
            response.raise_for_status()
            data = response.json()

            avatars = []
            for avatar in data.get("data", {}).get("avatars", []):
                avatars.append({
                    "avatar_id": avatar.get("avatar_id", ""),
                    "avatar_name": avatar.get("avatar_name", ""),
                    "gender": avatar.get("gender", ""),
                    "preview_image_url": avatar.get("preview_image_url", ""),
                    "preview_video_url": avatar.get("preview_video_url", ""),
                })

            return avatars

        except Exception as e:
            print(f"HeyGen API Error (list_avatars): {e}")
            return []

    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        利用可能なボイス一覧を取得

        Returns:
            List[Dict]: ボイスリスト
        """
        if not self.is_available():
            return []

        try:
            response = await self.client.get(f"{self.BASE_URL}/voices")
            response.raise_for_status()
            data = response.json()

            voices = []
            for voice in data.get("data", {}).get("voices", []):
                voices.append({
                    "voice_id": voice.get("voice_id", ""),
                    "name": voice.get("name", ""),
                    "language": voice.get("language", ""),
                    "gender": voice.get("gender", ""),
                    "preview_audio": voice.get("preview_audio", ""),
                })

            return voices

        except Exception as e:
            print(f"HeyGen API Error (list_voices): {e}")
            return []

    async def create_video(
        self,
        avatar_id: str,
        voice_id: str,
        script: str,
        title: Optional[str] = None,
        background_color: str = "#ffffff",
        width: int = 1920,
        height: int = 1080,
    ) -> Dict[str, Any]:
        """
        アバター動画を生成

        Args:
            avatar_id: アバターID
            voice_id: ボイスID
            script: 読み上げテキスト
            title: 動画タイトル
            background_color: 背景色
            width: 動画幅
            height: 動画高さ

        Returns:
            Dict: 生成タスク情報
        """
        if not self.is_available():
            return {"error": "HeyGen API is not available"}

        try:
            payload = {
                "video_inputs": [
                    {
                        "character": {
                            "type": "avatar",
                            "avatar_id": avatar_id,
                            "avatar_style": "normal",
                        },
                        "voice": {
                            "type": "text",
                            "input_text": script,
                            "voice_id": voice_id,
                        },
                        "background": {
                            "type": "color",
                            "value": background_color,
                        }
                    }
                ],
                "dimension": {
                    "width": width,
                    "height": height,
                },
                "title": title or "Generated Video",
            }

            response = await self.client.post(
                f"{self.BASE_URL}/video/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "video_id": data.get("data", {}).get("video_id", ""),
                "status": "processing",
            }

        except httpx.HTTPStatusError as e:
            print(f"HeyGen API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"HeyGen API Error (create_video): {e}")
            return {"error": str(e)}

    async def get_video_status(self, video_id: str) -> Dict[str, Any]:
        """
        動画生成ステータスを取得

        Args:
            video_id: 動画ID

        Returns:
            Dict: ステータス情報
            - status: pending, processing, completed, failed
            - video_url: 完了時の動画URL
            - thumbnail_url: サムネイルURL
            - duration: 動画の長さ（秒）
        """
        if not self.is_available():
            return {"error": "HeyGen API is not available"}

        try:
            response = await self.client.get(f"{self.BASE_URL}/video_status.get?video_id={video_id}")
            response.raise_for_status()
            data = response.json()

            # HeyGen V2 APIのレスポンス形式
            if data.get("code") == 100:
                video_data = data.get("data", {})
                return {
                    "video_id": video_id,
                    "status": video_data.get("status", "unknown"),
                    "video_url": video_data.get("video_url", ""),
                    "thumbnail_url": video_data.get("thumbnail_url", ""),
                    "duration": video_data.get("duration", 0),
                    "error": video_data.get("error", ""),
                }
            else:
                error_msg = data.get("message", "Unknown error")
                return {"error": error_msg, "status": "error"}

        except httpx.HTTPStatusError as e:
            print(f"HeyGen API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e), "status": "error"}
        except Exception as e:
            print(f"HeyGen API Error (get_video_status): {e}")
            return {"error": str(e), "status": "error"}

    async def create_video_with_audio(
        self,
        avatar_id: str,
        audio_url: str,
        title: Optional[str] = None,
        background_color: str = "#ffffff",
        width: int = 1920,
        height: int = 1080,
    ) -> Dict[str, Any]:
        """
        既存の音声ファイルを使用してアバター動画を生成

        Args:
            avatar_id: アバターID
            audio_url: 音声ファイルURL
            title: 動画タイトル
            background_color: 背景色
            width: 動画幅
            height: 動画高さ

        Returns:
            Dict: 生成タスク情報
        """
        if not self.is_available():
            return {"error": "HeyGen API is not available"}

        try:
            payload = {
                "video_inputs": [
                    {
                        "character": {
                            "type": "avatar",
                            "avatar_id": avatar_id,
                            "avatar_style": "normal",
                        },
                        "voice": {
                            "type": "audio",
                            "audio_url": audio_url,
                        },
                        "background": {
                            "type": "color",
                            "value": background_color,
                        }
                    }
                ],
                "dimension": {
                    "width": width,
                    "height": height,
                },
                "title": title or "Generated Video",
            }

            response = await self.client.post(
                f"{self.BASE_URL}/video/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "video_id": data.get("data", {}).get("video_id", ""),
                "status": "processing",
            }

        except httpx.HTTPStatusError as e:
            print(f"HeyGen API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"HeyGen API Error (create_video_with_audio): {e}")
            return {"error": str(e)}


# シングルトンインスタンス
heygen_api = HeyGenClient()
