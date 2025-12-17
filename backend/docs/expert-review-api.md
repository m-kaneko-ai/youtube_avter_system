# 台本専門家レビューAPI実装完了

## 概要

5人のAI専門家が台本を添削するバックエンドAPI機能が実装されました。

## 実装ファイル

### 1. スキーマ定義
**ファイル**: `backend/app/schemas/expert_review.py`

- ✅ 既存スキーマ（すべて実装済み）
- `ExpertReviewRequest`: レビューリクエスト
- `ExpertReviewResponse`: レビュー結果レスポンス
- `ExpertFeedbackResponse`: 専門家フィードバック
- `PublishReadinessResponse`: 公開OK判定
- `ChecklistItemResponse`: チェックリスト項目
- `BeforeAfterComparison`: ビフォーアフター比較
- その他多数のレスポンススキーマ

### 2. エンドポイント
**ファイル**: `backend/app/api/v1/endpoints/scripts.py`

```python
POST /api/v1/scripts/expert-review
```

- ✅ 実装済み（line 76-112）
- 権限チェック付き（Owner/Teamロールのみ）
- ナレッジDB連携対応

### 3. サービスロジック
**ファイル**: `backend/app/services/expert_review_service.py`

#### ✅ 実装完了機能

1. **5人の専門家定義** (line 41-180)
   - 🎣 フックマスター (Claude) - 冒頭30秒専門
   - 🎬 ストーリーアーキテクト (Gemini) - 構成全体
   - 🎭 エンタメプロデューサー (Claude) - 演出・テンポ
   - 🎯 ターゲットインサイター (Claude + ナレッジDB) - ペルソナ共感
   - 📣 CTAストラテジスト (Gemini) - 行動喚起

2. **並列レビュー実行** (line 311-351)
   - `_run_expert_reviews()`: 5人の専門家が並列でレビュー
   - `asyncio.gather()`で高速化
   - エラーハンドリング付き

3. **個別専門家レビュー** (line 353-416)
   - `_review_by_expert()`: Claude/Gemini APIコール
   - JSON形式でレスポンス取得
   - スコア・改善案・提案を生成

4. **改善版台本マージ** (line 418-484)
   - `_merge_expert_revisions()`: 専門家の提案を統合
   - セクション別に改善ポイントを適用

5. **スコア計算** (line 486-509)
   - `_calculate_scores()`: 重み付け平均
   - フック25%、ターゲット25%を重視

6. **チェックリスト生成** (line 511-546)
   - `_generate_checklist()`: 10項目の必須チェック
   - スコア別に合格/不合格判定

7. **ペルソナ反応予測** (line 548-621)
   - `_predict_persona_reactions()`: Claude APIで予測
   - ターゲット別の反応スコア

8. **演出提案** (line 623-651)
   - `_generate_direction_suggestions()`: 視覚挿入提案
   - 冒頭・数字セクション・CTA部分を重点的に

9. **タイムライン警告** (line 653-681)
   - `_analyze_timeline_warnings()`: 長時間アバターのみ警告
   - 20秒以上の連続を検出

## API使用例

### リクエスト

```bash
POST /api/v1/scripts/expert-review
Content-Type: application/json
Authorization: Bearer <token>

{
  "script_id": "script-001",
  "source_ai_type": "gemini",
  "knowledge_id": "knowledge-001",
  "sections": [
    {
      "id": "section-1",
      "label": "オープニング",
      "timestamp": "0:00",
      "content": "こんにちは、みなさん。今日は..."
    },
    {
      "id": "section-2",
      "label": "本編",
      "timestamp": "0:30",
      "content": "本日のテーマは..."
    },
    {
      "id": "section-3",
      "label": "エンディング",
      "timestamp": "2:00",
      "content": "いかがでしたか？チャンネル登録を..."
    }
  ]
}
```

### レスポンス

```json
{
  "id": "review-uuid",
  "script_id": "script-001",
  "publish_readiness": {
    "ready": true,
    "score": 85,
    "grade": "A",
    "message": "✨ 自信を持って公開してください！"
  },
  "expert_feedbacks": [
    {
      "expert_type": "hook_master",
      "score": 88,
      "original_text": "元の冒頭文",
      "revised_text": "改善後の冒頭文（インパクト強化）",
      "improvement_reason": "3秒以内のインパクトが不足していたため改善",
      "suggestions": [
        "数字を使って具体性を出す",
        "視聴者の悩みを冒頭で明示する",
        "「あなた」を主語にして自分ごと化させる"
      ]
    }
    // ... 残り4人の専門家
  ],
  "before_after": {
    "hook_score": { "before": 65, "after": 88 },
    "retention_score": { "before": 70, "after": 82 },
    "cta_score": { "before": 72, "after": 85 },
    "overall_score": { "before": 69, "after": 85 }
  },
  "checklist": [
    {
      "id": "hook_3sec",
      "label": "冒頭3秒のインパクト",
      "passed": true,
      "comment": "フックスコア: 88"
    }
    // ... 全10項目
  ],
  "persona_reactions": [
    {
      "persona_type": "main_target",
      "persona_name": "メインターゲット",
      "reaction_score": 87,
      "reaction_emoji": "😊",
      "reason": "悩みに共感し、解決策に興味を持つ"
    }
  ],
  "revised_sections": [
    {
      "id": "section-1",
      "label": "オープニング",
      "timestamp": "0:00",
      "original_content": "元のテキスト",
      "revised_content": "改善後のテキスト",
      "is_improved": true,
      "improvements_by_expert": [
        {
          "expert_type": "hook_master",
          "contribution": "冒頭のインパクトを強化"
        }
      ]
    }
    // ... 全セクション
  ],
  "direction_suggestions": [...],
  "timeline_warnings": [...],
  "source_ai_type": "gemini",
  "created_at": "2025-12-17T10:00:00Z",
  "processing_time_ms": 8500
}
```

