"""
日次レポート自動送信タスク

毎朝9時にシステムの日次レポートを送信
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func
import psutil

from app.core.database import AsyncSessionLocal
from app.services.notification_service import notification_service
from app.services.alert_rules import alert_engine

logger = logging.getLogger(__name__)


async def collect_daily_metrics() -> Dict[str, Any]:
    """日次メトリクスを収集"""
    metrics = {}

    try:
        async with AsyncSessionLocal() as db:
            # システムメトリクス
            metrics["system"] = {
                "cpu_usage": round(psutil.cpu_percent(interval=1), 2),
                "memory_usage": round(psutil.virtual_memory().percent, 2),
                "disk_usage": round(psutil.disk_usage('/').percent, 2),
            }

            # データベース接続数
            result = await db.execute(text("SELECT count(*) FROM pg_stat_activity"))
            metrics["database"] = {
                "connections": result.scalar() or 0,
            }

            # TODO: 以下のメトリクスは実際のテーブルに合わせて実装
            # 現状はモック値

            # 昨日の動画作成数
            metrics["videos"] = {
                "created_yesterday": 0,
                "published_yesterday": 0,
                "total_views_yesterday": 0,
            }

            # 昨日のタスク実行状況
            metrics["tasks"] = {
                "completed_yesterday": 0,
                "failed_yesterday": 0,
                "avg_execution_time_seconds": 0,
            }

            # API使用状況（昨日）
            metrics["api_usage"] = {
                "claude_calls": 0,
                "gemini_calls": 0,
                "heygen_calls": 0,
                "youtube_api_calls": 0,
            }

            # エラー統計
            metrics["errors"] = {
                "total_errors_yesterday": 0,
                "critical_errors": 0,
            }

    except Exception as e:
        logger.error(f"Error collecting daily metrics: {e}")
        metrics["error"] = str(e)

    return metrics


async def generate_daily_report() -> Dict[str, Any]:
    """日次レポートを生成"""
    report = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "generated_at": datetime.now().isoformat(),
    }

    # メトリクス収集
    metrics = await collect_daily_metrics()
    report["metrics"] = metrics

    # アラートチェック
    async with AsyncSessionLocal() as db:
        alerts = await alert_engine.check_all_rules(db)
        report["active_alerts"] = alerts

    # サマリー生成
    report["summary"] = generate_summary(metrics, alerts)

    return report


def generate_summary(metrics: Dict[str, Any], alerts: list) -> Dict[str, Any]:
    """レポートサマリーを生成"""
    summary = {
        "health_status": "healthy",
        "highlights": [],
        "concerns": [],
        "recommendations": [],
    }

    # システムヘルスチェック
    if metrics.get("system"):
        cpu = metrics["system"].get("cpu_usage", 0)
        memory = metrics["system"].get("memory_usage", 0)
        disk = metrics["system"].get("disk_usage", 0)

        if cpu > 80 or memory > 80 or disk > 80:
            summary["health_status"] = "degraded"
            summary["concerns"].append("システムリソースが高負荷状態です")

        if cpu < 50 and memory < 50:
            summary["highlights"].append("システムリソースは正常範囲内です")

    # アラートチェック
    if alerts:
        critical_alerts = [a for a in alerts if a.get("status") == "critical"]
        warning_alerts = [a for a in alerts if a.get("status") == "warning"]

        if critical_alerts:
            summary["health_status"] = "critical"
            summary["concerns"].append(f"{len(critical_alerts)}件の重大なアラートがあります")

        if warning_alerts:
            summary["concerns"].append(f"{len(warning_alerts)}件の警告があります")

    # 動画制作状況
    if metrics.get("videos"):
        created = metrics["videos"].get("created_yesterday", 0)
        published = metrics["videos"].get("published_yesterday", 0)

        if created > 0:
            summary["highlights"].append(f"昨日 {created}本の動画を作成しました")
        if published > 0:
            summary["highlights"].append(f"昨日 {published}本の動画を公開しました")

    # タスク実行状況
    if metrics.get("tasks"):
        failed = metrics["tasks"].get("failed_yesterday", 0)
        if failed > 0:
            summary["concerns"].append(f"昨日 {failed}件のタスクが失敗しました")
            summary["recommendations"].append("失敗したタスクのログを確認してください")

    # エラー状況
    if metrics.get("errors"):
        total_errors = metrics["errors"].get("total_errors_yesterday", 0)
        if total_errors > 10:
            summary["concerns"].append(f"昨日 {total_errors}件のエラーが発生しました")
            summary["recommendations"].append("エラーログを確認し、根本原因を特定してください")

    return summary


async def send_daily_report_task():
    """
    日次レポート送信タスク

    Celeryタスクまたはcronから実行される
    """
    logger.info("Starting daily report generation...")

    try:
        # レポート生成
        report = await generate_daily_report()

        # Slack用のメッセージフォーマット
        metrics = report.get("metrics", {})
        summary = report.get("summary", {})

        # ステータスアイコン
        status_icons = {
            "healthy": "✅",
            "degraded": "⚠️",
            "critical": "🔥",
        }
        status_icon = status_icons.get(summary.get("health_status", "healthy"), "📊")

        # メッセージフィールド構築
        fields = {}

        # システム状態
        if metrics.get("system"):
            system = metrics["system"]
            fields["システム状態"] = (
                f"CPU: {system.get('cpu_usage', 0)}% | "
                f"メモリ: {system.get('memory_usage', 0)}% | "
                f"ディスク: {system.get('disk_usage', 0)}%"
            )

        # 動画制作
        if metrics.get("videos"):
            videos = metrics["videos"]
            created = videos.get("created_yesterday", 0)
            published = videos.get("published_yesterday", 0)
            if created > 0 or published > 0:
                fields["動画制作"] = f"作成: {created}本 | 公開: {published}本"

        # タスク実行
        if metrics.get("tasks"):
            tasks = metrics["tasks"]
            completed = tasks.get("completed_yesterday", 0)
            failed = tasks.get("failed_yesterday", 0)
            if completed > 0 or failed > 0:
                fields["タスク実行"] = f"完了: {completed}件 | 失敗: {failed}件"

        # ハイライト
        if summary.get("highlights"):
            fields["ハイライト"] = "\n".join(f"• {h}" for h in summary["highlights"])

        # 懸念事項
        if summary.get("concerns"):
            fields["懸念事項"] = "\n".join(f"• {c}" for c in summary["concerns"])

        # 推奨事項
        if summary.get("recommendations"):
            fields["推奨事項"] = "\n".join(f"• {r}" for r in summary["recommendations"])

        # Slack送信
        success = await notification_service.send_daily_report(fields)

        if success:
            logger.info("Daily report sent successfully")
        else:
            logger.warning("Daily report sending failed (Slack may not be configured)")

        return report

    except Exception as e:
        logger.error(f"Error in daily report task: {e}")
        # エラー通知
        await notification_service.send_error_alert(
            error=e,
            context={
                "task": "daily_report",
                "timestamp": datetime.now().isoformat(),
            }
        )
        raise


# Celeryタスク登録用（app/tasks/__init__.py から呼び出される）
async def schedule_daily_report():
    """
    日次レポートのスケジュール設定

    crontab: 毎日9:00 JST (0:00 UTC)
    """
    await send_daily_report_task()
