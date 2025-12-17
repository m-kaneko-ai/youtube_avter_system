# Creator Studio AI - 本番デプロイチェックリスト

**最終更新**: 2025-12-17
**担当者**: ________________
**デプロイ日**: ________________

---

## 📋 デプロイ前チェックリスト

### 1. 環境変数設定

#### バックエンド (Cloud Run)
- [ ] `DATABASE_URL` が正しく設定されている (Neon PostgreSQL)
- [ ] `REDIS_URL` が正しく設定されている (Upstash)
- [ ] `SECRET_KEY` が32文字以上のランダム文字列
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が設定されている
- [ ] `ANTHROPIC_API_KEY` が設定されている (Claude)
- [ ] `GEMINI_API_KEY` が設定されている
- [ ] `HEYGEN_API_KEY` が設定されている
- [ ] `MINIMAX_API_KEY` が設定されている (オプション)
- [ ] `YOUTUBE_API_KEY` が設定されている
- [ ] `SERP_API_KEY` が設定されている
- [ ] `SOCIAL_BLADE_API_KEY` が設定されている (オプション)
- [ ] `GCS_BUCKET_NAME` が設定されている
- [ ] `SLACK_WEBHOOK_URL` が設定されている
- [ ] `CORS_ORIGINS` に本番ドメインのみ含まれている
- [ ] `ENVIRONMENT=production` に設定
- [ ] `LOG_LEVEL=INFO` に設定

#### フロントエンド (Vercel)
- [ ] `VITE_API_URL` が本番バックエンドURLに設定されている
- [ ] `VITE_GOOGLE_CLIENT_ID` が設定されている
- [ ] `VITE_ENVIRONMENT=production` に設定

#### GitHub Secrets
- [ ] すべての環境変数がGitHub Secretsに設定されている
- [ ] `GCP_SA_KEY` (サービスアカウントキー) が設定されている
- [ ] `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` が設定されている

### 2. データベース

- [ ] Neon PostgreSQLプロジェクトが作成されている
- [ ] データベース接続が確認できる (`psql $DATABASE_URL -c "SELECT 1;"`)
- [ ] pgvector拡張機能が有効化されている
- [ ] データベースマイグレーションが最新状態
  ```bash
  alembic current
  alembic upgrade head
  ```
- [ ] 初期ユーザー (Owner) が作成されている
- [ ] データベースバックアップが自動実行される設定
- [ ] SSL接続が有効 (`?sslmode=require`)

### 3. Redis

- [ ] Upstash Redisが作成されている
- [ ] Redis接続が確認できる (`redis-cli -u $REDIS_URL ping`)
- [ ] TLS接続が有効 (`rediss://`)
- [ ] Max Memory Policyが設定されている (`allkeys-lru`)

### 4. Google Cloud Platform

#### プロジェクト設定
- [ ] GCPプロジェクトが作成されている
- [ ] 必要なAPIが有効化されている
  - Cloud Run API
  - Container Registry API
  - Cloud Build API
  - Cloud Storage API
  - Secret Manager API

#### Cloud Run
- [ ] バックエンドサービスがデプロイされている
- [ ] メモリ設定が適切 (1-2GB推奨)
- [ ] CPU設定が適切 (1-2 CPU推奨)
- [ ] タイムアウトが適切 (300秒推奨)
- [ ] 最小インスタンス数が設定 (1推奨)
- [ ] 最大インスタンス数が設定 (10推奨)
- [ ] ヘルスチェックが有効
- [ ] カスタムドメインが設定されている (オプション)

#### Cloud Storage
- [ ] GCSバケットが作成されている
- [ ] CORS設定がされている
- [ ] ライフサイクルルールが設定されている (90日後削除)

#### サービスアカウント
- [ ] Cloud Run用サービスアカウントが作成されている
- [ ] 必要な権限が付与されている
  - Storage Object Admin
  - Cloud Run Admin

### 5. Vercel

- [ ] Vercelプロジェクトが作成されている
- [ ] GitHubリポジトリと連携されている
- [ ] ビルド設定が正しい
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Root Directory: `frontend`
- [ ] 環境変数が設定されている
- [ ] カスタムドメインが設定されている (オプション)
- [ ] SSL証明書が有効

### 6. セキュリティ

#### 認証・認可
- [ ] Google OAuth 2.0が正常に動作する
- [ ] JWT トークンの有効期限が適切 (30分推奨)
- [ ] リフレッシュトークンが正常に動作する
- [ ] ロールベースアクセス制御 (RBAC) が実装されている

#### CORS設定
- [ ] CORS_ORIGINSに本番ドメインのみ含まれている
- [ ] `localhost` が含まれていない
- [ ] ワイルドカード (`*`) が使用されていない

#### API認証
- [ ] すべてのAPIエンドポイントで認証が必要
- [ ] パブリックエンドポイント (`/health`) 以外は認証必須

