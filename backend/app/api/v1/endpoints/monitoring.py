"""
モニタリングダッシュボードAPI

システムメトリクス、APIステータス、タスクキューの状態を提供
"""
import psutil
import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import httpx
import logging

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


async def check_external_api_health(url: str, timeout: float = 5.0) -> Dict[str, Any]:
    """外部APIの健全性チェック"""
    try:
        start_time = time.time()
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            latency_ms = (time.time() - start_time) * 1000

            return {
                "status": "healthy" if response.status_code == 200 else "degraded",
                "latency_ms": round(latency_ms, 2),
                "status_code": response.status_code,
            }
    except Exception as e:
        logger.error(f"Health check failed for {url}: {e}")
        return {
            "status": "unhealthy",
            "latency_ms": None,
            "error": str(e),
        }


@router.get("/dashboard")
async def get_monitoring_dashboard(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    モニタリングダッシュボードデータを取得

    Returns:
        システムメトリクス、API状態、データベース状態、外部API状態、タスクキュー状態
    """
    try:
        # システムメトリクス
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        system_metrics = {
            "cpu_usage": round(cpu_percent, 2),
            "memory_usage": round(memory.percent, 2),
            "disk_usage": round(disk.percent, 2),
            "memory_available_gb": round(memory.available / (1024 ** 3), 2),
            "disk_free_gb": round(disk.free / (1024 ** 3), 2),
        }

        # データベース接続数とクエリ時間
        db_metrics = {
            "connections": 0,
            "query_time_avg_ms": 0,
        }

        try:
            # PostgreSQLの接続数を取得
            result = await db.execute(text("SELECT count(*) FROM pg_stat_activity"))
            db_metrics["connections"] = result.scalar() or 0

            # 簡単なクエリでレスポンスタイムを計測
            start_time = time.time()
            await db.execute(text("SELECT 1"))
            query_time_ms = (time.time() - start_time) * 1000
            db_metrics["query_time_avg_ms"] = round(query_time_ms, 2)
        except Exception as e:
            logger.error(f"Database metrics collection failed: {e}")
            db_metrics["error"] = str(e)

        # 外部APIの状態チェック
        external_apis = {}

        # Claude API
        if settings.ANTHROPIC_API_KEY:
            external_apis["claude"] = {
                "status": "configured",
                "latency_ms": None,
            }

        # Gemini API
        if settings.GEMINI_API_KEY:
            external_apis["gemini"] = {
                "status": "configured",
                "latency_ms": None,
            }

        # HeyGen API
        if settings.HEYGEN_API_KEY:
            external_apis["heygen"] = {
                "status": "configured",
                "latency_ms": None,
            }

        # YouTube API
        if settings.YOUTUBE_API_KEY:
            external_apis["youtube"] = {
                "status": "configured",
                "latency_ms": None,
            }

        # Social Blade API
        if settings.SOCIAL_BLADE_API_KEY:
            external_apis["social_blade"] = {
                "status": "configured",
                "latency_ms": None,
            }

        # タスクキュー状態（Redis経由で取得予定、今はモック）
        tasks = {
            "pending": 0,
            "running": 0,
            "failed_24h": 0,
            "completed_24h": 0,
        }

        return {
            "system": system_metrics,
            "database": db_metrics,
            "external_apis": external_apis,
            "tasks": tasks,
            "timestamp": time.time(),
        }

    except Exception as e:
        logger.error(f"Monitoring dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"モニタリングデータの取得に失敗しました: {str(e)}")


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """
    ヘルスチェックエンドポイント

    Returns:
        status: healthy or unhealthy
    """
    try:
        # データベース接続確認
        await db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service Unavailable")


@router.get("/metrics/api")
async def get_api_metrics(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    APIメトリクスを取得（レスポンスタイム、エラー率など）

    Note: 本格的な実装にはPrometheusなどのメトリクス収集が必要
    """
    # TODO: 実際のメトリクス収集実装
    return {
        "requests_per_minute": 0,
        "avg_response_time_ms": 0,
        "error_rate": 0.0,
        "endpoints": {},
    }
