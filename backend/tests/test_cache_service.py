"""
Redisキャッシュサービスのテスト
"""
import pytest
from datetime import date
from uuid import uuid4

from app.core.cache import CacheService, cache


@pytest.mark.asyncio
async def test_cache_service_basic_operations():
    """基本的なキャッシュ操作のテスト"""
    cache_service = CacheService(prefix="test")

    # セット
    key = "test_key"
    value = {"name": "テスト", "count": 123}
    result = await cache_service.set(key, value, ttl=60)
    assert result is True

    # 取得
    cached_value = await cache_service.get(key)
    assert cached_value == value

    # 削除
    deleted = await cache_service.delete(key)
    assert deleted is True

    # 削除後の取得
    cached_value = await cache_service.get(key)
    assert cached_value is None


@pytest.mark.asyncio
async def test_cache_service_exists():
    """キー存在確認のテスト"""
    cache_service = CacheService(prefix="test")

    key = "exists_test"
    value = {"test": "data"}

    # 存在しない場合
    exists = await cache_service.exists(key)
    assert exists is False

    # セット後
    await cache_service.set(key, value, ttl=60)
    exists = await cache_service.exists(key)
    assert exists is True

    # クリーンアップ
    await cache_service.delete(key)


@pytest.mark.asyncio
async def test_cache_service_ttl():
    """TTL取得のテスト"""
    cache_service = CacheService(prefix="test")

    key = "ttl_test"
    value = {"test": "data"}

    # セット
    await cache_service.set(key, value, ttl=60)

    # TTL確認（60秒に近い値のはず）
    ttl = await cache_service.ttl(key)
    assert 50 < ttl <= 60

    # クリーンアップ
    await cache_service.delete(key)


@pytest.mark.asyncio
async def test_cache_service_delete_pattern():
    """パターン削除のテスト"""
    cache_service = CacheService(prefix="test")

    # 複数のキーをセット
    await cache_service.set("user:1", {"id": 1}, ttl=60)
    await cache_service.set("user:2", {"id": 2}, ttl=60)
    await cache_service.set("post:1", {"id": 1}, ttl=60)

    # user:* を削除
    deleted_count = await cache_service.delete_pattern("user:*")
    assert deleted_count == 2

    # user:1, user:2 は削除されている
    assert await cache_service.exists("user:1") is False
    assert await cache_service.exists("user:2") is False

    # post:1 は残っている
    assert await cache_service.exists("post:1") is True

    # クリーンアップ
    await cache_service.delete("post:1")


@pytest.mark.asyncio
async def test_cache_decorator():
    """キャッシュデコレータのテスト"""
    call_count = 0

    from app.core.cache import cached

    @cached("test_func", ttl=60)
    async def test_function(x: int, y: int) -> int:
        nonlocal call_count
        call_count += 1
        return x + y

    # 初回呼び出し（キャッシュミス）
    result1 = await test_function(1, 2)
    assert result1 == 3
    assert call_count == 1

    # 2回目呼び出し（キャッシュヒット）
    result2 = await test_function(1, 2)
    assert result2 == 3
    assert call_count == 1  # 関数は呼ばれていない

    # 異なる引数（キャッシュミス）
    result3 = await test_function(2, 3)
    assert result3 == 5
    assert call_count == 2

    # クリーンアップ
    test_cache = CacheService()
    await test_cache.delete_pattern("test_func:*")


@pytest.mark.asyncio
async def test_cache_decorator_with_key_builder():
    """カスタムキービルダーを使用したキャッシュデコレータのテスト"""
    call_count = 0

    from app.core.cache import cached

    @cached(
        "custom_func",
        ttl=60,
        key_builder=lambda user_id, date_from=None: f"{user_id}:{date_from}"
    )
    async def get_user_data(user_id: str, date_from: date = None) -> dict:
        nonlocal call_count
        call_count += 1
        return {"user_id": user_id, "date": str(date_from)}

    # 初回呼び出し
    today = date.today()
    result1 = await get_user_data("user123", today)
    assert result1["user_id"] == "user123"
    assert call_count == 1

    # 2回目呼び出し（キャッシュヒット）
    result2 = await get_user_data("user123", today)
    assert result2["user_id"] == "user123"
    assert call_count == 1

    # クリーンアップ
    test_cache = CacheService()
    await test_cache.delete_pattern("custom_func:*")


@pytest.mark.asyncio
async def test_cache_increment():
    """インクリメント機能のテスト"""
    cache_service = CacheService(prefix="test")

    key = "counter"

    # 初回インクリメント
    value1 = await cache_service.increment(key, 1)
    assert value1 == 1

    # 2回目インクリメント
    value2 = await cache_service.increment(key, 1)
    assert value2 == 2

    # 10増やす
    value3 = await cache_service.increment(key, 10)
    assert value3 == 12

    # クリーンアップ
    await cache_service.delete(key)


@pytest.mark.asyncio
async def test_global_cache_instance():
    """グローバルキャッシュインスタンスのテスト"""
    # グローバルキャッシュインスタンスを使用
    key = "global_test"
    value = {"test": "global"}

    await cache.set(key, value, ttl=60)
    cached_value = await cache.get(key)
    assert cached_value == value

    # クリーンアップ
    await cache.delete(key)
