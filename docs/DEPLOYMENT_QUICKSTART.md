# デプロイ クイックスタートガイド

このガイドでは、Creator Studio AIを本番環境にデプロイするための最短手順を説明します。

---

## ⏱️ 所要時間

- 初回セットアップ: **60-90分**
- 2回目以降のデプロイ: **5分**（自動デプロイ）

---

## 📋 前提条件

以下のアカウントとサービスが必要です:

- [ ] GitHubアカウント
- [ ] Google Cloud Platform（GCP）アカウント
- [ ] Vercelアカウント
- [ ] Neon（PostgreSQL）アカウント
- [ ] Upstash（Redis）アカウント
- [ ] 各種APIキー（Claude, Gemini, YouTube等）

---

## 🚀 デプロイ手順（5ステップ）

### ステップ1: データベース・Redisセットアップ（15分）

#### Neon PostgreSQL
```bash
1. https://neon.tech/ にアクセス
2. "New Project" をクリック
3. プロジェクト名: creator-studio-ai-prod
4. リージョン: US East (Ohio)
5. "Connection string" をコピー
   → 形式: postgresql://user:password@host/db?sslmode=require
```

#### Upstash Redis
```bash
1. https://upstash.com/ にアクセス
2. "Create Database" をクリック
3. 名前: creator-studio-ai-prod
4. リージョン: us-east-1
5. TLS: 有効化必須
6. "TLS (rediss) URL" をコピー
   → 形式: rediss://default:password@host:6379
```

---

### ステップ2: GCPセットアップ（20分）

```bash
# 1. GCPプロジェクト作成
gcloud projects create creator-studio-ai-prod
gcloud config set project creator-studio-ai-prod

# 2. 必要なAPIを有効化
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com

# 3. サービスアカウント作成
gcloud iam service-accounts create creator-studio-ai \
  --display-name="Creator Studio AI"

# 4. ロールを付与
gcloud projects add-iam-policy-binding creator-studio-ai-prod \
  --member="serviceAccount:creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding creator-studio-ai-prod \
  --member="serviceAccount:creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# 5. サービスアカウントキーを作成
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=creator-studio-ai@creator-studio-ai-prod.iam.gserviceaccount.com

# 6. Base64エンコード
cat sa-key.json | base64 | tr -d '\n' > sa-key-base64.txt
# ⚠️ この内容をGitHub Secretsの GCP_SA_KEY に設定

# 7. Cloud Storageバケット作成
gsutil mb -p creator-studio-ai-prod \
  -c STANDARD \
  -l us-east1 \
  gs://creator-studio-ai-prod/
```

---

### ステップ3: シークレット生成（5分）

```bash
cd scripts

# 実行権限を付与
chmod +x generate-secrets.sh

# シークレット生成
./generate-secrets.sh

# 出力ファイル名を確認
ls -la secrets-*.txt

# 内容を確認
cat secrets-YYYYMMDD-HHMMSS.txt
```

**生成されるシークレット**:
- `JWT_SECRET`: JWT署名キー
- `SESSION_SECRET`: セッション署名キー

---

### ステップ4: GitHub Secretsに登録（15分）

```bash
1. GitHub Repository > Settings > Secrets and variables > Actions
2. "New repository secret" をクリック
3. 以下のSecretsを登録:
```

#### 必須Secrets（最小構成）

| Secret名 | 取得元 |
|---------|-------|
| `GCP_PROJECT_ID` | `creator-studio-ai-prod` |
| `GCP_SA_KEY` | `sa-key-base64.txt`の内容 |
| `GCS_BUCKET_NAME` | `creator-studio-ai-prod` |
| `DATABASE_URL` | Neonからコピー |
| `REDIS_URL` | Upstashからコピー |
| `JWT_SECRET` | `secrets-*.txt`から |
| `SESSION_SECRET` | `secrets-*.txt`から |
| `GOOGLE_CLIENT_ID` | GCPコンソール > 認証情報 |
| `GOOGLE_CLIENT_SECRET` | GCPコンソール > 認証情報 |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GEMINI_API_KEY` | https://aistudio.google.com |
| `YOUTUBE_API_KEY` | GCPコンソール > 認証情報 |

#### オプションSecrets（段階的に追加可能）

| Secret名 | 取得元 |
|---------|-------|
| `HEYGEN_API_KEY` | https://app.heygen.com |
| `MINIMAX_API_KEY` | https://www.minimax.chat |
| `YOUTUBE_CLIENT_ID` | GCPコンソール > 認証情報 |
| `YOUTUBE_CLIENT_SECRET` | GCPコンソール > 認証情報 |
| `SERP_API_KEY` | https://serpapi.com |
| `SOCIAL_BLADE_API_KEY` | https://socialblade.com |
| `SLACK_WEBHOOK_URL` | https://api.slack.com/messaging/webhooks |

#### Vercel Secrets

| Secret名 | 取得元 |
|---------|-------|
| `VERCEL_TOKEN` | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Project Settings > General |
| `VERCEL_PROJECT_ID` | Vercel Project Settings > General |

**詳細**: [GitHub Secrets設定ガイド](./GITHUB_SECRETS_SETUP.md)

---

### ステップ5: デプロイ前チェック＆デプロイ（5分）

```bash
cd scripts

