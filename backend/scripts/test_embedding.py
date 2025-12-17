"""
埋め込み生成テストスクリプト

OpenAI API統合のテスト
"""
import asyncio
import sys
from pathlib import Path

# バックエンドのルートディレクトリをパスに追加
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from app.services.embedding_service import EmbeddingService


async def test_embedding():
    """埋め込み生成のテスト"""
    print("=" * 60)
    print("埋め込み生成テスト")
    print("=" * 60)

    service = EmbeddingService()

    # OpenAI APIの状態を確認
    if service.openai_client:
        print("✓ OpenAI API: 有効")
        print(f"  モデル: {service.model}")
    else:
        print("✗ OpenAI API: 無効（フォールバック実装を使用）")

    print()

    # テストテキスト
    test_texts = [
        "これは短いテストテキストです。",
        "これはもう少し長いテストテキストです。" * 10,
        "日本語のテキストで埋め込みを生成します。" * 100,
    ]

    for i, text in enumerate(test_texts, 1):
        print(f"テスト {i}:")
        print(f"  テキスト長: {len(text)} 文字")

        # トークン数・コスト推定
        tokens, cost = service.estimate_cost(text)
        print(f"  推定トークン数: {tokens:,} tokens")
        print(f"  推定コスト: ${cost:.6f} USD")

        # 埋め込み生成
        try:
            embedding = await service.generate_embedding(text)
            print(f"  ✓ 埋め込み生成成功")
            print(f"    次元数: {len(embedding)}")
            print(f"    サンプル値: {embedding[:3]}")

            # 正規化チェック
            import math
            norm = math.sqrt(sum(x * x for x in embedding))
            print(f"    ノルム: {norm:.6f}")

        except Exception as e:
            print(f"  ✗ エラー: {e}")

        print()


if __name__ == "__main__":
    try:
        asyncio.run(test_embedding())
    except KeyboardInterrupt:
        print("\n\n中断されました。")
        sys.exit(0)
