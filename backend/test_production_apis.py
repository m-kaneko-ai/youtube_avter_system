#!/usr/bin/env python3
"""
動画制作API連携テスト

MiniMax AudioとHeyGen APIの基本動作を確認
"""
import asyncio
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# .env.localを読み込む
load_dotenv(".env.local")

from app.services.external.minimax_api import minimax_audio
from app.services.external.heygen_api import heygen_api


async def test_minimax():
    """MiniMax Audio API テスト"""
    print("\n" + "=" * 50)
    print("MiniMax Audio API テスト")
    print("=" * 50)

    # API利用可否確認
    if not minimax_audio.is_available():
        print("❌ MiniMax API Key が設定されていません")
        print("   .env.local に MINIMAX_API_KEY を設定してください")
        return

    print("✅ MiniMax API Key が設定されています")

    # ボイス一覧取得テスト
    print("\n📋 ボイス一覧を取得中...")
    voices = await minimax_audio.list_voices()
    if voices:
        print(f"✅ {len(voices)} 個のボイスが見つかりました")
        if len(voices) > 0:
            print(f"   例: {voices[0].get('name', 'Unknown')}")
    else:
        print("⚠️  ボイス一覧が取得できませんでした（エンドポイント未実装の可能性）")

    # 音声生成テスト
    print("\n🎤 音声生成テスト...")
    result = await minimax_audio.text_to_speech(
        text="これはテストメッセージです。MiniMax Audioの音声生成機能を確認しています。",
        voice_id="default_voice",
        speed=1.0,
        pitch=0.0,
        model="speech-02-hd",
        emotion="neutral",
    )

    if "error" in result:
        print(f"❌ エラー: {result['error']}")
    else:
        print("✅ 音声生成成功")
        print(f"   Duration: {result.get('duration', 0)} 秒")
        print(f"   Format: {result.get('format', 'unknown')}")
        audio_data = result.get('audio_data', '')
        if audio_data:
            print(f"   Audio Data: {len(audio_data)} バイト (base64)")


async def test_heygen():
    """HeyGen API テスト"""
    print("\n" + "=" * 50)
    print("HeyGen API テスト")
    print("=" * 50)

    # API利用可否確認
    if not heygen_api.is_available():
        print("❌ HeyGen API Key が設定されていません")
        print("   .env.local に HEYGEN_API_KEY を設定してください")
        return

    print("✅ HeyGen API Key が設定されています")

    # アバター一覧取得テスト
    print("\n👤 アバター一覧を取得中...")
    avatars = await heygen_api.list_avatars()
    if avatars:
        print(f"✅ {len(avatars)} 個のアバターが見つかりました")
        if len(avatars) > 0:
            print(f"   例: {avatars[0].get('avatar_name', 'Unknown')}")
    else:
        print("⚠️  アバター一覧が取得できませんでした")

    # ボイス一覧取得テスト
    print("\n🔊 ボイス一覧を取得中...")
    voices = await heygen_api.list_voices()
    if voices:
        print(f"✅ {len(voices)} 個のボイスが見つかりました")
        if len(voices) > 0:
            print(f"   例: {voices[0].get('name', 'Unknown')}")
    else:
        print("⚠️  ボイス一覧が取得できませんでした")

    print("\n⚠️  動画生成テストは実際のクレジット消費を避けるため省略します")
    print("   production_service.pyの実装により、実際の動画生成フローで動作確認できます")


async def main():
    """メインテスト実行"""
    print("\n🚀 動画制作API連携テスト開始")

    await test_minimax()
    await test_heygen()

    print("\n" + "=" * 50)
    print("✅ テスト完了")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
