# 外部APIキー取得・設定ガイド

Creator Studio AIで使用する全ての外部サービスのAPIキー取得方法と設定手順をまとめたドキュメントです。

**最終更新日**: 2025-12-17

---

## 目次

1. [AI生成API](#ai生成api)
   - [Claude API (Anthropic)](#claude-api-anthropic)
   - [Gemini API (Google)](#gemini-api-google)
   - [OpenAI API](#openai-api)
2. [動画制作API](#動画制作api)
   - [HeyGen API](#heygen-api)
   - [MiniMax Audio API](#minimax-audio-api)
   - [Nano Banana Pro API](#nano-banana-pro-api)
3. [YouTube関連API](#youtube関連api)
   - [YouTube Data API v3](#youtube-data-api-v3)
   - [YouTube Analytics API](#youtube-analytics-api)
   - [Social Blade API](#social-blade-api)
4. [その他のAPI](#その他のapi)
   - [SerpAPI](#serpapi)
   - [Amazon Product Advertising API](#amazon-product-advertising-api)
5. [環境変数設定](#環境変数設定)
6. [APIキーテスト方法](#apiキーテスト方法)

---

## AI生成API

### Claude API (Anthropic)

#### サービス概要
- **用途**: 台本生成パターンA、トレンド分析、専門家レビュー、ナレッジチャットボット
- **モデル**: Claude 3.5 Sonnet, Claude 3 Opus など
- **特徴**: 長文生成、論理的思考、日本語対応が優秀

#### 料金プラン
- **従量課金制**: 入力トークン $3/百万トークン、出力トークン $15/百万トークン (Claude 3.5 Sonnet)
- **無料枠**: なし
- **月額プラン**: なし（API Creditsの事前購入が可能）

#### APIキー取得手順

1. **Anthropicアカウント作成**
   - [https://console.anthropic.com/](https://console.anthropic.com/) にアクセス
   - 「Sign Up」をクリック
   - メールアドレスとパスワードを入力して登録

2. **支払い情報登録**
   - ダッシュボードにログイン後、「Billing」セクションへ移動
   - クレジットカード情報を登録
   - 初回は$5以上のクレジット購入が推奨

3. **APIキー発行**
   - ダッシュボード左メニューから「API Keys」を選択
   - 「Create Key」ボタンをクリック
   - キー名を入力（例: `creator-studio-production`）
   - 生成されたAPIキーをコピー（一度しか表示されないため注意）

4. **使用制限設定（推奨）**
   - 「Settings」→「API Limits」で月間使用上限を設定可能
   - 予期しない高額請求を防ぐため、初期は低めに設定

#### 環境変数名
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

#### テスト方法
```bash
cd backend
python -c "
from anthropic import Anthropic
client = Anthropic(api_key='YOUR_API_KEY')
response = client.messages.create(
    model='claude-3-5-sonnet-20241022',
    max_tokens=100,
    messages=[{'role': 'user', 'content': 'こんにちは'}]
)
print(response.content[0].text)
"
```

---

### Gemini API (Google)

#### サービス概要
- **用途**: 台本生成パターンB、コメント返信生成
- **モデル**: Gemini 1.5 Pro, Gemini 1.5 Flash など
- **特徴**: 大容量コンテキスト（最大2M トークン）、画像・動画理解

#### 料金プラン
- **無料枠**:
  - Gemini 1.5 Flash: 1,500リクエスト/日、150万トークン/日
  - Gemini 1.5 Pro: 50リクエスト/日、200万トークン/日
- **有料プラン**: $0.075/百万入力トークン、$0.30/百万出力トークン (Gemini 1.5 Flash)

#### APIキー取得手順

1. **Google Cloud プロジェクト作成**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/) にアクセス
   - Google アカウントでログイン
   - 画面上部の「プロジェクトを選択」→「新しいプロジェクト」
   - プロジェクト名（例: `creator-studio-ai`）を入力して作成

2. **Gemini API有効化**
   - 左メニュー「APIとサービス」→「ライブラリ」
   - 検索バーに「Generative Language API」を入力
   - 「Generative Language API」を選択して「有効にする」

3. **APIキー発行**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」を選択
   - 生成されたAPIキーをコピー
   - **セキュリティ対策**: 「キーを編集」→「APIの制限」で「Generative Language API」のみに制限を設定

4. **または Google AI Studio で簡易取得**
   - [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) にアクセス
   - 「Get API Key」→「Create API key in new project」
   - 自動でプロジェクトが作成され、APIキーが発行される

#### 環境変数名
```
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXX
```

#### テスト方法
```bash
cd backend
python -c "
import google.generativeai as genai
genai.configure(api_key='YOUR_API_KEY')
model = genai.GenerativeModel('gemini-1.5-flash')
response = model.generate_content('こんにちは')
print(response.text)
"
```

---

### OpenAI API

#### サービス概要
- **用途**: Embedding生成（text-embedding-3-large）、RAG用ベクトル検索
- **モデル**: text-embedding-3-large, text-embedding-3-small
- **特徴**: 高精度な意味ベクトル生成、ナレッジDB検索に使用

#### 料金プラン
- **従量課金制**: $0.13/百万トークン (text-embedding-3-large)
- **無料枠**: 新規登録で$5クレジット（3ヶ月有効）
- **月額プラン**: なし

#### APIキー取得手順

1. **OpenAIアカウント作成**
   - [https://platform.openai.com/signup](https://platform.openai.com/signup) にアクセス
   - メールアドレスまたはGoogleアカウントで登録

2. **電話番号認証**
   - アカウント設定から電話番号を登録
   - SMS認証コードを入力

3. **支払い情報登録**
   - 左メニュー「Billing」→「Payment methods」
   - クレジットカード情報を登録
   - 初回は$5以上のチャージが推奨

4. **APIキー発行**
   - 左メニュー「API keys」を選択
   - 「Create new secret key」をクリック
   - キー名を入力（例: `creator-studio-embeddings`）
   - 生成されたAPIキーをコピー（一度しか表示されない）

5. **使用制限設定（推奨）**
   - 「Billing」→「Usage limits」で月間上限を設定

#### 環境変数名
```
OPENAI_API_KEY=sk-proj-xxxxx
```

#### テスト方法
```bash
cd backend
python -c "
from openai import OpenAI
client = OpenAI(api_key='YOUR_API_KEY')
response = client.embeddings.create(
    input='テストテキスト',
    model='text-embedding-3-large'
)
print(f'Embedding次元数: {len(response.data[0].embedding)}')
"
```

---

## 動画制作API

### HeyGen API

#### サービス概要
- **用途**: AIアバター動画生成（トーキングヘッド）
- **機能**: カスタムアバター、多言語対応、リップシンク
- **特徴**: 高品質なアバター動画、日本語音声対応

#### 料金プラン
- **Creator Plan**: $29/月（5分の動画生成/月）
- **Business Plan**: $89/月（30分の動画生成/月）
- **Enterprise Plan**: カスタム価格
- **API従量課金**: 別途見積もり

#### APIキー取得手順

1. **HeyGenアカウント作成**
   - [https://app.heygen.com/](https://app.heygen.com/) にアクセス
   - 「Sign Up」からアカウント登録
   - メール認証を完了

2. **プラン選択**
   - ダッシュボードで「Upgrade」を選択
   - Business Plan以上を選択（API利用に必要）

3. **API Access申請**
   - ダッシュボード右上のユーザーアイコン→「Settings」
   - 「API」タブを選択
   - 「Request API Access」ボタンをクリック
   - 用途を記入して送信（通常1-2営業日で承認）

4. **APIキー取得**
   - API Accessが承認されると「API Keys」セクションが表示される
   - 「Generate New Key」をクリック
   - キー名を入力してAPIキーを生成
   - 生成されたAPIキーをコピー

5. **Webhook設定（任意）**
   - 動画生成完了時の通知を受け取る場合、Webhook URLを設定

#### 環境変数名
```
HEYGEN_API_KEY=xxxxxxxxxxxxxxxx
```

#### テスト方法
```bash
cd backend
python -c "
import requests
headers = {'X-Api-Key': 'YOUR_API_KEY'}
response = requests.get('https://api.heygen.com/v1/avatar.list', headers=headers)
print(response.json())
"
```

---

### MiniMax Audio API

#### サービス概要
- **用途**: ボイスクローン、TTS（Text-to-Speech）
- **機能**: カスタム音声クローン、多言語対応、感情表現
- **特徴**: 高品質な日本語音声、低レイテンシ

#### 料金プラン
- **従量課金制**: 音声生成時間に応じた課金（詳細は要問い合わせ）
- **無料枠**: トライアル期間あり

#### APIキー取得手順

1. **MiniMaxアカウント作成**
   - [https://www.minimax.chat/](https://www.minimax.chat/) にアクセス
   - 右上の「登録」ボタンをクリック
   - メールアドレスまたは携帯電話番号で登録

2. **本人確認**
   - アカウント設定から本人確認（中国国内ユーザーは身分証、海外ユーザーはパスポート）
   - 企業利用の場合は企業情報も登録

3. **API利用申請**
   - ダッシュボードから「API管理」を選択
   - 「API申請」ボタンをクリック
   - 用途、月間予想使用量を記入して送信

4. **APIキー発行**
   - API申請が承認されると「APIキー管理」が表示される
   - 「新しいキーを作成」をクリック
   - キー名を入力してAPIキーとSecret Keyを生成
   - 両方をコピー（Secret Keyは一度しか表示されない）

5. **音声サンプル登録（ボイスクローン用）**
   - 「音声管理」から音声サンプルをアップロード
   - 10秒以上の高音質音声が推奨
   - 登録完了後、voice_idが発行される

#### 環境変数名
```
MINIMAX_API_KEY=xxxxxxxxxxxxxxxx
MINIMAX_SECRET_KEY=xxxxxxxxxxxxxxxx
MINIMAX_VOICE_ID=xxxxxxxxxxxxxxxx  # ボイスクローン用
```

#### テスト方法
```bash
cd backend
python -c "
import requests
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'X-Secret-Key': 'YOUR_SECRET_KEY'
}
data = {
    'text': 'こんにちは、テストです。',
    'voice_id': 'YOUR_VOICE_ID'
}
response = requests.post('https://api.minimax.chat/v1/audio/generate', headers=headers, json=data)
print(response.status_code)
"
```

---

### Nano Banana Pro API

#### サービス概要
- **用途**: サムネイル画像生成
- **機能**: テキストから画像生成、スタイル指定
- **特徴**: YouTube最適化、高解像度出力

#### 料金プラン
- **詳細は公式サイトを確認**（情報が限定的なため）

#### APIキー取得手順

**注意**: Nano Banana Proは情報が限定的です。以下は一般的な画像生成APIの手順です。

1. **公式サイト確認**
   - Nano Banana Proの公式サイトまたはドキュメントにアクセス
   - API利用可能か確認

2. **代替案: Stability AI / DALL-E / Midjourney API**
   - より安定したサービスの利用を検討
   - 各サービスのAPI取得手順に従う

#### 環境変数名
```
NANO_BANANA_API_KEY=xxxxxxxxxxxxxxxx
```

#### テスト方法
```bash
# 代替案としてStability AIの例
cd backend
python -c "
import requests
headers = {'Authorization': 'Bearer YOUR_API_KEY'}
data = {
    'text_prompts': [{'text': 'YouTube thumbnail, bold text, eye-catching'}],
    'cfg_scale': 7,
    'height': 720,
    'width': 1280
}
response = requests.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', headers=headers, json=data)
print(response.status_code)
"
```

---

## YouTube関連API

### YouTube Data API v3

#### サービス概要
- **用途**: 競合チャンネル調査、動画検索、メタデータ取得
- **機能**: 動画情報、チャンネル情報、検索、コメント取得
- **特徴**: 無料で利用可能（制限あり）

#### 料金プラン
- **無料枠**: 10,000 units/日
  - 検索: 100 units/回
  - 動画詳細: 1 unit/回
  - チャンネル詳細: 1 unit/回
- **超過時**: 追加クォータの購入が可能（要申請）

#### APIキー取得手順

1. **Google Cloud プロジェクト作成**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/) にアクセス
   - 新しいプロジェクトを作成（または既存のGemini用プロジェクトを使用）

2. **YouTube Data API v3 有効化**
   - 左メニュー「APIとサービス」→「ライブラリ」
   - 検索バーに「YouTube Data API v3」を入力
   - 「YouTube Data API v3」を選択して「有効にする」

3. **APIキー発行**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」を選択
   - 生成されたAPIキーをコピー

4. **APIキー制限設定（推奨）**
   - 「キーを編集」をクリック
   - 「APIの制限」で「YouTube Data API v3」のみに制限
   - 「HTTPリファラー」または「IPアドレス」で使用元を制限

5. **クォータ確認**
   - 「APIとサービス」→「ダッシュボード」→「YouTube Data API v3」
   - 使用状況をモニタリング可能

#### 環境変数名
```
YOUTUBE_API_KEY=AIzaSyXXXXX
```

#### テスト方法
```bash
cd backend
python -c "
import requests
params = {
    'part': 'snippet',
    'q': 'Python tutorial',
    'maxResults': 5,
    'key': 'YOUR_API_KEY'
}
response = requests.get('https://www.googleapis.com/youtube/v3/search', params=params)
print(response.json()['items'][0]['snippet']['title'])
"
```

---

### YouTube Analytics API

#### サービス概要
- **用途**: 自チャンネルの詳細分析データ取得
- **機能**: 視聴時間、視聴者維持率、トラフィックソース、収益データ
- **認証**: OAuth 2.0（ユーザー認証必須）

#### 料金プラン
- **無料**: YouTube Data API v3のクォータとは別枠
- **制限**: 自分が管理するチャンネルのデータのみ取得可能

#### APIキー取得手順（OAuth 2.0）

1. **Google Cloud プロジェクト作成**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/) にアクセス
   - 既存のYouTube Data API用プロジェクトを使用

2. **YouTube Analytics API 有効化**
   - 左メニュー「APIとサービス」→「ライブラリ」
   - 「YouTube Analytics API」を検索して有効化

3. **OAuth 2.0 クライアントID作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「OAuthクライアントID」
   - 「同意画面を構成」が未設定の場合、先に設定
     - ユーザータイプ: 外部
     - アプリ名: Creator Studio AI
     - サポートメール: 自分のメール
     - スコープ: `https://www.googleapis.com/auth/youtube.readonly`, `https://www.googleapis.com/auth/yt-analytics.readonly`
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクトURI: `http://localhost:8000/api/auth/google/callback`（開発時）、`https://your-domain.com/api/auth/google/callback`（本番）
   - クライアントIDとクライアントシークレットをコピー

4. **テストユーザー追加（開発時）**
   - 「OAuth同意画面」→「テストユーザー」
   - 自分のGoogleアカウントを追加

5. **本番公開（リリース時）**
   - 「OAuth同意画面」→「アプリを公開」
   - Google の審査を受ける（YouTube Scopeは審査必須）

#### 環境変数名
```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

#### テスト方法
```bash
# OAuth フローを実装後、アクセストークンを取得してテスト
cd backend
python -c "
import requests
headers = {'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}
params = {
    'ids': 'channel==YOUR_CHANNEL_ID',
    'startDate': '2024-01-01',
    'endDate': '2024-12-31',
    'metrics': 'views,estimatedMinutesWatched',
    'dimensions': 'day'
}
response = requests.get('https://youtubeanalytics.googleapis.com/v2/reports', headers=headers, params=params)
print(response.json())
"
```

---

### Social Blade API

#### サービス概要
- **用途**: 競合チャンネルの履歴データ（登録者数推移、動画投稿頻度）
- **機能**: チャンネル統計、ランキング、推定収益
- **特徴**: YouTube公式APIでは取得できない履歴データ

#### 料金プラン
- **無料プラン**: なし
- **有料API**: $299/月〜（詳細は要問い合わせ）
- **代替手段**: Web スクレイピング（利用規約注意）

#### APIキー取得手順

1. **Social Bladeアカウント作成**
   - [https://socialblade.com/](https://socialblade.com/) にアクセス
   - 右上の「Sign Up」からアカウント登録

2. **API利用申請**
   - ログイン後、ダッシュボードから「API Access」を選択
   - 「Request API Access」ボタンをクリック
   - 用途、月間予想リクエスト数を記入
   - 支払いプランを選択

3. **APIキー発行**
   - API申請が承認されると「API Keys」が表示される
   - 「Generate API Key」をクリック
   - 生成されたAPIキーをコピー

4. **ドキュメント確認**
   - [https://socialblade.com/api-documentation](https://socialblade.com/api-documentation) でエンドポイントを確認

#### 環境変数名
```
SOCIAL_BLADE_API_KEY=xxxxxxxxxxxxxxxx
```

#### テスト方法
```bash
cd backend
python -c "
import requests
headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get('https://api.socialblade.com/v1/youtube/channel/UCxxxxxx', headers=headers)
print(response.json())
"
```

---

## その他のAPI

### SerpAPI

#### サービス概要
- **用途**: Google検索結果取得、トレンド分析、キーワード調査
- **機能**: Google検索、YouTube検索、ニュース検索、ショッピング検索
- **特徴**: 構造化されたJSON形式でデータ取得

#### 料金プラン
- **無料プラン**: 100検索/月
- **Developer Plan**: $50/月（5,000検索）
- **Production Plan**: $150/月（20,000検索）
- **Enterprise Plan**: カスタム価格

#### APIキー取得手順

1. **SerpAPIアカウント作成**
   - [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up) にアクセス
   - メールアドレスとパスワードで登録
   - メール認証を完了

2. **APIキー確認**
   - ログイン後、ダッシュボードに自動でAPIキーが表示される
   - 「Your Secret API Key」セクションからコピー

3. **プラン選択**
   - 無料プランで開始可能
   - 使用量に応じて「Billing」からアップグレード

4. **使用量確認**
   - ダッシュボードで月間使用量をリアルタイム確認可能

#### 環境変数名
```
SERP_API_KEY=xxxxxxxxxxxxxxxx
```

#### テスト方法
```bash
cd backend
python -c "
import requests
params = {
    'engine': 'google',
    'q': 'Python programming',
    'api_key': 'YOUR_API_KEY'
}
response = requests.get('https://serpapi.com/search', params=params)
print(response.json()['organic_results'][0]['title'])
"
```

---

### Amazon Product Advertising API

#### サービス概要
- **用途**: 書籍ランキング取得、レビューデータ分析（企画リサーチ）
- **機能**: 商品検索、ランキング、レビュー、価格情報
- **特徴**: Amazon公式API、アフィリエイト連携可能

#### 料金プラン
- **無料**: Amazonアソシエイトプログラム参加者は無料で利用可能
- **制限**: APIリクエストには売上実績が必要（初期は1日あたり8,640リクエスト）

#### APIキー取得手順

1. **Amazonアソシエイトプログラム登録**
   - [https://affiliate.amazon.co.jp/](https://affiliate.amazon.co.jp/) にアクセス
   - 「今すぐ登録」からアカウント登録
   - ウェブサイトまたはモバイルアプリの情報を入力
   - 審査を待つ（通常1-2日、初回売上発生後に本審査）

2. **Product Advertising API アクセス申請**
   - アソシエイトセントラルにログイン
   - 「ツール」→「Product Advertising API」を選択
   - 利用規約に同意して申請

3. **アクセスキー取得**
   - 申請が承認されると「認証情報の管理」ページが表示される
   - 「アクセスキーID」と「シークレットアクセスキー」を確認
   - 「アソシエイトタグ」も取得（トラッキング用）

4. **APIドキュメント確認**
   - [https://webservices.amazon.co.jp/paapi5/documentation/](https://webservices.amazon.co.jp/paapi5/documentation/) でPA-API 5.0の仕様を確認

#### 環境変数名
```
AMAZON_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
AMAZON_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_ASSOCIATE_TAG=your-associate-tag-22
```

#### テスト方法
```bash
cd backend
python -c "
from amazon_paapi import AmazonAPI
api = AmazonAPI('ACCESS_KEY', 'SECRET_KEY', 'ASSOCIATE_TAG', 'JP')
result = api.search_items(keywords='Python プログラミング')
print(result.items[0].item_info.title.display_value)
"
```

---

## 環境変数設定

### backend/.env

すべてのAPIキーを以下の形式で設定してください。

```bash
# ========================================
# AI生成API
# ========================================

# Claude API (Anthropic) - 必須
# 用途: 台本生成、トレンド分析、専門家レビュー
# 取得: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Gemini API (Google) - 必須
# 用途: 台本生成、コメント返信
# 取得: https://makersuite.google.com/
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXX

# OpenAI API - 必須（Embedding用）
# 用途: ナレッジDB用ベクトル検索
# 取得: https://platform.openai.com/
OPENAI_API_KEY=sk-proj-xxxxx

# ========================================
# 動画制作API
# ========================================

# HeyGen API - 必須
# 用途: AIアバター動画生成
# 取得: https://app.heygen.com/
HEYGEN_API_KEY=xxxxxxxxxxxxxxxx

# MiniMax Audio API - 必須
# 用途: ボイスクローン、TTS
# 取得: https://www.minimax.chat/
MINIMAX_API_KEY=xxxxxxxxxxxxxxxx
MINIMAX_SECRET_KEY=xxxxxxxxxxxxxxxx
MINIMAX_VOICE_ID=xxxxxxxxxxxxxxxx

# Nano Banana Pro API - オプション
# 用途: サムネイル生成
NANO_BANANA_API_KEY=xxxxxxxxxxxxxxxx

# ========================================
# YouTube関連API
# ========================================

# YouTube Data API v3 - 必須
# 用途: 競合調査、動画検索
# 取得: https://console.cloud.google.com/
YOUTUBE_API_KEY=AIzaSyXXXXX

# YouTube Analytics API (OAuth) - 必須
# 用途: 自チャンネル分析
# 取得: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Social Blade API - オプション
# 用途: 競合履歴データ
# 取得: https://socialblade.com/
SOCIAL_BLADE_API_KEY=xxxxxxxxxxxxxxxx

# ========================================
# その他のAPI
# ========================================

# SerpAPI - 必須
# 用途: Google検索トレンド、キーワード調査
# 取得: https://serpapi.com/
SERP_API_KEY=xxxxxxxxxxxxxxxx

# Amazon Product Advertising API - オプション
# 用途: 書籍ランキング、レビュー分析
# 取得: https://affiliate.amazon.co.jp/
AMAZON_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
AMAZON_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_ASSOCIATE_TAG=your-tag-22

# ========================================
# データベース・インフラ
# ========================================

# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS_PATH=/path/to/credentials.json

# ========================================
# その他
# ========================================

# JWT Secret
SECRET_KEY=your-secret-key-here

# Environment
ENVIRONMENT=development
```

### frontend/.env

```bash
# API Base URL
VITE_API_URL=http://localhost:8000

# Google OAuth (フロントエンド用)
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

---

## APIキーテスト方法

### 一括テストスクリプト

すべてのAPIキーの有効性を一括でテストできるスクリプトを用意します。

```bash
cd backend
python -m app.services.api_key_validator
```

**期待される出力例**:
```
✅ Claude API: OK
✅ Gemini API: OK
✅ OpenAI API: OK
✅ HeyGen API: OK
⚠️  MiniMax API: Not configured
❌ Social Blade API: Invalid API key
✅ YouTube Data API: OK
✅ SerpAPI: OK
⚠️  Amazon PA-API: Not configured

Summary: 6 OK, 2 Not configured, 1 Error
```

### ヘルスチェックエンドポイント

サーバー起動後、以下のエンドポイントで各APIの接続状態を確認できます。

```bash
curl http://localhost:8000/api/v1/health
```

**期待される出力例**:
```json
{
  "status": "healthy",
  "services": {
    "claude_api": {"status": "ok", "latency_ms": 120},
    "gemini_api": {"status": "ok", "latency_ms": 95},
    "openai_api": {"status": "ok", "latency_ms": 80},
    "heygen_api": {"status": "ok", "latency_ms": 250},
    "minimax_api": {"status": "not_configured"},
    "youtube_api": {"status": "ok", "latency_ms": 150},
    "serp_api": {"status": "ok", "latency_ms": 300},
    "database": {"status": "ok", "latency_ms": 5},
    "redis": {"status": "ok", "latency_ms": 2}
  }
}
```

---

## トラブルシューティング

### よくあるエラー

#### 1. `401 Unauthorized` エラー
- **原因**: APIキーが無効または期限切れ
- **解決策**:
  - APIキーを再発行
  - 環境変数が正しく設定されているか確認
  - `.env`ファイルが読み込まれているか確認

#### 2. `403 Forbidden` エラー
- **原因**: APIキーに権限がない、またはIPアドレス制限
- **解決策**:
  - API管理画面で権限を確認
  - IPアドレス制限を解除または追加

#### 3. `429 Too Many Requests` エラー
- **原因**: レート制限に達した
- **解決策**:
  - リクエスト間隔を空ける
  - 有料プランにアップグレード

#### 4. `SSL/TLS` エラー
- **原因**: 証明書検証エラー
- **解決策**:
  - Python: `requests.get(url, verify=True)`を確認
  - システム証明書を更新: `pip install --upgrade certifi`

---

## セキュリティベストプラクティス

1. **APIキーの管理**
   - `.env`ファイルは`.gitignore`に追加
   - 本番環境では環境変数またはSecret Managerを使用
   - APIキーは定期的にローテーション

2. **権限の最小化**
   - 必要最小限の権限のみを付与
   - API制限（リファラー、IPアドレス）を設定

3. **監視とアラート**
   - 異常なAPI使用量を検知
   - エラー率の監視
   - コスト上限の設定

4. **バックアップ**
   - 複数のAPIプロバイダーを用意（フォールバック）
   - APIキーのバックアップを安全に保管

---

## 付録: API優先順位

### 必須（システム起動に必要）
- ✅ Claude API
- ✅ Gemini API
- ✅ OpenAI API
- ✅ YouTube Data API v3
- ✅ Google OAuth (YouTube Analytics)
- ✅ SerpAPI

### 推奨（主要機能に必要）
- ⭐ HeyGen API
- ⭐ MiniMax Audio API

### オプション（追加機能）
- 🔹 Social Blade API
- 🔹 Amazon PA-API
- 🔹 Nano Banana Pro API

---

**作成日**: 2025-12-17
**バージョン**: 1.0
**メンテナー**: Creator Studio AI 開発チーム