# 実行権限を付与
chmod +x pre-deploy-check.sh

# デプロイ前チェック実行
./pre-deploy-check.sh

# 結果確認
# ✅ 成功: XX
# ⚠️  警告: X
# ❌ 失敗: 0  ← 失敗が0であることを確認
```

**チェック成功後、デプロイ**:
```bash
# mainブランチにプッシュ（自動デプロイ開始）
git push origin main

# または、GitHub Actionsから手動実行
# Repository > Actions > Deploy to Production > Run workflow
```

---

## 📊 デプロイ進行状況確認

### GitHub Actions
```
Repository > Actions > Deploy to Production
```

**デプロイフロー**:
1. ✅ Pre-deploy check（環境変数チェック）
2. ✅ Backend test（バックエンドテスト）
3. ✅ Frontend test（フロントエンドテスト）
4. ✅ Deploy backend（Cloud Runデプロイ）
5. ✅ Deploy frontend（Vercelデプロイ）
6. ✅ Health check（動作確認）
7. ✅ Notify（Slack通知）

**所要時間**: 約5-10分

---

## ✅ デプロイ完了確認

### バックエンド
```bash
# ヘルスチェック
curl https://creator-studio-backend.run.app/health

# 期待される出力
{"status": "ok", "version": "1.0.0"}
```

### フロントエンド
```bash
# ブラウザで開く
open https://creator-studio-ai.vercel.app

# 期待される画面
ログインページが表示される
```

---

## 🐛 トラブルシューティング

### デプロイ失敗: Pre-deploy check

**原因**: 環境変数が設定されていない

**解決方法**:
```bash
# ローカルで詳細確認
./pre-deploy-check.sh

# エラーメッセージを確認
# "❌ 未設定" が表示された環境変数を GitHub Secrets に登録
```

---

### デプロイ失敗: Backend test

**原因**: Pythonコードのリントエラー

**解決方法**:
```bash
cd backend
ruff check app/
# エラーを修正してコミット
```

---

### デプロイ失敗: Frontend test

**原因**: TypeScriptの型エラー

**解決方法**:
```bash
cd frontend
npm run type-check
# エラーを修正してコミット
```

---

### デプロイ失敗: Deploy backend

**原因**: GCP認証エラー

**解決方法**:
```bash
# GCP_SA_KEY が正しくBase64エンコードされているか確認
cat sa-key.json | base64 | tr -d '\n' | wc -c
# 出力が1000文字以上であることを確認

# GitHub Secretsの GCP_SA_KEY を再設定
```

---

### デプロイ失敗: Health check

**原因**: バックエンドが起動していない

**解決方法**:
```bash
# Cloud Runログを確認
gcloud run services logs read creator-studio-backend \
  --region us-east1 \
  --limit 50

# データベース接続エラーの場合
# DATABASE_URL が正しいか確認
# ?sslmode=require が含まれているか確認
```

---

## 🔄 2回目以降のデプロイ

```bash
# コード変更後、mainブランチにプッシュするだけ
git add .
git commit -m "feat: 新機能追加"
git push origin main

# 自動デプロイが開始されます
```

---

## 📚 詳細ドキュメント

- [GitHub Secrets設定ガイド](./GITHUB_SECRETS_SETUP.md) - 全Secretsの詳細
- [デプロイメントガイド](./DEPLOYMENT.md) - 完全なデプロイ手順
- [スクリプトガイド](../scripts/README.md) - スクリプトの使い方
- [本番チェックリスト](./PRODUCTION_CHECKLIST.md) - デプロイ前確認事項

---

## 🆘 サポート

問題が解決しない場合:

1. [GitHub Issues](https://github.com/YOUR_REPO/issues)に報告
2. [トラブルシューティングガイド](../scripts/README.md#-トラブルシューティング)を確認
3. Slackチャンネル（設定済みの場合）で質問

---

**作成日**: 2025-12-17
**最終更新**: 2025-12-17
