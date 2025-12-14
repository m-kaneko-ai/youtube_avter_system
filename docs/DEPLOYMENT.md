# Creator Studio AI - デプロイメントガイド

本番環境へのデプロイメント手順を記載します。

---

## 目次

1. [前提条件](#前提条件)
2. [環境構成](#環境構成)
3. [バックエンドデプロイ（Google Cloud Run）](#バックエンドデプロイgoogle-cloud-run)
4. [フロントエンドデプロイ（Vercel）](#フロントエンドデプロイvercel)
5. [データベース設定（Neon）](#データベース設定neon)
6. [Redis設定（Upstash）](#redis設定upstash)
7. [環境変数](#環境変数)
8. [CI/CD設定](#cicd設定)
9. [監視・アラート](#監視アラート)
10. [ロールバック手順](#ロールバック手順)
11. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要なアカウント・サービス
- Google Cloud Platform アカウント
- Vercel アカウント
- Neon（PostgreSQL）アカウント
- Upstash（Redis）アカウント
- GitHub リポジトリ

### 必要なCLIツール
```bash
# Google Cloud SDK
brew install google-cloud-sdk

# Vercel CLI
npm i -g vercel

# Docker
brew install docker
```

---

## 環境構成

### 本番環境
| コンポーネント | サービス | リージョン |
|--------------|---------|-----------|
| フロントエンド | Vercel | Edge (自動) |
| バックエンド | Cloud Run | asia-northeast1 |
| データベース | Neon PostgreSQL | ap-southeast-1 |
| キャッシュ | Upstash Redis | ap-northeast-1 |
| ファイルストレージ | Cloud Storage | asia-northeast1 |

### ステージング環境
本番と同様の構成で、別プロジェクト/ブランチで運用。

---

## バックエンドデプロイ（Google Cloud Run）

### 1. 初期設定

```bash
# GCPプロジェクトを設定
gcloud config set project creator-studio-ai

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# サービスアカウント作成
gcloud iam service-accounts create cloud-run-sa \
  --display-name="Cloud Run Service Account"
```

### 2. Dockerイメージのビルド・プッシュ

```bash
cd backend

# イメージをビルド
docker build -t gcr.io/creator-studio-ai/backend:latest .

# Container Registryにプッシュ
docker push gcr.io/creator-studio-ai/backend:latest
```

### 3. Cloud Runへデプロイ

```bash
gcloud run deploy creator-studio-backend \
  --image gcr.io/creator-studio-ai/backend:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,REDIS_URL=REDIS_URL:latest" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300
```

### 4. カスタムドメイン設定

```bash
gcloud run domain-mappings create \
  --service creator-studio-backend \
  --domain api.creator-studio.ai \
  --region asia-northeast1
```

---

## フロントエンドデプロイ（Vercel）

### 1. Vercelプロジェクト接続

```bash
cd frontend

# Vercelにログイン
vercel login

# プロジェクトを初期化
vercel link
```

### 2. 環境変数設定

Vercelダッシュボードで以下を設定：

| 変数名 | 値 | 環境 |
|-------|-----|-----|
| VITE_API_URL | https://api.creator-studio.ai | Production |
| VITE_GOOGLE_CLIENT_ID | xxx | All |

### 3. デプロイ

```bash
# 本番デプロイ
vercel --prod

# プレビューデプロイ
vercel
```

### 4. ビルド設定（vercel.json）

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## データベース設定（Neon）

### 1. データベース作成

Neonコンソールで新しいプロジェクトを作成：
- リージョン: ap-southeast-1
- PostgreSQL バージョン: 16

### 2. マイグレーション実行

```bash
cd backend

# 本番DBへ接続確認
DATABASE_URL="postgresql://..." alembic current

# マイグレーション実行
DATABASE_URL="postgresql://..." alembic upgrade head
```

### 3. 接続プール設定

Neonダッシュボードで接続プールを有効化：
- Pool mode: Transaction
- Pool size: 20

---

## Redis設定（Upstash）

### 1. Redisインスタンス作成

Upstashコンソールで新しいデータベースを作成：
- リージョン: ap-northeast-1
- Type: Regional
- TLS: Enabled

### 2. 接続情報取得

```
REDIS_URL=rediss://default:xxx@xxx-xxx.upstash.io:6379
```

---

## 環境変数

### バックエンド（Cloud Run Secrets）

```bash
# Secret Managerに秘密情報を保存
echo -n "postgresql://..." | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "rediss://..." | gcloud secrets create REDIS_URL --data-file=-
echo -n "your-session-secret" | gcloud secrets create SESSION_SECRET --data-file=-
echo -n "your-google-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
```

### 必要な環境変数一覧

| 変数名 | 説明 | 必須 |
|-------|------|-----|
| DATABASE_URL | PostgreSQL接続URL | Yes |
| REDIS_URL | Redis接続URL | Yes |
| JWT_SECRET | JWTトークン署名用シークレット | Yes |
| SESSION_SECRET | セッション用シークレット | Yes |
| GOOGLE_CLIENT_ID | Google OAuth クライアントID | Yes |
| GOOGLE_CLIENT_SECRET | Google OAuth クライアントシークレット | Yes |
| ANTHROPIC_API_KEY | Claude API キー | Yes |
| GEMINI_API_KEY | Gemini API キー | Yes |
| HEYGEN_API_KEY | HeyGen API キー | Yes |
| MINIMAX_API_KEY | MiniMax Audio API キー | Yes |
| YOUTUBE_API_KEY | YouTube Data API キー | Yes |
| NODE_ENV | 環境 (production) | Yes |
| FRONTEND_URL | フロントエンドURL | Yes |
| CORS_ORIGIN | CORS許可オリジン | Yes |

---

## CI/CD設定

### GitHub Actions（.github/workflows/deploy.yml）

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Frontend Tests
        working-directory: frontend
        run: |
          npm ci
          npm run type-check
          npm run lint
          npm run test

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Backend Tests
        working-directory: backend
        run: |
          pip install -r requirements.txt
          ruff check .
          mypy .
          pytest

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Auth GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT }}/backend
          gcloud run deploy creator-studio-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/backend \
            --platform managed \
            --region asia-northeast1

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 監視・アラート

### Cloud Monitoring設定

```bash
# アップタイムチェック作成
gcloud monitoring uptime check-configs create \
  --display-name="API Health Check" \
  --http-check-path="/api/v1/health" \
  --hostname="api.creator-studio.ai" \
  --period=60

# アラートポリシー作成（エラー率1%超過時）
gcloud alpha monitoring policies create \
  --display-name="High Error Rate" \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"'
```

### 監視ダッシュボード

以下のメトリクスを監視：
- リクエスト数・エラー率
- レイテンシ（P50, P95, P99）
- CPU・メモリ使用率
- コンテナインスタンス数
- Redis接続数・ヒット率

### メトリクスエンドポイント

Prometheus形式のメトリクスを取得：
```
GET /api/v1/metrics
GET /api/v1/metrics/json
```

---

## ロールバック手順

### バックエンド（Cloud Run）

```bash
# リビジョン一覧
gcloud run revisions list --service=creator-studio-backend --region=asia-northeast1

# 特定リビジョンにロールバック
gcloud run services update-traffic creator-studio-backend \
  --to-revisions=creator-studio-backend-00001-abc=100 \
  --region=asia-northeast1
```

### フロントエンド（Vercel）

```bash
# デプロイ一覧
vercel list

# 特定デプロイを本番に昇格
vercel promote [deployment-url]
```

### データベース

```bash
# マイグレーションロールバック
DATABASE_URL="postgresql://..." alembic downgrade -1
```

---

## トラブルシューティング

### よくある問題

#### 1. Cloud Runがスタートアップに失敗
```bash
# ログ確認
gcloud run services logs read creator-studio-backend --region=asia-northeast1

# よくある原因:
# - 環境変数の設定漏れ
# - データベース接続エラー
# - メモリ不足
```

#### 2. CORS エラー
```
# 確認事項:
# - CORS_ORIGINに正しいフロントエンドURLが設定されているか
# - プロトコル（https://）を含めているか
```

#### 3. 認証エラー
```
# Cookie関連の確認:
# - SameSite属性が正しく設定されているか
# - Secure属性が本番環境で有効か
# - フロントエンドがcredentials: 'include'を送信しているか
```

#### 4. Redis接続エラー
```bash
# Redis接続テスト
redis-cli -u $REDIS_URL ping

# よくある原因:
# - TLS設定（rediss://を使用）
# - IP許可リスト
```

### サポート連絡先

- 技術問題: tech@blick-labs.com
- 緊急連絡: Slack #incident-response

---

**最終更新**: 2025-12-13
**バージョン**: 1.0
