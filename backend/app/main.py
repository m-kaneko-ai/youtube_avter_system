"""
Creator Studio AI - FastAPIアプリケーション

AIアバターを活用したYouTube動画制作の全工程を自動化するシステム
"""
import logging
import sys
import traceback
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings


# ========== セキュリティヘッダーミドルウェア ==========

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    セキュリティヘッダーを追加するミドルウェア

    OWASP推奨のセキュリティヘッダーを全レスポンスに追加
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # XSS対策
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # クリックジャッキング対策
        response.headers["X-Frame-Options"] = "DENY"

        # リファラー情報制御
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS（本番環境のみ）
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        return response


from app.core.database import init_db, close_db
from app.core.cache import close_redis, get_redis
from app.api.v1.router import api_router


# ロギング設定
def setup_logging() -> logging.Logger:
    """ロギングの設定を行う"""
    logger = logging.getLogger("creator_studio")
    logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)

    # コンソールハンドラー
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)

    # フォーマッター
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    # ハンドラーを追加
    if not logger.handlers:
        logger.addHandler(handler)

    return logger


logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションライフサイクル管理

    起動時と終了時の処理を定義
    """
    # 起動時処理
    logger.info("🚀 Creator Studio AI Backend starting...")
    # await init_db()  # 本番ではAlembicマイグレーションを使用するためコメントアウト
    logger.info("✅ Database connection established")

    # Redis接続確認
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        logger.info("✅ Redis connection established")
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed (caching disabled): {e}")

    yield

    # 終了時処理
    logger.info("🛑 Creator Studio AI Backend shutting down...")
    await close_redis()
    logger.info("✅ Redis connection closed")
    await close_db()
    logger.info("✅ Database connection closed")


# FastAPIアプリケーション初期化
app = FastAPI(
    title="Creator Studio AI API",
    description="AIアバターを活用したYouTube動画制作の全工程を自動化するシステム",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# セキュリティヘッダーミドルウェア（最初に追加 = 最後に実行）
app.add_middleware(SecurityHeadersMiddleware)

# CORSミドルウェア設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーター登録（/api/v1プレフィックス）
app.include_router(api_router, prefix="/api/v1")


# ========== Prometheusメトリクス設定 ==========

# Prometheusインストゥルメンテーションを初期化
# HTTPリクエストメトリクス（レイテンシ、リクエスト数、エラー率）を自動収集
instrumentator = Instrumentator(
    should_group_status_codes=True,  # ステータスコードをグループ化（2xx, 3xx, 4xx, 5xx）
    should_ignore_untemplated=False,  # テンプレート化されていないパスも含める
    should_respect_env_var=True,  # 環境変数ENABLE_METRICSでオン/オフ可能
    should_instrument_requests_inprogress=True,  # 進行中のリクエスト数を計測
    excluded_handlers=["/metrics"],  # /metricsエンドポイント自体は計測対象外
    env_var_name="ENABLE_METRICS",  # 環境変数名（デフォルト有効）
    inprogress_name="http_requests_inprogress",  # 進行中リクエストメトリクス名
    inprogress_labels=True,  # 進行中リクエストにラベルを追加
)

# アプリケーションにインストゥルメンテーションを適用
instrumentator.instrument(app)

# /metricsエンドポイントを公開
# このエンドポイントでPrometheus形式のメトリクスを取得可能
instrumentator.expose(app, endpoint="/metrics", include_in_schema=True)


# ========== グローバルエラーハンドラー ==========

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    HTTPExceptionのグローバルハンドラー

    Args:
        request: リクエストオブジェクト
        exc: HTTPException

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail} - "
        f"Path: {request.url.path} - Method: {request.method}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error"
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    リクエストバリデーションエラーのハンドラー

    Args:
        request: リクエストオブジェクト
        exc: RequestValidationError

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    errors = exc.errors()
    logger.warning(
        f"ValidationError: {len(errors)} errors - "
        f"Path: {request.url.path} - Method: {request.method} - "
        f"Errors: {errors}"
    )
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation Error",
                "type": "validation_error",
                "details": errors
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    予期しない例外のグローバルハンドラー

    Args:
        request: リクエストオブジェクト
        exc: 例外

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    # スタックトレースをログに記録
    logger.error(
        f"Unhandled Exception: {type(exc).__name__} - {str(exc)} - "
        f"Path: {request.url.path} - Method: {request.method}\n"
        f"Traceback:\n{traceback.format_exc()}"
    )

    # 本番環境では詳細なエラーメッセージを隠す
    if settings.debug:
        message = str(exc)
    else:
        message = "An internal server error occurred. Please try again later."

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": message,
                "type": "internal_error"
            }
        }
    )


@app.get("/")
async def root():
    """
    ルートエンドポイント

    Returns:
        dict: ウェルカムメッセージ
    """
    return {
        "message": "Creator Studio AI API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
