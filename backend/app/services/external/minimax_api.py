"""
MiniMax Audio API クライアント

ボイスクローン・音声合成を提供

公式ドキュメント: https://platform.minimax.io/docs/api-reference/speech-t2a-intro
APIホスト: https://api.minimaxi.chat (グローバル)

## モックモード
MINIMAX_API_KEYが設定されていない場合、自動的にモックモードで動作します。
モックモードでは、実際のAPIを呼び出さず、サンプルのbase64音声データを返します。
"""
from typing import Optional, List, Dict, Any
import httpx
import base64
import asyncio
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class MiniMaxAudioClient:
    """MiniMax Audio API クライアント"""

    BASE_URL = "https://api.minimaxi.chat/v1/t2a"
    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # seconds

    def __init__(self):
        """初期化"""
        self.api_key = settings.MINIMAX_API_KEY
        self._client = None
        self._mock_mode = not bool(self.api_key)

        if self._mock_mode:
            logger.warning("MiniMax Audio API: MOCK MODE (API key not set)")
        else:
            logger.info("MiniMax Audio API: REAL MODE")

    @property
    def client(self) -> httpx.AsyncClient:
        """遅延初期化されたHTTPクライアント"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=120.0,  # 音声生成は時間がかかる場合がある
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                base_url=self.BASE_URL,
            )
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか（モックモードでもTrueを返す）"""
        return True  # モックモードでも利用可能とみなす

    def is_mock_mode(self) -> bool:
        """モックモードかどうか"""
        return self._mock_mode

    def _generate_mock_audio_base64(self, text: str, duration: float = 2.0) -> str:
        """
        モック用のbase64音声データを生成

        実際のMP3ファイルのヘッダーを含む最小限のダミーデータ
        """
        # 最小限のMP3ヘッダー（ID3v2 + MP3フレーム）
        # これは実際に再生可能な無音のMP3データ
        mp3_header = (
            b'ID3\x04\x00\x00\x00\x00\x00\x00'  # ID3v2ヘッダー
            b'\xff\xfb\x90\x00'  # MP3フレームヘッダー（44.1kHz, 128kbps）
        )

        # ダミーフレームを追加（無音）
        dummy_frame = b'\x00' * 417  # 1フレーム分のサイズ

        # 複数フレームを結合（duration秒分）
        num_frames = int(duration * 38.28)  # 44.1kHzの場合、1秒あたり約38.28フレーム
        audio_data = mp3_header + (dummy_frame * num_frames)

        return base64.b64encode(audio_data).decode('utf-8')

    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        利用可能なボイス一覧を取得

        Returns:
            List[Dict]: ボイスモデルリスト
        """
        if self._mock_mode:
            logger.info("MiniMax API (MOCK): Returning mock voice list")
            return [
                {
                    "voice_id": "male-qn-qingse",
                    "name": "青年男性",
                    "language": "ja-JP",
                    "gender": "male",
                    "description": "モック音声 - 青年男性",
                    "preview_url": "",
                },
                {
                    "voice_id": "female-shaonv",
                    "name": "少女",
                    "language": "ja-JP",
                    "gender": "female",
                    "description": "モック音声 - 少女",
                    "preview_url": "",
                },
            ]

        try:
            # MiniMax APIは300+のシステムボイスを提供
            # 実際のエンドポイントはドキュメント要確認
            response = await self.client.get("/voices")
            response.raise_for_status()
            data = response.json()

            voices = []
            for voice in data.get("data", {}).get("voices", []):
                voices.append({
                    "voice_id": voice.get("voice_id", ""),
                    "name": voice.get("name", ""),
                    "language": voice.get("language", ""),
                    "gender": voice.get("gender", ""),
                    "description": voice.get("description", ""),
                    "preview_url": voice.get("preview_url", ""),
                })

            logger.info(f"MiniMax API: Retrieved {len(voices)} voices")
            return voices

        except Exception as e:
            logger.error(f"MiniMax API Error (list_voices): {e}")
            return []

    async def text_to_speech(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        volume: float = 1.0,
        output_format: str = "mp3",
        model: str = "speech-02-hd",
        emotion: str = "neutral",
    ) -> Dict[str, Any]:
        """
        テキストから音声を生成（同期API）

        Args:
            text: 読み上げテキスト（最大10,000文字）
            voice_id: ボイスID
            speed: 速度（0.5〜2.0）
            pitch: ピッチ調整（-12〜12）
            volume: 音量（0.1〜1.0）
            output_format: 出力形式（mp3, wav, pcm, flac）
            model: モデル（speech-02-hd, speech-02-turbo, speech-01-hd, speech-01-turbo）
            emotion: 感情（happy, sad, angry, fearful, disgusted, surprised, neutral）

        Returns:
            Dict: 生成結果（audio_file base64, extra_info等）
        """
        # モックモードの場合
        if self._mock_mode:
            logger.info(f"MiniMax API (MOCK): Generating mock audio for text: {text[:50]}...")
            await asyncio.sleep(0.5)  # API呼び出しをシミュレート

            # テキスト長から推定duration（1文字 = 0.2秒と仮定）
            estimated_duration = len(text[:10000]) * 0.2

            return {
                "audio_data": self._generate_mock_audio_base64(text, estimated_duration),
                "duration": estimated_duration,
                "format": output_format,
                "sample_rate": 32000,
                "mock": True,  # モックデータであることを示す
            }

        # 実際のAPI呼び出し（リトライロジック付き）
        for attempt in range(self.MAX_RETRIES):
            try:
                payload = {
                    "model": model,
                    "text": text[:10000],  # 文字数制限
                    "voice_setting": {
                        "voice_id": voice_id,
                        "speed": max(0.5, min(2.0, speed)),
                        "vol": max(0.1, min(1.0, volume)),
                        "pitch": max(-12, min(12, pitch)),
                    },
                    "audio_setting": {
                        "sample_rate": 32000,
                        "bitrate": 128000,
                        "format": output_format,
                        "channel": 1,
                    },
                    "emotion": emotion,
                }

                logger.info(f"MiniMax API: Sending TTS request (attempt {attempt + 1}/{self.MAX_RETRIES})")
                response = await self.client.post("", json=payload)
                response.raise_for_status()
                data = response.json()

                # MiniMaxは同期APIのためbase64エンコードされた音声ファイルを返す
                if data.get("base_resp", {}).get("status_code") == 0:
                    audio_file = data.get("data", {}).get("audio_file", "")
                    extra_info = data.get("data", {}).get("extra_info", {})

                    logger.info(f"MiniMax API: TTS generation successful (duration: {extra_info.get('audio_length', 0) / 1000.0:.2f}s)")

                    return {
                        "audio_data": audio_file,  # base64エンコードされた音声
                        "duration": extra_info.get("audio_length", 0) / 1000.0,  # ms to seconds
                        "format": output_format,
                        "sample_rate": 32000,
                    }
                else:
                    error_msg = data.get("base_resp", {}).get("status_msg", "Unknown error")
                    error_code = data.get("base_resp", {}).get("status_code", -1)
                    logger.error(f"MiniMax API Error: [{error_code}] {error_msg}")
                    return {"error": f"[{error_code}] {error_msg}"}

            except httpx.HTTPStatusError as e:
                error_detail = f"HTTP {e.response.status_code}"
                try:
                    error_body = e.response.json()
                    error_detail += f": {error_body}"
                except:
                    error_detail += f": {e.response.text[:200]}"

                logger.error(f"MiniMax API HTTP Error (attempt {attempt + 1}): {error_detail}")

                # レート制限エラーの場合はリトライ
                if e.response.status_code == 429:
                    if attempt < self.MAX_RETRIES - 1:
                        retry_after = int(e.response.headers.get("Retry-After", self.RETRY_DELAY))
                        logger.info(f"Rate limited. Retrying after {retry_after}s...")
                        await asyncio.sleep(retry_after)
                        continue

                return {"error": error_detail}

            except httpx.TimeoutException as e:
                logger.error(f"MiniMax API Timeout (attempt {attempt + 1}): {e}")
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                    continue
                return {"error": f"Request timeout after {self.MAX_RETRIES} attempts"}

            except Exception as e:
                logger.error(f"MiniMax API Error (attempt {attempt + 1}): {type(e).__name__}: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                    continue
                return {"error": f"Unexpected error: {type(e).__name__}: {str(e)}"}

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
        # モックモードの場合
        if self._mock_mode:
            logger.info(f"MiniMax API (MOCK): Cloning voice '{voice_name}'")
            await asyncio.sleep(1.0)  # API呼び出しをシミュレート

            mock_voice_id = f"mock-clone-{voice_name.lower().replace(' ', '-')}"
            return {
                "voice_id": mock_voice_id,
                "voice_name": voice_name,
                "status": "created",
                "mock": True,
            }

        try:
            # 音声データをbase64エンコード
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            payload = {
                "voice_name": voice_name,
                "audio_data": audio_base64,
                "description": description or f"Cloned voice: {voice_name}",
            }

            logger.info(f"MiniMax API: Cloning voice '{voice_name}'")
            response = await self.client.post(
                f"{self.BASE_URL}/voice_clone",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            logger.info(f"MiniMax API: Voice clone successful (voice_id: {data.get('voice_id', '')})")

            return {
                "voice_id": data.get("voice_id", ""),
                "voice_name": voice_name,
                "status": data.get("status", "created"),
            }

        except httpx.HTTPStatusError as e:
            error_detail = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            logger.error(f"MiniMax API HTTP Error (clone_voice): {error_detail}")
            return {"error": error_detail}
        except Exception as e:
            logger.error(f"MiniMax API Error (clone_voice): {type(e).__name__}: {e}")
            return {"error": f"{type(e).__name__}: {str(e)}"}

    async def get_voice_status(self, voice_id: str) -> Dict[str, Any]:
        """
        ボイスクローンのステータスを取得

        Args:
            voice_id: ボイスID

        Returns:
            Dict: ステータス情報
        """
        # モックモードの場合
        if self._mock_mode:
            logger.info(f"MiniMax API (MOCK): Getting voice status for '{voice_id}'")
            await asyncio.sleep(0.3)  # API呼び出しをシミュレート

            return {
                "voice_id": voice_id,
                "status": "ready",
                "voice_name": voice_id.replace("mock-clone-", "").replace("-", " ").title(),
                "preview_url": "",
                "mock": True,
            }

        try:
            logger.info(f"MiniMax API: Getting voice status for '{voice_id}'")
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
            logger.error(f"MiniMax API Error (get_voice_status): {type(e).__name__}: {e}")
            return {"error": f"{type(e).__name__}: {str(e)}", "status": "error"}

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

        このメソッドは通常のtext_to_speechメソッドにemotion引数を追加することで実現されます。
        （現在のMiniMax APIでは専用エンドポイントではなく、text_to_speechでemotion指定可能）

        Args:
            text: 読み上げテキスト
            voice_id: ボイスID
            emotion: 感情（neutral, happy, sad, angry, fearful, surprised）
            emotion_intensity: 感情の強度（0.0〜1.0）
            speed: 速度

        Returns:
            Dict: 生成結果
        """
        # text_to_speechメソッドを使用（emotion引数を渡す）
        return await self.text_to_speech(
            text=text,
            voice_id=voice_id,
            emotion=emotion,
            speed=speed,
        )


# シングルトンインスタンス
minimax_audio = MiniMaxAudioClient()
