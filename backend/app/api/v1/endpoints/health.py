"""
ヘルスチェックエンドポイント

システム全体の健全性と外部APIの接続状態を確認するためのエンドポイント。
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.api_key_validator import APIKeyValidator

router = APIRouter()


@router.get("")
@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    システムヘルスチェック

    データベース、Redis、外部APIの接続状態を確認します。

    Returns:
        システムの健全性情報
    """
    # データベース接続チェック
    db_status = "ok"
    db_latency = None
    try:
        import time

        start = time.time()
        await db.execute("SELECT 1")
        db_latency = (time.time() - start) * 1000  # ms
    except Exception:
        db_status = "error"

    # Redis接続チェック（Redisが設定されている場合）
    redis_status = "not_configured"
    redis_latency = None
    try:
        from app.core.redis import get_redis

        redis_client = get_redis()
        if redis_client:
            import time

            start = time.time()
            await redis_client.ping()
            redis_latency = (time.time() - start) * 1000  # ms
            redis_status = "ok"
    except Exception:
        redis_status = "error"

    # 外部API接続チェック
    validator = APIKeyValidator()
    api_results = {}

    # Claude API
    status, latency, _ = await validator.validate_claude_api()
    api_results["claude_api"] = {"status": status, "latency_ms": latency}

    # Gemini API
    status, latency, _ = await validator.validate_gemini_api()
    api_results["gemini_api"] = {"status": status, "latency_ms": latency}

    # OpenAI API
    status, latency, _ = await validator.validate_openai_api()
    api_results["openai_api"] = {"status": status, "latency_ms": latency}

    # HeyGen API
    status, latency, _ = await validator.validate_heygen_api()
    api_results["heygen_api"] = {"status": status, "latency_ms": latency}

    # MiniMax API
    status, latency, _ = await validator.validate_minimax_api()
    api_results["minimax_api"] = {"status": status, "latency_ms": latency}

    # YouTube Data API
    status, latency, _ = await validator.validate_youtube_api()
    api_results["youtube_api"] = {"status": status, "latency_ms": latency}

    # SerpAPI
    status, latency, _ = await validator.validate_serp_api()
    api_results["serp_api"] = {"status": status, "latency_ms": latency}

    # Social Blade API
    status, latency, _ = await validator.validate_social_blade_api()
    api_results["social_blade_api"] = {"status": status, "latency_ms": latency}

    # Google OAuth
    status, latency, _ = await validator.validate_google_oauth()
    api_results["google_oauth"] = {"status": status, "latency_ms": latency}

    # 全体のステータス判定
    # 必須サービス（DB、Redis、主要API）のいずれかがエラーの場合は unhealthy
    critical_services = [db_status, redis_status]
    critical_apis = [
        api_results["claude_api"]["status"],
        api_results["gemini_api"]["status"],
        api_results["openai_api"]["status"],
        api_results["youtube_api"]["status"],
    ]

    overall_status = "healthy"
    if "error" in critical_services or "error" in critical_apis:
        overall_status = "unhealthy"
    elif "warning" in critical_services or "warning" in critical_apis:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "database": {"status": db_status, "latency_ms": db_latency},
        "redis": {"status": redis_status, "latency_ms": redis_latency},
        "services": api_results,
    }


@router.get("/simple")
async def simple_health_check():
    """
    シンプルなヘルスチェック

    ロードバランサーやモニタリングツール用の軽量なエンドポイント。
    外部APIチェックは行わず、アプリケーションの起動状態のみを確認します。

    Returns:
        {"status": "ok"}
    """
    return {"status": "ok"}


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    レディネスチェック

    Kubernetes等のオーケストレーションツール用のエンドポイント。
    データベース接続が確立されているかを確認します。

    Returns:
        データベース接続が確立されていれば {"status": "ready"}、そうでなければ 503 エラー
    """
    try:
        await db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        from fastapi import HTTPException

        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")


@router.get("/live")
async def liveness_check():
    """
    ライブネスチェック

    Kubernetes等のオーケストレーションツール用のエンドポイント。
    アプリケーションが生存しているかを確認します。

    Returns:
        {"status": "alive"}
    """
    return {"status": "alive"}
