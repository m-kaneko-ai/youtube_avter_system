# 引き継ぎ書: AIエージェント拡張要件定義

**作成日**: 2025-12-17
**作成者**: E2Eテストセッション
**目的**: エージェント機能の詳細設計を次回セッションで実施するための引き継ぎ

---

## 1. 現状サマリー

### 1.1 実装済み（UI・API骨格）

| レイヤー | 実装状態 | ファイル |
|---------|----------|----------|
| フロントエンドUI | ✅ 完了 | `AgentPage.tsx`（5タブ構成） |
| フロントエンドサービス | ✅ 完了 | `services/agent.ts` |
| バックエンドAPI | ✅ 完了 | `endpoints/agent.py`（12エンドポイント） |
| バックエンドモデル | ✅ 完了 | `models/agent.py` |
| DBマイグレーション | ✅ 完了 | `3f1f9a01d400_add_agent_models.py` |

### 1.2 未実装（実動作ロジック）

| 項目 | 状態 | 説明 |
|------|------|------|
| エージェント実行エンジン | ❌ | スケジュールに基づく自動実行 |
| AI API連携 | ❌ | Claude/Gemini呼び出しロジック |
| 外部API連携 | ❌ | YouTube/Google Trends連携 |
| タスクキュー | ❌ | Celery/Redisによる非同期実行 |
| 通知システム | ❌ | アラート発生時の通知 |

---

## 2. エージェントタイプ一覧

### 2.1 定義済みタイプ（types/index.ts）

```typescript
export type AgentType =
  | 'trend_monitor'        // トレンド監視
  | 'competitor_analyzer'  // 競合分析
  | 'comment_responder'    // コメント返信
  | 'content_scheduler'    // コンテンツスケジューラー
  | 'performance_tracker'  // パフォーマンス追跡
  | 'qa_checker'           // QAチェッカー
  | 'keyword_researcher';  // キーワードリサーチ
```

### 2.2 各エージェントの想定機能

| タイプ | 概要 | 入力 | 出力 | 外部連携 |
|--------|------|------|------|----------|
| trend_monitor | トレンドキーワード監視 | ナレッジのキーワード | TrendAlert | Google Trends, YouTube |
| competitor_analyzer | 競合チャンネル監視 | 登録済み競合チャンネル | CompetitorAlert | YouTube Data API |
| comment_responder | コメント自動返信 | CommentTemplate | CommentQueue | YouTube Data API |
| content_scheduler | 公開スケジュール管理 | PublishSchedule | 公開実行 | YouTube Data API |
| performance_tracker | パフォーマンス追跡 | VideoID | Analytics更新 | YouTube Analytics API |
| qa_checker | 品質チェック | 台本/サムネイル | QAスコア | Claude/Gemini |
| keyword_researcher | キーワード調査 | 検索クエリ | キーワードリスト | YouTube, SerpAPI |

---

## 3. 要件定義で決めるべき項目

### 3.1 各エージェントごとに定義が必要

```
■ エージェント名: [例: トレンド監視エージェント]

【トリガー条件】
- スケジュール: 毎日 9:00, 15:00, 21:00
- 手動実行: ダッシュボードから「今すぐ実行」

【入力データ】
- ナレッジID（どのナレッジに紐づくか）
- 監視キーワードリスト
- 監視対象カテゴリ

【処理フロー】
1. ナレッジDBからキーワードリスト取得
2. Google Trends APIでトレンドスコア取得
3. YouTube Data APIで関連動画数・再生数取得
4. スコア計算（前回比較）
5. 閾値超過時 → TrendAlert生成

【出力】
- TrendAlertレコード（DB保存）
- ダッシュボード通知
- Slack通知（オプション）

【AI連携】
- Claude: アラートの重要度判定
- Gemini: 企画提案の自動生成

【エラーハンドリング】
- API制限: リトライ（3回まで、指数バックオフ）
- タイムアウト: 300秒でキャンセル
- 失敗時: AgentLog記録 + 管理者通知
```

### 3.2 共通基盤として決めるべき項目

| 項目 | 決定事項 |
|------|----------|
| 実行エンジン | Celery + Redis or APScheduler? |
| AI API選択 | Claude優先 or Gemini優先? |
| レート制限 | YouTube API: 10,000 units/日の配分方法 |
| ログレベル | DEBUG/INFO/WARN/ERROR の使い分け |
| 通知チャネル | Slack? メール? アプリ内のみ? |
| 承認フロー | コメント返信の承認プロセス詳細 |

