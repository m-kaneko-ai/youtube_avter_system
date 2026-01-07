# Human-First AIスタッフ MCPサーバー

金子式・人間中心AI増幅システムの5人のAIスタッフを
Claude Desktop / Claude Code から利用可能にするMCPサーバー

**Central DB連携対応** - 全エージェントがPostgreSQL + pgvectorによるRAG検索でナレッジを参照

## 5人のAIスタッフ

| エージェント | ツール名 | 役割 | Central DB参照 |
|-------------|---------|------|---------------|
| サチコ | `sachiko_respond` | 秘書・FAQ対応 | FAQ質問パターン |
| ケンジ | `kenji_research` | リサーチ・調査 | 全カテゴリRAG検索 |
| ユウタ | `yuta_create` | 台本・コンテンツ作成 | メソッド・コンテンツ・質問 |
| マコト | `makoto_check` | 品質・倫理チェック | HSP配慮ガイドライン |
| ナオミ | `naomi_analyze` | 分析・顧客育成 | 育成メソッド・ビジネスインサイト |

## Central DB連携

全エージェントはCentral DB（PostgreSQL + pgvector）からナレッジを取得します。

### ナレッジカテゴリ

| カテゴリ | 説明 | 使用エージェント |
|---------|------|-----------------|
| `methods` | 金子式メソッド・技法 | ケンジ・ユウタ・マコト・ナオミ |
| `questions` | FAQ・質問パターン | サチコ・ケンジ・ユウタ |
| `clients` | 顧客情報 | ケンジ・ナオミ |
| `business` | 営業・ビジネスインサイト | ケンジ・ナオミ |
| `content` | コンテンツ・台本 | ケンジ・ユウタ・マコト |
| `tech` | 技術ドキュメント | ケンジ |

### RAG検索の仕組み

1. クエリをOpenAI `text-embedding-3-small` でベクトル化
2. pgvectorで類似度検索（コサイン類似度）
3. 関連ナレッジを取得してコンテキストに追加

## セットアップ

### 1. 依存関係のインストール

```bash
cd mcp-server
uv pip install -e .
```

または

```bash
uv pip install mcp pydantic psycopg openai
```

### 2. Central DB環境変数の設定

`~/.bluelamp/central-db.env` に以下を設定:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
OPENAI_API_KEY=sk-xxxx
```

### 3. Claude Desktop に追加

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "human-first-ai-staff": {
      "command": "/path/to/mcp-server/.venv/bin/python",
      "args": ["/path/to/mcp-server/server.py"]
    }
  }
}
```

### 4. Claude Code に追加

プロジェクトルートに `.mcp.json` を作成:

```json
{
  "mcpServers": {
    "human-first-ai-staff": {
      "command": "mcp-server/.venv/bin/python",
      "args": ["mcp-server/server.py"]
    }
  }
}
```

### 5. Claude Desktop / Claude Code を再起動

## 使い方

### サチコ（秘書）に質問対応を依頼

```
sachiko_respond ツールを使って、以下のメッセージに返信してください：
「講座の視聴方法がわかりません」
use_knowledge=True で関連FAQも参照して。
```

### ケンジ（リサーチ）にナレッジ検索を依頼

```
kenji_research ツールで「自己肯定感」についてナレッジ検索してください。
research_type は "knowledge" で、category は "methods" で。
```

### ケンジ（リサーチ）にカテゴリ一覧を取得

```
kenji_research ツールでカテゴリ一覧を取得してください。
research_type は "categories" で。
```

### ユウタ（クリエイティブ）に台本を依頼

```
yuta_create ツールで「自己肯定感」についての台本下書きを作成してください。
use_knowledge=True でCentral DBからメソッドも参照して。
```

### マコト（品質）にチェックを依頼

```
makoto_check ツールで以下のコンテンツをチェックしてください：
「今すぐ行動しないと、絶対に後悔します！」
use_knowledge=True でHSPガイドラインも参照して。
```

### ナオミ（分析）に進捗分析を依頼

```
naomi_analyze ツールで顧客進捗を分析してください。
analysis_type は "progress" で、data には {"customer_name": "田中さん", "completion_rate": 45, "days_since_login": 10} を指定。
use_knowledge=True で育成メソッドも参照して。
```

## パラメータ一覧

### sachiko_respond

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| message | str | 必須 | お客様からのメッセージ |
| customer_name | str | "お客様" | お客様の名前 |
| tier | str | "free" | 顧客階層 (premium/standard/entry/line/free) |
| use_knowledge | bool | True | Central DBからナレッジを検索するか |

### kenji_research

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| query | str | 必須 | 調査クエリ |
| research_type | str | "general" | 調査種別 (competitor/trend/knowledge/categories/general) |
| category | str | "" | Central DB検索時のカテゴリ絞り込み |
| limit | int | 5 | 検索結果の最大件数 |

### yuta_create

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| topic | str | 必須 | コンテンツのトピック |
| content_type | str | "script" | コンテンツ種別 (script/hook/newsletter/thumbnail) |
| use_knowledge | bool | True | Central DBからナレッジを取得するか |

### makoto_check

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| content | str | 必須 | チェック対象のコンテンツ |
| check_types | str | "all" | チェック種別 (hsp/ethics/technical/transparency/all) |
| use_knowledge | bool | True | Central DBからガイドラインを取得するか |

### naomi_analyze

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| analysis_type | str | "progress" | 分析種別 (video/progress/churn/monthly) |
| data | str | "{}" | 分析対象データ (JSON文字列) |
| use_knowledge | bool | True | Central DBからナレッジを取得するか |

## 階層別ルール

| 顧客階層 | AI対応範囲 |
|---------|-----------|
| Premium | AI完全禁止 |
| Standard | 下書きのみ、顧客接触禁止 |
| Entry | FAQ・推薦・進捗（透明性必須） |
| LINE/無料 | 全般（透明性必須） |

## 透明性機能

全てのAI出力には自動的に開示ラベルが付与されます：

```
AI秘書サチコ（Central DB参照）です

[回答内容]

【関連する質問パターン（参考）】
・質問パターン1
・質問パターン2

---
このメッセージはAI自動返信です
金子への直接相談はいつでもどうぞ
```

## 感情エスカレーション

感情的なキーワードを検出した場合、自動的にエスカレーションします：

- **高緊急**（自殺・自傷）→ 即座に対応を促す
- **中緊急**（辛い・悲しい）→ 48時間以内に金子さんが対応
- **低緊急**（不安・心配）→ 24時間以内に確認

## 開発者向け

### テスト実行

```bash
cd mcp-server
source .venv/bin/activate
python -c "
from server import kenji_research
print(kenji_research('自己肯定感', 'knowledge', 'methods', 3))
"
```

### Central DB接続テスト

```bash
python -c "
from server import central_db
categories = central_db.get_categories()
print(categories)
"
```

### ログ確認

MCPサーバーはstdio経由で通信するため、
ログは標準エラー出力に出力されます。