## 5人の専門家の特徴

| 専門家 | アイコン | AIモデル | 専門領域 | 評価基準 |
|-------|---------|---------|---------|---------|
| フックマスター | 🎣 | Claude Sonnet 4 | 冒頭30秒 | 3秒インパクト、問題提起、自分ごと化 |
| ストーリーアーキテクト | 🎬 | Gemini 1.5 Flash | 構成全体 | 起承転結、論理展開、トランジション |
| エンタメプロデューサー | 🎭 | Claude Sonnet 4 | 演出・テンポ | 緩急、エンタメ要素、感情訴求 |
| ターゲットインサイター | 🎯 | Claude Sonnet 4 | ペルソナ共感 | ターゲット適合、インサイト、ナレッジ一貫性 |
| CTAストラテジスト | 📣 | Gemini 1.5 Flash | 行動喚起 | CTA明確性、具体性、自然な誘導 |

## スコア重み付け

総合スコアは以下の重み付け平均で計算:

- フックマスター: **25%** (最重要)
- ストーリーアーキテクト: 20%
- エンタメプロデューサー: 15%
- ターゲットインサイター: **25%** (最重要)
- CTAストラテジスト: 15%

## 公開OK判定基準

| グレード | スコア範囲 | 公開判定 | メッセージ |
|---------|----------|---------|-----------|
| S | 90-100 | ✅ 公開OK | 🎉 バズる可能性が高いです！ |
| A | 80-89 | ✅ 公開OK | ✨ 自信を持って公開してください！ |
| B | 70-79 | ✅ 公開OK | 👍 公開OK。さらに改善の余地あり |
| C | 60-69 | ⚠️ 要注意 | ⚠️ 公開可能ですが、改善推奨 |
| D | 0-59 | ❌ 再添削 | ❌ 再添削を推奨します |

## 必須チェックリスト（10項目）

1. 冒頭3秒のインパクト
2. 冒頭30秒のフック
3. 起承転結の明確さ
4. ターゲット適合性
5. テンポと緩急
6. エンタメ要素
7. CTA明確性
8. 論理展開のスムーズさ
9. 感情への訴求
10. ナレッジ一貫性

## エラーハンドリング

- **AI API利用不可**: フォールバックスコア（50点）を返却
- **JSON解析エラー**: エラーログ出力、再試行メッセージ
- **個別専門家エラー**: 他の専門家は継続実行
- **並列実行エラー**: `asyncio.gather(return_exceptions=True)`でハンドリング

## パフォーマンス

- **並列実行**: 5人の専門家が同時並列でレビュー
- **予想処理時間**: 5-15秒（AI APIレスポンス時間に依存）
- **最大トークン数**: 各専門家2048トークン

## 環境変数

以下のAPI Keyが必要:

```bash
ANTHROPIC_API_KEY=your-claude-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## 次のステップ

### Phase 2（将来実装）
- [ ] Central DB連携（スコア履歴保存）
- [ ] 採用台本の自動保存
- [ ] 改善パターンの学習
- [ ] 類似度計算（成功事例との比較）
- [ ] 過去の自分との比較グラフ

### Phase 3（オプション）
- [ ] 改善版台本の統合生成（Claude/Geminiで最終版を作成）
- [ ] 演出提案の自動適用
- [ ] タイムライン警告の詳細分析

## テスト

テストファイル: `backend/test_expert_review.py`

```bash
# Python 3.11+が必要
cd backend
python3 test_expert_review.py
```

## ログ

```python
import logging
logger = logging.getLogger(__name__)

# レビュー開始ログ
logger.info(f"専門家レビュー開始: script_id={request.script_id}")

# 個別専門家エラーログ
logger.error(f"{expert_type}のレビューエラー: {e}")

# レビュー完了ログ
logger.info(f"専門家レビュー完了: {processing_time_ms}ms, スコア={overall_score}")
```

## まとめ

✅ **実装完了**
- 5人の専門家による台本添削機能
- Claude/Gemini API連携
- 並列実行による高速化
- スコア計算・チェックリスト・公開判定
- エラーハンドリング

✅ **エンドポイント**
- `POST /api/v1/scripts/expert-review`

✅ **使用可能**
- フロントエンドから即座に呼び出し可能
- API Key設定のみで動作

---

**実装日**: 2025-12-17
**実装者**: Claude Sonnet 4.5
