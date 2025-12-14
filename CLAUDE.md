# CLAUDE.md - Creator Studio AI

## プロジェクト概要

**Creator Studio AI** はAIアバターを活用したYouTube動画制作の全工程を自動化するシステムです。

### 成果目標
- 台本作成時間: **90%削減**
- 月間動画制作数/人: **120本**（ショート90本 + 長尺30本）
- 各ステップで人間確認を挟みつつワークフロー自動化

### フェーズ展開
1. Phase 1: 個人利用（オーナー1名）
2. Phase 2: チーム利用（7名）
3. Phase 3: 外部クライアント提供

---

## 技術スタック

### フロントエンド
```
React 18.x + TypeScript 5.x + Tailwind CSS 4.x + Vite 5.x
状態管理: Zustand
ルーティング: React Router v6
データフェッチ: React Query
アイコン: Lucide React
```

### バックエンド
```
Python 3.11+ + FastAPI
ORM: SQLAlchemy 2.0
非同期タスク: Celery + Redis
```

### データベース
```
PostgreSQL (Neon) - メインDB
Redis - キャッシュ/セッション/キュー
pgvector - RAG用ベクトル検索
```

### インフラ
```
フロントエンド: Vercel
バックエンド: Google Cloud Run
ファイルストレージ: Google Cloud Storage
```

---

## ディレクトリ構造

```
youtube_avatar_system/
├── CLAUDE.md                    # このファイル
├── docs/
│   ├── requirements.md          # 要件定義書
│   ├── quality-standards.md     # 品質基準
│   └── pages/                   # 各ページ詳細設計
│       ├── README.md
│       ├── 01-login.md
│       ├── 02-dashboard.md
│       ├── 03-research.md
│       ├── 04-planning.md
│       ├── 05-script.md
│       ├── 06-production.md
│       ├── 07-publish.md
│       ├── 08-analytics.md
│       └── 09-admin.md
├── frontend/                    # Reactアプリケーション
│   ├── src/
│   │   ├── components/          # 共通コンポーネント
│   │   ├── pages/               # ページコンポーネント
│   │   ├── hooks/               # カスタムフック
│   │   ├── stores/              # Zustandストア
│   │   ├── services/            # API通信
│   │   ├── types/               # 型定義
│   │   └── utils/               # ユーティリティ
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # FastAPIアプリケーション
│   ├── app/
│   │   ├── api/                 # APIエンドポイント
│   │   ├── core/                # 設定・認証
│   │   ├── models/              # SQLAlchemyモデル
│   │   ├── schemas/             # Pydanticスキーマ
│   │   ├── services/            # ビジネスロジック
│   │   └── tasks/               # Celeryタスク
│   ├── requirements.txt
│   └── main.py
└── docker-compose.yml
```

---

## 開発コマンド

### フロントエンド
```bash
cd frontend
npm install           # 依存関係インストール
npm run dev           # 開発サーバー起動 (localhost:5173)
npm run build         # 本番ビルド
npm run lint          # ESLintチェック
npm run type-check    # TypeScriptチェック
npm run test          # テスト実行
```

### バックエンド
```bash
cd backend
pip install -r requirements.txt    # 依存関係インストール
uvicorn main:app --reload          # 開発サーバー起動 (localhost:8000)
ruff check .                       # リンターチェック
mypy .                             # 型チェック
pytest                             # テスト実行
```

### Docker
```bash
docker-compose up -d               # 全サービス起動
docker-compose logs -f             # ログ確認
docker-compose down                # 停止
```

---

## ページ構成（9ページ）

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
| `/admin` | 管理 | ユーザー / クライアント / システム設定 / API連携 |

---

## ロール・権限

| ロール | 説明 |
|-------|------|
| Owner | システムオーナー（全権限） |
| Team | チームメンバー（制作・承認権限） |
| Client Premium+ | 制作代行クライアント（進捗・成果物・分析閲覧） |
| Client Premium | マスターコース（進捗・成果物閲覧） |
| Client Basic | ベーシックコース（進捗・成果物閲覧） |

---

## 外部サービス連携

### AI生成
- **Claude API**: 台本生成パターンA
- **Gemini API**: 台本生成パターンB
- **Nano Banana Pro**: サムネイル生成
- **MiniMax Audio**: ボイスクローン
- **HeyGen**: AIアバター動画生成
- **Veo**: B-roll動画生成

