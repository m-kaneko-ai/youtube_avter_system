"""
通知サービス

Slack Webhook、アプリ内通知の送信
"""
import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """通知タイプ"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    TREND_ALERT = "trend_alert"
    COMPETITOR_ALERT = "competitor_alert"
    COMMENT_PENDING = "comment_pending"
    TASK_COMPLETED = "task_completed"
    QUOTA_WARNING = "quota_warning"
    DEPLOY = "deploy"
    DAILY_REPORT = "daily_report"


class NotificationService:
    """通知サービス"""

    def __init__(self):
        self.slack_webhook_url = getattr(settings, 'SLACK_WEBHOOK_URL', None)
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    def is_slack_available(self) -> bool:
        return bool(self.slack_webhook_url)

    async def send_slack(
        self,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        details: Optional[Dict[str, Any]] = None,
        channel: Optional[str] = None,
    ) -> bool:
        """Slack通知を送信"""
        if not self.is_slack_available():
            logger.warning("Slack webhook URL not configured")
            return False

        try:
            emoji_map = {
                NotificationType.INFO: "ℹ️",
                NotificationType.SUCCESS: "✅",
                NotificationType.WARNING: "⚠️",
                NotificationType.ERROR: "❌",
                NotificationType.CRITICAL: "🔥",
                NotificationType.TREND_ALERT: "📈",
                NotificationType.COMPETITOR_ALERT: "🎯",
                NotificationType.COMMENT_PENDING: "💬",
                NotificationType.TASK_COMPLETED: "✨",
                NotificationType.QUOTA_WARNING: "🚨",
                NotificationType.DEPLOY: "🚀",
                NotificationType.DAILY_REPORT: "📊",
            }

            emoji = emoji_map.get(notification_type, "📢")

            blocks = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{emoji} *{notification_type.value.upper()}*\n{message}"
                    }
                }
            ]

            if details:
                fields = []
                for key, value in details.items():
                    fields.append({
                        "type": "mrkdwn",
                        "text": f"*{key}:*\n{value}"
                    })
                if fields:
                    blocks.append({
                        "type": "section",
                        "fields": fields[:10]  # Slack制限
                    })

            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} JST"
                    }
                ]
            })

            payload = {"blocks": blocks}
            if channel:
                payload["channel"] = channel

            response = await self.client.post(
                self.slack_webhook_url,
                json=payload
            )
            response.raise_for_status()
            return True

        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
            return False

    async def notify_trend_alert(
        self,
        keyword: str,
        score: float,
        source: str,
        suggested_actions: Optional[List[str]] = None,
    ) -> bool:
        """トレンドアラート通知"""
        message = f"新しいトレンドを検出しました: *{keyword}*"
        details = {
            "キーワード": keyword,
            "スコア": f"{score:.1f}",
            "ソース": source,
        }
        if suggested_actions:
            details["推奨アクション"] = "\n".join(f"• {a}" for a in suggested_actions)

        return await self.send_slack(
            message,
            NotificationType.TREND_ALERT,
            details
        )

    async def notify_competitor_alert(
        self,
        channel_name: str,
        video_title: str,
        view_count: int,
        video_url: str,
    ) -> bool:
        """競合アラート通知"""
        message = f"競合チャンネルが新しい動画を公開しました"
        details = {
            "チャンネル": channel_name,
            "動画タイトル": video_title,
            "再生数": f"{view_count:,}",
            "URL": video_url,
        }
        return await self.send_slack(
            message,
            NotificationType.COMPETITOR_ALERT,
            details
        )

    async def notify_comments_pending(
        self,
        count: int,
        video_title: Optional[str] = None,
    ) -> bool:
        """承認待ちコメント通知"""
        message = f"*{count}件*の返信候補が承認待ちです"
        details = {}
        if video_title:
            details["動画"] = video_title
        details["確認URL"] = f"{settings.FRONTEND_URL}/agent?tab=comments"

        return await self.send_slack(
            message,
            NotificationType.COMMENT_PENDING,
            details
        )

    async def notify_task_completed(
        self,
        agent_name: str,
        task_name: str,
        duration_seconds: float,
        result_summary: Optional[str] = None,
    ) -> bool:
        """タスク完了通知"""
        message = f"エージェントタスクが完了しました"
        details = {
            "エージェント": agent_name,
            "タスク": task_name,
            "実行時間": f"{duration_seconds:.1f}秒",
        }
        if result_summary:
            details["結果"] = result_summary

        return await self.send_slack(
            message,
            NotificationType.TASK_COMPLETED,
            details
        )

    async def notify_quota_warning(
        self,
        service: str,
        used: int,
        limit: int,
        percentage: float,
    ) -> bool:
        """クォータ警告通知"""
        message = f"⚠️ *{service}* のAPIクォータが {percentage:.0f}% に達しました"
        details = {
            "サービス": service,
            "使用量": f"{used:,} / {limit:,}",
            "使用率": f"{percentage:.1f}%",
        }
        return await self.send_slack(
            message,
            NotificationType.QUOTA_WARNING,
            details
        )

    async def notify_error(
        self,
        source: str,
        error_message: str,
        error_details: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """エラー通知"""
        message = f"エラーが発生しました: {source}"
        details = {
            "エラー": error_message,
        }
        if error_details:
            details.update(error_details)

        return await self.send_slack(
            message,
            NotificationType.ERROR,
            details
        )

    async def send_alert(
        self,
        level: str,
        title: str,
        message: str,
        fields: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        アラート送信（error, warning, info, critical）

        Args:
            level: アラートレベル（error, warning, info, critical）
            title: アラートタイトル
            message: アラートメッセージ
            fields: 追加情報（オプション）

        Returns:
            送信成功したかどうか
        """
        level_map = {
            "error": NotificationType.ERROR,
            "warning": NotificationType.WARNING,
            "info": NotificationType.INFO,
            "critical": NotificationType.CRITICAL,
        }

        notification_type = level_map.get(level.lower(), NotificationType.INFO)
        full_message = f"*{title}*\n{message}"

        return await self.send_slack(
            full_message,
            notification_type,
            fields
        )

    async def send_daily_report(self, metrics: Dict[str, Any]) -> bool:
        """
        日次レポート送信

        Args:
            metrics: レポートに含めるメトリクス情報

        Returns:
            送信成功したかどうか
        """
        message = "日次レポート"

        return await self.send_slack(
            message,
            NotificationType.DAILY_REPORT,
            metrics
        )

    async def send_deploy_notification(
        self,
        version: str,
        status: str,
        environment: str = "production",
        details: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        デプロイ通知

        Args:
            version: バージョン
            status: デプロイステータス（success, failed, in_progress）
            environment: 環境名
            details: 追加情報（オプション）

        Returns:
            送信成功したかどうか
        """
        status_emoji = {
            "success": "✅",
            "failed": "❌",
            "in_progress": "🔄",
        }

        emoji = status_emoji.get(status, "🚀")
        message = f"{emoji} デプロイ {status.upper()}: *{version}* → {environment}"

        deploy_details = {
            "バージョン": version,
            "環境": environment,
            "ステータス": status,
        }

        if details:
            deploy_details.update(details)

        return await self.send_slack(
            message,
            NotificationType.DEPLOY,
            deploy_details
        )

    async def send_error_alert(
        self,
        error: Exception,
        context: Dict[str, Any],
    ) -> bool:
        """
        エラーアラート（Exceptionオブジェクトから自動生成）

        Args:
            error: Exceptionオブジェクト
            context: エラー発生時のコンテキスト情報

        Returns:
            送信成功したかどうか
        """
        error_type = type(error).__name__
        error_message = str(error)

        message = f"システムエラーが発生しました: *{error_type}*"

        details = {
            "エラー型": error_type,
            "エラーメッセージ": error_message,
        }
        details.update(context)

        return await self.send_slack(
            message,
            NotificationType.ERROR,
            details
        )

    async def close(self):
        """クライアントをクローズ"""
        if self._client:
            await self._client.aclose()


# シングルトンインスタンス
notification_service = NotificationService()
