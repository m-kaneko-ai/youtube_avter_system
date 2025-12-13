"""
Redisキャッシュモジュール

高速なデータキャッシングとセッション管理を提供
"""
import json
import functools
import hashlib
import logging
from typing import Any, Callable, TypeVar, ParamSpec, Optional
from datetime import timedelta

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

from app.core.config import settings

logger = logging.getLogger(__name__)
P = ParamSpec('P')
T = TypeVar('T')


# ========== Redis接続プール ==========

_pool: Optional[ConnectionPool] = None


async def get_redis_pool() -> ConnectionPool:
    """
    Redis接続プールを取得または作成

    Returns:
        ConnectionPool: Redis接続プール
    """
    global _pool
    if _pool is None:
        _pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True,
        )
    return _pool


async def get_redis() -> redis.Redis:
    """
    Redisクライアントを取得

    Returns:
        redis.Redis: Redisクライアントインスタンス
    """
    pool = await get_redis_pool()
    return redis.Redis(connection_pool=pool)


async def close_redis() -> None:
    """
    Redis接続プールをクローズ

    アプリケーション終了時に呼び出す
    """
    global _pool
    if _pool:
        await _pool.disconnect()
        _pool = None
        logger.info("Redis connection pool closed")


# ========== キャッシュ操作 ==========


