"""
Google Cloud Storage サービス

音声・動画ファイルのアップロード、署名付きURL生成、削除機能を提供
"""
import base64
import os
from datetime import timedelta
from pathlib import Path
from typing import Optional
from uuid import uuid4

from app.core.config import settings


class GCSService:
    """Google Cloud Storage サービス"""

    def __init__(self):
        """
        GCSクライアントを初期化

        環境変数:
            GCS_BUCKET_NAME: GCSバケット名
            GCS_PROJECT_ID: GCPプロジェクトID（オプション）
            GOOGLE_APPLICATION_CREDENTIALS: サービスアカウントキーのパス（オプション）
        """
        self.bucket_name = settings.GCS_BUCKET_NAME
        self.project_id = settings.GCS_PROJECT_ID
        self._client = None
        self._bucket = None

        # ローカルフォールバック用ディレクトリ
        self.local_storage_dir = Path("/tmp/creator_studio_storage")
        self.local_storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_client(self):
        """GCSクライアントを遅延初期化（APIキー未設定時はNone）"""
        if self._client is None and self.bucket_name:
            try:
                from google.cloud import storage

                # GOOGLE_APPLICATION_CREDENTIALSが設定されている場合はそれを使用
                if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(
                    settings.GOOGLE_APPLICATION_CREDENTIALS
                ):
                    os.environ[
                        "GOOGLE_APPLICATION_CREDENTIALS"
                    ] = settings.GOOGLE_APPLICATION_CREDENTIALS

                # クライアント初期化
                if self.project_id:
                    self._client = storage.Client(project=self.project_id)
                else:
                    self._client = storage.Client()

                self._bucket = self._client.bucket(self.bucket_name)
            except Exception as e:
                print(f"GCS client initialization failed: {e}")
                self._client = None
                self._bucket = None

        return self._client

    def is_available(self) -> bool:
        """GCSが利用可能かどうか"""
        return self._get_client() is not None

    async def upload_audio(
        self, audio_data: bytes, filename: str, content_type: str = "audio/mpeg"
    ) -> str:
        """
        音声データをGCSにアップロードしてURLを返す

        Args:
            audio_data: 音声データ（bytes）
            filename: ファイル名（拡張子含む）
            content_type: コンテンツタイプ（デフォルト: audio/mpeg）

        Returns:
            str: アップロードされたファイルの公開URL
        """
        # ユニークなファイル名を生成
        unique_filename = f"audio/{uuid4()}/{filename}"

        # GCS利用可能な場合
        if self.is_available():
            try:
                blob = self._bucket.blob(unique_filename)
                blob.upload_from_string(audio_data, content_type=content_type)

                # 公開URLを返す
                # NOTE: バケットが公開設定されている場合は以下のURLで直接アクセス可能
                public_url = f"https://storage.googleapis.com/{self.bucket_name}/{unique_filename}"
                return public_url
            except Exception as e:
                print(f"GCS upload failed: {e}")
                # フォールバックへ

        # ローカルフォールバックの場合
        local_path = self.local_storage_dir / unique_filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(audio_data)

        # ローカルファイルパスを返す（本番環境では適切なURL変換が必要）
        return f"file://{local_path}"

    async def upload_video(
        self, video_data: bytes, filename: str, content_type: str = "video/mp4"
    ) -> str:
        """
        動画データをGCSにアップロードしてURLを返す

        Args:
            video_data: 動画データ（bytes）
            filename: ファイル名（拡張子含む）
            content_type: コンテンツタイプ（デフォルト: video/mp4）

        Returns:
            str: アップロードされたファイルの公開URL
        """
        # ユニークなファイル名を生成
        unique_filename = f"video/{uuid4()}/{filename}"

        # GCS利用可能な場合
        if self.is_available():
            try:
                blob = self._bucket.blob(unique_filename)
                blob.upload_from_string(video_data, content_type=content_type)

                # 公開URLを返す
                public_url = f"https://storage.googleapis.com/{self.bucket_name}/{unique_filename}"
                return public_url
            except Exception as e:
                print(f"GCS upload failed: {e}")
                # フォールバックへ

        # ローカルフォールバックの場合
        local_path = self.local_storage_dir / unique_filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(video_data)

        # ローカルファイルパスを返す（本番環境では適切なURL変換が必要）
        return f"file://{local_path}"

    async def get_signed_url(self, blob_name: str, expiration: int = 3600) -> str:
        """
        署名付きURLを生成（一時的なアクセス許可）

        Args:
            blob_name: GCS上のファイル名
            expiration: 有効期限（秒）デフォルト: 3600秒（1時間）

        Returns:
            str: 署名付きURL
        """
        if not self.is_available():
            # ローカルファイルの場合はそのまま返す
            local_path = self.local_storage_dir / blob_name
            if local_path.exists():
                return f"file://{local_path}"
            raise FileNotFoundError(f"File not found: {blob_name}")

        try:
            blob = self._bucket.blob(blob_name)
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=expiration),
                method="GET",
            )
            return url
        except Exception as e:
            print(f"Failed to generate signed URL: {e}")
            raise

    async def delete_file(self, blob_name: str) -> bool:
        """
        ファイルを削除

        Args:
            blob_name: GCS上のファイル名

        Returns:
            bool: 削除成功したらTrue
        """
        if not self.is_available():
            # ローカルファイルの場合
            local_path = self.local_storage_dir / blob_name
            if local_path.exists():
                local_path.unlink()
                return True
            return False

        try:
            blob = self._bucket.blob(blob_name)
            blob.delete()
            return True
        except Exception as e:
            print(f"Failed to delete file: {e}")
            return False

    async def upload_from_base64(
        self,
        base64_data: str,
        filename: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        """
        Base64エンコードされたデータをGCSにアップロード

        Args:
            base64_data: Base64エンコードされた文字列
            filename: ファイル名（拡張子含む）
            content_type: コンテンツタイプ

        Returns:
            str: アップロードされたファイルの公開URL
        """
        try:
            # Base64デコード
            audio_data = base64.b64decode(base64_data)

            # コンテンツタイプに応じてアップロード
            if content_type.startswith("audio/"):
                return await self.upload_audio(audio_data, filename, content_type)
            elif content_type.startswith("video/"):
                return await self.upload_video(audio_data, filename, content_type)
            else:
                raise ValueError(f"Unsupported content type: {content_type}")
        except Exception as e:
            print(f"Failed to upload from base64: {e}")
            raise


# シングルトンインスタンス
gcs_service = GCSService()
