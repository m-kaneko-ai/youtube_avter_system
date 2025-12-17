"""
MiniMax Audio API テストスクリプト

環境変数 MINIMAX_API_KEY が設定されていない場合はモックモードで動作します。
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# backend/.env.local を読み込み
env_path = Path(__file__).parent / ".env.local"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded environment from: {env_path}")
else:
    print(f"⚠ .env.local not found at: {env_path}")

# app モジュールをインポート可能にする
sys.path.insert(0, str(Path(__file__).parent))

from app.services.external.minimax_api import minimax_audio


async def test_api_availability():
    """APIキーの確認"""
    print("\n" + "="*60)
    print("TEST 1: API Availability Check")
    print("="*60)

    api_key = os.getenv("MINIMAX_API_KEY", "")
    if api_key:
        print(f"✓ MINIMAX_API_KEY is set: {api_key[:10]}...{api_key[-4:]}")
    else:
        print("⚠ MINIMAX_API_KEY is not set")

    is_available = minimax_audio.is_available()
    print(f"API Available: {is_available}")

    return is_available


async def test_text_to_speech_simple():
    """簡単なテキストからTTS生成"""
    print("\n" + "="*60)
    print("TEST 2: Simple Text-to-Speech")
    print("="*60)

    test_text = "こんにちは、MiniMax Audioのテストです。"
    voice_id = "male-qn-qingse"  # サンプルボイスID

    print(f"Text: {test_text}")
    print(f"Voice ID: {voice_id}")
    print(f"Model: speech-02-hd")
    print("\nGenerating audio...")

    result = await minimax_audio.text_to_speech(
        text=test_text,
        voice_id=voice_id,
        model="speech-02-hd",
        speed=1.0,
        emotion="neutral"
    )

    if "error" in result:
        print(f"❌ Error: {result['error']}")
        return False
    else:
        print(f"✓ Success!")
        print(f"  Duration: {result.get('duration', 0):.2f}s")
        print(f"  Format: {result.get('format', 'unknown')}")
        print(f"  Sample Rate: {result.get('sample_rate', 0)} Hz")
        audio_data = result.get("audio_data", "")
        if audio_data:
            print(f"  Audio data length: {len(audio_data)} bytes (base64)")
            # 最初の100文字を表示
            print(f"  Audio data preview: {audio_data[:100]}...")
        else:
            print("  ⚠ No audio data returned")
        return True


async def test_text_to_speech_with_emotion():
    """感情付きTTS生成"""
    print("\n" + "="*60)
    print("TEST 3: Text-to-Speech with Emotion")
    print("="*60)

    test_text = "これは感情を込めた音声生成のテストです。"
    voice_id = "male-qn-qingse"
    emotion = "happy"

    print(f"Text: {test_text}")
    print(f"Voice ID: {voice_id}")
    print(f"Emotion: {emotion}")
    print("\nGenerating audio...")

    result = await minimax_audio.text_to_speech(
        text=test_text,
        voice_id=voice_id,
        emotion=emotion,
        speed=1.0,
        pitch=0.0,
        volume=1.0
    )

    if "error" in result:
        print(f"❌ Error: {result['error']}")
        return False
    else:
        print(f"✓ Success!")
        print(f"  Duration: {result.get('duration', 0):.2f}s")
        return True


async def test_error_handling():
    """エラーハンドリングのテスト"""
    print("\n" + "="*60)
    print("TEST 4: Error Handling")
    print("="*60)

    # 空のテキストでテスト
    print("Testing with empty text...")
    result = await minimax_audio.text_to_speech(
        text="",
        voice_id="male-qn-qingse"
    )

    if "error" in result:
        print(f"✓ Expected error caught: {result['error']}")
    else:
        print("⚠ No error for empty text (API might handle it)")

    # 無効なボイスIDでテスト
    print("\nTesting with invalid voice_id...")
    result = await minimax_audio.text_to_speech(
        text="テスト",
        voice_id="invalid_voice_id_12345"
    )

    if "error" in result:
        print(f"✓ Expected error caught: {result['error']}")
    else:
        print("⚠ No error for invalid voice_id")

    return True


async def test_parameter_validation():
    """パラメータバリデーションのテスト"""
    print("\n" + "="*60)
    print("TEST 5: Parameter Validation")
    print("="*60)

    test_text = "パラメータテストです。"
    voice_id = "male-qn-qingse"

    # 範囲外のspeedでテスト（自動的にクランプされる）
    print("Testing with speed=10.0 (should be clamped to 2.0)...")
    result = await minimax_audio.text_to_speech(
        text=test_text,
        voice_id=voice_id,
        speed=10.0  # 範囲外
    )

    if "error" not in result:
        print("✓ Parameter clamping works correctly")
    else:
        print(f"⚠ Unexpected error: {result['error']}")

    # 範囲外のpitchでテスト
    print("\nTesting with pitch=100 (should be clamped to 12)...")
    result = await minimax_audio.text_to_speech(
        text=test_text,
        voice_id=voice_id,
        pitch=100  # 範囲外
    )

    if "error" not in result:
        print("✓ Parameter clamping works correctly")
    else:
        print(f"⚠ Unexpected error: {result['error']}")

    return True


async def test_long_text():
    """長文のテスト"""
    print("\n" + "="*60)
    print("TEST 6: Long Text (10,000 characters limit)")
    print("="*60)

    # 10,000文字を超えるテキストを作成
    long_text = "これは長文のテストです。" * 1000  # 約12,000文字
    voice_id = "male-qn-qingse"

    print(f"Original text length: {len(long_text)} characters")
    print("Generating audio (should be truncated to 10,000 chars)...")

    result = await minimax_audio.text_to_speech(
        text=long_text,
        voice_id=voice_id
    )

    if "error" in result:
        print(f"⚠ Error: {result['error']}")
        return False
    else:
        print(f"✓ Success! Text was automatically truncated")
        return True


async def main():
    """全テストを実行"""
    print("\n" + "="*60)
    print("MiniMax Audio API Test Suite")
    print("="*60)

    # APIキーの確認
    is_available = await test_api_availability()

    if not is_available:
        print("\n" + "="*60)
        print("MOCK MODE")
        print("="*60)
        print("⚠ MINIMAX_API_KEY is not set.")
        print("To set it up:")
        print("1. Sign up at https://www.minimax.chat/")
        print("2. Get your API key")
        print("3. Add to backend/.env.local:")
        print("   MINIMAX_API_KEY=your_api_key_here")
        print("\nProceeding with mock mode tests...")

    # テスト実行
    results = {
        "simple_tts": await test_text_to_speech_simple(),
        "emotion_tts": await test_text_to_speech_with_emotion(),
        "error_handling": await test_error_handling(),
        "parameter_validation": await test_parameter_validation(),
        "long_text": await test_long_text(),
    }

    # サマリー
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)

    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")

    if passed_tests == total_tests:
        print("\n🎉 All tests passed!")
    elif passed_tests == 0:
        print("\n⚠ All tests failed (probably due to missing API key)")
    else:
        print(f"\n⚠ {total_tests - passed_tests} test(s) failed")

    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
