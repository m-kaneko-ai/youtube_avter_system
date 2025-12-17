# サービスファイル分割 - クイックリファレンス

## 分割済みサービス

### ✅ research.ts → research/
- **types.ts** (187行): API型 + Frontend型
- **mappers.ts** (103行): 8つの変換関数
- **mocks.ts** (254行): 5つのモックデータ
- **index.ts** (268行): 8つのサービスメソッド

### ✅ production.ts → production/
- **types.ts** (385行): 5サブシステムの型
- **mappers.ts** (153行): 9つの変換関数
- **mocks.ts** (167行): 6つのモックデータ
- **index.ts** (264行): 13のサービスメソッド

## 使い方

### 既存コード（変更不要）
```typescript
import { researchService } from '@/services/research';
```

### 新しいコード（推奨）
```typescript
// サービス + 型
import { researchService } from '@/services/research';
import type { Competitor } from '@/services/research';

// 直接インポート
import { mockCompetitors } from '@/services/research/mocks';
import { mapCompetitor } from '@/services/research/mappers';
```

## 成果

| 指標 | Before | After | 改善 |
|------|--------|-------|------|
| 最大ファイル | 753行 | 385行 | -49% |
| 平均ファイル | 712行 | 180行 | -75% |
| モジュール数 | 2 | 8 | 単一責任 |

## 次のステップ

1. **analytics.ts** (583行) - 分割推奨
2. 他の大きなファイルの特定
3. テストカバレッジ向上

## ドキュメント

- [分割計画書](./SERVICE_FILE_SPLIT_PLAN.md)
- [サマリー](./SERVICE_SPLIT_SUMMARY.md)
- [視覚的比較](./SERVICE_SPLIT_VISUALIZATION.md)
- [最終報告書](./SERVICE_SPLIT_FINAL_REPORT.md)

---
**最終更新**: 2025-12-17
