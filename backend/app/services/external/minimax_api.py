"""
MiniMax Audio API クライアント

ボイスクローン・音声合成を提供
"""
from typing import Optional, List, Dict, Any
import httpx
import base64

from app.core.config import settings


class MiniMaxAudioClient:
    """MiniMax Audio API クライアント"""

    BASE_URL = "https://api.minimax.chat/v1"

    def __init__(self):
        """初期化"""
        self.api_key = settings.MINIMAX_API_KEY
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """遅延初期化されたHTTPクライアント"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=120.0,  # 音声生成は時間がかかる場合がある
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        利用可能なボイス一覧を取得

        Returns:
            List[Dict]: ボイスモデルリスト
        """
        if not self.is_available():
            return []

        try:
            response = await self.client.get(f"{self.BASE_URL}/text_to_speech/voices")
            response.raise_for_status()
            data = response.json()

            voices = []
            for voice in data.get("voices", []):
                voices.append({
                    "voice_id": voice.get("voice_id", ""),
                    "name": voice.get("name", ""),
                    "language": voice.get("language", ""),
                    "gender": voice.get("gender", ""),
                    "description": voice.get("description", ""),
                    "preview_url": voice.get("preview_url", ""),
                })

            return voices

        except Exception as e:
            print(f"MiniMax API Error (list_voices): {e}")
            return []

    async def text_to_speech(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        volume: float = 1.0,
        output_format: str = "mp3",
    ) -> Dict[str, Any]:
        """
        テキストから音声を生成

        Args:
            text: 読み上げテキスト
            voice_id: ボイスID
            speed: 速度（0.5〜2.0）
            pitch: ピッチ調整（-12〜12）
            volume: 音量（0.1〜1.0）
            output_format: 出力形式（mp3, wav）

        Returns:
            Dict: 生成結果（audio_data, duration等）
        """
        if not self.is_available():
            return {"error": "MiniMax Audio API is not available"}

        try:
            payload = {
                "text": text,
                "voice_id": voice_id,
                "speed": max(0.5, min(2.0, speed)),
                "pitch": max(-12, min(12, pitch)),
                "vol": max(0.1, min(1.0, volume)),
                "output_format": output_format,
            }

            response = await self.client.post(
                f"{self.BASE_URL}/text_to_speech",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            # 音声データはbase64エンコードで返される場合がある
            audio_data = data.get("audio_data", "")
            audio_url = data.get("audio_url", "")

            return {
                "audio_data": audio_data,
                "audio_url": audio_url,
                "duration": data.get("duration", 0),
                "format": output_format,
                "sample_rate": data.get("sample_rate", 44100),
            }

        except httpx.HTTPStatusError as e:
            print(f"MiniMax API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"MiniMax API Error (text_to_speech): {e}")
            return {"error": str(e)}

    async def clone_voice(
        self,
        audio_data: bytes,
        voice_name: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        音声サンプルからボイスクローンを作成

        Args:
            audio_data: 音声ファイルのバイナリデータ
            voice_name: ボイス名
            description: 説明

        Returns:
            Dict: 作成されたボイスの情報
        """
        if not self.is_available():
            return {"error": "MiniMax Audio API is not available"}

        try:
            # 音声データをbase64エンコード
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            payload = {
                "voice_name": voice_name,
                "audio_data": audio_base64,
                "description": description or f"Cloned voice: {voice_name}",
            }

            response = await self.client.post(
                f"{self.BASE_URL}/voice_clone",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "voice_id": data.get("voice_id", ""),
                "voice_name": voice_name,
                "status": data.get("status", "created"),
            }

        except httpx.HTTPStatusError as e:
            print(f"MiniMax API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"MiniMax API Error (clone_voice): {e}")
            return {"error": str(e)}

    async def get_voice_status(self, voice_id: str) -> Dict[str, Any]:
        """
        ボイスクローンのステータスを取得

        Args:
            voice_id: ボイスID

        Returns:
            Dict: ステータス情報
        """
        if not self.is_available():
            return {"error": "MiniMax Audio API is not available"}

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/voice_clone/{voice_id}"
            )
            response.raise_for_status()
            data = response.json()

            return {
                "voice_id": voice_id,
                "status": data.get("status", "unknown"),
                "voice_name": data.get("voice_name", ""),
                "preview_url": data.get("preview_url", ""),
            }

        except Exception as e:
            print(f"MiniMax API Error (get_voice_status): {e}")
            return {"error": str(e), "status": "error"}

    async def generate_with_emotion(
        self,
        text: str,
        voice_id: str,
        emotion: str = "neutral",
        emotion_intensity: float = 0.5,
        speed: float = 1.0,
    ) -> Dict[str, Any]:
        """
        感情を付与して音声を生成

        Args:
            text: 読み上げテキスト
            voice_id: ボイスID
            emotion: 感情（neutral, happy, sad, angry, fearful, surprised）
            emotion_intensity: 感情の強度（0.0〜1.0）
            speed: 速度

        Returns:
            Dict: 生成結果
        """
        if not self.is_available():
            return {"error": "MiniMax Audio API is not available"}

        try:
            payload = {
                "text": text,
                "voice_id": voice_id,
                "emotion": emotion,
                "emotion_intensity": max(0.0, min(1.0, emotion_intensity)),
                "speed": max(0.5, min(2.0, speed)),
            }

            response = await self.client.post(
                f"{self.BASE_URL}/text_to_speech/emotional",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "audio_data": data.get("audio_data", ""),
                "audio_url": data.get("audio_url", ""),
                "duration": data.get("duration", 0),
                "emotion": emotion,
            }

        except httpx.HTTPStatusError as e:
            print(f"MiniMax API HTTP Error: {e.response.status_code} - {e.response.text}")
            return {"error": str(e)}
        except Exception as e:
            print(f"MiniMax API Error (generate_with_emotion): {e}")
            return {"error": str(e)}


# シングルトンインスタンス
minimax_audio = MiniMaxAudioClient()
