# Redis キャッシング実装ガイド

## 概要

Creator Studio AI バックエンドにRedisキャッシングを実装し、パフォーマンスを向上させました。

## 実装内容

### 1. Redis接続設定

**ファイル**: `backend/app/core/cache.py`

- 非同期Redis接続プール
- 自動的な接続管理
- グレースフルシャットダウン対応

**環境変数**:
```bash
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=3600  # デフォルトTTL（秒）
REDIS_MAX_CONNECTIONS=20
```

### 2. キャッシュサービス

#### 基本機能

```python
from app.core.cache import cache

# セット
await cache.set("key", {"data": "value"}, ttl=600)

# 取得
value = await cache.get("key")

# 削除
await cache.delete("key")

# パターン削除
await cache.delete_pattern("user:*")

# 存在確認
exists = await cache.exists("key")

# TTL取得
ttl = await cache.ttl("key")

# インクリメント
count = await cache.increment("counter", amount=1)
```

#### キャッシュデコレータ

```python
from app.core.cache import cached

# 基本的な使用法
@cached("user", ttl=3600)
async def get_user(user_id: str) -> User:
    return await db.get_user(user_id)

# カスタムキービルダー
@cached(
    "analytics:video",
    ttl=600,
    key_builder=lambda video_id, date_from, date_to: f"{video_id}:{date_from}:{date_to}"
)
async def get_video_analytics(video_id: str, date_from: date, date_to: date):
    return await fetch_analytics(video_id, date_from, date_to)
```

#### キャッシュ無効化デコレータ

```python
from app.core.cache import invalidate_cache

@invalidate_cache("user:*")
async def update_user(user_id: str, data: UserUpdate):
    return await db.update_user(user_id, data)
```

### 3. マスターデータキャッシュ

**対象**: カテゴリ、タグ
**TTL**: 1時間（3600秒）
**キーパターン**: `cs:master:categories`, `cs:master:tags`

**実装ファイル**:
- `backend/app/services/master_service.py`
- `backend/app/api/v1/endpoints/master.py`

```python
# マスターサービスに@cachedデコレータを適用
@cached("master:categories", ttl=3600)
async def get_categories(db: AsyncSession) -> list[dict]:
    # DB取得処理
    ...
```

**効果**:
- 初回リクエスト: DBクエリ実行
- 2回目以降: Redisから高速取得（1時間有効）
- DB負荷削減

### 4. 分析APIキャッシュ

**対象**: 動画分析、チャンネル概要、パフォーマンスレポート、トレンド分析
**TTL**: 10分（600秒）
**キーパターン**:
- `cs:analytics:video:{video_id}:{date_from}:{date_to}`
- `cs:analytics:channel:{client_id}:{date_from}:{date_to}`
- `cs:analytics:performance:{client_id}:{date_from}:{date_to}`
- `cs:analytics:trends:{client_id}:{date_from}:{date_to}`

**実装ファイル**:
- `backend/app/services/analytics_service.py`

```python
# 分析サービスに@cachedデコレータを適用
@cached(
    "analytics:video",
    ttl=600,
    key_builder=lambda db, role, video_id, date_from=None, date_to=None: f"{video_id}:{date_from}:{date_to}"
)
async def get_video_analytics(...):
    # 分析データ取得処理
    ...
```

**効果**:
- 同一パラメータでの連続リクエスト: キャッシュから即座に返却
- 外部API（YouTube Analytics）呼び出し削減
- レスポンス時間短縮

### 5. レートリミッター

Redisベースのレートリミッターも実装済み:

```python
from app.core.cache import RateLimiter

# API制限: 100リクエスト/分
limiter = RateLimiter("api", max_requests=100, window_seconds=60)

# チェック
is_allowed = await limiter.check("user:123")
if not is_allowed:
    raise HTTPException(status_code=429, detail="Too Many Requests")

# 残り回数確認
remaining, reset_seconds = await limiter.get_remaining("user:123")
```

## テスト

### 単体テスト

```bash
cd backend
pytest tests/test_cache_service.py -v
```

### 統合テスト

```bash
# Redisを起動
redis-server

# テストスクリプト実行
cd backend
python test_redis_cache.py
```