---

## 4. 既存ドキュメントの参照箇所

### 4.1 requirements.md

- **セクション13.2**: 秘策2「サブエージェント戦略」
- **セクション13.7**: 新規DBテーブル `agent_tasks, agent_results`
- **セクション13.8**: Phase 5「自動化（エージェント、コメント）」3日

### 4.2 SCOPE_PROGRESS.md

- **セクション12.1**: エージェント実装状況
- **セクション12.2**: エージェントAPIエンドポイント一覧
- **セクション12.4**: 秘策2, 6の対応状況

### 4.3 CLAUDE.md

- **ページ構成**: エージェント (/agent) - AI自動化
- **外部サービス連携**: YouTube Data API, Claude API, Gemini API

---

## 5. 推奨アプローチ

### 5.1 Phase分け提案

| Phase | 内容 | 工数目安 |
|-------|------|----------|
| Phase 1 | 要件定義書作成（全7エージェント詳細設計） | 1日 |
| Phase 2 | 実行エンジン基盤（Celery + スケジューラー） | 2日 |
| Phase 3 | トレンド監視エージェント実装 | 2日 |
| Phase 4 | 競合分析エージェント実装 | 2日 |
| Phase 5 | コメント返信エージェント実装 | 3日 |
| Phase 6 | 残り4エージェント実装 | 4日 |
| Phase 7 | 統合テスト・調整 | 2日 |

**合計: 約16日**

### 5.2 優先度提案

1. **最優先**: コメント返信エージェント（リスト獲得に直結）
2. **高優先**: トレンド監視エージェント（企画の質向上）
3. **中優先**: 競合分析エージェント（差別化戦略）
4. **低優先**: その他4エージェント

---

## 6. 次回セッションへの依頼

### 6.1 目的

エージェント拡張要件定義書（`docs/agent-specification.md`）の作成

### 6.2 成果物

1. **全7エージェントの詳細仕様書**
   - トリガー条件
   - 入力/出力データ
   - 処理フロー（フローチャート）
   - AI連携方法
   - 外部API連携方法
   - エラーハンドリング

2. **共通基盤設計**
   - 実行エンジン選定
   - タスクキュー設計
   - 通知システム設計
   - ログ設計

3. **実装ロードマップ**
   - Phase分け
   - 依存関係
   - リスク・懸念事項

### 6.3 参考にすべき既存実装

| ファイル | 内容 |
|----------|------|
| `backend/app/models/agent.py` | エージェントDBモデル |
| `backend/app/schemas/agent.py` | APIスキーマ |
| `backend/app/api/endpoints/agent.py` | APIエンドポイント |
| `frontend/src/services/agent.ts` | フロントエンドサービス |
| `frontend/src/pages/agent/AgentPage.tsx` | UI実装 |
| `frontend/src/types/index.ts` | 型定義（AgentType等） |

---

## 7. 質問事項（次回セッションで確認）

1. **AI API優先度**: Claude vs Gemini、どちらを主に使う？
2. **実行頻度**: トレンド監視は何時間ごと？
3. **通知方法**: Slack連携は必要？
4. **承認フロー**: コメント返信は全件承認必須？それとも自動返信OK？
5. **コスト制限**: YouTube API の 10,000 units/日をどう配分？

---

## 8. 関連ファイル一覧

```
docs/
├── requirements.md          # 要件定義書（セクション13に秘策記載）
├── SCOPE_PROGRESS.md        # 進捗管理（セクション12にエージェント）
├── CLAUDE.md                # 開発ガイド
└── handoff/
    └── 2025-12-17_agent-extension-requirements.md  # この引き継ぎ書

backend/app/
├── models/agent.py          # DBモデル
├── schemas/agent.py         # Pydanticスキーマ
├── api/endpoints/agent.py   # APIエンドポイント
└── services/                # ★ここにエージェント実行ロジックを追加

frontend/src/
├── pages/agent/             # エージェント管理UI
├── services/agent.ts        # APIクライアント
└── types/index.ts           # 型定義
```

---

**次回セッション開始時のコマンド例:**

```
エージェント拡張要件定義を作成してください。
引き継ぎ書: docs/handoff/2025-12-17_agent-extension-requirements.md
```

---

**作成完了**: 2025-12-17 21:10
