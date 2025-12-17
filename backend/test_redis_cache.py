#!/usr/bin/env python3
"""
Redisキャッシュ統合テストスクリプト

実行前にRedisが起動していることを確認してください:
$ redis-server

テスト実行:
$ python test_redis_cache.py
"""
import asyncio
import sys
from datetime import date
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(".env.local")

from app.core.cache import cache, CacheService


async def test_basic_cache_operations():
    """基本的なキャッシュ操作のテスト"""
    print("\n=== 基本的なキャッシュ操作テスト ===")

    # セット
    key = "test:basic"
    value = {"name": "Creator Studio AI", "version": "1.0"}
    print(f"SET: {key} = {value}")
    result = await cache.set(key, value, ttl=60)
    print(f"Result: {result}")

    # 取得
    print(f"\nGET: {key}")
    cached_value = await cache.get(key)
    print(f"Result: {cached_value}")
    assert cached_value == value, "キャッシュ値が一致しません"

    # TTL確認
    print(f"\nTTL: {key}")
    ttl = await cache.ttl(key)
    print(f"Result: {ttl}秒")

    # 削除
    print(f"\nDELETE: {key}")
    deleted = await cache.delete(key)
    print(f"Result: {deleted}")

    # 削除後の取得
    print(f"\nGET after DELETE: {key}")
    cached_value = await cache.get(key)
    print(f"Result: {cached_value}")
    assert cached_value is None, "削除後もキャッシュが残っています"

    print("\n✅ 基本操作テスト成功")


async def test_master_data_cache():
    """マスターデータキャッシュのシミュレーション"""
    print("\n=== マスターデータキャッシュテスト ===")

    # カテゴリデータのキャッシュ（1時間）
    categories = [
        {"id": "1", "name": "チュートリアル", "description": "How-to動画"},
        {"id": "2", "name": "レビュー", "description": "商品レビュー"},
        {"id": "3", "name": "Vlog", "description": "日常動画"},
    ]
    key = "master:categories"
    print(f"SET: {key} (TTL: 3600秒)")
    await cache.set(key, categories, ttl=3600)

    # タグデータのキャッシュ（1時間）
    tags = [
        {"id": "1", "name": "初心者向け"},
        {"id": "2", "name": "上級者向け"},
        {"id": "3", "name": "人気"},
    ]
    key = "master:tags"
    print(f"SET: {key} (TTL: 3600秒)")
    await cache.set(key, tags, ttl=3600)

    # 取得
    print(f"\nGET: master:categories")
    cached_categories = await cache.get("master:categories")
    print(f"Result: {len(cached_categories)} categories")
    assert len(cached_categories) == 3

    print(f"\nGET: master:tags")
    cached_tags = await cache.get("master:tags")
    print(f"Result: {len(cached_tags)} tags")
    assert len(cached_tags) == 3

    # クリーンアップ
    await cache.delete("master:categories")
    await cache.delete("master:tags")

    print("\n✅ マスターデータキャッシュテスト成功")


async def test_analytics_cache():
    """分析APIキャッシュのシミュレーション"""
    print("\n=== 分析APIキャッシュテスト ===")

    # 動画分析データのキャッシュ（10分）
    video_id = "video-123"
    date_from = date(2025, 12, 1)
    date_to = date(2025, 12, 17)

    analytics_data = {
        "video_id": video_id,
        "total_views": 15420,
        "total_watch_time_minutes": 45230.5,
        "average_view_duration": 176.3,
        "total_likes": 892,
    }

    key = f"analytics:video:{video_id}:{date_from}:{date_to}"
    print(f"SET: {key} (TTL: 600秒)")
    await cache.set(key, analytics_data, ttl=600)

    # 取得
    print(f"\nGET: {key}")
    cached_analytics = await cache.get(key)
    print(f"Result: {cached_analytics['total_views']} views")
    assert cached_analytics["total_views"] == 15420

    # TTL確認
    ttl = await cache.ttl(key)
    print(f"Remaining TTL: {ttl}秒")
    assert 590 < ttl <= 600

    # クリーンアップ
    await cache.delete(key)

    print("\n✅ 分析APIキャッシュテスト成功")


async def test_pattern_delete():
    """パターン削除のテスト"""
    print("\n=== パターン削除テスト ===")

    # 複数のキーをセット
    keys = [
        "analytics:video:1",
        "analytics:video:2",
        "analytics:video:3",
        "analytics:channel:1",
        "master:categories",
    ]

    for key in keys:
        await cache.set(key, {"test": "data"}, ttl=60)
        print(f"SET: {key}")

    # analytics:video:* を削除
    print("\nDELETE PATTERN: analytics:video:*")
    deleted = await cache.delete_pattern("analytics:video:*")
    print(f"Deleted: {deleted} keys")
    assert deleted == 3

    # 残りのキーを確認
    exists = await cache.exists("analytics:channel:1")
    print(f"\nEXISTS: analytics:channel:1 = {exists}")
    assert exists is True

    exists = await cache.exists("master:categories")
    print(f"EXISTS: master:categories = {exists}")
    assert exists is True

    # クリーンアップ
    await cache.delete("analytics:channel:1")
    await cache.delete("master:categories")

    print("\n✅ パターン削除テスト成功")


async def test_cache_decorator():
    """キャッシュデコレータのテスト"""
    print("\n=== キャッシュデコレータテスト ===")

    call_count = 0

    from app.core.cache import cached

    @cached(
        "test:decorator",
        ttl=60,
        key_builder=lambda user_id: f"{user_id}"
    )
    async def get_user_data(user_id: str) -> dict:
        nonlocal call_count
        call_count += 1
        print(f"  → 関数実行: {user_id}")
        return {"user_id": user_id, "name": f"User {user_id}"}

    # 初回呼び出し（キャッシュミス）
    print("\n1回目の呼び出し:")
    result1 = await get_user_data("user123")
    print(f"Result: {result1}")
    assert call_count == 1

    # 2回目呼び出し（キャッシュヒット）
    print("\n2回目の呼び出し (キャッシュヒット):")
    result2 = await get_user_data("user123")
    print(f"Result: {result2}")
    print(f"関数呼び出し回数: {call_count}")
    assert call_count == 1  # 関数は呼ばれていない
    assert result2 == result1

    # 異なる引数（キャッシュミス）
    print("\n3回目の呼び出し (異なる引数):")
    result3 = await get_user_data("user456")
    print(f"Result: {result3}")
    print(f"関数呼び出し回数: {call_count}")
    assert call_count == 2

    # クリーンアップ
    await cache.delete_pattern("test:decorator:*")

    print("\n✅ キャッシュデコレータテスト成功")


async def main():
    """メインテスト実行"""
    print("=" * 60)
    print("Redis Cache Integration Test")
    print("=" * 60)

    try:
        # Redis接続テスト
        print("\n=== Redis接続確認 ===")
        from app.core.cache import get_redis
        redis_client = await get_redis()
        pong = await redis_client.ping()
        print(f"Redis PING: {pong}")

        if not pong:
            print("\n❌ Redisに接続できません")
            print("以下のコマンドでRedisを起動してください:")
            print("$ redis-server")
            sys.exit(1)

        # 各テストを実行
        await test_basic_cache_operations()
        await test_master_data_cache()
        await test_analytics_cache()
        await test_pattern_delete()
        await test_cache_decorator()

        print("\n" + "=" * 60)
        print("✅ 全テスト成功")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
