# マスターデータAPI仕様書

**作成日**: 2025-12-13
**バージョン**: 1.0
**スライス**: 2-B（マスターデータ）

## 概要

クライアント、カテゴリ、タグのマスターデータ管理API

---

## エンドポイント一覧

### クライアント管理

#### 1. POST /api/v1/clients
**クライアント作成**

- **権限**: Owner, Team
- **リクエストボディ**:
```json
{
  "user_id": "uuid",
  "company_name": "株式会社サンプル",
  "plan": "basic" | "premium" | "premium_plus"
}
```

- **レスポンス** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "company_name": "株式会社サンプル",
  "plan": "basic",
  "knowledge_count": 0,
  "created_at": "2025-12-13T00:00:00Z",
  "updated_at": "2025-12-13T00:00:00Z"
}
```

---

#### 2. GET /api/v1/clients
**クライアント一覧取得**

- **権限**: Owner, Team
- **クエリパラメータ**:
  - `page` (int, default: 1): ページ番号
  - `limit` (int, default: 20, max: 100): 1ページあたりの件数
  - `plan` (enum, optional): プランフィルタ (basic/premium/premium_plus)

- **レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "company_name": "株式会社サンプル",
      "plan": "basic",
      "knowledge_count": 3,
      "created_at": "2025-12-13T00:00:00Z",
      "updated_at": "2025-12-13T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

---

#### 3. GET /api/v1/clients/{client_id}
**クライアント詳細取得**

- **権限**:
  - Owner, Team: 全クライアント取得可能
  - Client: 自分自身のクライアント情報のみ

- **パスパラメータ**:
  - `client_id` (uuid): クライアントID

- **レスポンス** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "company_name": "株式会社サンプル",
  "plan": "premium",
  "knowledge_count": 5,
  "created_at": "2025-12-13T00:00:00Z",
  "updated_at": "2025-12-13T00:00:00Z"
}
```

- **エラー**:
  - 404: クライアントが存在しない
  - 403: アクセス権限なし（他のクライアント情報へのアクセス）

---

#### 4. PUT /api/v1/clients/{client_id}
**クライアント更新**

- **権限**: Owner, Team
- **パスパラメータ**:
  - `client_id` (uuid): クライアントID

- **リクエストボディ** (全てoptional):
```json
{
  "company_name": "株式会社サンプル（更新）",
  "plan": "premium_plus",
  "knowledge_count": 10
}
```

- **レスポンス** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "company_name": "株式会社サンプル（更新）",
  "plan": "premium_plus",
  "knowledge_count": 10,
  "created_at": "2025-12-13T00:00:00Z",
  "updated_at": "2025-12-13T00:10:00Z"
}
```

---

### マスターデータ

#### 5. GET /api/v1/master/categories
**カテゴリ一覧取得**

- **権限**: 認証済み全ユーザー
- **レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ビジネスマーケティング",
      "description": "マーケティング戦略、販売促進、ブランディング",
      "created_at": "2025-12-13T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "AI・テクノロジー",
      "description": "最新AI技術、プログラミング、デジタルツール",
      "created_at": "2025-12-13T00:00:00Z"
    }
  ]
}
```

---

#### 6. GET /api/v1/master/tags
**タグ一覧取得**

- **権限**: 認証済み全ユーザー
- **レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "マーケティング",
      "created_at": "2025-12-13T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "AI",
      "created_at": "2025-12-13T00:00:00Z"
    }
  ]
}
```

---

## データモデル

### Client
| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| id | UUID | Yes | クライアントID |
| user_id | UUID | Yes | ユーザーID（外部キー） |
| company_name | String(255) | Yes | 会社名 |
| plan | Enum | Yes | 契約プラン (basic/premium/premium_plus) |
| knowledge_count | Integer | Yes | ナレッジ数 |
| created_at | DateTime | Yes | 作成日時 |
| updated_at | DateTime | Yes | 更新日時 |

### Category
| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| id | UUID | Yes | カテゴリID |
| name | String(100) | Yes | カテゴリ名（ユニーク） |
| description | Text | No | 説明 |
| created_at | DateTime | Yes | 作成日時 |

### Tag
| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| id | UUID | Yes | タグID |
| name | String(50) | Yes | タグ名（ユニーク） |
| created_at | DateTime | Yes | 作成日時 |

---

## 認証

全エンドポイントは`Authorization: Bearer <token>`ヘッダーによるJWT認証が必要

---

## エラーレスポンス

### 400 Bad Request
```json
{
  "detail": "バリデーションエラーメッセージ"
}
```

### 401 Unauthorized
```json
{
  "detail": "無効な認証トークンです"
}
```

### 403 Forbidden
```json
{
  "detail": "このリソースへのアクセスには owner, team ロールが必要です"
}
```

### 404 Not Found
```json
{
  "detail": "Client with id {client_id} not found"
}
```

---

## 実装ファイル

- **モデル**:
  - `backend/app/models/client.py`
  - `backend/app/models/category.py`
  - `backend/app/models/tag.py`

- **スキーマ**:
  - `backend/app/schemas/client.py`
  - `backend/app/schemas/master.py`

- **サービス**:
  - `backend/app/services/client_service.py`
  - `backend/app/services/master_service.py`

- **エンドポイント**:
  - `backend/app/api/v1/endpoints/clients.py`
  - `backend/app/api/v1/endpoints/master.py`

- **マイグレーション**:
  - `backend/alembic/versions/3feb5fddb768_add_clients_categories_tags_tables.py`

---

## 完了条件チェックリスト

- [x] 6つのエンドポイントが実装されている
- [x] Client, Category, Tagモデルが作成されている
- [x] マイグレーションが実行可能
- [x] api/v1/routerにルーターが登録されている
- [x] 権限チェックが実装されている
- [x] ページネーション機能が動作している
- [x] APIドキュメントが自動生成されている (Swagger UI)

---

## 次のステップ

- スライス3-A: ナレッジ管理の実装
- スライス3-B: プロジェクト管理の実装