### YouTube/調査
- **YouTube Data API v3**: 競合チャンネル/動画調査
- **YouTube Analytics API**: 自チャンネル分析
- **Social Blade API**: 競合履歴データ
- **SerpApi**: 検索トレンド
- **Amazon PA-API**: 書籍ランキング・レビュー

---

## ナレッジシステム

### 概念
**1ナレッジ = 1ブランド/事業 または 1コンテンツシリーズ**

### 構造（8セクション）
1. メインターゲット像
2. サブターゲット像
3. 競合分析（Competitor）
4. 自社分析（Company）
5. AHAコンセプト
6. コンセプトまとめ
7. カスタマージャーニー
8. プロモーション戦略 & 商品設計

### チャットボット構築
ヒアリングシートの代わりにチャット形式でナレッジを構築。
「分からない」への対応パターン:
- エピソードベース質問
- 具体例要求
- 過去のお客様の事例を聞く

---

## ワークフロー（8ステップ）

```
1. 競合調査・トレンド分析 → [人間確認]
2. 企画立案 → [人間確認]
3. 台本生成（Gemini版/Claude版比較） → [人間確認]
4. メタデータ生成（タイトル/説明/サムネイル） → [人間確認]
5. 音声生成（MiniMax Audio） → [人間確認]
6. アバター動画生成（HeyGen） → [人間確認]
7. 編集・B-roll挿入 → [人間確認]
8. 公開 → [人間確認]
```

---

## コーディング規約

### フロントエンド（TypeScript）
```typescript
// コンポーネント: PascalCase
export const VideoCard: React.FC<VideoCardProps> = ({ video }) => { ... }

// 関数/変数: camelCase
const handleSubmit = () => { ... }

// Props: interfaceで定義
interface VideoCardProps {
  video: Video;
  onSelect?: (id: string) => void;
}

// インポート順序
import React from 'react';           // 1. React
import { useQuery } from '@tanstack/react-query';  // 2. 外部ライブラリ
import { VideoCard } from '@/components';  // 3. 内部モジュール
import type { Video } from '@/types';  // 4. 型定義
```

### バックエンド（Python）
```python
# クラス: PascalCase
class VideoService:
    pass

# 関数/変数: snake_case
def get_video_by_id(video_id: str) -> Video:
    pass

# 型ヒント必須
async def create_video(
    data: VideoCreate,
    db: AsyncSession,
) -> Video:
    pass

# Docstring: Google Style
def generate_script(prompt: str) -> str:
    """台本を生成する。

    Args:
        prompt: 生成プロンプト

    Returns:
        生成された台本テキスト
    """
    pass
```

---

## テスト基準

| レイヤー | カバレッジ目標 |
|---------|-------------|
| ビジネスロジック | 80%以上 |
| APIエンドポイント | 90%以上 |
| UIコンポーネント | 60%以上 |
| ユーティリティ | 90%以上 |

### テストファイル命名
```
フロントエンド: *.test.tsx / *.test.ts
バックエンド: test_*.py
```

---

## パフォーマンス基準

### フロントエンド
| 指標 | 目標値 |
|-----|-------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| バンドルサイズ（gzip） | < 500KB |

### バックエンド
| 指標 | 目標値 |
|-----|-------|
| API応答時間（P95） | < 500ms |
| API応答時間（P99） | < 1000ms |
| エラー率 | < 0.1% |

---

## データベーススキーマ（主要テーブル）

```sql
-- ユーザー
users (id, email, name, role, created_at, updated_at)

-- クライアント
clients (id, user_id, company_name, plan, knowledge_count, created_at)

-- ナレッジ
knowledges (id, client_id, name, type, content, embedding, created_at, updated_at)

-- プロジェクト
projects (id, client_id, knowledge_id, name, status, created_at)

-- 動画
videos (id, project_id, title, script, status, youtube_url, analytics, created_at)

-- ワークフローステップ
workflow_steps (id, video_id, step_name, status, approver_id, approved_at, comments, created_at)

-- チャットセッション
chat_sessions (id, client_id, knowledge_id, current_step, messages, status, created_at)
```

---

## 環境変数

### フロントエンド (.env)
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=xxx
```

### バックエンド (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
SECRET_KEY=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
CLAUDE_API_KEY=xxx
GEMINI_API_KEY=xxx
HEYGEN_API_KEY=xxx
MINIMAX_API_KEY=xxx
YOUTUBE_API_KEY=xxx
SOCIAL_BLADE_API_KEY=xxx
SERP_API_KEY=xxx
```

---

## CI/CD

### GitHub Actions
```
push/PR → Lint → Type Check → Test → Build → Deploy
```

