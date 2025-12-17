"""
Google Cloud Storage サービスのテストスクリプト

GCSへのアップロード、署名付きURL生成、削除をテストします。
"""
import asyncio
import base64
from pathlib import Path

from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv(".env.local")

from app.services.external.gcs_service import gcs_service


async def test_gcs_upload():
    """GCSアップロードのテスト"""
    print("=" * 60)
    print("🧪 GCS Service Test - Upload Audio & Video")
    print("=" * 60)

    # GCS利用可能性チェック
    print(f"\n✅ GCS Available: {gcs_service.is_available()}")
    if not gcs_service.is_available():
        print("⚠️  GCS未設定 - ローカルフォールバックモードで動作します")
        print(f"   ローカル保存先: {gcs_service.local_storage_dir}")

    # テスト用の音声データ（ダミー）
    dummy_audio = b"This is a dummy audio file content for testing purposes."
    filename_audio = "test_audio.mp3"

    print(f"\n📤 Uploading audio: {filename_audio}")
    try:
        audio_url = await gcs_service.upload_audio(
            audio_data=dummy_audio,
            filename=filename_audio,
            content_type="audio/mpeg",
        )
        print(f"✅ Audio uploaded successfully!")
        print(f"   URL: {audio_url}")
    except Exception as e:
        print(f"❌ Audio upload failed: {e}")
        return

    # テスト用の動画データ（ダミー）
    dummy_video = b"This is a dummy video file content for testing purposes."
    filename_video = "test_video.mp4"

    print(f"\n📤 Uploading video: {filename_video}")
    try:
        video_url = await gcs_service.upload_video(
            video_data=dummy_video,
            filename=filename_video,
            content_type="video/mp4",
        )
        print(f"✅ Video uploaded successfully!")
        print(f"   URL: {video_url}")
    except Exception as e:
        print(f"❌ Video upload failed: {e}")
        return

    # Base64アップロードのテスト
    print(f"\n📤 Uploading from Base64...")
    dummy_base64 = base64.b64encode(dummy_audio).decode("utf-8")
    try:
        base64_url = await gcs_service.upload_from_base64(
            base64_data=dummy_base64,
            filename="test_base64_audio.mp3",
            content_type="audio/mpeg",
        )
        print(f"✅ Base64 upload successful!")
        print(f"   URL: {base64_url}")
    except Exception as e:
        print(f"❌ Base64 upload failed: {e}")

    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)


async def test_gcs_signed_url():
    """署名付きURL生成のテスト"""
    print("\n" + "=" * 60)
    print("🧪 GCS Service Test - Signed URL Generation")
    print("=" * 60)

    if not gcs_service.is_available():
        print("⚠️  GCS未設定 - 署名付きURLはローカルファイルパスを返します")

    # テストファイルをアップロード
    dummy_audio = b"Test audio for signed URL"
    filename = "test_signed_audio.mp3"

    print(f"\n📤 Uploading test file: {filename}")
    try:
        audio_url = await gcs_service.upload_audio(
            audio_data=dummy_audio,
            filename=filename,
            content_type="audio/mpeg",
        )
        print(f"✅ File uploaded: {audio_url}")

        # ファイル名を抽出（GCSの場合）
        if audio_url.startswith("https://storage.googleapis.com"):
            blob_name = audio_url.split(f"{gcs_service.bucket_name}/")[-1]
        elif audio_url.startswith("file://"):
            blob_name = audio_url.replace("file://", "").replace(
                str(gcs_service.local_storage_dir) + "/", ""
            )
        else:
            print("❌ Invalid URL format")
            return

        # 署名付きURL生成
        print(f"\n🔐 Generating signed URL for: {blob_name}")
        signed_url = await gcs_service.get_signed_url(blob_name, expiration=3600)
        print(f"✅ Signed URL generated!")
        print(f"   URL: {signed_url}")
    except Exception as e:
        print(f"❌ Signed URL test failed: {e}")

    print("\n" + "=" * 60)


async def test_gcs_delete():
    """ファイル削除のテスト"""
    print("\n" + "=" * 60)
    print("🧪 GCS Service Test - File Deletion")
    print("=" * 60)

    # テストファイルをアップロード
    dummy_audio = b"Test audio for deletion"
    filename = "test_delete_audio.mp3"

    print(f"\n📤 Uploading test file: {filename}")
    try:
        audio_url = await gcs_service.upload_audio(
            audio_data=dummy_audio,
            filename=filename,
            content_type="audio/mpeg",
        )
        print(f"✅ File uploaded: {audio_url}")

        # ファイル名を抽出
        if audio_url.startswith("https://storage.googleapis.com"):
            blob_name = audio_url.split(f"{gcs_service.bucket_name}/")[-1]
        elif audio_url.startswith("file://"):
            blob_name = audio_url.replace("file://", "").replace(
                str(gcs_service.local_storage_dir) + "/", ""
            )
        else:
            print("❌ Invalid URL format")
            return

        # ファイル削除
        print(f"\n🗑️  Deleting file: {blob_name}")
        deleted = await gcs_service.delete_file(blob_name)
        if deleted:
            print(f"✅ File deleted successfully!")
        else:
            print(f"❌ File deletion failed")
    except Exception as e:
        print(f"❌ Delete test failed: {e}")

    print("\n" + "=" * 60)


async def main():
    """全テストを実行"""
    print("\n🚀 Starting GCS Service Tests...")

    # 1. アップロードテスト
    await test_gcs_upload()

    # 2. 署名付きURLテスト
    await test_gcs_signed_url()

    # 3. 削除テスト
    await test_gcs_delete()

    print("\n" + "=" * 60)
    print("🎉 All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
