"""
アラートルール設定

システムメトリクスの閾値監視とアラート送信
"""
import psutil
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


class AlertRule:
    """アラートルールの基底クラス"""

    def __init__(
        self,
        name: str,
        warning_threshold: float,
        critical_threshold: float,
        check_interval_minutes: int = 5,
    ):
        self.name = name
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.check_interval_minutes = check_interval_minutes
        self.last_alert_time: Optional[datetime] = None
        self.cooldown_minutes = 30  # アラート再送のクールダウン時間

    async def check(self) -> Optional[Dict[str, Any]]:
        """ルールチェックを実行（サブクラスで実装）"""
        raise NotImplementedError

    def should_send_alert(self) -> bool:
        """アラートを送信すべきかどうか（クールダウン考慮）"""
        if self.last_alert_time is None:
            return True

        elapsed = datetime.now() - self.last_alert_time
        return elapsed.total_seconds() > (self.cooldown_minutes * 60)

    async def send_alert(self, level: str, message: str, fields: Dict[str, Any]):
        """アラート送信"""
        if not self.should_send_alert():
            logger.info(f"Alert cooldown active for {self.name}, skipping")
            return

        success = await notification_service.send_alert(
            level=level,
            title=self.name,
            message=message,
            fields=fields,
        )

        if success:
            self.last_alert_time = datetime.now()
            logger.info(f"Alert sent for {self.name}: {level}")


class CPUUsageRule(AlertRule):
    """CPU使用率監視ルール"""

    def __init__(self):
        super().__init__(
            name="CPU使用率アラート",
            warning_threshold=70.0,  # 70%で警告
            critical_threshold=90.0,  # 90%で緊急
        )

    async def check(self) -> Optional[Dict[str, Any]]:
        cpu_percent = psutil.cpu_percent(interval=1)

        if cpu_percent >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"CPU使用率が危険なレベルに達しています: {cpu_percent}%",
                fields={
                    "現在の使用率": f"{cpu_percent}%",
                    "閾値": f"{self.critical_threshold}%",
                    "推奨アクション": "サーバーのスケールアップを検討してください",
                },
            )
            return {"status": "critical", "value": cpu_percent}

        elif cpu_percent >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"CPU使用率が高くなっています: {cpu_percent}%",
                fields={
                    "現在の使用率": f"{cpu_percent}%",
                    "閾値": f"{self.warning_threshold}%",
                },
            )
            return {"status": "warning", "value": cpu_percent}

        return None


class MemoryUsageRule(AlertRule):
    """メモリ使用率監視ルール"""

    def __init__(self):
        super().__init__(
            name="メモリ使用率アラート",
            warning_threshold=70.0,
            critical_threshold=90.0,
        )

    async def check(self) -> Optional[Dict[str, Any]]:
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        if memory_percent >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"メモリ使用率が危険なレベルに達しています: {memory_percent}%",
                fields={
                    "現在の使用率": f"{memory_percent}%",
                    "空き容量": f"{memory.available / (1024**3):.1f} GB",
                    "閾値": f"{self.critical_threshold}%",
                    "推奨アクション": "メモリリークの確認とサーバースケールアップを検討してください",
                },
            )
            return {"status": "critical", "value": memory_percent}

        elif memory_percent >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"メモリ使用率が高くなっています: {memory_percent}%",
                fields={
                    "現在の使用率": f"{memory_percent}%",
                    "空き容量": f"{memory.available / (1024**3):.1f} GB",
                    "閾値": f"{self.warning_threshold}%",
                },
            )
            return {"status": "warning", "value": memory_percent}

        return None


class DiskUsageRule(AlertRule):
    """ディスク使用率監視ルール"""

    def __init__(self):
        super().__init__(
            name="ディスク使用率アラート",
            warning_threshold=70.0,
            critical_threshold=85.0,
        )

    async def check(self) -> Optional[Dict[str, Any]]:
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent

        if disk_percent >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"ディスク使用率が危険なレベルに達しています: {disk_percent}%",
                fields={
                    "現在の使用率": f"{disk_percent}%",
                    "空き容量": f"{disk.free / (1024**3):.1f} GB",
                    "閾値": f"{self.critical_threshold}%",
                    "推奨アクション": "不要なファイルの削除またはストレージ拡張を実施してください",
                },
            )
            return {"status": "critical", "value": disk_percent}

        elif disk_percent >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"ディスク使用率が高くなっています: {disk_percent}%",
                fields={
                    "現在の使用率": f"{disk_percent}%",
                    "空き容量": f"{disk.free / (1024**3):.1f} GB",
                    "閾値": f"{self.warning_threshold}%",
                },
            )
            return {"status": "warning", "value": disk_percent}

        return None


