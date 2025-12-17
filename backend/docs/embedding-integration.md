# OpenAI Embedding API統合ガイド

## 概要

このドキュメントでは、ナレッジのベクトル埋め込み生成にOpenAI Embedding APIを統合する方法を説明します。

## セットアップ

### 1. 環境変数設定

`.env.local`に以下を追加：

```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-large  # オプション（デフォルト値）
```

### 2. 依存パッケージインストール

```bash
pip install -r requirements.txt
```

## 使用方法

### 単一ナレッジの埋め込み生成

```python
from app.services.embedding_service import embedding_service
from app.core.database import async_session_maker

async def generate_embedding_example():
    async with async_session_maker() as db:
        knowledge = await embedding_service.update_knowledge_embedding(
            knowledge_id=knowledge_id,
            db=db
        )
        print(f"埋め込み生成完了: {len(knowledge.embedding)}次元")
```

### バッチ埋め込み生成

```python
from app.services.embedding_service import embedding_service
from app.core.database import async_session_maker

async def batch_generate_example():
    async with async_session_maker() as db:
        knowledge_ids = [id1, id2, id3, ...]
        success, failure, cost = await embedding_service.batch_update_embeddings(
            knowledge_ids=knowledge_ids,
            db=db
        )
        print(f"成功: {success}, 失敗: {failure}, コスト: ${cost:.6f}")
```

### 類似ナレッジ検索

```python
from app.services.embedding_service import embedding_service
from app.core.database import async_session_maker

async def search_example():
    async with async_session_maker() as db:
        results = await embedding_service.search_similar(
            query="起業したい人向けのサービス",
            db=db,
            client_id=client_id,  # オプション
            limit=5
        )
        for knowledge in results:
            print(f"- {knowledge.name}")
```

## 管理スクリプト

### 埋め込み統計表示

```bash
python scripts/regenerate_embeddings.py --stats
```

### 全ナレッジの埋め込み再生成（ドライラン）

```bash
python scripts/regenerate_embeddings.py --all --dry-run
```

### 全ナレッジの埋め込み再生成

```bash
python scripts/regenerate_embeddings.py --all
```

### 特定クライアントのナレッジのみ再生成

```bash
python scripts/regenerate_embeddings.py --all --client <client_id>
```

### 単一ナレッジの埋め込み再生成

```bash
python scripts/regenerate_embeddings.py --knowledge <knowledge_id>
```

## APIエンドポイント

### 埋め込み生成

```http
POST /api/v1/knowledges/{knowledge_id}/embedding
Authorization: Bearer <token>
```

レスポンス:
```json
{
  "id": "uuid",
  "name": "ナレッジ名",
  "embedding": [0.1, 0.2, ...],  // 1536次元
  ...
}
```

### ベクトル検索

```http
GET /api/v1/knowledges/search?query=検索クエリ&limit=5&client_id=<client_id>
Authorization: Bearer <token>
```

レスポンス:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ナレッジ名",
      ...
    }
  ],
  "total": 5
}
```

## フォールバック実装

`OPENAI_API_KEY`が設定されていない場合、自動的にフォールバック実装（ランダムシードベース）が使用されます。

- 開発環境では問題なく動作
- 本番環境ではOpenAI APIの使用を強く推奨
- フォールバック実装は決定的（同じテキスト → 同じ埋め込み）

## コスト見積もり

### トークン数推定

```python
from app.services.embedding_service import embedding_service

text = "ナレッジのテキスト..."
tokens = embedding_service.estimate_tokens(text)
print(f"推定トークン数: {tokens}")
```

### コスト推定

```python
from app.services.embedding_service import embedding_service

text = "ナレッジのテキスト..."
tokens, cost = embedding_service.estimate_cost(text)
print(f"推定トークン数: {tokens}, 推定コスト: ${cost:.6f}")
```

### 料金

- モデル: `text-embedding-3-large`
- 次元数: 1536
- 料金: **$0.00013 per 1K tokens**

参考: 10,000文字の日本語テキスト ≈ 3,333トークン ≈ $0.00043

## テスト

### ユニットテスト

```bash
cd backend
pytest tests/test_embedding_service.py -v
```

テスト内容:
- OpenAI APIモック
- フォールバック実装
- エラー時のフォールバック
- トークン数・コスト推定
- バッチ更新
- 類似検索

### 統合テスト

```bash
python scripts/test_embedding.py
```

## トラブルシューティング

### OpenAI APIキーが無効

```
OpenAI API error: Incorrect API key provided
```

→ `.env.local`の`OPENAI_API_KEY`を確認

### 次元数が1536でない

→ `OPENAI_EMBEDDING_MODEL`が`text-embedding-3-large`であることを確認

### フォールバックが使用される

```
OPENAI_API_KEY not set. Using fallback implementation.
```

→ 開発環境では問題なし。本番環境では`OPENAI_API_KEY`を設定

## 参考リンク

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [text-embedding-3-large Model Card](https://platform.openai.com/docs/models/embeddings)
