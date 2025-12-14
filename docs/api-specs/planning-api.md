# 企画・計画ページ API仕様書

## 概要
企画・計画ページで使用するAPIエンドポイントの仕様

## ベースURL
```
/api/planning
```

---

## 1. カレンダー関連

### 1.1 カレンダーデータ取得
```
GET /api/planning/calendar
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| year | number | Yes | 年 |
| month | number | Yes | 月 (1-12) |
| knowledge_id | string | No | ナレッジIDでフィルタ |

**レスポンス**
```json
{
  "year": 2025,
  "month": 12,
  "projects": [
    {
      "id": "proj_001",
      "title": "【完全解説】ChatGPT活用術5選",
      "type": "short",
      "status": "published",
      "scheduled_date": "2025-12-08",
      "published_date": "2025-12-08"
    }
  ]
}
```

### 1.2 プロジェクトをカレンダーに配置
```
PATCH /api/planning/calendar/schedule
```

**リクエストボディ**
```json
{
  "project_id": "proj_001",
  "scheduled_date": "2025-12-15"
}
```

**レスポンス**
```json
{
  "success": true,
  "project": {
    "id": "proj_001",
    "scheduled_date": "2025-12-15"
  }
}
```

---

## 2. 企画一覧関連

### 2.1 企画一覧取得
```
GET /api/planning/projects
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| status | string | No | ステータスフィルタ (all/planning/production/scheduled/published) |
| type | string | No | 種類フィルタ (all/short/long) |
| search | string | No | タイトル検索 |
| page | number | No | ページ番号 (デフォルト: 1) |
| limit | number | No | 取得件数 (デフォルト: 20) |
| sort | string | No | ソート (scheduled_date_asc/scheduled_date_desc/created_at_desc) |

**レスポンス**
```json
{
  "projects": [
    {
      "id": "proj_001",
      "title": "【完全解説】ChatGPT活用術5選",
      "category": "ビジネスマーケティング",
      "type": "short",
      "status": "published",
      "scheduled_date": "2025-12-08",
      "created_at": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

### 2.2 企画詳細取得
```
GET /api/planning/projects/:id
```

**レスポンス**
```json
{
  "id": "proj_001",
  "title": "【完全解説】ChatGPT活用術5選",
  "category": "ビジネスマーケティング",
  "description": "初心者向けにChatGPTの基本的な使い方をわかりやすく解説...",
  "type": "short",
  "status": "published",
  "scheduled_date": "2025-12-08",
  "knowledge_id": "know_001",
  "ai_suggestion_id": "sug_001",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-08T15:00:00Z"
}
```

### 2.3 企画ステータス更新
```
PATCH /api/planning/projects/:id/status
```

**リクエストボディ**
```json
{
  "status": "production"
}
```

### 2.4 企画削除
```
DELETE /api/planning/projects/:id
```

---

## 3. AI提案（チャット）関連

### 3.1 チャットセッション作成
```
POST /api/planning/chat/sessions
```

**リクエストボディ**
```json
{
  "knowledge_id": "know_001"
}
```

**レスポンス**
```json
{
  "session_id": "sess_001",
  "created_at": "2025-12-12T10:00:00Z"
}
```

### 3.2 チャットメッセージ送信
```
POST /api/planning/chat/sessions/:session_id/messages
```

**リクエストボディ**
```json
{
  "content": "AIツール比較の企画を考えて",
  "type": "user"
}
```

**レスポンス（ストリーミング）**
```json
{
  "message_id": "msg_001",
  "type": "assistant",
  "content": "AIツール比較の企画ですね！ナレッジを参照すると...",
  "suggestions": [
    {
      "id": "sug_001",
      "title": "【2025年版】AIツール比較レビュー",
      "description": "主要なAIツール10種を徹底比較...",
      "type": "short",
      "tags": ["AI", "比較", "レビュー"],
      "estimated_views": "50K-100K",
      "confidence": 0.85
    }
  ],
  "created_at": "2025-12-12T10:01:00Z"
}
```

### 3.3 チャット履歴取得
```
GET /api/planning/chat/sessions/:session_id/messages
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| limit | number | No | 取得件数 (デフォルト: 50) |
| before | string | No | このメッセージID以前を取得 |

### 3.4 提案を採用（企画として保存）
```
POST /api/planning/chat/suggestions/:suggestion_id/adopt
```

**リクエストボディ**
```json
{
  "scheduled_date": "2025-12-20",
  "modifications": {
    "title": "【最新版】AIツール徹底比較2025"
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "project": {
    "id": "proj_002",
    "title": "【最新版】AIツール徹底比較2025",
    "status": "planning",
    "scheduled_date": "2025-12-20"
  }
}
```

### 3.5 採用済み提案一覧取得
```
GET /api/planning/chat/suggestions/adopted
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| session_id | string | No | セッションIDでフィルタ |
| limit | number | No | 取得件数 |

### 3.6 採用取り消し
```
DELETE /api/planning/chat/suggestions/:suggestion_id/adopt
```

---

## 4. トレンド・ナレッジ参照

### 4.1 AI提案用コンテキスト取得
```
GET /api/planning/chat/context
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| knowledge_id | string | No | 特定ナレッジの情報を取得 |

**レスポンス**
```json
{
  "trends": [
    {
      "keyword": "AI効率化",
      "volume": 15000,
      "growth": 25
    }
  ],
  "knowledge": {
    "target_persona": "30-40代ビジネスパーソン",
    "insights": ["時短を求めている", "実践的な内容を好む"],
    "successful_patterns": ["How-to形式", "比較形式"]
  },
  "recent_projects": [
    {
      "title": "ChatGPT活用術",
      "performance": "good"
    }
  ]
}
```

---

## 5. 統計情報

### 5.1 企画統計取得
```
GET /api/planning/stats
```

**レスポンス**
```json
{
  "total_projects": 50,
  "by_status": {
    "planning": 10,
    "production": 8,
    "scheduled": 12,
    "published": 20
  },
  "by_type": {
    "short": 35,
    "long": 15
  },
  "this_month": {
    "created": 15,
    "published": 12
  }
}
```

---

## エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid scheduled_date format",
    "details": {
      "field": "scheduled_date",
      "expected": "YYYY-MM-DD"
    }
  }
}
```

### エラーコード一覧
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| NOT_FOUND | 404 | リソースが見つからない |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限エラー |
| AI_SERVICE_ERROR | 503 | AI生成サービスエラー |
| RATE_LIMIT | 429 | レート制限 |

---

## レート制限

| エンドポイント | 制限 |
|---------------|------|
| チャットメッセージ送信 | 20回/分 |
| 提案採用 | 100回/時 |
| その他 | 1000回/時 |

---

## @MOCK_TO_API マーカー対応表

| フロントエンドコンポーネント | APIエンドポイント |
|---------------------------|------------------|
| CalendarTab.tsx | GET /api/planning/calendar |
| ProjectListTab.tsx | GET /api/planning/projects |
| AIChatTab.tsx | POST /api/planning/chat/sessions/:id/messages |
| AIChatTab.tsx (採用) | POST /api/planning/chat/suggestions/:id/adopt |
