# Scripts - Creator Studio AI

このディレクトリには、本番デプロイやメンテナンス用のスクリプトが含まれています。

---

## 📋 スクリプト一覧

### 1. `pre-deploy-check.sh`
本番デプロイ前に必要な環境変数と接続をチェックします。

**使用方法**:
```bash
cd scripts
chmod +x pre-deploy-check.sh
./pre-deploy-check.sh
```

**オプション**:
- `--env-file <path>`: 環境変数ファイルを指定（デフォルト: `../.env.local`）
- `--skip-db`: データベース接続テストをスキップ
- `--skip-redis`: Redis接続テストをスキップ
- `--skip-gcs`: GCS接続テストをスキップ

**チェック項目**:
1. 必須環境変数の設定確認
2. データベース（PostgreSQL）接続テスト
3. Redis接続テスト
4. Google Cloud Storage接続テスト
5. セキュリティチェック（TLS、SSL、シークレット長さ）

---

### 2. `deploy.sh`
本番デプロイを自動化します。

**使用方法**:
```bash
cd scripts
chmod +x deploy.sh
./deploy.sh
```

**オプション**:
- `--skip-tests`: テストをスキップ
- `--skip-checks`: デプロイ前チェックをスキップ
- `--dry-run`: 実際のデプロイを行わず、チェックのみ実行
- `--version <tag>`: デプロイするバージョンタグ（デフォルト: タイムスタンプ）

**実行内容**:
1. 事前チェック（Gitステータス、ブランチ確認）
2. フロントエンドビルド & テスト
3. バックエンドテスト
4. Gitタグ作成
5. mainブランチへマージ
6. GitHub Actionsで自動デプロイ開始

---

### 3. `rollback.sh`
本番環境をロールバックします。

**使用方法**:
```bash
cd scripts
chmod +x rollback.sh
./rollback.sh
```

**オプション**:
- `--version <tag>`: ロールバックするバージョン（デフォルト: 前のバージョン）
- `--force`: 確認なしで実行
- `--backend-only`: バックエンドのみロールバック
- `--frontend-only`: フロントエンドのみロールバック

**実行内容**:
1. バージョン確認
2. バックエンド ロールバック（Cloud Run リビジョン切り替え）
3. フロントエンド ロールバック（Vercel デプロイ切り替え）
4. データベース マイグレーション（オプション）

---

### 4. `generate-secrets.sh`
本番デプロイに必要なシークレット（JWT_SECRET / SESSION_SECRET）を生成します。

**使用方法**:
```bash
cd scripts
chmod +x generate-secrets.sh
./generate-secrets.sh
```

**出力**:
- `secrets-YYYYMMDD-HHMMSS.txt` ファイルが生成されます
- このファイルには生成されたシークレットとGitHub Secretsへの登録手順が記載されています

**⚠️ 重要**:
- 生成されたファイルは絶対にGitにコミットしないでください
- `.gitignore`に`scripts/secrets-*.txt`が登録されています


---

## 🚀 デプロイフロー

### 初回デプロイ（手動セットアップ）

#### ステップ1: 環境変数準備

```bash
# シークレット生成
cd scripts
./generate-secrets.sh

# 生成されたシークレットを確認
cat secrets-YYYYMMDD-HHMMSS.txt
```

#### ステップ2: GitHub Secretsに登録

1. [GitHub Secrets設定ガイド](../docs/GITHUB_SECRETS_SETUP.md)を参照
2. 必要なSecretsを全てGitHub Repositoryに登録

#### ステップ3: デプロイ前チェック

```bash
# ローカル環境でチェック
./pre-deploy-check.sh
```

#### ステップ4: 本番デプロイ実行

```bash
# デプロイスクリプトを実行
./deploy.sh

# または、Dry-runモードで事前確認
./deploy.sh --dry-run
```

### 通常のデプロイ（2回目以降）

```bash
# 1. コードをコミット
git add .
git commit -m "feat: 新機能追加"

# 2. デプロイスクリプトを実行
cd scripts
./deploy.sh

# GitHub Actionsが自動でデプロイを実行
# Production環境へのデプロイには手動承認が必要
```

### 緊急ロールバック

```bash
# 前のバージョンにロールバック
cd scripts
./rollback.sh

# 特定のバージョンにロールバック
./rollback.sh --version v20250115123456

# バックエンドのみロールバック
./rollback.sh --backend-only
```

---

## 🔧 トラブルシューティング

### スクリプトが実行できない

**エラー**: `Permission denied`

**解決方法**:
```bash
chmod +x generate-secrets.sh
chmod +x pre-deploy-check.sh
```

---

### データベース接続エラー

**エラー**: `psql: could not connect to server`

**チェックポイント**:
1. `DATABASE_URL`が正しく設定されているか
2. `?sslmode=require`が含まれているか（本番環境）
3. Neonプロジェクトが起動しているか（アイドル状態から復帰に数秒）
4. IPアドレス制限が設定されていないか

---

### Redis接続エラー

**エラー**: `redis.exceptions.ConnectionError`

**チェックポイント**:
1. `REDIS_URL`が`rediss://`（TLS）で始まっているか（本番環境）
2. Upstashダッシュボードで接続制限を確認
3. ポート番号（6379）が正しいか

---

### GCS接続エラー

**エラー**: `gsutil: command not found`

**解決方法**:
```bash
# Google Cloud SDKをインストール
brew install google-cloud-sdk  # macOS
# または
curl https://sdk.cloud.google.com | bash  # Linux

# 認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

### JWT_SECRETが短すぎる

**エラー**: `JWT_SECRET長さ: ❌ 16文字（推奨: 32文字以上）`

**解決方法**:
```bash
# 新しいシークレットを生成
./generate-secrets.sh

# または
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📚 関連ドキュメント

- [GitHub Secrets設定ガイド](../docs/GITHUB_SECRETS_SETUP.md)
- [デプロイメントガイド](../docs/DEPLOYMENT.md)
- [環境変数テンプレート](../.env.example)

---

## 🔐 セキュリティ注意事項

### 絶対にコミットしてはいけないファイル

- `secrets-*.txt` - 生成されたシークレットファイル
- `sa-key.json` - GCPサービスアカウントキー
- `sa-key-*.json` - GCPサービスアカウントキー（バックアップ含む）
- `.env.local` - ローカル環境変数
- `.env.production` - 本番環境変数

これらのファイルは`.gitignore`に登録されていますが、念のため確認してください。

### シークレットローテーション

定期的にシークレットをローテーションしてください:

- **APIキー**: 3ヶ月ごと
- **GCPサービスアカウントキー**: 6ヶ月ごと
- **JWT_SECRET / SESSION_SECRET**: 1年ごと

詳細は[GitHub Secrets設定ガイド](../docs/GITHUB_SECRETS_SETUP.md)の「定期メンテナンス」セクションを参照してください。

---

**作成日**: 2025-12-17
**最終更新**: 2025-12-18