#### データ保護
- [ ] データベース接続がSSL/TLS
- [ ] Redis接続がTLS (`rediss://`)
- [ ] APIキーがSecret Managerに保存されている
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] サービスアカウントキーがGitにコミットされていない

#### レート制限
- [ ] APIレート制限が設定されている (60/分推奨)
- [ ] DoS攻撃対策が実装されている

### 7. モニタリング・ログ

- [ ] Cloud Run ログが有効
- [ ] エラーログが適切に記録されている
- [ ] Slackへの通知が設定されている
- [ ] Uptime Monitoringが設定されている
- [ ] アラート設定がされている
  - API応答時間 P95 > 1秒
  - エラー率 > 1%
  - メモリ使用率 > 80%
- [ ] Sentry (エラー監視) が設定されている (オプション)

### 8. CI/CD

- [ ] GitHub Actionsワークフローが正常に動作する
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy-production.yml`
- [ ] `main` ブランチへのpushで自動デプロイされる
- [ ] デプロイ成功/失敗がSlackに通知される
- [ ] データベースマイグレーションが自動実行される

### 9. バックアップ

- [ ] データベースバックアップが自動実行される
- [ ] バックアップの保持期間が設定 (30日推奨)
- [ ] バックアップからの復元手順が確認できる

### 10. パフォーマンス

- [ ] フロントエンドのビルドサイズが適切 (< 500KB gzip推奨)
- [ ] Lighthouse スコアが良好
  - Performance > 80
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90
- [ ] APIレスポンス時間が適切 (P95 < 500ms推奨)
- [ ] データベースインデックスが適切に設定されている
- [ ] Redisキャッシュが有効

---

## 🚀 デプロイ手順

### 1. 最終確認

```bash
# ローカルでビルド確認
cd frontend
npm run build
npm run type-check
npm run lint

cd ../backend
ruff check app/
mypy app/ --ignore-missing-imports
pytest tests/
```

### 2. Gitタグ作成

```bash
git tag -a v1.0.0 -m "Production Release v1.0.0"
git push origin v1.0.0
```

### 3. mainブランチへマージ

```bash
# developからmainへPR作成
# レビュー後、マージ
# GitHub Actionsが自動でデプロイ開始
```

### 4. デプロイ確認

```bash
# フロントエンド
curl -I https://creator-studio-ai.vercel.app

# バックエンド
curl https://creator-studio-backend.run.app/health

# レスポンス例
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   "version": "1.0.0"
# }
```

### 5. 動作確認

- [ ] ログインできる (Google OAuth)
- [ ] ダッシュボードが表示される
- [ ] リサーチ機能が動作する
- [ ] 企画作成が動作する
- [ ] 台本生成が動作する (Claude/Gemini)
- [ ] AIエージェント機能が動作する
- [ ] YouTube連携が動作する
- [ ] ファイルアップロードが動作する

---

## 🔥 緊急時の対応

### ロールバック手順

#### フロントエンド (Vercel)

```bash
# Vercel Dashboard > Deployments > 前のデプロイ > Promote to Production
# または
vercel rollback <deployment-url>
```

#### バックエンド (Cloud Run)

```bash
# リビジョン一覧
gcloud run revisions list --service=creator-studio-backend --region=asia-northeast1

# ロールバック
gcloud run services update-traffic creator-studio-backend \
  --region=asia-northeast1 \
  --to-revisions=<previous-revision>=100
```

#### データベース

```bash
# マイグレーションロールバック
cd backend
alembic downgrade -1

# バックアップから復元 (Neon Dashboard)
```

### 緊急連絡先

- **開発チーム**: Slack #creator-studio-dev
- **運用チーム**: Slack #creator-studio-ops
- **オーナー**: [連絡先]

---

## 📊 デプロイ後確認

### 初日 (デプロイ当日)

- [ ] 1時間ごとにログを確認
- [ ] エラー率を監視
- [ ] API応答時間を監視
- [ ] ユーザーフィードバックを確認

### 1週間後

- [ ] パフォーマンスメトリクスを確認
- [ ] エラーログを分析
- [ ] ユーザー利用状況を確認
- [ ] コストを確認

### 1ヶ月後

- [ ] セキュリティ監査
- [ ] パフォーマンス最適化の検討
- [ ] 依存関係の更新

---

## 📝 デプロイ記録

| 日付 | バージョン | 担当者 | 備考 |
|------|-----------|--------|------|
| 2025-12-17 | v1.0.0 | [担当者名] | 初回本番リリース |
|  |  |  |  |
|  |  |  |  |

---

**チェックリスト完了サイン**

- デプロイ責任者: ________________ 日付: ________
- レビュアー: ________________ 日付: ________
- 承認者: ________________ 日付: ________

---

**参考ドキュメント**

- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイガイド
- [requirements.md](./requirements.md) - 要件定義
- [CLAUDE.md](../CLAUDE.md) - プロジェクト概要
