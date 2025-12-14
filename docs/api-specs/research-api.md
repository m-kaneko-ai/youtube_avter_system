# リサーチページ API仕様書

生成日: 2025-12-12
収集元: frontend/src/pages/research/components/*.tsx
@MOCK_TO_APIマーク数: 8

---

## エンドポイント一覧

| # | メソッド | エンドポイント | 説明 |
|---|---------|---------------|------|
| 1 | GET | /api/research/competitors | 登録済み競合チャンネル一覧 |
| 2 | GET | /api/research/popular-videos | 競合の人気動画TOP10 |
| 3 | GET | /api/research/trends/keywords | 急上昇キーワード一覧 |
| 4 | GET | /api/research/trends/news | 関連ニュース・話題 |
| 5 | GET | /api/research/trends/books | Amazon書籍ランキング |
| 6 | GET | /api/research/comments/sentiment | コメント感情分析 |
| 7 | GET | /api/research/comments/keywords | 頻出キーワード |
| 8 | GET | /api/research/comments/notable | 注目コメント |

---

## 1. 競合チャンネル一覧取得

### リクエスト
```
GET /api/research/competitors
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| page | number | No | ページ番号（デフォルト: 1） |
| limit | number | No | 取得件数（デフォルト: 10） |

### レスポンス
```typescript
interface Competitor {
  id: string;
  channelId: string;
  name: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  videoCount: number;
  avgViews: number;
  growthRate?: number;
  createdAt: string;
  updatedAt: string;
}

// Response
{
  data: Competitor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### サンプルレスポンス
```json
{
  "data": [
    {
      "id": "1",
      "channelId": "UC123456",
      "name": "おさるマーケ大学",
      "thumbnailUrl": "https://example.com/thumb1.jpg",
      "subscriberCount": 123000,
      "videoCount": 245,
      "avgViews": 8500,
      "growthRate": 2.3,
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2025-12-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

## 2. 人気動画一覧取得

### リクエスト
```
GET /api/research/popular-videos
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| limit | number | No | 取得件数（デフォルト: 10） |
| competitorId | string | No | 特定の競合のみ |

### レスポンス
```typescript
interface PopularVideo {
  id: string;
  videoId: string;
  title: string;
  views: number;
  channelName: string;
  thumbnailUrl?: string;
  publishedAt: string;
}

// Response
{
  data: PopularVideo[];
}
```

### サンプルレスポンス
```json
{
  "data": [
    {
      "id": "1",
      "videoId": "abc123",
      "title": "【完全版】AIで月100万円稼ぐ方法",
      "views": 450000,
      "channelName": "おさるマーケ大学",
      "thumbnailUrl": "https://example.com/video1.jpg",
      "publishedAt": "2025-12-01T00:00:00Z"
    }
  ]
}
```

---

## 3. 急上昇キーワード取得

### リクエスト
```
GET /api/research/trends/keywords
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| category | string | No | カテゴリでフィルタ |
| period | string | No | 期間（7d, 30d, 90d） |
| limit | number | No | 取得件数（デフォルト: 10） |

### レスポンス
```typescript
interface TrendKeyword {
  id: string;
  keyword: string;
  growthRate: number;
  searchVolume?: number;
  category?: string;
  isFire: boolean;
}

// Response
{
  data: TrendKeyword[];
}
```

### サンプルレスポンス
```json
{
  "data": [
    {
      "id": "1",
      "keyword": "Claude 3.5",
      "growthRate": 340,
      "searchVolume": 45000,
      "category": "AI",
      "isFire": true
    }
  ]
}
```

---

## 4. 関連ニュース取得

### リクエスト
```
GET /api/research/trends/news
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| category | string | No | カテゴリでフィルタ |
| limit | number | No | 取得件数（デフォルト: 5） |

### レスポンス
```typescript
interface TrendNews {
  id: string;
  title: string;
  description?: string;
  source: string;
  url: string;
  publishedAt: string;
}

// Response
{
  data: TrendNews[];
}
```

---

## 5. 書籍ランキング取得

### リクエスト
```
GET /api/research/trends/books
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| category | string | No | カテゴリでフィルタ |
| limit | number | No | 取得件数（デフォルト: 5） |

### レスポンス
```typescript
interface BookRanking {
  id: string;
  title: string;
  author?: string;
  rating: number;
  reviewCount: number;
  category: string;
  amazonUrl?: string;
  imageUrl?: string;
}

// Response
{
  data: BookRanking[];
}
```

---

## 6. コメント感情分析

### リクエスト
```
GET /api/research/comments/sentiment
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| videoUrl | string | Yes | YouTube動画URL |

### レスポンス
```typescript
interface CommentSentiment {
  positive: number;      // パーセンテージ (0-100)
  neutral: number;       // パーセンテージ (0-100)
  negative: number;      // パーセンテージ (0-100)
  totalComments: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

// Response
{
  data: CommentSentiment;
}
```

### サンプルレスポンス
```json
{
  "data": {
    "positive": 78,
    "neutral": 12,
    "negative": 10,
    "totalComments": 1250,
    "positiveCount": 975,
    "neutralCount": 150,
    "negativeCount": 125
  }
}
```

---

## 7. 頻出キーワード取得

### リクエスト
```
GET /api/research/comments/keywords
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| videoUrl | string | Yes | YouTube動画URL |
| limit | number | No | 取得件数（デフォルト: 20） |

### レスポンス
```typescript
interface KeywordFrequency {
  keyword: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Response
{
  data: KeywordFrequency[];
}
```

---

## 8. 注目コメント取得

### リクエスト
```
GET /api/research/comments/notable
```

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| videoUrl | string | Yes | YouTube動画URL |
| limit | number | No | 取得件数（デフォルト: 10） |
| sortBy | string | No | ソート順（likes, recent） |

### レスポンス
```typescript
interface NotableComment {
  id: string;
  text: string;
  likes: number;
  authorName: string;
  authorImageUrl?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  publishedAt: string;
}

// Response
{
  data: NotableComment[];
}
```

---

## エラーレスポンス

全エンドポイント共通のエラーレスポンス形式:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | リクエストパラメータ不正 |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバーエラー |

---

## モックサービス参照

```
frontend/src/pages/research/components/CompetitorTab.tsx
frontend/src/pages/research/components/TrendTab.tsx
frontend/src/pages/research/components/CommentTab.tsx
```

実装時はこれらのファイル内のモックデータを参考にしてください。
