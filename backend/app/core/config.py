"""
アプリケーション設定モジュール

pydantic-settingsを使用した環境変数管理
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション設定クラス"""

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # 未定義の環境変数を無視（フロントエンド用のVITE_*等）
    )

    # ===== アプリケーション基本設定 =====
    NODE_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGIN: str = "http://localhost:5173"

    # ===== データベース =====
    DATABASE_URL: str

    # ===== Redis =====
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_CACHE_TTL: int = 3600  # デフォルトキャッシュTTL（秒）
    REDIS_MAX_CONNECTIONS: int = 20

    # ===== 認証システム =====
    JWT_SECRET: str
    SESSION_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # ===== AI生成サービス =====
    # Claude API
    ANTHROPIC_API_KEY: str = ""

    # Gemini API
    GEMINI_API_KEY: str = ""

    # HeyGen API
    HEYGEN_API_KEY: str = ""

    # MiniMax Audio
    MINIMAX_API_KEY: str = ""

    # ===== YouTube / リサーチ =====
    YOUTUBE_API_KEY: str = ""
    SERP_API_KEY: str = ""
    SOCIAL_BLADE_API_KEY: str = ""

    @property
    def cors_origins(self) -> List[str]:
        """CORS許可オリジンのリスト"""
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",")]


# シングルトンインスタンス
settings = Settings()
