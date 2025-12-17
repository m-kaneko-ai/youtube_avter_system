# AIエージェント運用マニュアル

## 1. 概要

### 1.1 システム構成

Creator Studio AIのエージェントシステムは、**7種類の専門エージェント**が自動的にYouTube動画制作ワークフローをサポートします。

```
┌──────────────────────────────────────────────────────────┐
│  Celery Beat Scheduler (cron)                             │
│  ├─ 9:00, 15:00, 21:00 → trend_monitor                    │
│  ├─ 9:30, 15:30, 21:30 → comment_responder               │
│  ├─ 21:30 → competitor_analyzer                          │
│  ├─ 00:00 → performance_tracker                          │
│  ├─ 08:00 → content_scheduler                            │
│  └─ 月曜9:00 → keyword_researcher                         │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  Celery Worker + Redis Queue                              │
│  └─ app.tasks.agent_executor.run_agent                    │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  Agent Orchestrator Service                               │
│  └─ エージェントサービスを統括・実行                          │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  7つのエージェントサービス                                   │
│  ├─ TrendMonitorService                                   │
│  ├─ CompetitorAnalyzerService                            │
│  ├─ CommentResponderService                              │
│  ├─ ContentSchedulerService                              │
│  ├─ PerformanceTrackerService                            │
│  ├─ QACheckerService                                     │
│  └─ KeywordResearcherService                             │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  外部API連携                                               │
│  ├─ YouTube Data API v3                                  │
│  ├─ YouTube Analytics API                                │
│  ├─ SerpAPI (Google Trends代替)                          │
│  ├─ Social Blade API                                     │
│  ├─ Claude API                                           │
│  └─ Gemini API                                           │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  通知システム                                              │
│  ├─ Slack Webhook                                        │
│  └─ アプリ内通知（DBレコード）                              │
└──────────────────────────────────────────────────────────┘
```

### 1.2 7種類のエージェント説明

| エージェント | 説明 | 実行頻度 | AIモデル |
|------------|------|---------|---------|
| **trend_monitor** | Google Trends + YouTube検索でトレンドキーワードを検出 | 1日3回（9:00, 15:00, 21:00） | Claude |
| **competitor_analyzer** | 競合チャンネルの新着動画をチェックし、バイラル動画を分析 | 1日1回（21:30） | Claude |
| **comment_responder** | 動画コメントを収集し、AI返信を生成（承認フロー） | 1日3回（9:30, 15:30, 21:30） | Claude |
| **content_scheduler** | スケジュールされた動画を自動公開 | 毎日8:00 | - |
| **performance_tracker** | 公開済み動画のパフォーマンスを追跡 | 毎日0:00 | Claude |
| **qa_checker** | 台本・サムネイルの品質を自動評価 | イベントドリブン（手動実行可） | Claude |
| **keyword_researcher** | 検索キーワード調査 | 週1回（月曜9:00） | Claude |

---

## 2. セットアップ

### 2.1 前提条件

- **Python**: 3.11以上
- **Redis**: 6.2以上（Celeryのブローカー/バックエンド）
- **PostgreSQL**: 15以上（Neonまたはローカル）
- **OS**: macOS/Linux推奨（Windowsの場合はWSL2推奨）

### 2.2 環境変数設定

`.env.local`ファイルに以下を設定してください。

```bash
# ===== データベース =====
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ===== Redis =====
REDIS_URL=redis://localhost:6379

# ===== 認証 =====
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ===== AI生成サービス =====
ANTHROPIC_API_KEY=sk-ant-xxx  # Claude API
GEMINI_API_KEY=AIzaSyXXX      # Gemini API
HEYGEN_API_KEY=xxx             # HeyGen API
MINIMAX_API_KEY=xxx            # MiniMax Audio API

# ===== YouTube / リサーチ =====
YOUTUBE_API_KEY=AIzaSyXXX                     # YouTube Data API v3
SERP_API_KEY=xxx                              # SerpAPI（$50/月）
SOCIAL_BLADE_API_KEY=xxx                      # Social Blade API（$30-50/月）

# ===== 通知 =====
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx  # Slack通知用
```

#### APIキーの取得方法