## キャッシュキープレフィックス

すべてのキャッシュキーには `cs:` (Creator Studio) プレフィックスが付与されます:

```
実際のキー = cs:{指定したキー}

例:
- 指定: "master:categories"
- 実際: "cs:master:categories"
```

これにより他のアプリケーションとキーの衝突を防ぎます。

## キャッシュ戦略

### マスターデータ（1時間）

理由:
- 頻繁に変更されないデータ
- 全ユーザーで共通
- DB負荷削減効果が高い

### 分析データ（10分）

理由:
- リアルタイム性が求められる
- 外部API呼び出しコスト削減
- 適度なデータ鮮度を維持

## パフォーマンス向上

### 想定される効果

| エンドポイント | キャッシュなし | キャッシュあり | 改善率 |
|------------|------------|------------|-------|
| GET /api/v1/master/categories | 50ms | 5ms | 90% |
| GET /api/v1/master/tags | 50ms | 5ms | 90% |
| GET /api/v1/analytics/video/{id} | 500ms | 10ms | 98% |
| GET /api/v1/analytics/channel | 800ms | 10ms | 99% |

### DB負荷削減

- マスターデータクエリ: **99%削減**（1時間に1回のみ実行）
- 分析クエリ: **90%削減**（10分に1回のみ実行）

## 運用

### キャッシュクリア

特定パターンのキャッシュをクリアする場合:

```python
from app.core.cache import cache

# 全マスターデータをクリア
await cache.delete_pattern("master:*")

# 特定クライアントの分析データをクリア
await cache.delete_pattern(f"analytics:*:{client_id}:*")
```

### モニタリング

Redisの状態確認:

```bash
# Redis接続確認
redis-cli ping

# キーの確認
redis-cli keys "cs:*"

# 特定キーの値確認
redis-cli get "cs:master:categories"

# TTL確認
redis-cli ttl "cs:master:categories"

# メモリ使用量
redis-cli info memory
```

### トラブルシューティング

#### Redis接続エラー

症状: アプリケーションが起動しない、または500エラー

対処:
```bash
# Redisが起動しているか確認
redis-cli ping

# 起動していない場合
redis-server

# 環境変数を確認
cat .env.local | grep REDIS_URL
```

#### キャッシュが効かない

症状: 毎回DBアクセスが発生している

確認ポイント:
1. Redisが起動しているか
2. 環境変数 `REDIS_URL` が正しいか
3. ログに "Cache hit" / "Cache miss" が出力されているか
4. TTLが適切に設定されているか

デバッグログ有効化:
```python
import logging
logging.getLogger("app.core.cache").setLevel(logging.DEBUG)
```

## ベストプラクティス

### ✅ 推奨

- **頻繁に読まれるデータ**をキャッシュする
- **変更頻度の低いデータ**を長めのTTLでキャッシュ
- **カスタムキービルダー**で意味のあるキーを生成
- **パターン削除**でデータ更新時にキャッシュを無効化

### ❌ 非推奨

- **ユーザー固有の大量データ**をキャッシュ（メモリ圧迫）
- **頻繁に変更されるデータ**を長時間キャッシュ（不整合）
- **巨大なオブジェクト**をキャッシュ（シリアライズコスト）
- **TTLなし**のキャッシュ（メモリリーク）

## 今後の拡張

### キャッシュ対象候補

- プロジェクト一覧（ユーザー単位、TTL: 5分）
- ナレッジデータ（クライアント単位、TTL: 30分）
- ユーザー情報（TTL: 15分）
- 競合チャンネルデータ（TTL: 1時間）

### 機能拡張候補

- キャッシュウォームアップ（アプリ起動時）
- キャッシュヒット率の測定
- 自動キャッシュ無効化（データ更新時）
- 分散キャッシュ（Redis Cluster）

## 参考資料

- [Redis公式ドキュメント](https://redis.io/docs/)
- [redis-py（非同期）](https://redis.readthedocs.io/en/stable/examples/asyncio_examples.html)
- [FastAPI Caching Best Practices](https://fastapi.tiangolo.com/advanced/nosql-databases/)