class CacheService:
    """
    キャッシュサービスクラス

    Usage:
        cache = CacheService()
        await cache.set("user:123", user_data, ttl=3600)
        user = await cache.get("user:123")
    """

    def __init__(self, prefix: str = "cs"):
        """
        初期化

        Args:
            prefix: キャッシュキーのプレフィックス（cs = Creator Studio）
        """
        self.prefix = prefix
        self.default_ttl = settings.REDIS_CACHE_TTL

    def _make_key(self, key: str) -> str:
        """キーにプレフィックスを付与"""
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        """
        キャッシュから値を取得

        Args:
            key: キャッシュキー

        Returns:
            キャッシュされた値、存在しない場合はNone
        """
        try:
            client = await get_redis()
            value = await client.get(self._make_key(key))
            if value is None:
                return None
            return json.loads(value)
        except redis.RedisError as e:
            logger.warning(f"Redis get error for key '{key}': {e}")
            return None
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error for key '{key}': {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        キャッシュに値を設定

        Args:
            key: キャッシュキー
            value: キャッシュする値（JSON serializable）
            ttl: 有効期限（秒）、Noneの場合はデフォルト値を使用

        Returns:
            bool: 成功した場合True
        """
        try:
            client = await get_redis()
            serialized = json.dumps(value, ensure_ascii=False, default=str)
            await client.setex(
                self._make_key(key),
                ttl or self.default_ttl,
                serialized,
            )
            return True
        except redis.RedisError as e:
            logger.warning(f"Redis set error for key '{key}': {e}")
            return False
        except (TypeError, ValueError) as e:
            logger.warning(f"JSON serialize error for key '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        キャッシュから値を削除

        Args:
            key: キャッシュキー

        Returns:
            bool: 削除された場合True
        """
        try:
            client = await get_redis()
            result = await client.delete(self._make_key(key))
            return result > 0
        except redis.RedisError as e:
            logger.warning(f"Redis delete error for key '{key}': {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        パターンにマッチするキーを一括削除

        Args:
            pattern: 削除パターン（例: "user:*"）

        Returns:
            int: 削除されたキーの数
        """
        try:
            client = await get_redis()
            full_pattern = self._make_key(pattern)
            keys = []
            async for key in client.scan_iter(match=full_pattern):
                keys.append(key)
            if keys:
                return await client.delete(*keys)
            return 0
        except redis.RedisError as e:
            logger.warning(f"Redis delete_pattern error for '{pattern}': {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """
        キーが存在するか確認

        Args:
            key: キャッシュキー

        Returns:
            bool: 存在する場合True
        """
        try:
            client = await get_redis()
            return await client.exists(self._make_key(key)) > 0
        except redis.RedisError as e:
            logger.warning(f"Redis exists error for key '{key}': {e}")
            return False

    async def ttl(self, key: str) -> int:
        """
        キーの残り有効期限を取得

        Args:
            key: キャッシュキー

        Returns:
            int: 残り秒数、-1: 無期限、-2: キーなし
        """
        try:
            client = await get_redis()
            return await client.ttl(self._make_key(key))
        except redis.RedisError as e:
            logger.warning(f"Redis ttl error for key '{key}': {e}")
            return -2

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        カウンターをインクリメント

        Args:
            key: キャッシュキー
            amount: 増加量

        Returns:
            int: 新しい値、エラー時はNone
        """
        try:
            client = await get_redis()
            return await client.incrby(self._make_key(key), amount)
        except redis.RedisError as e:
            logger.warning(f"Redis increment error for key '{key}': {e}")
            return None


# グローバルキャッシュインスタンス
cache = CacheService()


# ========== キャッシュデコレータ ==========


def cached(
    key_prefix: str,
    ttl: Optional[int] = None,
    key_builder: Optional[Callable[..., str]] = None,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    関数の結果をキャッシュするデコレータ

    Usage:
        @cached("user", ttl=3600)
        async def get_user(user_id: str) -> User:
            return await db.get_user(user_id)

        # カスタムキービルダー
        @cached("search", key_builder=lambda query, page: f"{query}:{page}")
        async def search(query: str, page: int = 1):
            ...

    Args:
        key_prefix: キャッシュキーのプレフィックス
        ttl: 有効期限（秒）
        key_builder: カスタムキービルダー関数

    Returns:
        デコレートされた関数
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # キャッシュキーを生成
            if key_builder:
                cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
            else:
                # デフォルト: 引数のハッシュをキーに使用
                key_data = json.dumps(
                    {"args": args, "kwargs": kwargs},
                    sort_keys=True,
                    default=str,
                )
                key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
                cache_key = f"{key_prefix}:{key_hash}"

            # キャッシュから取得
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # キャッシュミス: 関数を実行
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)

            # 結果をキャッシュ
            if result is not None:
                await cache.set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator


def invalidate_cache(key_prefix: str) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    関数実行後にキャッシュを無効化するデコレータ

    Usage:
        @invalidate_cache("user:*")
        async def update_user(user_id: str, data: UserUpdate):
            ...

    Args:
        key_prefix: 無効化するキャッシュのパターン

    Returns:
        デコレートされた関数
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            result = await func(*args, **kwargs)
            # キャッシュを無効化
            deleted = await cache.delete_pattern(key_prefix)
            logger.debug(f"Invalidated {deleted} cache keys matching '{key_prefix}'")
            return result
        return wrapper
    return decorator


# ========== レートリミッター ==========


class RateLimiter:
    """
    Redisベースのレートリミッター

    Usage:
        limiter = RateLimiter("api", max_requests=100, window_seconds=60)
        is_allowed = await limiter.check("user:123")
    """

    def __init__(
        self,
        prefix: str,
        max_requests: int,
        window_seconds: int,
    ):
        """
        初期化

        Args:
            prefix: キーのプレフィックス
            max_requests: ウィンドウ内の最大リクエスト数
            window_seconds: ウィンドウサイズ（秒）
        """
        self.prefix = prefix
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    def _make_key(self, identifier: str) -> str:
        """レートリミットキーを生成"""
        return f"rl:{self.prefix}:{identifier}"

    async def check(self, identifier: str) -> bool:
        """
        レートリミットをチェック

        Args:
            identifier: ユーザーID、IPアドレスなど

        Returns:
            bool: リクエストが許可される場合True
        """
        try:
            client = await get_redis()
            key = self._make_key(identifier)

            # カウンターをインクリメント
            current = await client.incr(key)

            # 初回の場合はTTLを設定
            if current == 1:
                await client.expire(key, self.window_seconds)

            # リミット超過チェック
            if current > self.max_requests:
                logger.warning(
                    f"Rate limit exceeded for {identifier}: "
                    f"{current}/{self.max_requests} in {self.window_seconds}s"
                )
                return False

            return True
        except redis.RedisError as e:
            logger.error(f"Rate limit check error: {e}")
            # Redis障害時は許可（fail-open）
            return True

    async def get_remaining(self, identifier: str) -> tuple[int, int]:
        """
        残りリクエスト数とリセットまでの秒数を取得

        Args:
            identifier: ユーザーID、IPアドレスなど

        Returns:
            tuple: (残りリクエスト数, リセットまでの秒数)
        """
        try:
            client = await get_redis()
            key = self._make_key(identifier)

            current = await client.get(key)
            ttl = await client.ttl(key)

            current_count = int(current) if current else 0
            remaining = max(0, self.max_requests - current_count)
            reset_seconds = max(0, ttl) if ttl > 0 else 0

            return remaining, reset_seconds
        except redis.RedisError as e:
            logger.error(f"Rate limit get_remaining error: {e}")
            return self.max_requests, 0


# デフォルトのレートリミッター（100リクエスト/分）
api_rate_limiter = RateLimiter("api", max_requests=100, window_seconds=60)