| サービス | 取得方法 | 料金 |
|---------|---------|------|
| **YouTube Data API** | [Google Cloud Console](https://console.cloud.google.com/) → API有効化 → 認証情報作成 | 無料（10,000 units/日） |
| **YouTube Analytics API** | 同上 + OAuth 2.0設定 | 無料 |
| **Claude API** | [Anthropic Console](https://console.anthropic.com/) | 従量課金 |
| **Gemini API** | [Google AI Studio](https://aistudio.google.com/) | 従量課金 |
| **SerpAPI** | [https://serpapi.com/](https://serpapi.com/) | $50/月〜 |
| **Social Blade API** | [https://socialblade.com/](https://socialblade.com/) | $30-50/月 |
| **Slack Webhook** | Slackワークスペース → 設定 → Incoming Webhooks | 無料 |

### 2.3 Celeryワーカー起動

#### ローカル開発時

```bash
# Redis起動（別ターミナル）
redis-server

# Celeryワーカー起動
cd backend
celery -A app.core.celery_config worker --loglevel=info

# Celery Beatスケジューラー起動（別ターミナル）
celery -A app.core.celery_config beat --loglevel=info
```

#### プロセス管理（本番環境）

**systemdの場合**:

```bash
# /etc/systemd/system/celery-worker.service
[Unit]
Description=Celery Worker for Creator Studio AI
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/celery -A app.core.celery_config worker --loglevel=info --pidfile=/run/celery/worker.pid
PIDFile=/run/celery/worker.pid
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/systemd/system/celery-beat.service
[Unit]
Description=Celery Beat Scheduler for Creator Studio AI
After=network.target redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/celery -A app.core.celery_config beat --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

起動コマンド:
```bash
sudo systemctl daemon-reload
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat
sudo systemctl status celery-worker celery-beat
```

**supervisordの場合**:

```ini
# /etc/supervisor/conf.d/celery.conf
[program:celery-worker]
command=/path/to/venv/bin/celery -A app.core.celery_config worker --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.err.log

[program:celery-beat]
command=/path/to/venv/bin/celery -A app.core.celery_config beat --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat.err.log
```

起動コマンド:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker celery-beat
sudo supervisorctl status
```

---

## 3. エージェント別設定

### 3.1 トレンド監視（trend_monitor）

#### 実行スケジュール
- **9:00, 15:00, 21:00 JST**（1日3回）

#### 監視キーワード設定方法
1. `/analytics` ページ → 「ナレッジ」タブ
2. ナレッジ作成/編集時に**監視キーワード**を登録
3. エージェントはこのキーワードを自動監視

#### アラート閾値設定
| 閾値 | 条件 | 通知 |
|------|------|------|
| **High** | スコア ≥ 70 | Slack + アプリ内通知 |
| **Medium** | スコア ≥ 50 | アプリ内通知のみ |
| **Low** | スコア < 50 | 記録のみ（通知なし） |

スコア計算式:
```
score = (Google Trends Score * 0.4) + (YouTube Growth Rate * 0.6)
```

#### 手動実行
```bash
# コマンドライン
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["trend_monitor"]'

# または管理画面から「今すぐ実行」ボタン
```

---

### 3.2 競合分析（competitor_analyzer）

#### 実行スケジュール
- **毎日21:30 JST**（1日1回）

#### 監視チャンネル登録方法
1. `/research` ページ → 「競合リサーチ」タブ
2. 「チャンネルURLを入力」→ 「調査開始」
3. 結果から「追加」ボタンで監視対象に登録

#### バイラル判定基準
```
viral_score = (views / channel_avg_views) * 100

- High（150以上）: 平均の1.5倍以上 → Slack通知
- Medium（120-149）: 平均の1.2倍以上 → アプリ内通知
- Low（<120）: 通常 → 記録のみ
```

#### 分析内容
- 新着動画の検出（24時間以内）
- 再生数・エンゲージメント率の計算
- Claude APIによる動画内容分析
- 競合戦略の変化検出

---

### 3.3 コメント返信（comment_responder）

#### 実行スケジュール
- **9:30, 15:30, 21:30 JST**（1日3回）

#### テンプレート設定
1. `/agent` ページ → 「コメント管理」タブ
2. 「返信テンプレート」セクション
3. カテゴリごとにテンプレート作成:
   - 質問
   - 感謝
   - ネガティブ
   - カスタムCTA

#### 承認フロー説明

```
┌────────────────────────────────────────┐
│ 1. コメント収集                         │
│    └─ YouTube Data API                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 2. AI返信生成                          │
│    ├─ Claude API（感情分析）            │
│    ├─ テンプレート選択                   │
│    └─ カスタマイズ返信文生成             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 3. CommentQueue保存（status=pending）  │
│    └─ DB: comment_queue                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 4. 管理者承認（/agent ページ）          │
│    ├─ [承認] → YouTube API投稿         │
│    ├─ [編集して承認] → 修正後投稿       │
│    └─ [却下] → status=rejected         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 5. 投稿完了                            │
│    └─ status=posted, posted_at記録     │
└────────────────────────────────────────┘
```

#### 重要: 全件承認必須
- コメント返信は**全件手動承認必須**です
- 自動投稿は行われません
- 承認待ちコメントが10件以上になるとSlack通知が送信されます

---

### 3.4 コンテンツスケジューラー（content_scheduler）

#### 実行スケジュール
- **毎日8:00 JST**

#### 公開スケジュール設定方法
1. `/production` ページ → 動画作成完了
2. 「公開設定」で公開日時を指定
3. エージェントが指定日時に自動公開

#### 動作
- `publish_schedules` テーブルをチェック
- `scheduled_at` ≤ 現在時刻の動画を公開
- YouTube Data API v3で公開ステータスを変更
- 完了後、Slack + アプリ内通知

---

### 3.5 パフォーマンス追跡（performance_tracker）

#### 実行スケジュール
- **毎日0:00 JST**（深夜実行）

#### 追跡対象設定
- 公開済み全動画を自動追跡
- 特定動画を除外: `/analytics` → 動画詳細 → 「追跡停止」

#### 取得データ
- 再生数
- 視聴維持率（平均視聴時間 / 動画長）
- クリック率（CTR）
- いいね・コメント数
- トラフィックソース

#### 週次サマリー
毎週月曜0:00に、過去7日間のパフォーマンスサマリーをSlack送信:
```
📊 週次レポート (2025/12/10 - 2025/12/16)
- 合計再生数: 125,480回
- 平均視聴維持率: 58.2%
- トップ動画: "○○○○" (32,140回)
```

---

### 3.6 QAチェッカー（qa_checker）

#### 実行スケジュール
- **手動実行** または
- 台本/サムネイル保存時に自動実行（オプション）

#### スコア基準説明

| 項目 | 評価基準 | 配点 |
|------|---------|------|
| **フック** | 冒頭30秒のインパクト、オープンループ | 0-100点 |
| **ストーリー構成** | 3幕構成、情報の順序、伏線 | 0-100点 |
| **ターゲット適合性** | ペルソナ一致、共感ポイント | 0-100点 |
| **CTA明確性** | 行動喚起の明確さ、導線 | 0-100点 |
| **全体スコア** | 上記4項目の平均 | 0-100点 |

#### 判定基準
- **90点以上**: S評価（バズる可能性高）
- **80-89点**: A評価（自信を持って公開可）
- **70-79点**: B評価（公開OK、改善の余地あり）
- **60-69点**: C評価（改善推奨）
- **60点未満**: D評価（再添削推奨）

#### 手動実行
```bash
# 台本評価
curl -X POST http://localhost:8000/api/v1/agent/qa/script \
  -H "Content-Type: application/json" \
  -d '{"script_id": "script_xxx"}'

# または /script ページ → 「品質チェック」ボタン
```

---

### 3.7 キーワードリサーチ（keyword_researcher）

#### 実行スケジュール
- **毎週月曜9:00 JST**

#### リサーチ設定
1. `/research` ページ → 「トレンド分析」タブ
2. カテゴリ・期間を指定してリサーチ開始
3. 結果はデータベースに保存され、企画立案時に参照可能

#### データソース
- YouTube検索
- SerpAPI（Google検索結果）
- Google Trends（pytrends）

---

## 4. 監視・アラート

### 4.1 Slack通知設定

#### Webhook URL設定
1. Slackワークスペース → 設定 → カスタムインテグレーション
2. 「Incoming Webhooks」を追加
3. チャンネル選択 → Webhook URL取得
4. `.env.local` に `SLACK_WEBHOOK_URL=...` を設定

#### 通知チャンネル設定
推奨チャンネル構成:
```
#creator-studio-alerts   → 重要アラート（トレンドHigh、エラー）
#creator-studio-tasks    → タスク完了通知
#creator-studio-comments → コメント承認待ち通知
```

#### 通知タイプ別設定

| 通知タイプ | Slack | アプリ内 | 条件 |
|-----------|-------|---------|------|
| トレンドHigh | ✅ | ✅ | score ≥ 70 |
| トレンドMedium | - | ✅ | score ≥ 50 |
| 競合バイラル | ✅ | ✅ | viral_score ≥ 150 |
| コメント承認待ち | ✅ | ✅ | pending ≥ 10件 |
| API Quota警告 | ✅ | ✅ | 使用量 ≥ 8,000 units |
| エージェントエラー | ✅ | ✅ | 全エラー |
| タスク完了 | - | ✅ | 全タスク |

### 4.2 エラー監視

#### ログ確認方法

**ローカル開発**:
```bash
# Celeryワーカーログ（リアルタイム）
celery -A app.core.celery_config worker --loglevel=debug

# Redis監視
redis-cli monitor

# FastAPIログ
tail -f logs/app.log
```

**本番環境**:
```bash
# systemd
sudo journalctl -u celery-worker -f
sudo journalctl -u celery-beat -f

# supervisord
tail -f /var/log/celery/worker.log
tail -f /var/log/celery/beat.log
```

#### よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|-------|------|--------|
| `Connection refused (Redis)` | Redis未起動 | `redis-server` 起動確認 |
| `YouTube API quota exceeded` | API制限到達（10,000 units/日） | 翌日まで待機、または配分見直し |
| `401 Unauthorized (YouTube)` | APIキー無効 | `.env.local`の`YOUTUBE_API_KEY`確認 |
| `Celery task timeout` | タスクが10分超過 | 処理対象を減らすか、`task_time_limit`延長 |
| `SLACK_WEBHOOK_URL not set` | Webhook URL未設定 | `.env.local`に追加（警告のみ、エラーではない） |
| `SQLAlchemy connection pool` | DB接続数不足 | `DATABASE_URL`のpool設定確認 |

### 4.3 API Quota監視

#### YouTube API Quota確認方法
1. [Google Cloud Console](https://console.cloud.google.com/)
2. 「APIとサービス」→「クォータ」
3. 「YouTube Data API v3」を検索
4. 使用状況グラフ確認

#### 警告閾値設定

デフォルト閾値（`.env.local`で変更可能）:
```bash
QUOTA_WARNING_THRESHOLD=8000   # 80%到達で警告
QUOTA_STOP_THRESHOLD=9500      # 95%到達でエージェント停止
```

#### 配分表（1日10,000 units）

| エージェント | 1回あたり | 日次実行回数 | 日次消費 | 比率 |
|------------|----------|------------|---------|------|
| trend_monitor | 500 units | 3回 | 1,500 units | 15% |
| competitor_analyzer | 1,000 units | 1回 | 1,000 units | 10% |
| comment_responder（取得） | 300 units | 3回 | 900 units | 9% |
| comment_responder（投稿） | 50 units | 平均10件 | 500 units | 5% |
| performance_tracker | 200 units | 1回 | 200 units | 2% |
| keyword_researcher | 500 units | 0.14回（週1） | 71 units | 0.7% |
| 手動実行予備 | - | - | 5,829 units | 58.3% |
| **合計** | - | - | **10,000 units** | **100%** |

---

## 5. トラブルシューティング

### 5.1 Celeryワーカーが起動しない

#### 症状
```bash
$ celery -A app.core.celery_config worker
[ERROR] celery.worker.consumer.connection: Cannot connect to redis://localhost:6379
```

#### 解決手順
1. Redis起動確認
   ```bash
   redis-cli ping
   # → PONG が返ればOK
   ```

2. Redis URL確認
   ```bash
   echo $REDIS_URL
   # → redis://localhost:6379
   ```

3. Redisログ確認
   ```bash
   redis-cli INFO stats
   ```

4. ポート競合確認
   ```bash
   lsof -i :6379
   ```

### 5.2 エージェントが実行されない

#### 症状
- スケジュール時刻になってもタスクが実行されない

#### 解決手順
1. Celery Beatスケジューラーの起動確認
   ```bash
   ps aux | grep "celery beat"
   ```

2. スケジュール設定確認
   ```python
   from app.core.celery_config import celery_app
   print(celery_app.conf.beat_schedule)
   ```

3. タイムゾーン確認
   ```bash
   date
   # → JST (Asia/Tokyo) になっているか確認
   ```

4. タスクログ確認
   ```bash
   # 手動実行してエラーを確認
   celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["trend_monitor"]'
   ```

### 5.3 通知が届かない

#### Slack通知が届かない

1. Webhook URL確認
   ```bash
   echo $SLACK_WEBHOOK_URL
   # → https://hooks.slack.com/services/... が設定されているか
   ```

2. 手動テスト
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text": "テストメッセージ"}'
   ```

3. ログ確認
   ```bash
   # notification_service.pyのログを確認
   grep "Slack notification" logs/app.log
   ```

#### アプリ内通知が表示されない

1. DB確認
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
   ```

2. API確認
   ```bash
   curl http://localhost:8000/api/v1/notifications \
     -H "Authorization: Bearer $TOKEN"
   ```

### 5.4 API制限エラー

#### YouTube API Quota超過

```
Error: YouTube API quota exceeded (10,000 units/day)
```

**対処法**:
1. 翌日0:00（太平洋時間）まで待機
2. 配分を見直し（頻度を下げる）
3. 複数プロジェクトを使用してQuotaを分散

#### Claude API Rate Limit

```
Error: Rate limit exceeded (anthropic.RateLimitError)
```

**対処法**:
1. リトライ間隔を広げる（デフォルト60秒）
2. リクエスト頻度を下げる
3. 必要に応じてAPI tierをアップグレード

---

## 6. 手動実行

### 6.1 管理画面から実行

1. `/agent` ページにアクセス
2. 「エージェント管理」タブ
3. 実行したいエージェントの「今すぐ実行」ボタンをクリック
4. 実行結果が「ログ」タブに表示されます

### 6.2 コマンドラインから実行

#### 基本構文
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["<agent_type>"]'
```

#### エージェント別実行例

**トレンド監視**:
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["trend_monitor"]'
```

**競合分析**:
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["competitor_analyzer"]'
```

**コメント返信**:
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["comment_responder"]'
```

**QAチェック（台本指定）**:
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual \
  --args='["qa_checker"]' \
  --kwargs='{"input_data": {"script_id": "script_xxx"}}'
```

#### ヘルスチェック
```bash
celery -A app.core.celery_config call app.tasks.agent_executor.health_check
# → {"status": "healthy", "timestamp": "...", "worker": "agent_executor"}
```

---

## 7. バックアップ・リカバリ

### 7.1 データバックアップ

#### PostgreSQLダンプ
```bash
# 全データベース
pg_dump -h <host> -U <user> -d <dbname> > backup_$(date +%Y%m%d).sql

# テーブル指定
pg_dump -h <host> -U <user> -d <dbname> \
  -t agents -t agent_tasks -t comment_queue -t trend_alerts \
  > agents_backup_$(date +%Y%m%d).sql
```

#### Redisダンプ
```bash
# 手動バックアップ
redis-cli SAVE
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb

# 自動バックアップ（cron）
0 2 * * * redis-cli BGSAVE && sleep 10 && cp /var/lib/redis/dump.rdb /backup/redis_$(date +\%Y\%m\%d).rdb
```

### 7.2 設定バックアップ

```bash
# 環境変数
cp .env.local .env.local.backup

# Celery設定
cp app/core/celery_config.py celery_config.backup.py

# エージェント設定
tar -czf agents_config_$(date +%Y%m%d).tar.gz \
  app/services/agents/*.py \
  app/tasks/agent_executor.py
```

### 7.3 リカバリ手順

#### データベースリストア
```bash
psql -h <host> -U <user> -d <dbname> < backup_20251217.sql
```

#### Redisリストア
```bash
# Redis停止
sudo systemctl stop redis

# ダンプファイル配置
sudo cp /backup/redis_20251217.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Redis起動
sudo systemctl start redis
```

#### エージェント再起動
```bash
# systemdの場合
sudo systemctl restart celery-worker celery-beat

# supervisordの場合
sudo supervisorctl restart celery-worker celery-beat
```

---

## 8. 更新・メンテナンス

### 8.1 エージェントロジック更新時の手順

1. **コード修正**
   ```bash
   vim app/services/agents/trend_monitor_service.py
   ```

2. **テスト実行**
   ```bash
   pytest tests/test_agents_integration.py -v
   ```

3. **手動実行で動作確認**
   ```bash
   celery -A app.core.celery_config call app.tasks.agent_executor.run_agent_manual --args='["trend_monitor"]'
   ```

4. **Celeryワーカー再起動**
   ```bash
   # systemd
   sudo systemctl restart celery-worker

   # supervisord
   sudo supervisorctl restart celery-worker
   ```

   **注**: Celery Beatは再起動不要（スケジュール変更時のみ）

### 8.2 依存関係更新

```bash
# 仮想環境有効化
source venv/bin/activate

# パッケージ更新
pip install --upgrade celery redis anthropic google-generativeai

# requirements.txt更新
pip freeze > requirements.txt

# Celeryワーカー再起動
sudo systemctl restart celery-worker celery-beat
```

### 8.3 ダウンタイム最小化

#### Blue-Green Deployment

```bash
# 1. 新バージョンをビルド
git pull origin main
pip install -r requirements.txt

# 2. 新ワーカーを別ポートで起動
celery -A app.core.celery_config worker --loglevel=info --hostname=worker2@%h &

# 3. タスクが完了するまで待機（約5分）
celery -A app.core.celery_config inspect active

# 4. 旧ワーカーを停止
sudo systemctl stop celery-worker

# 5. 新ワーカーをsystemdに登録
sudo systemctl start celery-worker

# 6. 確認
celery -A app.core.celery_config inspect stats
```

---

## 付録

### A. API Quota配分表

| API | 無料枠/制限 | 1日の配分 | 超過時の対応 |
|-----|-----------|----------|------------|
| YouTube Data API v3 | 10,000 units/日 | 4,171 units（41.7%） | 翌日0:00までエージェント停止 |
| YouTube Analytics API | 無制限 | 無制限 | - |
| Claude API | 従量課金 | 約100リクエスト/日 | リクエスト削減、またはAPI tierアップグレード |
| Gemini API | 従量課金 | 約50リクエスト/日 | 同上 |
| SerpAPI | 100検索/月（Free） | 3検索/日 | 有料プラン（$50/月）へアップグレード |
| Social Blade API | プランによる | 100リクエスト/日 | 有料プラン見直し |

### B. エラーコード一覧

| コード | 名称 | 原因 | 対処法 |
|-------|------|------|--------|
| `AGENT_001` | エージェント未登録 | agent_typeが存在しない | agent_executor.pyの登録を確認 |
| `AGENT_002` | タスク実行タイムアウト | 10分以内に完了しない | 処理対象を減らす |
| `API_001` | YouTube API Quota超過 | 1日10,000 units到達 | 翌日まで待機 |
| `API_002` | YouTube API認証エラー | APIキー無効 | `.env.local`確認 |
| `API_003` | Claude API Rate Limit | リクエスト過多 | 間隔を広げる |
| `REDIS_001` | Redis接続エラー | Redis未起動 | `redis-server`起動 |
| `DB_001` | データベース接続エラー | DATABASE_URL不正 | `.env.local`確認 |
| `NOTIFY_001` | Slack通知失敗 | Webhook URL不正 | `.env.local`確認 |

### C. 関連ドキュメントリンク

- [要件定義書](./requirements.md)
- [開発進捗状況](./SCOPE_PROGRESS.md)
- [プロジェクトガイドライン](../CLAUDE.md)
- [エージェント拡張要件](./handoff/2025-12-17_agent-extension-requirements.md)
- [API仕様書](./api-specs/)
- [Celery公式ドキュメント](https://docs.celeryproject.org/)
- [Redis公式ドキュメント](https://redis.io/documentation)
- [YouTube Data API v3リファレンス](https://developers.google.com/youtube/v3/docs)

---

**作成日**: 2025-12-17
**バージョン**: 1.0
**作成者**: Creator Studio AI 開発チーム
**最終更新**: 2025-12-17
