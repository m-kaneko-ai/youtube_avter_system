"""
本番環境設定モジュール

本番環境専用の設定値を定義します。
"""
from typing import List


class ProductionConfig:
    """本番環境設定クラス"""

    # ===== アプリケーション基本設定 =====
    DEBUG = False
    TESTING = False
    ENVIRONMENT = "production"

    # ===== CORS設定 =====
    # 本番環境では必ず本番ドメインのみを許可
    # localhost は絶対に含めない
    CORS_ORIGINS: List[str] = [
        "https://creator-studio-ai.vercel.app",
        # 追加の本番ドメインがあればここに記載
    ]
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    CORS_ALLOW_HEADERS = ["*"]

    # ===== ログ設定 =====
    LOG_LEVEL = "INFO"  # 本番: INFO, ステージング: DEBUG
    LOG_FORMAT = "json"  # Cloud Loggingと互換性のあるJSON形式

    # ===== セキュリティ設定 =====
    # JWT トークン有効期限
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    # セッション有効期限
    SESSION_EXPIRE_HOURS = 24

    # パスワードハッシュ設定
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_DIGIT = True
    PASSWORD_REQUIRE_SPECIAL = True

    # ===== データベース設定 =====
    # コネクションプール設定
    DB_POOL_SIZE = 10  # 最大接続数
    DB_MAX_OVERFLOW = 20  # プールを超えて作成できる接続数
    DB_POOL_TIMEOUT = 30  # 接続取得タイムアウト（秒）
    DB_POOL_RECYCLE = 3600  # 接続の再利用時間（秒）
    DB_POOL_PRE_PING = True  # 接続前にpingして有効性を確認

    # SSL/TLS設定
    DB_SSL_MODE = "require"  # PostgreSQL SSL必須

    # ===== Redis設定 =====
    REDIS_MAX_CONNECTIONS = 20
    REDIS_SOCKET_CONNECT_TIMEOUT = 5
    REDIS_SOCKET_TIMEOUT = 5
    REDIS_DECODE_RESPONSES = True

    # キャッシュTTL設定（秒）
    REDIS_CACHE_TTL = 3600  # 1時間
    REDIS_SESSION_TTL = 86400  # 24時間
    REDIS_RATE_LIMIT_TTL = 60  # 1分

    # ===== APIレート制限 =====
    # Tier 1: 認証済みユーザー
    RATE_LIMIT_AUTHENTICATED = "60/minute"  # 1分あたり60リクエスト
    # Tier 2: 未認証ユーザー
    RATE_LIMIT_ANONYMOUS = "10/minute"  # 1分あたり10リクエスト
    # Tier 3: AI生成エンドポイント
    RATE_LIMIT_AI_GENERATION = "10/hour"  # 1時間あたり10リクエスト

    # ===== Celeryタスク設定 =====
    CELERY_BROKER_CONNECTION_RETRY = True
    CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
    CELERY_BROKER_CONNECTION_MAX_RETRIES = 10
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = "Asia/Tokyo"
    CELERY_ENABLE_UTC = True

    # タスクタイムアウト設定（秒）
    CELERY_TASK_TIME_LIMIT = 600  # 10分
    CELERY_TASK_SOFT_TIME_LIMIT = 540  # 9分

    # ===== 外部API設定 =====
    # タイムアウト設定（秒）
    API_TIMEOUT = 30
    API_RETRY_COUNT = 3
    API_RETRY_DELAY = 1  # 秒

    # Claude API
    CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
    CLAUDE_MAX_TOKENS = 4096
    CLAUDE_TEMPERATURE = 0.7

    # Gemini API
    GEMINI_MODEL = "gemini-2.0-flash-exp"
    GEMINI_TEMPERATURE = 0.7
    GEMINI_TOP_P = 0.8
    GEMINI_TOP_K = 40

    # OpenAI API (Embedding)
    OPENAI_EMBEDDING_MODEL = "text-embedding-3-large"
    OPENAI_EMBEDDING_DIMENSIONS = 1536

    # HeyGen API
    HEYGEN_WEBHOOK_ENABLED = True

    # ===== ファイルストレージ設定 =====
    # Google Cloud Storage
    GCS_UPLOAD_MAX_SIZE = 100 * 1024 * 1024  # 100MB
    GCS_ALLOWED_EXTENSIONS = [
        # 画像
        "jpg", "jpeg", "png", "gif", "webp",
        # 動画
        "mp4", "mov", "avi", "webm",
        # 音声
        "mp3", "wav", "aac", "m4a",
        # ドキュメント
        "pdf", "txt", "docx", "xlsx",
    ]

    # ライフサイクルルール（日数）
    GCS_LIFECYCLE_DELETE_AFTER_DAYS = 90  # 90日後に自動削除

    # ===== モニタリング・アラート設定 =====
    # エラー通知設定
    ERROR_NOTIFICATION_ENABLED = True
    ERROR_NOTIFICATION_THRESHOLD = 5  # 5回以上エラーでSlack通知

    # パフォーマンス監視
    SLOW_API_THRESHOLD = 1.0  # 1秒以上のAPIはログ記録
    SLOW_DB_QUERY_THRESHOLD = 0.5  # 0.5秒以上のクエリはログ記録

    # ヘルスチェック
    HEALTH_CHECK_TIMEOUT = 5  # ヘルスチェックタイムアウト（秒）

    # ===== YouTube API設定 =====
    YOUTUBE_API_QUOTA_PER_DAY = 10000  # 1日あたりのクォータ
    YOUTUBE_API_RETRY_COUNT = 3

    # ===== SerpAPI設定 =====
    SERP_API_TIMEOUT = 10  # タイムアウト（秒）
    SERP_API_RETRY_COUNT = 2

    # ===== その他 =====
    # ページネーション
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # バッチ処理
    BATCH_SIZE = 100

    # タイムゾーン
    TIMEZONE = "Asia/Tokyo"

    # ===== フィーチャーフラグ =====
    FEATURE_YOUTUBE_ANALYTICS = True
    FEATURE_AI_AGENTS = True
    FEATURE_SOCIAL_BLADE = True
    FEATURE_THUMBNAIL_GENERATION = True
    FEATURE_VOICE_CLONE = True
    FEATURE_AVATAR_VIDEO = True


# 環境変数から設定を上書き（必要に応じて）
def get_production_config() -> ProductionConfig:
    """
    本番環境設定を取得

    環境変数から一部の設定を上書き可能にする
    """
    config = ProductionConfig()

    # 環境変数から上書き可能な設定例
    import os

    # ログレベル
    if log_level := os.getenv("LOG_LEVEL"):
        config.LOG_LEVEL = log_level

    # CORS設定
    if cors_origins := os.getenv("CORS_ORIGINS"):
        config.CORS_ORIGINS = [origin.strip() for origin in cors_origins.split(",")]

    # レート制限
    if rate_limit := os.getenv("RATE_LIMIT_AUTHENTICATED"):
        config.RATE_LIMIT_AUTHENTICATED = rate_limit

    return config
