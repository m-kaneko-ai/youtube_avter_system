"""
音声生成 + GCSアップロードの統合テスト

production_service.pyのAudioService.generate_audio()を通して
GCSアップロードが正しく統合されているかテストします。
"""
import asyncio
from uuid import uuid4

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 環境変数読み込み
load_dotenv(".env.local")

from app.core.config import settings
from app.models import Video, Project, Client, User
from app.models.user import UserRole
from app.schemas.production import AudioGenerateRequest
from app.services.production_service import AudioService


async def setup_test_data(session: AsyncSession):
    """テスト用データを準備"""
    print("📝 Setting up test data...")

    # テストユーザー作成
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        role=UserRole.OWNER,
    )
    session.add(user)

    # テストクライアント作成
    client = Client(
        id=uuid4(),
        user_id=user.id,
        company_name="Test Company",
        plan="basic",
    )
    session.add(client)

    # テストプロジェクト作成
    project = Project(
        id=uuid4(),
        client_id=client.id,
        name="Test Project",
        status="active",
    )
    session.add(project)

    # テスト動画作成
    video = Video(
        id=uuid4(),
        project_id=project.id,
        title="Test Video for Audio Generation",
        status="script",
    )
    session.add(video)

    await session.commit()
    await session.refresh(video)

    print(f"✅ Test data created")
    print(f"   - Video ID: {video.id}")
    return video


async def test_audio_generation_with_gcs():
    """音声生成 + GCSアップロードのテスト"""
    print("=" * 60)
    print("🧪 Audio Generation + GCS Upload Integration Test")
    print("=" * 60)

    # データベース接続（postgresql:// → postgresql+asyncpg://）
    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # テストデータ準備
        video = await setup_test_data(session)

        # 音声生成リクエスト
        request = AudioGenerateRequest(
            video_id=video.id,
            script_id=None,
            text="これはGoogle Cloud Storageアップロードのテストです。音声が正しくアップロードされることを確認します。",
            voice_id="default_voice",
            voice_name="Default Voice",
            speed=1.0,
            pitch=0.0,
        )

        print("\n📤 Generating audio...")
        print(f"   Text: {request.text[:50]}...")

        try:
            # 音声生成実行
            result = await AudioService.generate_audio(
                db=session, current_user_role=UserRole.OWNER.value, request=request
            )

            print(f"\n✅ Audio generation completed!")
            print(f"   Audio ID: {result.audio_id}")
            print(f"   Status: {result.status}")
            print(f"   Message: {result.message}")

            # 音声データを取得して確認
            audio = await AudioService.get_audio(
                db=session,
                current_user_role=UserRole.OWNER.value,
                audio_id=result.audio_id,
            )

            print(f"\n📊 Audio Details:")
            print(f"   URL: {audio.audio_url}")
            print(f"   Duration: {audio.duration}s")
            print(f"   Voice ID: {audio.voice_id}")
            print(f"   Voice Name: {audio.voice_name}")

            # URLの形式を確認
            if audio.audio_url.startswith("https://storage.googleapis.com"):
                print(f"\n✅ GCS Upload Success!")
                print(f"   Audio is stored in Google Cloud Storage")
            elif audio.audio_url.startswith("file://"):
                print(f"\n⚠️  Local Fallback Mode")
                print(f"   Audio is stored locally (GCS not configured)")
            elif audio.audio_url.startswith("data:audio"):
                print(f"\n⚠️  Data URL Mode")
                print(f"   Audio is embedded as base64 (fallback)")
            else:
                print(f"\n⚠️  Mock Mode")
                print(f"   Using stub audio URL (no actual upload)")

        except Exception as e:
            print(f"\n❌ Audio generation failed: {e}")
            raise

    await engine.dispose()

    print("\n" + "=" * 60)
    print("✅ Integration test completed!")
    print("=" * 60)


async def main():
    """メイン実行"""
    print("\n🚀 Starting Audio + GCS Integration Test...\n")
    await test_audio_generation_with_gcs()
    print("\n🎉 All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
