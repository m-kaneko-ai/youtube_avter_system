# Google Cloud Storage 統合ガイド

## 概要

Creator Studio AIではGoogle Cloud Storage (GCS)を使用して音声ファイルと動画ファイルを保存します。

## 実装内容

### 1. GCSサービス (`backend/app/services/external/gcs_service.py`)

以下の機能を提供します:

- **音声ファイルのアップロード**: `upload_audio(audio_data, filename)`
- **動画ファイルのアップロード**: `upload_video(video_data, filename)`
- **Base64からのアップロード**: `upload_from_base64(base64_data, filename, content_type)`
- **署名付きURL生成**: `get_signed_url(blob_name, expiration)`
- **ファイル削除**: `delete_file(blob_name)`

### 2. フォールバック機能

GCSが設定されていない場合、自動的にローカルファイルシステムにフォールバックします:

- **保存先**: `/tmp/creator_studio_storage/`
- **URL形式**: `file:///tmp/creator_studio_storage/audio/...`

### 3. production_service.py との統合

`AudioService.generate_audio()` で音声生成後に自動的にGCSにアップロードされます:

```python
# MiniMax Audio APIから音声生成
result = await minimax_audio.text_to_speech(...)

# Base64データをGCSにアップロード
audio_url = await gcs_service.upload_from_base64(
    base64_data=result.get("audio_data"),
    filename=f"audio_{video_id}_{voice_id}.mp3",
    content_type="audio/mpeg",
)
```

## 環境変数設定

`.env.local` に以下の環境変数を追加してください:

```bash
# ===== Google Cloud Storage =====
# GCS バケット名（例: creator-studio-media）
GCS_BUCKET_NAME=your-bucket-name

# GCP プロジェクトID（例: creator-studio-prod）
GCS_PROJECT_ID=your-project-id

# サービスアカウントキーのパス（オプション）
# 設定しない場合はデフォルトの認証情報を使用
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## GCPセットアップ

### 1. GCSバケット作成

```bash
# GCPプロジェクト設定
gcloud config set project YOUR_PROJECT_ID

# バケット作成
gsutil mb -l asia-southeast1 gs://creator-studio-media

# バケットを公開に設定（オプション）
gsutil iam ch allUsers:objectViewer gs://creator-studio-media
```

### 2. サービスアカウント作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create creator-studio-api \
    --description="Creator Studio API Service Account" \
    --display-name="Creator Studio API"

# Storage Admin権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:creator-studio-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# キーファイル作成
gcloud iam service-accounts keys create ~/creator-studio-key.json \
    --iam-account=creator-studio-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. 環境変数設定

```bash
export GCS_BUCKET_NAME=creator-studio-media
export GCS_PROJECT_ID=YOUR_PROJECT_ID
export GOOGLE_APPLICATION_CREDENTIALS=~/creator-studio-key.json
```

## テスト

### 基本テスト

```bash
cd backend
python3 test_gcs_service.py
```

### 音声生成統合テスト

```bash
cd backend
python3 test_audio_gcs_simple.py
```

## 本番環境デプロイ

### Google Cloud Run の場合

環境変数を設定:

```bash
gcloud run services update creator-studio-api \
    --update-env-vars GCS_BUCKET_NAME=creator-studio-media \
    --update-env-vars GCS_PROJECT_ID=YOUR_PROJECT_ID
```

サービスアカウントを設定（推奨）:

```bash
gcloud run services update creator-studio-api \
    --service-account=creator-studio-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

これにより、`GOOGLE_APPLICATION_CREDENTIALS` が不要になります。

## セキュリティ

### バケット権限

- **推奨**: バケットは非公開に設定し、署名付きURLを使用
- **代替**: バケットを公開設定（`allUsers:objectViewer`）し、直接URLでアクセス

### ファイルURL形式

#### 公開バケットの場合
```
https://storage.googleapis.com/creator-studio-media/audio/{uuid}/{filename}.mp3
```

#### 非公開バケット + 署名付きURL
```python
signed_url = await gcs_service.get_signed_url(blob_name, expiration=3600)
# 有効期限: 1時間
```

## トラブルシューティング

### GCS利用可能性チェック

```python
from app.services.external.gcs_service import gcs_service

if gcs_service.is_available():
    print("GCS is configured and ready")
else:
    print("GCS is not configured, using local fallback")
```

### よくあるエラー

#### `google.auth.exceptions.DefaultCredentialsError`

**原因**: 認証情報が設定されていない

**解決**:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

#### `google.api_core.exceptions.Forbidden: 403`

**原因**: サービスアカウントに権限がない

**解決**: `roles/storage.admin` または `roles/storage.objectAdmin` を付与

#### `google.api_core.exceptions.NotFound: 404`

**原因**: バケットが存在しない

**解決**: バケットを作成するか、正しいバケット名を指定

## 依存関係

```txt
google-cloud-storage==2.14.0
```

## ファイル構造

```
backend/
├── app/
│   ├── services/
│   │   └── external/
│   │       ├── gcs_service.py          # GCS連携サービス
│   │       └── __init__.py             # エクスポート
│   └── services/
│       └── production_service.py       # AudioServiceでGCS使用
├── test_gcs_service.py                 # GCS基本テスト
├── test_audio_gcs_simple.py            # 音声生成統合テスト
└── docs/
    └── gcs-integration.md              # このファイル
```

## 参考リンク

- [Google Cloud Storage Python Client](https://cloud.google.com/python/docs/reference/storage/latest)
- [GCS 認証ガイド](https://cloud.google.com/docs/authentication/getting-started)
- [Cloud Run サービスアカウント](https://cloud.google.com/run/docs/securing/service-identity)
