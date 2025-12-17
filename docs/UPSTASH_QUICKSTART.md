# Upstash Redis クイックセットアップ（5分）

## なぜUpstashが必要か

- **セッション管理**: ユーザーログイン状態の維持
- **キャッシュ**: APIレスポンスの高速化
- **Celeryタスクキュー**: バックグラウンドジョブ管理

---

## セットアップ手順

### ステップ1: アカウント作成（無料）

1. https://upstash.com/ にアクセス
2. 「Start for Free」をクリック
3. GitHubまたはGoogleアカウントでサインイン

---

### ステップ2: データベース作成

1. ダッシュボードで「Create Database」をクリック
2. 以下を入力:

| 項目 | 値 |
|-----|---|
| **Name** | `creator-studio-ai-prod` |
| **Type** | Regional |
| **Region** | `us-east-1`（または最寄り） |
| **TLS/SSL** | ✅ Enabled（必須） |

3. 「Create」をクリック

---

### ステップ3: 接続URLをコピー

1. 作成したデータベースをクリック
2. 「Details」タブで以下を確認:

```
🔗 TLS Endpoint: rediss://default:****@***.upstash.io:6379
```

⚠️ **重要**: `redis://`ではなく`rediss://`（TLS付き）を使用

---

### ステップ4: GitHub Secretsに登録

```
Secret名: REDIS_URL
値: rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

---

## 無料プラン制限

| 項目 | 制限 |
|-----|-----|
| 毎日のコマンド数 | 10,000 |
| データサイズ | 256MB |
| 帯域幅 | 50GB/月 |

💡 本番運用には十分な容量です。必要に応じて有料プラン（$10/月〜）に移行可能。

---

## 接続テスト

```python
import redis

r = redis.from_url("rediss://default:xxx@yyy.upstash.io:6379")
r.set("test", "hello")
print(r.get("test"))  # b'hello'
```

---

**所要時間**: 約5分
