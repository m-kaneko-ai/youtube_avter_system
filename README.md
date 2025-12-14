# Creator Studio AI

AIアバターを活用したYouTube動画制作の全工程を自動化するシステム

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

### フロントエンド (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### バックエンド (.env.local)
```
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Security
SECRET_KEY=your-secret-key-here
DEBUG=true

# External APIs (optional)
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key
YOUTUBE_API_KEY=your_key
HEYGEN_API_KEY=your_key
SERP_API_KEY=your_key
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

## ドキュメント

- [要件定義書](docs/requirements.md)
- [開発ガイドライン](CLAUDE.md)
- [進捗状況](docs/SCOPE_PROGRESS.md)
