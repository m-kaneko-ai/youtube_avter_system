# GitHub Secrets 設定ガイド

このガイドでは、Creator Studio AIを本番環境にデプロイするために必要なGitHub Secretsの設定方法を説明します。

---

## 📋 必要なSecrets一覧

### Google Cloud Platform

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `GCP_PROJECT_ID` | GCPプロジェクトID | GCPコンソール > プロジェクト選択 |
| `GCP_SA_KEY` | サービスアカウントキー（JSON、Base64エンコード） | 後述の手順で作成 |
| `GCS_BUCKET_NAME` | Cloud Storageバケット名 | 例: `creator-studio-ai-prod` |

### データベース

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `DATABASE_URL` | PostgreSQL接続URL | Neonダッシュボード > Connection Details |
| `REDIS_URL` | Redis接続URL（TLS必須） | Upstashダッシュボード > Details |

形式例:
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
REDIS_URL=rediss://default:password@epic-fly-12345.upstash.io:6379
```

### 認証システム

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `JWT_SECRET` | JWT署名キー（32文字以上） | `scripts/generate-secrets.sh` で生成 |
| `SESSION_SECRET` | セッション署名キー（32文字以上） | `scripts/generate-secrets.sh` で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | GCPコンソール > 認証情報 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | GCPコンソール > 認証情報 |

### AI生成API

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API キー | https://console.anthropic.com/settings/keys |
| `GEMINI_API_KEY` | Gemini API キー | https://aistudio.google.com/apikey |
| `HEYGEN_API_KEY` | HeyGen API キー（AIアバター） | https://app.heygen.com/settings |
| `MINIMAX_API_KEY` | MiniMax Audio API キー（ボイスクローン） | https://www.minimax.chat/ |

### リサーチ・外部サービス

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 キー | GCPコンソール > 認証情報 |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth クライアントID | GCPコンソール > 認証情報 |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth クライアントシークレット | GCPコンソール > 認証情報 |
| `SERP_API_KEY` | SerpAPI キー（検索トレンド） | https://serpapi.com/manage-api-key |
| `SOCIAL_BLADE_API_KEY` | Social Blade API キー（オプション） | https://socialblade.com/ |

### 通知

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `SLACK_WEBHOOK_URL` | Slack通知用Webhook URL | https://api.slack.com/messaging/webhooks |

### Vercel（フロントエンド）

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `VERCEL_TOKEN` | Vercel APIトークン | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel組織ID | Vercel Project Settings > General |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID | Vercel Project Settings > General |

---

## 🚀 セットアップ手順

### 1. GCPサービスアカウント作成

#### 1-1. GCPプロジェクト作成
```bash
# GCPコンソールで新規プロジェクト作成
# プロジェクトID: creator-studio-ai-prod
```

#### 1-2. 必要なAPIを有効化
```bash
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

#### 1-3. サービスアカウント作成
```bash
# サービスアカウント作成
gcloud iam service-accounts create creator-studio-ai \
  --display-name="Creator Studio AI" \
  --description="Cloud Run service account"

# Cloud Runに必要なロールを付与
gcloud projects add-iam-policy-binding creator-studio-ai-prod \
  --member="serviceAccount:creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Cloud Storageに必要なロールを付与
gcloud projects add-iam-policy-binding creator-studio-ai-prod \
  --member="serviceAccount:creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

#### 1-4. サービスアカウントキーをダウンロード
```bash
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com
```

#### 1-5. キーをBase64エンコード
```bash
# macOS/Linux
cat sa-key.json | base64 | tr -d '\n' > sa-key-base64.txt

# このファイルの内容をGitHub Secretsの GCP_SA_KEY に設定
```

**⚠️ 重要**: `sa-key.json` と `sa-key-base64.txt` は絶対にGitにコミットしないでください！

---

### 2. Neon PostgreSQLセットアップ

#### 2-1. Neonプロジェクト作成
1. https://neon.tech/ にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `creator-studio-ai-prod`
4. リージョン: `US East (Ohio)` 推奨（低レイテンシー）

#### 2-2. DATABASE_URLをコピー
```
Neon Dashboard > Connection Details > Connection string
```

形式:
```
postgresql://user:password@ep-xxx-123456.us-east-2.aws.neon.tech/dbname?sslmode=require
```

#### 2-3. pgvector拡張を有効化
```sql
-- Neon SQL Editorで実行
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 3. Upstash Redisセットアップ

#### 3-1. Upstashプロジェクト作成
1. https://upstash.com/ にアクセス
2. 「Create Database」をクリック
3. 名前: `creator-studio-ai-prod`
4. リージョン: `us-east-1` 推奨（低レイテンシー）
5. TLS: **有効化必須**

#### 3-2. REDIS_URLをコピー
```
Upstash Console > Details > TLS (rediss) URL
```

形式:
```
rediss://default:password@epic-fly-12345.upstash.io:6379
```

---

### 4. Google Cloud Storageバケット作成

```bash
# バケット作成
gsutil mb -p creator-studio-ai-prod \
  -c STANDARD \
  -l us-east1 \
  gs://creator-studio-ai-prod/

# CORSを設定
gsutil cors set gcs-cors.json gs://creator-studio-ai-prod/

# ライフサイクル設定（古い一時ファイルを自動削除）
gsutil lifecycle set gcs-lifecycle.json gs://creator-studio-ai-prod/
```

