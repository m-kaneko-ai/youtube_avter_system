"""
メトリクスエンドポイント

Prometheus形式のメトリクスを提供するAPIエンドポイント
運用監視・アラート設定に使用
"""
import time
import psutil
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse

router = APIRouter()

# アプリケーション起動時刻
APP_START_TIME = time.time()

# リクエストカウンター（簡易実装）
REQUEST_COUNTS: Dict[str, int] = {
    "total": 0,
    "success": 0,
    "error": 0,
}


def increment_request_count(success: bool = True) -> None:
    """リクエストカウントをインクリメント"""
    REQUEST_COUNTS["total"] += 1
    if success:
        REQUEST_COUNTS["success"] += 1
    else:
        REQUEST_COUNTS["error"] += 1


@router.get("/metrics", response_class=PlainTextResponse)
async def get_metrics() -> str:
    """
    Prometheus形式のメトリクスを返す

    Returns:
        str: Prometheus形式のメトリクステキスト
    """
    # システムメトリクス
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    # アプリケーションメトリクス
    uptime_seconds = time.time() - APP_START_TIME

    # Prometheus形式でメトリクスを構築
    metrics = []

    # アプリケーション情報
    metrics.append("# HELP creator_studio_info Application information")
    metrics.append("# TYPE creator_studio_info gauge")
    metrics.append('creator_studio_info{version="1.0.0"} 1')

    # アップタイム
    metrics.append("# HELP creator_studio_uptime_seconds Application uptime in seconds")
    metrics.append("# TYPE creator_studio_uptime_seconds counter")
    metrics.append(f"creator_studio_uptime_seconds {uptime_seconds:.2f}")

    # リクエストカウント
    metrics.append("# HELP creator_studio_requests_total Total number of requests")
    metrics.append("# TYPE creator_studio_requests_total counter")
    metrics.append(f'creator_studio_requests_total{{status="success"}} {REQUEST_COUNTS["success"]}')
    metrics.append(f'creator_studio_requests_total{{status="error"}} {REQUEST_COUNTS["error"]}')

    # CPU使用率
    metrics.append("# HELP creator_studio_cpu_usage_percent CPU usage percentage")
    metrics.append("# TYPE creator_studio_cpu_usage_percent gauge")
    metrics.append(f"creator_studio_cpu_usage_percent {cpu_percent:.2f}")

    # メモリ使用率
    metrics.append("# HELP creator_studio_memory_usage_percent Memory usage percentage")
    metrics.append("# TYPE creator_studio_memory_usage_percent gauge")
    metrics.append(f"creator_studio_memory_usage_percent {memory.percent:.2f}")

    # メモリ使用量（バイト）
    metrics.append("# HELP creator_studio_memory_used_bytes Memory used in bytes")
    metrics.append("# TYPE creator_studio_memory_used_bytes gauge")
    metrics.append(f"creator_studio_memory_used_bytes {memory.used}")

    # メモリ総量（バイト）
    metrics.append("# HELP creator_studio_memory_total_bytes Total memory in bytes")
    metrics.append("# TYPE creator_studio_memory_total_bytes gauge")
    metrics.append(f"creator_studio_memory_total_bytes {memory.total}")

    # ディスク使用率
    metrics.append("# HELP creator_studio_disk_usage_percent Disk usage percentage")
    metrics.append("# TYPE creator_studio_disk_usage_percent gauge")
    metrics.append(f"creator_studio_disk_usage_percent {disk.percent:.2f}")

    # ディスク使用量（バイト）
    metrics.append("# HELP creator_studio_disk_used_bytes Disk used in bytes")
    metrics.append("# TYPE creator_studio_disk_used_bytes gauge")
    metrics.append(f"creator_studio_disk_used_bytes {disk.used}")

    return "\n".join(metrics) + "\n"


@router.get("/metrics/json")
async def get_metrics_json() -> Dict[str, Any]:
    """
    JSON形式のメトリクスを返す

    Returns:
        Dict[str, Any]: JSON形式のメトリクス
    """
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime_seconds = time.time() - APP_START_TIME

    return {
        "application": {
            "name": "Creator Studio AI",
            "version": "1.0.0",
            "uptime_seconds": round(uptime_seconds, 2),
            "started_at": datetime.fromtimestamp(APP_START_TIME).isoformat(),
        },
        "requests": {
            "total": REQUEST_COUNTS["total"],
            "success": REQUEST_COUNTS["success"],
            "error": REQUEST_COUNTS["error"],
            "error_rate": (
                round(REQUEST_COUNTS["error"] / REQUEST_COUNTS["total"] * 100, 2)
                if REQUEST_COUNTS["total"] > 0
                else 0
            ),
        },
        "system": {
            "cpu": {
                "usage_percent": round(cpu_percent, 2),
            },
            "memory": {
                "usage_percent": round(memory.percent, 2),
                "used_bytes": memory.used,
                "total_bytes": memory.total,
                "available_bytes": memory.available,
            },
            "disk": {
                "usage_percent": round(disk.percent, 2),
                "used_bytes": disk.used,
                "total_bytes": disk.total,
                "free_bytes": disk.free,
            },
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
