# フロントエンドサービスファイル分割計画

## 概要

巨大なサービスファイルを保守性とテスタビリティを向上させるため、論理的な単位で分割しました。

## 分割の原則

### ファイル構造
```
services/
├── {service-name}.ts          # 後方互換性のためのre-export
└── {service-name}/
    ├── index.ts                # メインサービスロジック
    ├── types.ts                # 型定義（API型 + フロントエンド型）
    ├── mappers.ts              # API型 → フロントエンド型のマッピング関数
    └── mocks.ts                # 開発・テスト用モックデータ
```

### 分割の利点

1. **保守性向上**
   - 各ファイルが単一責任を持つ
   - 型定義、マッピングロジック、モックデータが分離され見通しが良い

2. **テスタビリティ向上**
   - マッピング関数を独立してテスト可能
   - モックデータを簡単に再利用可能

3. **後方互換性**
   - 既存のインポートパスは変更不要
   - 段階的な移行が可能

4. **コード再利用性**
   - 型定義を他のファイルから簡単にインポート可能
   - マッピングロジックを共有しやすい

## 実装済みファイル

### 1. research.ts (753行 → 4ファイル)

#### 元のファイル構造
- API型定義: 150行
- マッピング関数: 80行
- モックデータ: 240行
- サービスメソッド: 230行

#### 分割後
```
research/
├── index.ts (230行) - サービスメソッド
├── types.ts (200行) - API型 + フロントエンド型 + レスポンス型
├── mappers.ts (100行) - 8つのマッピング関数
└── mocks.ts (240行) - 5つのモックデータセット
```

#### 機能別分類
- **競合分析**: getCompetitors
- **動画調査**: getPopularVideos
- **トレンド分析**: getTrendingKeywords, getTrendingNews, getBookRankings
- **コメント分析**: getCommentSentiment, getCommentKeywords, getNotableComments

### 2. production.ts (671行 → 4ファイル)

#### 元のファイル構造
- API型定義: 150行
- マッピング関数: 130行
- モックデータ: 160行
- サービスメソッド: 210行

#### 分割後
```
production/
├── index.ts (240行) - サービスメソッド
├── types.ts (370行) - API型 + フロントエンド型（音声、アバター、B-roll、編集、品質）
├── mappers.ts (150行) - 9つのマッピング関数
└── mocks.ts (160行) - 6つのモックデータセット
```

#### 機能別分類
- **音声生成**: getVoiceModels, getVoiceProjects, generateAudio, getAudio
- **アバター生成**: getAvatarModels, getAvatarProjects, generateAvatar, getAvatar
- **編集**: getEditProjects
- **B-roll**: generateBroll, getBroll
- **品質管理**: getVideoForReview, submitReview

## 推奨：analytics.ts (583行 → 4ファイル)

### 現在の構造分析
- API型定義: 140行
- マッピング関数: 120行
- モックデータ: 160行
- サービスメソッド: 150行

### 推奨分割
```
analytics/
├── index.ts (150行) - サービスメソッド
├── types.ts (250行) - API型 + フロントエンド型
├── mappers.ts (120行) - 7つのマッピング関数
└── mocks.ts (160行) - 5つのモックデータセット
```

### 機能別分類
- **収益分析**: getRevenues, getMonthlyRevenue
- **シリーズ管理**: getSeries
- **ナレッジ管理**: getKnowledge
- **テンプレート管理**: getTemplates
- **パフォーマンス分析**: getVideoAnalytics, getChannelOverview, getPerformanceReport
- **レポート生成**: generateReport

## 移行ガイド

### 既存コードの変更不要
```typescript
// 既存のインポートはそのまま動作
import { researchService } from '@/services/research';
import { productionService } from '@/services/production';
```

### 新しいコードでの推奨
```typescript
// 型も一緒にインポートする場合
import { researchService } from '@/services/research';
import type { Competitor, PopularVideo } from '@/services/research';

// または直接サブディレクトリから
import { researchService } from '@/services/research/index';
import type { ApiCompetitorChannel } from '@/services/research/types';
```

### テストコードでの活用
```typescript
// マッピング関数を個別にテスト
import { mapCompetitor } from '@/services/research/mappers';

describe('mapCompetitor', () => {
  it('should map API data to frontend format', () => {
    const apiData = { ... };
    const result = mapCompetitor(apiData, 0);
    expect(result).toEqual({ ... });
  });
});

// モックデータを再利用
import { mockCompetitors } from '@/services/research/mocks';

const testData = mockCompetitors[0];
```

## 今後の方針

### 優先度1: 大きなファイルから順次分割
1. analytics.ts (583行) - 推奨分割プラン作成済み
2. script.ts (400行以上の場合)
3. planning.ts (400行以上の場合)

### 優先度2: 複雑度が高いファイル
- 多数のAPI型定義を持つファイル
- 複雑なマッピングロジックを含むファイル
- 大量のモックデータを持つファイル

### 分割の基準
- **400行以上**: 分割を検討
- **600行以上**: 分割を強く推奨
- **800行以上**: 即座に分割すべき

## ベストプラクティス

### 型定義（types.ts）
```typescript
// API型とフロントエンド型を明確に分離
// API型: snake_case (バックエンドに合わせる)
export interface ApiVideoData {
  video_id: string;
  created_at: string;
}

// フロントエンド型: camelCase
export interface VideoData {
  videoId: string;
  createdAt: string;
}
```

### マッピング関数（mappers.ts）
```typescript
// 純粋関数として実装
// テストしやすい
export const mapVideo = (api: ApiVideoData): VideoData => ({
  videoId: api.video_id,
  createdAt: api.created_at,
});
```

### モックデータ（mocks.ts）
```typescript
// 型を明示
// 実際のAPIレスポンスに近い構造
export const mockVideos: VideoData[] = [
  {
    videoId: 'test-1',
    createdAt: '2024-01-01T00:00:00Z',
  },
];
```

### サービスメソッド（index.ts）
```typescript
// API呼び出し → マッピング → エラーハンドリング
export const service = {
  async getData(): Promise<Response> {
    try {
      const apiData = await api.get<ApiResponse>('/endpoint');
      return {
        items: apiData.data.map(mapItem),
        total: apiData.total,
      };
    } catch (error) {
      console.warn('API error, using mock:', error);
      return { items: mockItems, total: mockItems.length };
    }
  },
};
```

## まとめ

### 完了
- research.ts: 753行 → 4ファイル（合計770行、構造化により可読性向上）
- production.ts: 671行 → 4ファイル（合計920行、構造化により保守性向上）

### 次のステップ
1. analytics.ts の分割実装
2. 他の大きなサービスファイルの調査
3. テストカバレッジの向上（分割により容易に）

### 期待される効果
- コードレビューの容易性向上
- 新機能追加時の影響範囲の明確化
- テスト作成の効率化
- チーム開発時の競合減少

---

**作成日**: 2025-12-17
**最終更新**: 2025-12-17
