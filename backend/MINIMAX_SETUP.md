# 🎙️ MiniMax Audio API クイックスタート

## 📋 必要なもの

- MiniMax APIキー（無料トライアルあり）

## 🚀 3ステップで開始

### 1️⃣ APIキーを取得

1. https://www.minimax.chat/ にアクセス
2. サインアップしてログイン
3. ダッシュボード > API Keys で新しいキーを作成
4. APIキーをコピー（一度しか表示されません！）

### 2️⃣ 環境変数に設定

`backend/.env.local` を開いて、以下の行を編集:

```bash
MINIMAX_API_KEY=your_api_key_here
```

↓

```bash
MINIMAX_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

### 3️⃣ テスト実行

```bash
cd backend
python3 test_minimax_api.py
```

✅ "All tests passed!" が表示されればOK！

## 💡 モックモード

APIキーがなくても大丈夫！自動的にモックモードで動作します。

- 実際のAPIを呼び出さずに動作確認可能
- 開発初期段階やテストに便利
- ダミー音声データを返す

## 📚 詳細ドキュメント

詳しいセットアップ方法やトラブルシューティングは以下を参照:

👉 [backend/docs/minimax-audio-setup.md](./docs/minimax-audio-setup.md)

## 🔧 基本的な使い方

```python
from app.services.external.minimax_api import minimax_audio

# テキストから音声生成
result = await minimax_audio.text_to_speech(
    text="こんにちは、Creator Studio AIです。",
    voice_id="male-qn-qingse",
    emotion="neutral"
)

if "error" not in result:
    audio_base64 = result["audio_data"]
    duration = result["duration"]
    print(f"✓ 生成成功！ ({duration}秒)")
```

## ❓ 問題が発生したら

1. `.env.local` が保存されているか確認
2. サーバーを再起動
3. `test_minimax_api.py` でエラーメッセージを確認
4. 詳細ドキュメントを参照

---

Happy coding! 🎉
