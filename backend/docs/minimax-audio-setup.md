# MiniMax Audio API セットアップガイド

## 概要

MiniMax Audio APIは、高品質な音声合成（Text-to-Speech）とボイスクローニングを提供するサービスです。
Creator Studio AIでは、動画制作時のナレーション音声生成に使用します。

## 主な機能

- **Text-to-Speech（TTS）**: テキストから自然な音声を生成
- **ボイスクローン**: 音声サンプルから独自のボイスを作成
- **感情表現**: 7種類の感情（neutral, happy, sad, angry, fearful, disgusted, surprised）
- **高品質モデル**: speech-02-hd、speech-02-turbo など
- **日本語対応**: 日本語を含む多言語サポート

## APIキーの取得方法

### 1. MiniMaxアカウントの作成

1. [MiniMax公式サイト](https://www.minimax.chat/) にアクセス
2. 右上の「Sign Up」または「サインアップ」をクリック
3. メールアドレスとパスワードを入力して登録

### 2. APIキーの取得

1. ログイン後、ダッシュボードにアクセス
2. 左メニューから「API Keys」または「APIキー」を選択
3. 「Create New Key」または「新しいキーを作成」をクリック
4. APIキーが表示されるので、安全な場所にコピー

> **重要**: APIキーは一度しか表示されません。必ず安全な場所に保存してください。

### 3. 料金プラン

MiniMaxは従量課金制です。無料トライアルクレジットが提供される場合があります。

- 最新の料金情報は[公式サイト](https://www.minimax.chat/pricing)を確認してください
- クレジット残高は[ダッシュボード](https://www.minimax.chat/dashboard)で確認できます

## 環境変数の設定

### backend/.env.local に追加

```bash
# MiniMax Audio API
# https://www.minimax.chat/
MINIMAX_API_KEY=your_api_key_here
```

### 設定手順

1. `backend/.env.local` ファイルを開く
2. `MINIMAX_API_KEY=` の行を見つける
3. 取得したAPIキーを貼り付け

```bash
MINIMAX_API_KEY=sk-xxx...
```

4. ファイルを保存
5. バックエンドサーバーを再起動（ホットリロードが有効な場合は不要）

## 動作確認

### テストスクリプトの実行

```bash
cd backend
python3 test_minimax_api.py
```

### 成功時の出力例

```
============================================================
MiniMax Audio API Test Suite
============================================================

============================================================
TEST 1: API Availability Check
============================================================
✓ MINIMAX_API_KEY is set: sk-xxx...xxx
API Available: True

============================================================
TEST 2: Simple Text-to-Speech
============================================================
Text: こんにちは、MiniMax Audioのテストです。
Voice ID: male-qn-qingse
Model: speech-02-hd

Generating audio...
✓ Success!
  Duration: 2.50s
  Format: mp3
  Sample Rate: 32000 Hz
  Audio data length: 45678 bytes (base64)
  Audio data preview: SUQzBAAAAAAAAP/7kAAA...

...

Total: 5/5 tests passed

🎉 All tests passed!
```

## モックモード

APIキーが設定されていない場合、自動的に**モックモード**で動作します。

### モックモードの特徴

- 実際のAPIを呼び出さずに動作確認可能
- ダミーの音声データ（無音MP3）を返す
- エラーハンドリングや機能フローの確認に便利
- 開発初期段階での動作確認に最適

### モックモードの確認

```python
from app.services.external.minimax_api import minimax_audio

# モックモードかどうか確認
is_mock = minimax_audio.is_mock_mode()
print(f"Mock Mode: {is_mock}")  # True: モックモード、False: 実API
```

ログに以下のメッセージが表示されます:

```
WARNING:app.services.external.minimax_api:MiniMax Audio API: MOCK MODE (API key not set)
```

## API仕様

### エンドポイント

```
Base URL: https://api.minimaxi.chat/v1/t2a
```

### 主要なメソッド

#### 1. text_to_speech

テキストから音声を生成

```python
from app.services.external.minimax_api import minimax_audio

result = await minimax_audio.text_to_speech(
    text="こんにちは、MiniMax Audioのテストです。",
    voice_id="male-qn-qingse",
    model="speech-02-hd",
    speed=1.0,
    pitch=0.0,
    volume=1.0,
    emotion="neutral",
    output_format="mp3"
)

if "error" in result:
    print(f"Error: {result['error']}")
else:
    audio_base64 = result["audio_data"]
    duration = result["duration"]
    print(f"Success! Duration: {duration}s")
```

#### 2. list_voices

利用可能なボイス一覧を取得

```python
voices = await minimax_audio.list_voices()

for voice in voices:
    print(f"{voice['voice_id']}: {voice['name']} ({voice['language']})")
```

#### 3. clone_voice

音声サンプルからボイスクローンを作成

```python
with open("sample.mp3", "rb") as f:
    audio_data = f.read()

result = await minimax_audio.clone_voice(
    audio_data=audio_data,
    voice_name="My Custom Voice",
    description="カスタムボイスの説明"
)

if "error" in result:
    print(f"Error: {result['error']}")
else:
    voice_id = result["voice_id"]
    print(f"Voice cloned: {voice_id}")
```

## パラメータ範囲

| パラメータ | 範囲 | デフォルト | 説明 |
|-----------|------|-----------|------|
| speed | 0.5 〜 2.0 | 1.0 | 速度 |
| pitch | -12 〜 12 | 0.0 | ピッチ調整（半音単位） |
| volume | 0.1 〜 1.0 | 1.0 | 音量 |
| text | 最大10,000文字 | - | 読み上げテキスト |

範囲外の値は自動的にクランプされます。

## エラーハンドリング

### リトライ機能

- 最大3回まで自動リトライ
- レート制限（HTTP 429）時は `Retry-After` ヘッダーを考慮
- タイムアウトエラー時は指数バックオフ

### エラーレスポンス

```python
{
    "error": "詳細なエラーメッセージ"
}
```

### 一般的なエラー

| エラー | 原因 | 対処法 |
|-------|------|-------|
| `HTTP 401` | APIキーが無効 | APIキーを確認 |
| `HTTP 429` | レート制限 | しばらく待ってからリトライ |
| `HTTP 500` | サーバーエラー | 時間をおいてリトライ |
| `Timeout` | タイムアウト | ネットワーク接続を確認 |

## ログ出力

MiniMax APIクライアントは詳細なログを出力します:

```python
import logging

# ログレベルの設定
logging.basicConfig(level=logging.INFO)
```

### ログ例

```
INFO:app.services.external.minimax_api:MiniMax Audio API: REAL MODE
INFO:app.services.external.minimax_api:MiniMax API: Sending TTS request (attempt 1/3)
INFO:app.services.external.minimax_api:MiniMax API: TTS generation successful (duration: 2.50s)
```

## トラブルシューティング

### APIキーが認識されない

1. `.env.local` ファイルのパスを確認
2. ファイルの保存を確認
3. バックエンドサーバーを再起動
4. 環境変数が正しく読み込まれているか確認:

```bash
cd backend
python3 -c "from app.core.config import settings; print(settings.MINIMAX_API_KEY)"
```

### テストが失敗する

1. インターネット接続を確認
2. APIキーの有効期限を確認
3. クレジット残高を確認
4. ログを確認してエラーの詳細を確認

### 音声が生成されない

1. `audio_data` が空でないか確認
2. base64デコードが正しく行われているか確認
3. ログにエラーメッセージがないか確認

## 参考リンク

- [MiniMax公式サイト](https://www.minimax.chat/)
- [MiniMax API ドキュメント](https://platform.minimax.io/docs/api-reference/speech-t2a-intro)
- [MiniMaxダッシュボード](https://www.minimax.chat/dashboard)
- [料金プラン](https://www.minimax.chat/pricing)

## サポート

問題が解決しない場合:

1. MiniMax公式サポートに問い合わせ
2. [公式ドキュメント](https://platform.minimax.io/docs)を確認
3. Creator Studio AI開発チームに連絡

---

最終更新: 2025-12-17