`gcs-cors.json`:
```json
[
  {
    "origin": ["https://creator-studio-ai.vercel.app"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

---

### 5. Vercelプロジェクト設定

#### 5-1. Vercelプロジェクト作成
1. https://vercel.com/new にアクセス
2. GitHubリポジトリを選択
3. Framework Preset: `Vite`
4. Root Directory: `frontend`

#### 5-2. 環境変数を設定
```
VITE_API_URL=https://creator-studio-backend.run.app
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ENVIRONMENT=production
```

#### 5-3. Vercel APIトークン取得
```
Vercel Dashboard > Settings > Tokens > Create Token
```

#### 5-4. プロジェクトIDを取得
```
Vercel Project Settings > General > Project ID
```

---

### 6. GitHub Secretsに登録

#### 6-1. GitHubリポジトリ設定画面を開く
```
GitHub Repository > Settings > Secrets and variables > Actions
```

#### 6-2. 「New repository secret」をクリックして以下を登録

| Secret名 | 値 |
|---------|---|
| `GCP_PROJECT_ID` | `creator-studio-ai-prod` |
| `GCP_SA_KEY` | `sa-key-base64.txt`の内容 |
| `GCS_BUCKET_NAME` | `creator-studio-ai-prod` |
| `DATABASE_URL` | Neonから取得 |
| `REDIS_URL` | Upstashから取得 |
| `JWT_SECRET` | `scripts/generate-secrets.sh`で生成 |
| `SESSION_SECRET` | `scripts/generate-secrets.sh`で生成 |
| `GOOGLE_CLIENT_ID` | GCPから取得 |
| `GOOGLE_CLIENT_SECRET` | GCPから取得 |
| `ANTHROPIC_API_KEY` | Anthropicから取得 |
| `GEMINI_API_KEY` | Google AI Studioから取得 |
| `HEYGEN_API_KEY` | HeyGenから取得 |
| `MINIMAX_API_KEY` | MiniMaxから取得 |
| `YOUTUBE_API_KEY` | GCPから取得 |
| `YOUTUBE_CLIENT_ID` | GCPから取得 |
| `YOUTUBE_CLIENT_SECRET` | GCPから取得 |
| `SERP_API_KEY` | SerpAPIから取得 |
| `SOCIAL_BLADE_API_KEY` | Social Bladeから取得（オプション） |
| `SLACK_WEBHOOK_URL` | Slackから取得 |
| `VERCEL_TOKEN` | Vercelから取得 |
| `VERCEL_ORG_ID` | Vercelから取得 |
| `VERCEL_PROJECT_ID` | Vercelから取得 |

---

## 🔐 シークレット生成

### JWT_SECRET / SESSION_SECRET生成

#### 方法1: スクリプト使用（推奨）
```bash
cd scripts
chmod +x generate-secrets.sh
./generate-secrets.sh
```

出力例:
```
JWT_SECRET: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SESSION_SECRET: x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

#### 方法2: Python
```bash
python -c "import secrets; print('JWT_SECRET:', secrets.token_urlsafe(32))"
python -c "import secrets; print('SESSION_SECRET:', secrets.token_urlsafe(32))"
```

#### 方法3: OpenSSL
```bash
openssl rand -base64 32
```

---

## ✅ デプロイ前チェック

### 自動チェックスクリプト実行
```bash
cd scripts
chmod +x pre-deploy-check.sh
./pre-deploy-check.sh
```

チェック項目:
- [ ] 必須環境変数が設定されているか
- [ ] DATABASE_URL形式が正しいか
- [ ] REDIS_URL形式が正しいか（TLS）
- [ ] データベース接続テスト
- [ ] Redis接続テスト
- [ ] GCS接続テスト
- [ ] API キー形式チェック

---

## 🚨 トラブルシューティング

### データベース接続エラー
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**解決方法**:
1. `DATABASE_URL` に `?sslmode=require` が含まれているか確認
2. Neonプロジェクトが起動しているか確認（アイドル状態から復帰に数秒かかる）
3. IPアドレス制限が設定されていないか確認

### Redis接続エラー
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**解決方法**:
1. `REDIS_URL` が `rediss://`（TLS）で始まっているか確認
2. Upstashダッシュボードで接続制限を確認
3. ポート番号（6379）が正しいか確認

### Cloud Run デプロイエラー
```
ERROR: failed to deploy to Cloud Run
```

**解決方法**:
1. `GCP_SA_KEY` がBase64エンコードされているか確認
2. サービスアカウントに必要なロールが付与されているか確認
3. Cloud Run APIが有効化されているか確認

### Vercel ビルドエラー
```
Error: Missing VITE_API_URL environment variable
```

**解決方法**:
1. Vercel Project Settings > Environment Variables で設定
2. `VITE_` プレフィックスが必須
3. Production / Preview / Development それぞれに設定

---

## 📚 参考リンク

- [Neon Documentation](https://neon.tech/docs/introduction)
- [Upstash Documentation](https://docs.upstash.com/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🔄 定期メンテナンス

### API キーローテーション（3ヶ月ごと推奨）
1. 新しいAPIキーを発行
2. GitHub Secretsを更新
3. 古いキーを無効化

### サービスアカウントキーローテーション（6ヶ月ごと推奨）
```bash
# 新しいキーを作成
gcloud iam service-accounts keys create sa-key-new.json \
  --iam-account=creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com

# Base64エンコード
cat sa-key-new.json | base64 | tr -d '\n' > sa-key-new-base64.txt

# GitHub Secretsを更新

# 古いキーを削除
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com
```

---

**作成日**: 2025-12-17
**最終更新**: 2025-12-17
