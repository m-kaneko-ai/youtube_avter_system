# Social Blade API連携サービス

## 概要

Social Blade APIを使用してYouTubeチャンネルの履歴データ、統計、成長率を取得するサービス。競合分析エージェントで使用される。

## ファイル

- **実装**: `backend/app/services/external/social_blade_service.py`
- **基盤APIクライアント**: `backend/app/services/external/social_blade_api.py`

## 機能

### 1. チャンネル統計取得

```python
from app.services.external.social_blade_service import social_blade_service

# チャンネル統計取得
stats = await social_blade_service.get_channel_stats(channel_id)

# 取得データ
# {
#     "channel_id": "UCX_6VhS0...",
#     "username": "チャンネル名",
#     "subscriber_count": 1250000,
#     "video_count": 324,
#     "total_views": 8500000,
#     "grade": "A",
#     "subscriber_rank": 1523,
#     "video_views_rank": 2341,
#     "country_rank": 456,
#     "created_at": "2020-03-15",
#     "_is_mock": False  # モックデータかどうか
# }
```

### 2. 履歴データ取得

```python
# 30日分の履歴取得（最大180日）
history = await social_blade_service.get_channel_history(channel_id, days=30)

# 取得データ
# [
#     {
#         "date": "2025-12-01",
#         "subscriber_count": 100000,
#         "subscriber_change": 500
#     },
#     ...
# ]
```

### 3. 成長率取得

```python
# 成長率データ取得
growth = await social_blade_service.get_growth_rate(channel_id)

# 取得データ
# {
#     "channel_id": "UCX_6VhS0...",
#     "subscriber_growth_30d": 25000,
#     "subscriber_growth_14d": 12000,
#     "subscriber_growth_7d": 5500,
#     "views_growth_30d": 1200000,
#     "views_growth_14d": 580000,
#     "views_growth_7d": 250000,
#     "avg_daily_subs": 833,
#     "avg_daily_views": 40000,
#     "_is_mock": False
# }
```

### 4. ランキング取得

```python
# ランキング情報取得
rank = await social_blade_service.get_channel_rank(channel_id)

# 取得データ
# {
#     "channel_id": "UCX_6VhS0...",
#     "subscriber_rank": 1523,
#     "video_views_rank": 2341,
#     "country_rank": 456,
#     "grade": "A"
# }
```

### 5. 将来予測取得

```python
# 将来予測データ取得
projections = await social_blade_service.get_future_projections(channel_id)

# 取得データ
# {
#     "channel_id": "UCX_6VhS0...",
#     "projected_subs_1_year": 180000,
#     "projected_subs_5_years": 450000,
#     "projected_views_1_year": 15000000,
#     "projected_views_5_years": 80000000,
#     "estimated_monthly_earnings_min": 2500,
#     "estimated_monthly_earnings_max": 12000,
#     "estimated_yearly_earnings_min": 30000,
#     "estimated_yearly_earnings_max": 144000,
#     "_is_mock": False
# }
```

## 特徴

### 1. Redisキャッシング

- **TTL**: 1時間（3600秒）
- **キャッシュキー**: `socialblade:{method}:{hash}` 形式
- Redis利用不可の場合は自動でメモリキャッシュにフォールバック

```python
# キャッシュの動作
# 1回目: API呼び出し（約2秒）
stats1 = await social_blade_service.get_channel_stats(channel_id)

# 2回目: キャッシュから取得（約50ms以下）
stats2 = await social_blade_service.get_channel_stats(channel_id)
```

### 2. モックフォールバック

API利用不可時は自動でモックデータを返却:

```python
# API Key未設定、またはAPIエラー時
stats = await social_blade_service.get_channel_stats(channel_id)
# → stats["_is_mock"] = True のモックデータが返る
```

### 3. レート制限対応

- **API呼び出し間隔**: 2秒
- 連続呼び出し時は自動で待機

```python
# 連続呼び出しでも自動で2秒間隔を維持
for channel_id in channel_ids:
    stats = await social_blade_service.get_channel_stats(channel_id)
    # 自動でレート制限待機
```

## 競合分析エージェントとの連携

`competitor_analyzer_service.py`での使用例:

```python
from app.services.external.social_blade_service import social_blade_service

# 成長率データを取得して、平均再生数の推定に使用
channel_id = competitor.get("channel_id")
growth_data = await social_blade_service.get_growth_rate(channel_id)

if not growth_data.get("_is_mock"):
    avg_daily_views = growth_data.get("avg_daily_views", 0)
    if avg_daily_views > 0:
        # 1動画あたりの平均再生数を推定
        avg_views = avg_daily_views * 7  # 週1本投稿と仮定

# AI分析プロンプトにSocial Bladeデータを含める
prompt = f"""以下の競合動画を分析してください。

チャンネル成長率データ（Social Blade）:
- 週間登録者増: {growth_data.get('subscriber_growth_7d', 0):,}
- 月間登録者増: {growth_data.get('subscriber_growth_30d', 0):,}
- 平均日次登録者増: {growth_data.get('avg_daily_subs', 0):,.0f}
- 平均日次再生数: {growth_data.get('avg_daily_views', 0):,}
"""
```

## 環境変数

```bash
# .env.local
SOCIAL_BLADE_API_KEY=your_api_key_here
```

APIキーが未設定の場合、自動でモックデータにフォールバックします。

## エラーハンドリング

```python
try:
    stats = await social_blade_service.get_channel_stats(channel_id)

    if stats.get("_is_mock"):
        logger.warning("Using mock data for Social Blade")
    else:
        logger.info("Real Social Blade data retrieved")

except Exception as e:
    logger.error(f"Social Blade API error: {e}")
    # モックデータが自動で返されるため、処理は継続可能
```

## 注意事項

1. **API Quota**
   - Social Blade APIには月間リクエスト数制限あり（プランによる）
   - キャッシュを活用してAPI呼び出しを最小化

2. **モックデータ**
   - `_is_mock: True`のデータは実際のチャンネル情報ではない
   - 開発・テスト目的でのみ使用

3. **レート制限**
   - 2秒間隔で自動制御されるが、大量のチャンネルを一度に処理する場合は注意

4. **Redis依存**
   - Redisが利用不可でもフォールバックして動作するが、パフォーマンスは低下

## 実装チェックリスト

- [x] チャンネル統計取得
- [x] 履歴データ取得（30日、最大180日）
- [x] 成長率計算（7日、14日、30日）
- [x] ランキング情報取得
- [x] 将来予測取得（収益予測含む）
- [x] Redisキャッシング（TTL: 1時間）
- [x] モックフォールバック
- [x] レート制限対応（2秒間隔）
- [x] competitor_analyzer_service連携
- [x] 構文チェック完了

## テスト

### 単体テスト

```bash
# モックデータのテスト
pytest tests/services/test_social_blade_service.py::test_mock_data

# キャッシング動作確認
pytest tests/services/test_social_blade_service.py::test_caching

# レート制限動作確認
pytest tests/services/test_social_blade_service.py::test_rate_limiting
```

### 統合テスト

```bash
# 競合分析エージェントとの統合テスト
pytest tests/agents/test_competitor_analyzer.py
```

## 関連ドキュメント

- Social Blade API公式ドキュメント: https://socialblade.com/api
- `backend/app/services/external/social_blade_api.py` - 基盤APIクライアント
- `backend/app/services/agents/competitor_analyzer_service.py` - 使用例
- `docs/SCOPE_PROGRESS.md` - Phase 2実装状況

---

**作成日**: 2025-12-17
**最終更新**: 2025-12-17
