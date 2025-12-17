# Creator Studio AI

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

AIアバターを活用したYouTube動画制作の全工程を自動化するシステム

## ステータス

| 環境 | デプロイ状況 | URL |
|------|-------------|-----|
| Production | ![Status](https://img.shields.io/badge/status-pending-yellow.svg) | TBD |
| Staging | ![Status](https://img.shields.io/badge/status-pending-yellow.svg) | TBD |

## 成果目標

- 台本作成時間: **90%削減**
- 月間動画制作数/人: **120本**（ショート90本 + 長尺30本）
- 各ステップで人間確認を挟みつつワークフロー自動化

## 技術スタック

### フロントエンド
- React 18.x + TypeScript 5.x
- Tailwind CSS 4.x + Vite 5.x
- Zustand（状態管理）
- React Query（データフェッチング）
- React Router v6（ルーティング）

### バックエンド
- Python 3.11+ + FastAPI
- SQLAlchemy 2.0（ORM）
- Celery + Redis（非同期タスク）
- PostgreSQL (Neon)

### インフラ
- フロントエンド: Vercel
- バックエンド: Google Cloud Run
- ファイルストレージ: Google Cloud Storage

## セットアップ

### 前提条件
- Node.js 20.x以上
- Python 3.11以上
- PostgreSQL（または Neon アカウント）
- Redis

### フロントエンド

```bash
cd frontend
npm install
cp ../.env.local.example .env.local
# .env.local を編集してAPI URLを設定
npm run dev
```

開発サーバー: http://localhost:5173

### バックエンド

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env.local
# .env.local を編集して環境変数を設定
uvicorn app.main:app --reload --port 8000
```

開発サーバー: http://localhost:8000

APIドキュメント:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 環境変数

### セットアップガイド

**外部APIキーの取得方法は [docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md) を参照してください。**

各サービスのアカウント作成からAPIキー発行までの詳細な手順が記載されています。

### フロントエンド (.env.local)
```bash
# frontend/.env.example をコピーして使用
cp frontend/.env.example frontend/.env.local

# 必要な環境変数を設定
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### バックエンド (.env.local)
```bash
# backend/.env.example をコピーして使用
cp backend/.env.example backend/.env.local

# 必須項目を設定（詳細は .env.example 参照）
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Security
SECRET_KEY=your-secret-key-here
DEBUG=true

# AI APIs (必須)
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXX
OPENAI_API_KEY=sk-proj-xxxxx

# Video Production (必須)
HEYGEN_API_KEY=xxxxxxxxxxxxxxxx
MINIMAX_API_KEY=xxxxxxxxxxxxxxxx

# YouTube & Research (必須)
YOUTUBE_API_KEY=AIzaSyXXXXX
SERP_API_KEY=xxxxxxxxxxxxxxxx

# Google OAuth (必須)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# その他（オプション）
SOCIAL_BLADE_API_KEY=xxxxxxxxxxxxxxxx
```

### APIキーの検証

セットアップ後、以下のコマンドで全てのAPIキーの有効性を確認できます。

```bash
cd backend
python3 -m app.services.api_key_validator
```

**期待される出力例:**
```
============================================================
  外部APIキー検証結果
============================================================

✅ Claude API              (120ms) - 正常に接続できました
✅ Gemini API              (95ms) - 正常に接続できました
✅ OpenAI API              (80ms) - 正常に接続できました
✅ HeyGen API              (250ms) - 正常に接続できました
⚪ MiniMax Audio API       - 未設定
✅ YouTube Data API        (150ms) - 正常に接続できました
✅ SerpAPI                 (300ms) - 正常に接続できました
⚪ Social Blade API        - 未設定
✅ Google OAuth            - OAuth認証情報が設定されています

============================================================
サマリー:
  ✅ 正常: 6
  ⚠️  警告: 0
  ❌ エラー: 0
  ⚪ 未設定: 2
============================================================
```

### ヘルスチェックエンドポイント

サーバー起動後、以下のエンドポイントでシステムの健全性を確認できます。

```bash
# 詳細なヘルスチェック（DB、Redis、全外部API）
curl http://localhost:8000/api/v1/health

# シンプルなヘルスチェック（起動確認のみ）
curl http://localhost:8000/api/v1/health/simple

# レディネスチェック（DB接続確認）
curl http://localhost:8000/api/v1/health/ready

# ライブネスチェック（アプリ生存確認）
curl http://localhost:8000/api/v1/health/live
```

## 開発コマンド

### フロントエンド
```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run lint       # ESLintチェック
npm run type-check # TypeScriptチェック
npm run test       # テスト実行
npm run test:e2e   # E2Eテスト実行
```

### バックエンド
```bash
uvicorn app.main:app --reload   # 開発サーバー起動
pytest                           # テスト実行
ruff check .                     # リンターチェック
mypy .                           # 型チェック
```

## ディレクトリ構造

```
creator-studio-ai/
├── frontend/                 # Reactアプリケーション
│   ├── src/
│   │   ├── components/       # 共通コンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   ├── stores/           # Zustandストア
│   │   ├── services/         # API通信
│   │   ├── types/            # 型定義
│   │   └── utils/            # ユーティリティ
│   └── tests/                # E2Eテスト
├── backend/                  # FastAPIアプリケーション
│   ├── app/
│   │   ├── api/              # APIエンドポイント
│   │   ├── core/             # 設定・認証
│   │   ├── models/           # SQLAlchemyモデル
│   │   ├── schemas/          # Pydanticスキーマ
│   │   ├── services/         # ビジネスロジック
│   │   └── tasks/            # Celeryタスク
│   └── tests/                # 統合テスト
├── docs/                     # ドキュメント
│   ├── requirements.md       # 要件定義書
│   ├── api-specs/            # API仕様書
│   └── e2e-specs/            # E2Eテスト仕様書
└── CLAUDE.md                 # 開発ガイドライン
```

## ページ構成

| パス | ページ名 | 主要機能 |
|------|---------|---------|
| `/login` | ログイン | Google OAuth認証 |
| `/dashboard` | ダッシュボード | 概要 / 今日のタスク / 通知 |
| `/research` | リサーチ | 競合調査 / トレンド分析 / キーワード |
| `/planning` | 企画・計画 | カレンダー / 企画一覧 / AI提案 |
| `/script` | 台本・メタデータ | 台本エディタ / タイトル・説明 / サムネイル |
| `/production` | 動画制作 | 音声生成 / アバター動画 / B-roll |
| `/publish` | 公開・配信 | YouTube / TikTok / Instagram / スケジュール |
| `/analytics` | 分析・ナレッジ | パフォーマンス / ナレッジDB / レポート |
| `/admin` | 管理 | ユーザー / クライアント / システム設定 |

## 外部サービス連携

- **Claude API / Gemini API**: 台本生成
- **HeyGen**: AIアバター動画生成
- **MiniMax Audio**: ボイスクローン
- **YouTube Data API v3**: 競合チャンネル調査
- **SerpAPI**: 検索トレンド分析

## ライセンス

Proprietary - All rights reserved

## バージョン

現在のバージョン: **1.0.0**

変更履歴は [CHANGELOG.md](CHANGELOG.md) を参照してください。

## CI/CD パイプライン

このプロジェクトは GitHub Actions を使用した自動化されたCI/CDパイプラインを備えています。

### ワークフロー一覧

| ワークフロー | トリガー | 説明 |
|------------|---------|------|
| **CI** | PR/Push (main, develop) | Lint, Type Check, Test, Build |
| **Deploy to Staging** | Push to develop | Staging環境への自動デプロイ |
| **Deploy to Production** | Push to main | Production環境への手動承認デプロイ |
| **Security Scan** | PR/Push/週次 | 脆弱性スキャン (npm audit, pip-audit, CodeQL) |
| **Release** | Tag push (v*.*.*) | リリースノート自動生成 |

### CI (継続的インテグレーション)

プルリクエストまたはmain/developブランチへのプッシュ時に自動実行されます。

**フロントエンド**
- Lint (ESLint)
- Type Check (TypeScript)
- Build (Vite)
- Test (Vitest)

**バックエンド**
- Lint (Ruff)
- Type Check (Mypy)
- Test (pytest)

### CD (継続的デプロイ)

#### Staging環境
- トリガー: developブランチへのマージ
- フロントエンド: Vercel Preview Deploy
- バックエンド: Google Cloud Run (staging)
- 自動デプロイ

#### Production環境
- トリガー: mainブランチへのマージ
- フロントエンド: Vercel Production Deploy
- バックエンド: Google Cloud Run (production)
- **手動承認が必要** (environment: production)
- マイグレーション自動実行

### セキュリティスキャン

毎週月曜日および各プッシュ/PRで自動実行されます。

- **npm audit**: フロントエンドの依存関係の脆弱性チェック
- **pip-audit**: バックエンドの依存関係の脆弱性チェック
- **CodeQL**: コード品質と脆弱性の静的解析
- **TruffleHog**: シークレットのスキャン
- **Dependency Review**: PRでの依存関係の変更レビュー

### リリース

タグをプッシュすると自動でリリースノートが生成されます。

```bash
# リリース作成例
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

リリースノートには以下が含まれます:
- Features (新機能)
- Bug Fixes (バグ修正)
- Documentation (ドキュメント)
- Maintenance (メンテナンス)
- Security (セキュリティ)

### 必要なSecrets設定

以下のGitHub Secretsを設定する必要があります。

#### Vercel
```
VERCEL_TOKEN           # Vercel APIトークン
VERCEL_ORG_ID          # Vercel組織ID
VERCEL_PROJECT_ID      # VercelプロジェクトID
```

#### Google Cloud Platform
```
GCP_PROJECT_ID         # GCPプロジェクトID
GCP_SA_KEY             # サービスアカウントのJSONキー
```

#### 環境変数 (Staging)
```
STAGING_DATABASE_URL   # Staging環境のDB URL
STAGING_REDIS_URL      # Staging環境のRedis URL
STAGING_SECRET_KEY     # Staging環境のシークレットキー
```

#### 環境変数 (Production)
```
PRODUCTION_DATABASE_URL    # Production環境のDB URL
PRODUCTION_REDIS_URL       # Production環境のRedis URL
PRODUCTION_SECRET_KEY      # Production環境のシークレットキー
```

#### 共通
```
GOOGLE_CLIENT_ID          # Google OAuth Client ID
GOOGLE_CLIENT_SECRET      # Google OAuth Client Secret
ANTHROPIC_API_KEY         # Claude API Key
GEMINI_API_KEY            # Gemini API Key
YOUTUBE_API_KEY           # YouTube Data API Key
HEYGEN_API_KEY            # HeyGen API Key
SERP_API_KEY              # SerpAPI Key
SOCIAL_BLADE_API_KEY      # Social Blade API Key
SLACK_WEBHOOK_URL         # Slack通知用Webhook URL
```

### Secretsの設定方法

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」に移動
2. 「New repository secret」をクリック
3. 上記の各Secretを追加

### Environment設定

Production環境のデプロイには手動承認が必要です。

1. GitHubリポジトリの「Settings」→「Environments」に移動
2. 「New environment」をクリック
3. 名前を「production」に設定
4. 「Required reviewers」にレビュアーを追加
5. 「Save protection rules」をクリック

## ドキュメント

### 開発ドキュメント
- [要件定義書](docs/requirements.md)
- [開発ガイドライン](CLAUDE.md)
- [進捗状況](docs/SCOPE_PROGRESS.md)
- [変更履歴](CHANGELOG.md)

### デプロイメント
- **[🚀 デプロイ クイックスタート](docs/DEPLOYMENT_QUICKSTART.md)** - 初めての本番デプロイ（60分）
- [GitHub Secrets 設定ガイド](docs/GITHUB_SECRETS_SETUP.md) - 必要なSecretsの完全リスト
- [デプロイメントガイド](docs/DEPLOYMENT.md) - 完全なデプロイ手順
- [本番デプロイチェックリスト](docs/PRODUCTION_CHECKLIST.md) - デプロイ前確認事項
- [スクリプトガイド](scripts/README.md) - シークレット生成・デプロイ前チェック

### スクリプト
- `scripts/pre-deploy-check.sh` - デプロイ前の環境変数とDB/Redis接続確認
- `scripts/deploy.sh` - 本番デプロイの自動化
- `scripts/rollback.sh` - 緊急時のロールバック
- `scripts/generate-secrets.sh` - JWT/セッション秘密鍵の生成