class ErrorRateRule(AlertRule):
    """エラー率監視ルール"""

    def __init__(self):
        super().__init__(
            name="APIエラー率アラート",
            warning_threshold=1.0,  # 1%で警告
            critical_threshold=5.0,  # 5%で緊急
        )

    async def check(self, db: AsyncSession) -> Optional[Dict[str, Any]]:
        # TODO: 実際のエラーログからエラー率を計算
        # 現状はモック実装
        error_rate = 0.0

        if error_rate >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"APIエラー率が危険なレベルに達しています: {error_rate}%",
                fields={
                    "エラー率": f"{error_rate}%",
                    "閾値": f"{self.critical_threshold}%",
                    "推奨アクション": "エラーログを確認し、即座に対応してください",
                },
            )
            return {"status": "critical", "value": error_rate}

        elif error_rate >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"APIエラー率が上昇しています: {error_rate}%",
                fields={
                    "エラー率": f"{error_rate}%",
                    "閾値": f"{self.warning_threshold}%",
                },
            )
            return {"status": "warning", "value": error_rate}

        return None


class ResponseTimeRule(AlertRule):
    """レスポンスタイム監視ルール"""

    def __init__(self):
        super().__init__(
            name="APIレスポンスタイムアラート",
            warning_threshold=1000.0,  # 1秒で警告
            critical_threshold=2000.0,  # 2秒で緊急
        )

    async def check(self, db: AsyncSession) -> Optional[Dict[str, Any]]:
        # データベースクエリ時間を測定
        import time
        start_time = time.time()
        await db.execute(text("SELECT 1"))
        query_time_ms = (time.time() - start_time) * 1000

        # TODO: より包括的なレスポンスタイム測定
        avg_response_time = query_time_ms

        if avg_response_time >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"APIレスポンスタイムが危険なレベルに達しています: {avg_response_time:.0f}ms",
                fields={
                    "平均レスポンスタイム": f"{avg_response_time:.0f}ms",
                    "閾値": f"{self.critical_threshold:.0f}ms",
                    "推奨アクション": "データベースクエリの最適化とキャッシュの確認を実施してください",
                },
            )
            return {"status": "critical", "value": avg_response_time}

        elif avg_response_time >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"APIレスポンスタイムが遅くなっています: {avg_response_time:.0f}ms",
                fields={
                    "平均レスポンスタイム": f"{avg_response_time:.0f}ms",
                    "閾値": f"{self.warning_threshold:.0f}ms",
                },
            )
            return {"status": "warning", "value": avg_response_time}

        return None


class APIQuotaRule(AlertRule):
    """API Quota監視ルール"""

    def __init__(self):
        super().__init__(
            name="API Quotaアラート",
            warning_threshold=80.0,  # 80%で警告
            critical_threshold=95.0,  # 95%で緊急
        )

    async def check(self, service: str, used: int, limit: int) -> Optional[Dict[str, Any]]:
        if limit == 0:
            return None

        usage_percent = (used / limit) * 100

        if usage_percent >= self.critical_threshold:
            await self.send_alert(
                level="critical",
                message=f"{service} API Quotaが上限に近づいています: {usage_percent:.1f}%",
                fields={
                    "サービス": service,
                    "使用量": f"{used:,} / {limit:,}",
                    "使用率": f"{usage_percent:.1f}%",
                    "推奨アクション": "Quota上限の引き上げまたは使用量の削減を検討してください",
                },
            )
            return {"status": "critical", "value": usage_percent}

        elif usage_percent >= self.warning_threshold:
            await self.send_alert(
                level="warning",
                message=f"{service} API Quotaが {usage_percent:.1f}% に達しました",
                fields={
                    "サービス": service,
                    "使用量": f"{used:,} / {limit:,}",
                    "使用率": f"{usage_percent:.1f}%",
                },
            )
            return {"status": "warning", "value": usage_percent}

        return None


class AlertRuleEngine:
    """アラートルールエンジン"""

    def __init__(self):
        self.rules: List[AlertRule] = [
            CPUUsageRule(),
            MemoryUsageRule(),
            DiskUsageRule(),
            ErrorRateRule(),
            ResponseTimeRule(),
        ]

    async def check_all_rules(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """全てのルールをチェック"""
        alerts = []

        for rule in self.rules:
            try:
                # ルールに応じて適切な引数でチェック
                if isinstance(rule, (CPUUsageRule, MemoryUsageRule, DiskUsageRule)):
                    result = await rule.check()
                else:
                    result = await rule.check(db)

                if result:
                    alerts.append({
                        "rule": rule.name,
                        **result,
                    })

            except Exception as e:
                logger.error(f"Error checking rule {rule.name}: {e}")

        return alerts


# シングルトンインスタンス
alert_engine = AlertRuleEngine()
