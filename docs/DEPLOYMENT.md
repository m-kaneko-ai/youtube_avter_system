# Creator Studio AI - 本番デプロイメントガイド

## 目次

1. [前提条件](#1-前提条件)
2. [環境変数設定](#2-環境変数設定)
3. [データベースセットアップ](#3-データベースセットアップ)
4. [Redisセットアップ](#4-redisセットアップ)
5. [バックエンドデプロイ (Google Cloud Run)](#5-バックエンドデプロイ-google-cloud-run)
6. [フロントエンドデプロイ (Vercel)](#6-フロントエンドデプロイ-vercel)
7. [環境別設定 (Staging / Production)](#7-環境別設定-staging--production)
8. [ヘルスチェック・監視](#8-ヘルスチェック監視)
9. [トラブルシューティング](#9-トラブルシューティング)
10. [セキュリティチェックリスト](#10-セキュリティチェックリスト)

---

## 1. 前提条件

### 1.1 必須ツール

| ツール | バージョン | インストール方法 |
|-------|-----------|---------------|
| Node.js | 18.x 以上 | [nodejs.org](https://nodejs.org/) |
| Python | 3.11 以上 | [python.org](https://www.python.org/) |
| Docker | 24.x 以上 | [docker.com](https://www.docker.com/) |
| Docker Compose | 2.x 以上 | Docker Desktop に同梱 |
| gcloud CLI | 最新版 | [cloud.google.com](https://cloud.google.com/sdk/docs/install) |
| Vercel CLI | 最新版 | `npm install -g vercel` |

### 1.2 必須アカウント

- **Google Cloud Platform** (バックエンド、ストレージ)
- **Vercel** (フロントエンド)
- **Neon** (PostgreSQL データベース)
- **Upstash** または **Redis Cloud** (Redis ホスティング)
- **Slack** (通知用 Webhook)

### 1.3 必須 API キー

以下の外部サービスのAPIキーを事前に取得してください:

#### AI サービス
- **Claude API Key** ([console.anthropic.com](https://console.anthropic.com/))
- **Gemini API Key** ([ai.google.dev](https://ai.google.dev/))
- **HeyGen API Key** ([heygen.com](https://www.heygen.com/))
- **MiniMax Audio API Key** ([minimax.chat](https://www.minimaxi.com/))

#### YouTube / 調査サービス
- **YouTube Data API Key** ([console.cloud.google.com](https://console.cloud.google.com/))
- **YouTube Analytics API** (OAuth 2.0 認証情報)
- **Social Blade API Key** ([socialblade.com](https://socialblade.com/))
- **SerpApi API Key** ([serpapi.com](https://serpapi.com/))

#### Google OAuth 2.0
- **Google Client ID / Secret** ([console.cloud.google.com](https://console.cloud.google.com/apis/credentials))

---

## 2. 環境変数設定

### 2.1 バックエンド (.env)

`backend/.env` ファイルを作成し、以下の環境変数を設定します。

```bash
# ===== Database =====
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database_name
# Neon PostgreSQL の場合: postgresql+asyncpg://user:password@ep-xxxx.region.aws.neon.tech/database_name

# ===== Redis =====
REDIS_URL=redis://default:password@host:6379
# Upstash の場合: rediss://default:password@region-xxxx.upstash.io:6379

# ===== Security =====
SECRET_KEY=<32文字以上のランダム文字列>
# 生成方法: python -c "import secrets; print(secrets.token_urlsafe(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/google/callback

# ===== AI Services =====
CLAUDE_API_KEY=sk-ant-xxxx
GEMINI_API_KEY=AIzaxxxx
HEYGEN_API_KEY=xxxx
MINIMAX_API_KEY=xxxx

# ===== YouTube APIs =====
YOUTUBE_API_KEY=AIzaxxxx
YOUTUBE_CLIENT_ID=xxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxxx
YOUTUBE_REDIRECT_URI=https://api.yourdomain.com/api/v1/youtube/callback

# ===== External APIs =====
SOCIAL_BLADE_API_KEY=xxxx
SERP_API_KEY=xxxx

# ===== Celery =====
CELERY_BROKER_URL=redis://default:password@host:6379/0
CELERY_RESULT_BACKEND=redis://default:password@host:6379/1

# ===== Notifications =====
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxx

# ===== Google Cloud Storage =====
GCS_BUCKET_NAME=creator-studio-ai-prod
GCS_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# ===== CORS Settings =====
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ===== Environment =====
ENVIRONMENT=production
LOG_LEVEL=INFO

# ===== Optional =====
SENTRY_DSN=https://xxxx@o0.ingest.sentry.io/xxxx  # エラー監視
```

### 2.2 フロントエンド (.env)

`frontend/.env` ファイルを作成します。

```bash
# ===== API Endpoint =====
VITE_API_URL=https://api.yourdomain.com

# ===== Google OAuth =====
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

# ===== Environment =====
VITE_ENVIRONMENT=production

# ===== Optional =====
VITE_SENTRY_DSN=https://xxxx@o0.ingest.sentry.io/xxxx
```

### 2.3 環境変数生成スクリプト

以下のスクリプトで `SECRET_KEY` を生成できます:

```bash
# SECRET_KEY生成
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 複数生成する場合
python -c "import secrets; print('\n'.join([secrets.token_urlsafe(32) for _ in range(5)]))"
```

---

## 3. データベースセットアップ

### 3.1 Neon PostgreSQL のセットアップ

#### 1. プロジェクト作成

1. [Neon Console](https://console.neon.tech/) にログイン
2. **New Project** をクリック
3. プロジェト名: `creator-studio-ai-prod`
4. リージョン: `Asia Pacific (ap-southeast-1)` または `US East (us-east-1)`
5. PostgreSQL バージョン: `15` または `16`

#### 2. データベース接続情報の取得

```bash
# 接続文字列の例:
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require

# asyncpg 対応に変換:
postgresql+asyncpg://user:password@ep-xxxx.region.aws.neon.tech/neondb
```

#### 3. pgvector 拡張機能の有効化

Neon コンソールで SQL Editor を開き、以下を実行:

```sql
-- pgvector 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 確認
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

### 3.2 データベースマイグレーション

#### 1. ローカルでマイグレーション確認

```bash
cd backend

# 環境変数読み込み
export $(cat .env | xargs)

# マイグレーション履歴確認
alembic history

# 現在のリビジョン確認
alembic current

# マイグレーション実行（dry-run）
alembic upgrade head --sql
```

#### 2. 本番環境へのマイグレーション適用

```bash
# 本番DBに接続してマイグレーション実行
alembic upgrade head

# エラーが発生した場合、ロールバック
alembic downgrade -1
```

#### 3. 初期データ投入

```bash
# 初期ユーザー作成（オーナー）
python scripts/create_initial_user.py \
  --email=owner@example.com \
  --name="System Owner" \
  --role=owner
```

### 3.3 データベーススキーマ検証

```bash
# テーブル一覧確認
psql $DATABASE_URL -c "\dt"

# インデックス確認
psql $DATABASE_URL -c "\di"

# 拡張機能確認
psql $DATABASE_URL -c "\dx"
```

---

## 4. Redisセットアップ

### 4.1 Upstash Redis のセットアップ

#### 1. プロジェクト作成

1. [Upstash Console](https://console.upstash.com/) にログイン
2. **Redis** → **Create Database**
3. 名前: `creator-studio-ai-prod`
4. リージョン: データベースと同じリージョン推奨
5. TLS: 有効化 (推奨)

#### 2. 接続情報の取得

```bash
# Upstash から取得した接続文字列:
rediss://default:xxxx@region-xxxx.upstash.io:6379

# 環境変数に設定:
REDIS_URL=rediss://default:xxxx@region-xxxx.upstash.io:6379
```

### 4.2 Redis Cloud の代替案

もし Upstash が利用できない場合は [Redis Cloud](https://redis.com/) を使用:

1. **Free Plan** または **Pro Plan** を選択
2. データベースを作成
3. 接続情報を取得し、`REDIS_URL` に設定

### 4.3 Redis 接続確認

```bash
# redis-cli で接続確認
redis-cli -u $REDIS_URL ping
# 出力: PONG

# Python から接続確認
python -c "
import redis
r = redis.from_url('$REDIS_URL')
r.ping()
print('Redis connection successful!')
"
```

---

## 5. バックエンドデプロイ (Google Cloud Run)

### 5.1 Google Cloud プロジェクトの準備

#### 1. プロジェクト作成

```bash
# プロジェクト作成
gcloud projects create creator-studio-ai-prod --name="Creator Studio AI (Production)"

# プロジェクト設定
gcloud config set project creator-studio-ai-prod

# 必要なAPIを有効化
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  storage.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com
```

#### 2. サービスアカウント作成

```bash
# Cloud Run用サービスアカウント
gcloud iam service-accounts create creator-studio-backend \
  --display-name="Creator Studio Backend Service Account"

# 権限付与
gcloud projects add-iam-policy-binding creator-studio-ai-prod \
  --member="serviceAccount:creator-studio-backend@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# キー生成（ローカル開発用）
gcloud iam service-accounts keys create ~/creator-studio-key.json \
  --iam-account=creator-studio-backend@creator-studio-ai-prod.iam.gserviceaccount.com
```

### 5.2 Google Cloud Storage バケット作成

```bash
# バケット作成
gsutil mb -p creator-studio-ai-prod -l ASIA-SOUTHEAST1 gs://creator-studio-ai-prod

# CORS設定
cat > cors.json <<EOF
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://creator-studio-ai-prod

# 公開設定（必要に応じて）
gsutil iam ch allUsers:objectViewer gs://creator-studio-ai-prod/public
```

### 5.3 Secret Manager で環境変数を管理

機密情報は Secret Manager に保存します:

```bash
# Secret作成
echo -n "your-secret-key" | gcloud secrets create SECRET_KEY --data-file=-
echo -n "your-db-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-redis-url" | gcloud secrets create REDIS_URL --data-file=-
echo -n "your-claude-key" | gcloud secrets create CLAUDE_API_KEY --data-file=-
# ...他のAPIキーも同様

# アクセス権限付与
gcloud secrets add-iam-policy-binding SECRET_KEY \
  --member="serviceAccount:creator-studio-backend@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5.4 Dockerfile の作成

`backend/Dockerfile` を作成:

```dockerfile
# Python 3.11ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# ポート公開
EXPOSE 8080

# 本番環境用の起動コマンド
CMD uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers 4 \
    --log-level info
```

### 5.5 Cloud Run へのデプロイ

#### 1. コンテナイメージのビルド & プッシュ

```bash
cd backend

# イメージビルド
gcloud builds submit \
  --tag gcr.io/creator-studio-ai-prod/backend:latest

# または Docker でビルド
docker build -t gcr.io/creator-studio-ai-prod/backend:latest .
docker push gcr.io/creator-studio-ai-prod/backend:latest
```

#### 2. Cloud Run サービスのデプロイ

```bash
# デプロイ
gcloud run deploy creator-studio-backend \
  --image gcr.io/creator-studio-ai-prod/backend:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 1 \
  --set-env-vars "ENVIRONMENT=production,LOG_LEVEL=INFO" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,SECRET_KEY=SECRET_KEY:latest,CLAUDE_API_KEY=CLAUDE_API_KEY:latest" \
  --service-account creator-studio-backend@creator-studio-ai-prod.iam.gserviceaccount.com
```

#### 3. カスタムドメインの設定

```bash
# ドメインマッピング
gcloud run domain-mappings create \
  --service creator-studio-backend \
  --domain api.yourdomain.com \
  --region asia-southeast1

# DNS設定が必要（Cloud DNSまたは外部DNS）
# A レコード: api.yourdomain.com → Cloud Run IP
```

### 5.6 Celery ワーカーのデプロイ

Celery ワーカーは別の Cloud Run サービスとしてデプロイします:

#### 1. Celery用 Dockerfile

`backend/Dockerfile.celery`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Celery Worker 起動
CMD celery -A app.core.celery_config:celery_app worker \
    --loglevel=info \
    --concurrency=4
```

#### 2. Celery Beat用 Dockerfile

`backend/Dockerfile.celery_beat`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Celery Beat 起動
CMD celery -A app.core.celery_config:celery_app beat \
    --loglevel=info
```

#### 3. デプロイ

```bash
# Celery Worker
gcloud builds submit --config cloudbuild-celery-worker.yaml
gcloud run deploy creator-studio-celery-worker \
  --image gcr.io/creator-studio-ai-prod/celery-worker:latest \
  --platform managed \
  --region asia-southeast1 \
  --no-allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 5 \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,CLAUDE_API_KEY=CLAUDE_API_KEY:latest"

# Celery Beat
gcloud run deploy creator-studio-celery-beat \
  --image gcr.io/creator-studio-ai-prod/celery-beat:latest \
  --platform managed \
  --region asia-southeast1 \
  --no-allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 1 \
  --set-secrets "REDIS_URL=REDIS_URL:latest"
```

---

## 6. フロントエンドデプロイ (Vercel)

### 6.1 Vercel プロジェクトの作成

#### 1. GitHub リポジトリとの連携

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New** → **Project**
3. GitHubリポジトリを選択: `Blick-Labs/youtube_avatar_system`
4. Root Directory: `frontend`
5. Framework Preset: `Vite`

#### 2. 環境変数の設定

Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_ENVIRONMENT=production
```

#### 3. ビルド設定

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 6.2 CLI からのデプロイ

```bash
cd frontend

# Vercel にログイン
vercel login

# 初回セットアップ
vercel

# 本番デプロイ
vercel --prod
```

### 6.3 カスタムドメインの設定

1. Vercel Dashboard → Settings → Domains
2. **Add Domain** → `yourdomain.com` を追加
3. DNS設定:
   - A レコード: `yourdomain.com` → `76.76.21.21`
   - CNAME レコード: `www.yourdomain.com` → `cname.vercel-dns.com`

### 6.4 Vercel でのビルド最適化

`frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.yourdomain.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 7. 環境別設定 (Staging / Production)

### 7.1 Staging 環境の構築

#### バックエンド (Cloud Run)

```bash
# Staging用サービス
gcloud run deploy creator-studio-backend-staging \
  --image gcr.io/creator-studio-ai-prod/backend:staging \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars "ENVIRONMENT=staging"
```

#### フロントエンド (Vercel)

1. Vercel Dashboard → 新しいプロジェクト作成
2. Git Branch: `develop` を連携
3. Environment Variables:
   ```
   VITE_API_URL=https://api-staging.yourdomain.com
   VITE_ENVIRONMENT=staging
   ```

### 7.2 環境変数の管理戦略

| 環境 | データベース | Redis | APIキー | ログレベル |
|-----|------------|-------|--------|----------|
| Local | Docker PostgreSQL | Docker Redis | テスト用 | DEBUG |
| Staging | Neon (Staging Branch) | Upstash (Staging) | テスト用 | INFO |
| Production | Neon (Main) | Upstash (Production) | 本番用 | INFO |

### 7.3 環境変数ファイルの分離

```
backend/
├── .env.local
├── .env.staging
├── .env.production
└── .env.example  # テンプレート
```

```bash
# 環境に応じて読み込み
export ENV_FILE=.env.production
python -m uvicorn app.main:app --env-file $ENV_FILE
```

---

## 8. ヘルスチェック・監視

### 8.1 ヘルスチェックエンドポイント

バックエンドに以下のエンドポイントが実装されています:

```
GET /health
GET /api/v1/health
GET /metrics  # Prometheus メトリクス
```

### 8.2 Cloud Run ヘルスチェック設定

```bash
gcloud run services update creator-studio-backend \
  --region asia-southeast1 \
  --min-instances 1 \
  --startup-probe timeout=5,period=10,failure-threshold=3 \
  --liveness-probe timeout=5,period=10,failure-threshold=3,path=/health
```

### 8.3 Uptime 監視 (Google Cloud Monitoring)

#### 1. Uptime Check の作成

```bash
gcloud monitoring uptime create creator-studio-api \
  --display-name="Creator Studio API Health Check" \
  --protocol=HTTPS \
  --resource-type=uptime-url \
  --uri=https://api.yourdomain.com/health \
  --check-interval=60s \
  --timeout=10s
```

#### 2. アラート設定

```bash
# アラート通知チャネル作成（Slack）
gcloud alpha monitoring channels create \
  --display-name="Slack Notifications" \
  --type=slack \
  --channel-labels="url=https://hooks.slack.com/services/xxxx"

# Uptime アラート作成
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="API Down Alert" \
  --condition-display-name="API Health Check Failed" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=300s
```

### 8.4 ログ監視 (Cloud Logging)

```bash
# エラーログの確認
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50 \
  --format json

# 特定のエラーを検索
gcloud logging read "resource.type=cloud_run_revision AND textPayload:\"Database connection failed\"" \
  --limit 10
```

### 8.5 Sentry によるエラー監視

#### バックエンド

```bash
pip install sentry-sdk
```

`backend/app/main.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    environment=settings.ENVIRONMENT,
    traces_sample_rate=0.1,
)
```

#### フロントエンド

```bash
npm install @sentry/react @sentry/vite-plugin
```

`frontend/src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  tracesSampleRate: 0.1,
});
```

### 8.6 メトリクス監視 (Prometheus + Grafana)

バックエンドは `/metrics` エンドポイントで Prometheus メトリクスを公開しています。

#### Google Cloud Monitoring との統合

```bash
# Prometheus エクスポーター
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

`monitoring-dashboard.json`:

```json
{
  "displayName": "Creator Studio API Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "prometheusQuery": "rate(http_requests_total[5m])"
              }
            }]
          }
        }
      }
    ]
  }
}
```

---

## 9. トラブルシューティング

### 9.1 よくあるエラーと対処法

#### エラー 1: データベース接続エラー

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**原因**:
- DATABASE_URL が正しくない
- Neon データベースが一時停止している（Free Planの場合）
- ネットワーク接続の問題

**対処法**:
```bash
# 接続確認
psql $DATABASE_URL -c "SELECT 1;"

# Neon ダッシュボードでデータベースが Active か確認

# SSL証明書の問題の場合
# DATABASE_URL に ?sslmode=require を追加
```

#### エラー 2: Redis接続エラー

```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**原因**:
- REDIS_URL が正しくない
- Redis サーバーが停止している

**対処法**:
```bash
# Redis 接続確認
redis-cli -u $REDIS_URL ping

# Upstash ダッシュボードで接続情報を確認
```

#### エラー 3: Cloud Run デプロイエラー

```
ERROR: failed to build: executing lifecycle: failed with status code: 51
```

**原因**:
- Dockerfile の構文エラー
- requirements.txt の依存関係の問題

**対処法**:
```bash
# ローカルでビルド確認
docker build -t test-image .

# 依存関係の確認
pip install -r requirements.txt --dry-run
```

#### エラー 4: CORS エラー

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**原因**:
- バックエンドの CORS_ORIGINS 設定が間違っている

**対処法**:
```python
# backend/app/core/config.py
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

#### エラー 5: Celery タスクが実行されない

**原因**:
- Redis接続が失敗している
- Celery Worker が起動していない
- タスクのルーティング設定が間違っている

**対処法**:
```bash
# Celery Worker の起動確認
celery -A app.core.celery_config:celery_app inspect active

# タスクキューの確認
redis-cli -u $REDIS_URL llen celery

# ログ確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=creator-studio-celery-worker"
```

### 9.2 デバッグツール

#### ログレベルの変更

```bash
# Cloud Run サービスの環境変数を一時的に変更
gcloud run services update creator-studio-backend \
  --region asia-southeast1 \
  --set-env-vars "LOG_LEVEL=DEBUG"
```

#### Cloud Shell でのデバッグ

```bash
# Cloud Shell起動
gcloud cloud-shell ssh

# データベースに接続
psql $DATABASE_URL

# サービスログのストリーミング
gcloud run services logs tail creator-studio-backend --region asia-southeast1
```

---

## 10. セキュリティチェックリスト

### 10.1 デプロイ前のチェック項目

- [ ] 環境変数が適切に設定されている
  - [ ] SECRET_KEY が32文字以上のランダム文字列
  - [ ] 本番環境で DEBUG モードが無効化されている
  - [ ] データベースパスワードが強固
- [ ] CORS設定が適切
  - [ ] `CORS_ORIGINS` に本番ドメインのみを指定
  - [ ] `localhost` が含まれていない
- [ ] API認証が有効
  - [ ] Google OAuth 2.0 が正常に動作
  - [ ] JWT トークンの有効期限が適切（30分推奨）
- [ ] データベースセキュリティ
  - [ ] SSL/TLS接続が有効
  - [ ] データベースユーザーの権限が最小限
- [ ] ファイルストレージ
  - [ ] GCS バケットのアクセス権限が適切
  - [ ] 機密ファイルが公開されていない
- [ ] Secret 管理
  - [ ] APIキーが Secret Manager に保存されている
  - [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] ログ・監視
  - [ ] エラーログが適切に記録されている
  - [ ] Sentry などのエラー監視ツールが設定されている
  - [ ] Uptime モニタリングが設定されている

### 10.2 定期的なセキュリティメンテナンス

#### 依存関係の更新（月1回）

```bash
# バックエンド
cd backend
pip list --outdated
pip install --upgrade <package-name>
pip-audit  # 脆弱性スキャン

# フロントエンド
cd frontend
npm outdated
npm audit
npm audit fix
```

#### セキュリティスキャン

```bash
# Docker イメージのスキャン
docker scan gcr.io/creator-studio-ai-prod/backend:latest

# Google Cloud Security Scanner
gcloud beta compute security-policies rules create 1000 \
  --security-policy=creator-studio-policy \
  --expression="true" \
  --action=allow
```

### 10.3 インシデント対応プラン

#### データベースバックアップの復元

```bash
# Neon の自動バックアップから復元（ダッシュボードから操作）

# 手動バックアップの作成
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップからの復元
psql $DATABASE_URL < backup_20250101_120000.sql
```

#### ロールバック手順

```bash
# Cloud Run で前のリビジョンにロールバック
gcloud run services update-traffic creator-studio-backend \
  --region asia-southeast1 \
  --to-revisions=creator-studio-backend-00005-xyz=100

# Vercel でロールバック
vercel rollback
```

---

## 11. CI/CD パイプライン

### 11.1 GitHub Actions による自動デプロイ

`.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: creator-studio-ai-prod

      - name: Build and push Docker image
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/creator-studio-ai-prod/backend:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy creator-studio-backend \
            --image gcr.io/creator-studio-ai-prod/backend:${{ github.sha }} \
            --region asia-southeast1 \
            --platform managed

      - name: Run database migrations
        run: |
          gcloud run jobs execute migrate-database --wait

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: frontend
```

### 11.2 Staging 環境への自動デプロイ

`.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      # ...同様の手順（サービス名を -staging に変更）

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      # ...同様の手順（Vercel環境をstagingに変更）
```

---

## 12. パフォーマンス最適化

### 12.1 Cloud Run の最適化

```bash
# CPU Always Allocated（リクエスト待機中もCPUを確保）
gcloud run services update creator-studio-backend \
  --region asia-southeast1 \
  --cpu-throttling=false \
  --min-instances=1

# コンカレンシー設定
gcloud run services update creator-studio-backend \
  --region asia-southeast1 \
  --concurrency=80
```

### 12.2 データベースの最適化

```sql
-- インデックスの作成
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_workflow_steps_video_id ON workflow_steps(video_id);

-- 不要なデータのアーカイブ（3ヶ月以上前のログ）
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '3 months';
```

### 12.3 Redis キャッシング戦略

```python
# マスターデータのキャッシュ（1時間）
async def get_categories_cached():
    cache_key = "categories:all"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    categories = await db.execute(select(Category))
    await redis.setex(cache_key, 3600, json.dumps(categories))
    return categories
```

### 12.4 フロントエンドの最適化

```typescript
// コード分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Research = lazy(() => import('./pages/Research'));

// 画像の遅延読み込み
<img src={thumbnail} loading="lazy" />

// バンドルサイズの確認
npm run build -- --analyze
```

---

## 13. コスト最適化

### 13.1 概算コスト（月額）

| サービス | プラン | 月額コスト |
|---------|-------|----------|
| **Neon PostgreSQL** | Pro ($19) | $19 |
| **Upstash Redis** | Pay-as-you-go | ~$10 |
| **Google Cloud Run** | 2GB RAM, 2 CPU | ~$50 |
| **Google Cloud Storage** | 100GB | ~$3 |
| **Vercel** | Pro ($20) | $20 |
| **AI APIs** | Claude + Gemini | ~$50-100 |
| **外部API** | YouTube, SerpAPI, Social Blade | ~$50 |
| **合計** | - | **約 $200-250/月** |

### 13.2 コスト削減のヒント

1. **Cloud Run の min-instances を 0 に設定**（トラフィック少ない場合）
2. **Redis の maxmemory-policy を設定**してメモリ使用量を制限
3. **GCS のライフサイクルルール**で古いファイルを削除
4. **AI API の呼び出しを最適化**（キャッシュ活用）

```bash
# GCS ライフサイクル設定
gsutil lifecycle set lifecycle.json gs://creator-studio-ai-prod
```

`lifecycle.json`:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
```

---

## 14. まとめ

### デプロイ完了チェックリスト

- [ ] データベースが作成され、マイグレーションが完了している
- [ ] Redis が稼働している
- [ ] バックエンドが Cloud Run にデプロイされている
- [ ] フロントエンドが Vercel にデプロイされている
- [ ] カスタムドメインが設定されている
- [ ] HTTPS が有効化されている
- [ ] Google OAuth 2.0 が動作している
- [ ] ヘルスチェックが正常に動作している
- [ ] ログ監視が設定されている
- [ ] バックアップが自動実行されている
- [ ] Celery ワーカーが稼働している（エージェント機能用）

### 次のステップ

1. **負荷テスト**: [Locust](https://locust.io/) や [k6](https://k6.io/) で負荷テストを実施
2. **セキュリティ診断**: OWASP ZAP などでセキュリティスキャン
3. **ドキュメント整備**: API仕様書、運用マニュアルの作成
4. **モニタリング強化**: Grafana ダッシュボードの構築

---

**作成日**: 2025-12-17
**バージョン**: 1.0
**メンテナンス**: 四半期ごとに更新

**サポート**: 問題が発生した場合は [GitHub Issues](https://github.com/Blick-Labs/youtube_avatar_system/issues) または Slack (#creator-studio-support) で報告してください。