### 環境
| 環境 | トリガー |
|-----|---------|
| Staging | develop マージ |
| Production | main マージ + 手動承認 |

---

## セキュリティ

### 認証
- OAuth 2.0 / OpenID Connect
- JWT トークン（有効期限設定）
- セッション管理（Redis）

### 認可
- ロールベースアクセス制御（RBAC）
- リソースレベル権限チェック
- クライアント別データ分離

### データ保護
- HTTPS/TLS 1.3
- データベース暗号化（at rest）
- APIキー: 環境変数/Secret Manager

---

## よく使うAPI

### 認証
```
POST /api/auth/google          # Google OAuth
POST /api/auth/refresh         # トークンリフレッシュ
POST /api/auth/logout          # ログアウト
```

### プロジェクト・動画
```
GET  /api/projects             # プロジェクト一覧
POST /api/projects             # プロジェクト作成
GET  /api/videos               # 動画一覧
POST /api/videos/:id/approve   # 動画承認
```

### ナレッジ
```
GET  /api/knowledges           # ナレッジ一覧
POST /api/knowledges           # ナレッジ作成
GET  /api/knowledges/:id/chat  # チャットセッション取得
POST /api/knowledges/:id/chat  # チャットメッセージ送信
```

### AI生成
```
POST /api/scripts/generate     # 台本生成
POST /api/thumbnails/generate  # サムネイル生成
POST /api/audio/generate       # 音声生成
POST /api/avatar/generate      # アバター動画生成
```

### リサーチ
```
POST /api/research/youtube     # YouTube競合調査
POST /api/research/trends      # トレンド分析
POST /api/research/keywords    # キーワード調査
```

---

## 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| 要件定義書 | `docs/requirements.md` |
| 品質基準 | `docs/quality-standards.md` |
| ページ詳細設計 | `docs/pages/*.md` |

---

## 開発時の注意点

1. **ナレッジ参照を忘れない**: AI生成時は必ずナレッジDBを参照し、ターゲット・インサイトと一貫性を保つ
2. **人間確認ステップ**: 各ワークフローステップで必ず承認UIを実装
3. **型安全性**: TypeScript/Pythonの型を厳格に使用
4. **エラーハンドリング**: APIエラーは適切にユーザーに表示
5. **非同期処理**: 長時間処理はCeleryタスクで実行、進捗表示を実装

---

**作成日**: 2025-12-11
**バージョン**: 1.0

---

### 13. E2Eテスト自律実行の絶対原則

**【重要】セッション開始時・compact後の自動判定**

このセクションはE2Eテストオーケストレーターによって自動生成されました。

---

**最初に必ず専門知識を注入してください**

E2Eテスト実行中の場合、以下を実行してから開始してください：

```
inject_knowledge ツールで keyword: "@E2Eテストオーケストレーター"
を実行してから開始してください。（初回必須・compact後も必須）
```

重要：キーワードは "@E2Eテストオーケストレーター"
をそのまま使用してください。変換や推測は不要です。

準備完了です。まず知識注入を実行してから、タスクを開始してください。

---

**E2Eテストオーケストレーター実行中の判定**:
- SCOPE_PROGRESS.mdに「## 📊 E2Eテスト全体進捗」が存在する場合
- または、セッション再開時に前回のメッセージに「E2Eテスト」「オーケストレーター」キーワードがある場合

**セッション開始時・compact後の自動処理**:
1. 上記の判定基準でE2Eテスト実行中と判定
2. inject_knowledge('@E2Eテストオーケストレーター') を必ず実行
3. docs/e2e-best-practices.md の存在確認（なければ初期テンプレート作成）
4. SCOPE_PROGRESS.mdから [ ] テストの続きを自動で特定
5. [x] のテストは絶対にスキップ
6. ユーザー確認不要、完全自律モードで継続
7. ページ選定も自動（未完了ページを上から順に選択）
8. 停止条件：全テスト100%完了のみ

**5回エスカレーション後の処理**:
- チェックリストに [-] マークを付ける
- docs/e2e-test-history/skipped-tests.md に記録
- 次のテストへ自動で進む（停止しない）

**ベストプラクティス自動蓄積**:
- 各テストで成功した方法を docs/e2e-best-practices.md に自動保存
- 後続テストが前のテストの知見を自動活用
- 試行錯誤が減っていく（学習効果）

**重要**:
- この原則はCLAUDE.mdに記載されているため、compact後も自動で適用される
- セッション開始時にこのセクションがない場合、オーケストレーターが自動で追加する
