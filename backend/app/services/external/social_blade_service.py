"""
Social Blade API連携サービス

YouTubeチャンネルの履歴データを取得するためのサービス。
競合分析エージェント(competitor_analyzer)で使用。

機能:
- チャンネル統計履歴取得
- 成長率計算
- ランキング情報取得
- Redisキャッシング（TTL: 1時間）
- モックフォールバック（API利用不可時）
- レート制限対応
"""
import asyncio
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import hashlib

from app.services.external.social_blade_api import social_blade_api
from app.core.config import settings

logger = logging.getLogger(__name__)


class SocialBladeService:
    """Social Blade API連携サービス（キャッシング + モックフォールバック）"""

    CACHE_TTL = 3600  # 1時間
    RATE_LIMIT_DELAY = 2.0  # API呼び出し間隔（秒）

    def __init__(self):
        """初期化"""
        self._redis_client = None
        self._last_api_call = 0.0

    @property
    def redis_client(self):
        """遅延初期化されたRedisクライアント"""
        if self._redis_client is None:
            try:
                import redis.asyncio as redis
                self._redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                )
            except Exception as e:
                logger.warning(f"Redis initialization failed: {e}")
                self._redis_client = None
        return self._redis_client

    def _generate_cache_key(self, prefix: str, **kwargs) -> str:
        """キャッシュキーを生成"""
        key_data = json.dumps(kwargs, sort_keys=True)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()[:8]
        return f"socialblade:{prefix}:{key_hash}"

    async def _get_cached(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """キャッシュから取得"""
        if not self.redis_client:
            return None

        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                logger.debug(f"Cache hit: {cache_key}")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis get error: {e}")

        return None

    async def _set_cache(self, cache_key: str, data: Dict[str, Any]) -> None:
        """キャッシュに保存"""
        if not self.redis_client:
            return

        try:
            await self.redis_client.setex(
                cache_key,
                self.CACHE_TTL,
                json.dumps(data, ensure_ascii=False),
            )
            logger.debug(f"Cache set: {cache_key}")
        except Exception as e:
            logger.warning(f"Redis set error: {e}")

    async def _rate_limit_wait(self) -> None:
        """レート制限対応（API呼び出し間隔調整）"""
        current_time = asyncio.get_event_loop().time()
        elapsed = current_time - self._last_api_call

        if elapsed < self.RATE_LIMIT_DELAY:
            wait_time = self.RATE_LIMIT_DELAY - elapsed
            logger.debug(f"Rate limit wait: {wait_time:.2f}s")
            await asyncio.sleep(wait_time)

        self._last_api_call = asyncio.get_event_loop().time()

    def _get_mock_channel_stats(self, channel_id: str) -> Dict[str, Any]:
        """モックデータ: チャンネル統計"""
        return {
            "channel_id": channel_id,
            "username": f"MockChannel_{channel_id[:8]}",
            "subscriber_count": 125000,
            "video_count": 324,
            "total_views": 8500000,
            "grade": "A",
            "subscriber_rank": 1523,
            "video_views_rank": 2341,
            "country_rank": 456,
            "created_at": "2020-03-15",
            "_is_mock": True,
        }

    def _get_mock_channel_history(self, channel_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """モックデータ: 履歴データ"""
        history = []
        base_subscribers = 100000

        for i in range(days):
            date = datetime.now() - timedelta(days=days - i - 1)
            daily_growth = 500 + (i * 50)  # 成長加速

            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "subscriber_count": base_subscribers + (i * daily_growth),
                "subscriber_change": daily_growth,
            })

        return history

    def _get_mock_channel_growth(self, channel_id: str) -> Dict[str, Any]:
        """モックデータ: 成長率"""
        return {
            "channel_id": channel_id,
            "subscriber_growth_30d": 25000,
            "subscriber_growth_14d": 12000,
            "subscriber_growth_7d": 5500,
            "views_growth_30d": 1200000,
            "views_growth_14d": 580000,
            "views_growth_7d": 250000,
            "avg_daily_subs": 833,
            "avg_daily_views": 40000,
            "_is_mock": True,
        }

    async def get_channel_stats(self, channel_id: str) -> Dict[str, Any]:
        """
        チャンネル統計取得

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: チャンネル統計（登録者数、総再生回数、動画数、推定収益）
        """
        # キャッシュ確認
        cache_key = self._generate_cache_key("stats", channel_id=channel_id)
        cached = await self._get_cached(cache_key)
        if cached:
            return cached

        # API利用可能チェック
        if not social_blade_api.is_available():
            logger.warning("Social Blade API is not available, using mock data")
            mock_data = self._get_mock_channel_stats(channel_id)
            await self._set_cache(cache_key, mock_data)
            return mock_data

        # レート制限待機
        await self._rate_limit_wait()

        # API呼び出し
        try:
            data = await social_blade_api.get_youtube_channel_stats(channel_id)

            if "error" in data:
                logger.error(f"Social Blade API error: {data['error']}")
                mock_data = self._get_mock_channel_stats(channel_id)
                await self._set_cache(cache_key, mock_data)
                return mock_data

            # 成功時はキャッシュに保存
            await self._set_cache(cache_key, data)
            return data

        except Exception as e:
            logger.error(f"Social Blade API error: {e}")
            mock_data = self._get_mock_channel_stats(channel_id)
            await self._set_cache(cache_key, mock_data)
            return mock_data

    async def get_channel_history(self, channel_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        履歴データ取得

        Args:
            channel_id: YouTubeチャンネルID
            days: 取得日数（デフォルト30日、最大180日）

        Returns:
            List[Dict]: 登録者数推移、再生回数推移、日次変化
        """
        # キャッシュ確認
        cache_key = self._generate_cache_key("history", channel_id=channel_id, days=days)
        cached = await self._get_cached(cache_key)
        if cached:
            return cached

        # API利用可能チェック
        if not social_blade_api.is_available():
            logger.warning("Social Blade API is not available, using mock data")
            mock_data = self._get_mock_channel_history(channel_id, days)
            await self._set_cache(cache_key, mock_data)
            return mock_data

        # レート制限待機
        await self._rate_limit_wait()

        # API呼び出し
        try:
            data = await social_blade_api.get_youtube_channel_history(channel_id, days)

            if not data:
                logger.warning("Social Blade API returned empty data, using mock")
                mock_data = self._get_mock_channel_history(channel_id, days)
                await self._set_cache(cache_key, mock_data)
                return mock_data

            # 成功時はキャッシュに保存
            await self._set_cache(cache_key, data)
            return data

        except Exception as e:
            logger.error(f"Social Blade API error: {e}")
            mock_data = self._get_mock_channel_history(channel_id, days)
            await self._set_cache(cache_key, mock_data)
            return mock_data

    async def get_growth_rate(self, channel_id: str) -> Dict[str, Any]:
        """
        成長率計算

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: 週間成長率、月間成長率、年間成長率
        """
        # キャッシュ確認
        cache_key = self._generate_cache_key("growth", channel_id=channel_id)
        cached = await self._get_cached(cache_key)
        if cached:
            return cached

        # API利用可能チェック
        if not social_blade_api.is_available():
            logger.warning("Social Blade API is not available, using mock data")
            mock_data = self._get_mock_channel_growth(channel_id)
            await self._set_cache(cache_key, mock_data)
            return mock_data

        # レート制限待機
        await self._rate_limit_wait()

        # API呼び出し
        try:
            data = await social_blade_api.get_youtube_channel_growth(channel_id)

            if "error" in data:
                logger.error(f"Social Blade API error: {data['error']}")
                mock_data = self._get_mock_channel_growth(channel_id)
                await self._set_cache(cache_key, mock_data)
                return mock_data

            # 成功時はキャッシュに保存
            await self._set_cache(cache_key, data)
            return data

        except Exception as e:
            logger.error(f"Social Blade API error: {e}")
            mock_data = self._get_mock_channel_growth(channel_id)
            await self._set_cache(cache_key, mock_data)
            return mock_data

    async def get_channel_rank(self, channel_id: str) -> Dict[str, Any]:
        """
        ランキング取得

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: 国内ランキング、カテゴリ別ランキング
        """
        # get_channel_stats() にランキング情報が含まれている
        stats = await self.get_channel_stats(channel_id)

        return {
            "channel_id": channel_id,
            "subscriber_rank": stats.get("subscriber_rank", 0),
            "video_views_rank": stats.get("video_views_rank", 0),
            "country_rank": stats.get("country_rank", 0),
            "grade": stats.get("grade", ""),
        }

    async def get_future_projections(self, channel_id: str) -> Dict[str, Any]:
        """
        将来予測取得（推定収益含む）

        Args:
            channel_id: YouTubeチャンネルID

        Returns:
            Dict: 将来予測データ（登録者数、再生数、推定月間収益）
        """
        # キャッシュ確認
        cache_key = self._generate_cache_key("future", channel_id=channel_id)
        cached = await self._get_cached(cache_key)
        if cached:
            return cached

        # API利用可能チェック
        if not social_blade_api.is_available():
            logger.warning("Social Blade API is not available, using mock data")
            mock_data = {
                "channel_id": channel_id,
                "projected_subs_1_year": 180000,
                "projected_subs_5_years": 450000,
                "projected_views_1_year": 15000000,
                "projected_views_5_years": 80000000,
                "estimated_monthly_earnings_min": 2500,
                "estimated_monthly_earnings_max": 12000,
                "estimated_yearly_earnings_min": 30000,
                "estimated_yearly_earnings_max": 144000,
                "_is_mock": True,
            }
            await self._set_cache(cache_key, mock_data)
            return mock_data

        # レート制限待機
        await self._rate_limit_wait()

        # API呼び出し
        try:
            data = await social_blade_api.get_youtube_future_projections(channel_id)

            if "error" in data:
                logger.error(f"Social Blade API error: {data['error']}")
                mock_data = {
                    "channel_id": channel_id,
                    "projected_subs_1_year": 180000,
                    "projected_subs_5_years": 450000,
                    "projected_views_1_year": 15000000,
                    "projected_views_5_years": 80000000,
                    "estimated_monthly_earnings_min": 2500,
                    "estimated_monthly_earnings_max": 12000,
                    "estimated_yearly_earnings_min": 30000,
                    "estimated_yearly_earnings_max": 144000,
                    "_is_mock": True,
                }
                await self._set_cache(cache_key, mock_data)
                return mock_data

            # 成功時はキャッシュに保存
            await self._set_cache(cache_key, data)
            return data

        except Exception as e:
            logger.error(f"Social Blade API error: {e}")
            mock_data = {
                "channel_id": channel_id,
                "projected_subs_1_year": 180000,
                "projected_subs_5_years": 450000,
                "projected_views_1_year": 15000000,
                "projected_views_5_years": 80000000,
                "estimated_monthly_earnings_min": 2500,
                "estimated_monthly_earnings_max": 12000,
                "estimated_yearly_earnings_min": 30000,
                "estimated_yearly_earnings_max": 144000,
                "_is_mock": True,
            }
            await self._set_cache(cache_key, mock_data)
            return mock_data


# シングルトンインスタンス
social_blade_service = SocialBladeService()
