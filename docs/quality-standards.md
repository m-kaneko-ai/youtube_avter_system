# Creator Studio AI 品質基準

## 1. コード品質基準

### 1.1 フロントエンド（React + TypeScript）

#### TypeScript設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### コーディング規約
| 項目 | 基準 |
|-----|------|
| 命名規則 | コンポーネント: PascalCase, 関数/変数: camelCase |
| ファイル構成 | 1コンポーネント = 1ファイル |
| インポート順 | React → 外部ライブラリ → 内部モジュール → 型定義 |
| Props定義 | interface で明示的に型定義 |
| 状態管理 | ローカル: useState, グローバル: Zustand |

#### Linter/Formatter
- **ESLint**: airbnb-typescript ベース
- **Prettier**: 統一フォーマット
- **Husky**: コミット前自動チェック

### 1.2 バックエンド（Python + FastAPI）

#### Python設定
```toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "C4"]

[tool.mypy]
strict = true
```

#### コーディング規約
| 項目 | 基準 |
|-----|------|
| 命名規則 | クラス: PascalCase, 関数/変数: snake_case |
| 型ヒント | 全関数に必須 |
| Docstring | Google Style |
| 例外処理 | カスタム例外クラス使用 |

#### Linter/Formatter
- **Ruff**: リンター + フォーマッター
- **mypy**: 型チェック
- **pre-commit**: コミット前自動チェック

---

## 2. テスト基準

### 2.1 テストカバレッジ目標

| レイヤー | カバレッジ目標 | 優先度 |
|---------|-------------|-------|
| ビジネスロジック | 80%以上 | 高 |
| APIエンドポイント | 90%以上 | 高 |
| UIコンポーネント | 60%以上 | 中 |
| ユーティリティ | 90%以上 | 高 |

### 2.2 テスト種別

#### ユニットテスト
```
フロントエンド: Vitest + React Testing Library
バックエンド: pytest + pytest-asyncio
```

#### 統合テスト
```
API: pytest + httpx
E2E: Playwright
```

#### テストファイル命名規則
```
フロントエンド: *.test.tsx / *.test.ts
バックエンド: test_*.py
```

### 2.3 テスト実行タイミング

| タイミング | テスト種別 |
|-----------|----------|
| コミット前 | Lint + ユニットテスト（変更ファイルのみ） |
| PR作成時 | 全ユニットテスト + 統合テスト |
| マージ前 | 全テスト + E2Eテスト |
| デプロイ前 | 全テスト + E2Eテスト + パフォーマンステスト |

---

## 3. CI/CD パイプライン

### 3.1 GitHub Actions ワークフロー

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: mypy .
      - run: pytest --cov=app --cov-report=xml
```

### 3.2 デプロイメントフロー

```
[develop] → PR → CI → Review → Merge
                              ↓
[main] → CI → Staging Deploy → E2E Test → Production Deploy
```

### 3.3 環境構成

| 環境 | 用途 | デプロイトリガー |
|-----|------|---------------|
| Development | 開発・テスト | ローカル |
| Staging | 統合テスト・レビュー | develop マージ |
| Production | 本番 | main マージ + 手動承認 |

---

## 4. コードレビュー基準

### 4.1 レビューチェックリスト

#### 機能面
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

#### コード品質
- [ ] 命名が明確か
- [ ] 関数/メソッドが単一責任か
- [ ] 重複コードがないか
- [ ] 型定義が適切か

#### セキュリティ
- [ ] 入力値のバリデーションがあるか
- [ ] 認証・認可が適切か
- [ ] 機密情報がハードコードされていないか

#### テスト
- [ ] テストが追加されているか
- [ ] テストが意味のあるものか

### 4.2 レビュー承認ルール

| 変更規模 | 必要承認数 |
|---------|----------|
| 小（typo修正など） | 1名 |
| 中（機能追加・修正） | 1名 |
| 大（アーキテクチャ変更） | 2名 |

---

## 5. パフォーマンス基準

### 5.1 フロントエンド

| 指標 | 目標値 |
|-----|-------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| バンドルサイズ（gzip） | < 500KB |

### 5.2 バックエンド

| 指標 | 目標値 |
|-----|-------|
| API応答時間（P95） | < 500ms |
| API応答時間（P99） | < 1000ms |
| エラー率 | < 0.1% |
| 同時接続数 | 50+ |

### 5.3 計測ツール

- **Lighthouse**: フロントエンドパフォーマンス
- **Sentry**: エラー監視
- **Cloud Monitoring**: インフラ監視

---

## 6. セキュリティ基準

### 6.1 セキュリティチェックリスト

#### 認証・認可
- [ ] JWT トークンの有効期限設定
- [ ] リフレッシュトークンの安全な管理
- [ ] RBAC の適切な実装

#### データ保護
- [ ] 機密データの暗号化
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策

#### インフラ
- [ ] HTTPS強制
- [ ] CORS設定
- [ ] レート制限

### 6.2 セキュリティスキャン

| ツール | 対象 | 実行タイミング |
|-------|------|---------------|
| npm audit | フロントエンド依存関係 | CI時 |
| safety | バックエンド依存関係 | CI時 |
| Trivy | Dockerイメージ | デプロイ前 |

---

## 7. ドキュメント基準

### 7.1 必須ドキュメント

| ドキュメント | 対象 | 更新タイミング |
|------------|------|---------------|
| README.md | プロジェクト概要 | 機能追加時 |
| CLAUDE.md | 開発ガイドライン | 設計変更時 |
| API仕様書 | エンドポイント | API変更時 |
| 変更履歴 | リリース内容 | リリース時 |

### 7.2 コメント基準

#### 必須コメント
- 複雑なビジネスロジック
- ワークアラウンド/ハック
- TODO/FIXME

#### 不要コメント
- 自明なコード
- コードの単純な説明

---

## 8. 監視・ログ基準

### 8.1 ログレベル

| レベル | 用途 |
|-------|------|
| ERROR | 異常系（即時対応必要） |
| WARN | 警告（要注意） |
| INFO | 重要なビジネスイベント |
| DEBUG | 開発・デバッグ用 |

### 8.2 必須ログ項目

- リクエストID
- ユーザーID（認証済みの場合）
- タイムスタンプ
- 処理時間
- ステータスコード

### 8.3 アラート設定

| 条件 | アクション |
|-----|----------|
| エラー率 > 1% | Slack通知 |
| 応答時間P95 > 2s | Slack通知 |
| サービスダウン | Slack + メール通知 |

---

**作成日**: 2025-12-11
**バージョン**: 1.0
