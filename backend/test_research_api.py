"""
リサーチAPI動作確認スクリプト

実際のFastAPIサーバーに対して、リサーチAPIエンドポイントの動作を確認する
"""
import asyncio
import httpx


async def test_research_endpoints():
    """リサーチエンドポイントの動作確認"""
    base_url = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        print("=== リサーチAPI動作確認 ===\n")

        # スライス4-B: コメント分析系エンドポイント
        print("【スライス4-B: コメント分析系】")

        # 1. 書籍トレンド
        print("\n1. GET /api/v1/research/trends/books")
        try:
            response = await client.get(f"{base_url}/api/v1/research/trends/books")
            print(f"   Status: {response.status_code}")
            if response.status_code == 403:
                print("   ✓ 認証エラー（期待通り）")
            elif response.status_code == 200:
                data = response.json()
                print(f"   ✓ 成功: {len(data.get('data', []))}件の書籍データ")
        except Exception as e:
            print(f"   ✗ エラー: {e}")

        # 2. コメント感情分析
        print("\n2. GET /api/v1/research/comments/sentiment")
        try:
            response = await client.get(
                f"{base_url}/api/v1/research/comments/sentiment",
                params={"video_id": "test_video_123"}
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 403:
                print("   ✓ 認証エラー（期待通り）")
            elif response.status_code == 200:
                data = response.json()
                sentiment = data.get('sentiment', {})
                print(f"   ✓ 成功: ポジティブ率 {sentiment.get('positive_ratio', 0):.1%}")
        except Exception as e:
            print(f"   ✗ エラー: {e}")

        # 3. コメントキーワード抽出
        print("\n3. GET /api/v1/research/comments/keywords")
        try:
            response = await client.get(
                f"{base_url}/api/v1/research/comments/keywords",
                params={"video_id": "test_video_123", "limit": 10}
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 403:
                print("   ✓ 認証エラー（期待通り）")
            elif response.status_code == 200:
                data = response.json()
                print(f"   ✓ 成功: {len(data.get('data', []))}件のキーワード")
        except Exception as e:
            print(f"   ✗ エラー: {e}")

        # 4. 注目コメント取得
        print("\n4. GET /api/v1/research/comments/notable")
        try:
            response = await client.get(
                f"{base_url}/api/v1/research/comments/notable",
                params={"video_id": "test_video_123", "limit": 10}
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 403:
                print("   ✓ 認証エラー（期待通り）")
            elif response.status_code == 200:
                data = response.json()
                print(f"   ✓ 成功: {len(data.get('data', []))}件の注目コメント")
        except Exception as e:
            print(f"   ✗ エラー: {e}")

        print("\n" + "="*50)
        print("全エンドポイントの接続確認完了")
        print("="*50 + "\n")


if __name__ == "__main__":
    asyncio.run(test_research_endpoints())
