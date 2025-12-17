#!/usr/bin/env python3
"""
監視・アラート機能のテスト（Slack通知なしで動作確認）

使い方:
  python test_monitoring_without_slack.py
"""
import asyncio
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(__file__))

from app.services.notification_service import notification_service
from app.services.alert_rules import alert_engine, APIQuotaRule
from app.core.database import AsyncSessionLocal


async def test_notification_service():
    """NotificationServiceのテスト"""
    print("\n=== NotificationService テスト ===")

    # Slack Webhookが設定されているか確認
    is_available = notification_service.is_slack_available()
    print(f"Slack Webhook設定: {'有効' if is_available else '無効（テストモード）'}")

    # send_alert テスト
    print("\n1. send_alert テスト...")
    result = await notification_service.send_alert(
        level="info",
        title="テストアラート",
        message="これはテストメッセージです",
        fields={
            "テスト項目": "send_alert",
            "ステータス": "正常",
        }
    )
    print(f"   結果: {'成功' if result else '失敗（Slack未設定の場合は正常）'}")

    # send_daily_report テスト
    print("\n2. send_daily_report テスト...")
    result = await notification_service.send_daily_report({
        "システム状態": "正常",
        "CPU使用率": "45%",
        "メモリ使用率": "62%",
        "動画作成数": "10本",
    })
    print(f"   結果: {'成功' if result else '失敗（Slack未設定の場合は正常）'}")

    # send_deploy_notification テスト
    print("\n3. send_deploy_notification テスト...")
    result = await notification_service.send_deploy_notification(
        version="v1.2.3",
        status="success",
        environment="staging",
        details={
            "コミット": "abc1234",
            "デプロイ時間": "2分30秒",
        }
    )
    print(f"   結果: {'成功' if result else '失敗（Slack未設定の場合は正常）'}")

    # send_error_alert テスト
    print("\n4. send_error_alert テスト...")
    try:
        raise ValueError("これはテストエラーです")
    except Exception as e:
        result = await notification_service.send_error_alert(
            error=e,
            context={
                "関数": "test_notification_service",
                "モジュール": "test_monitoring_without_slack",
            }
        )
        print(f"   結果: {'成功' if result else '失敗（Slack未設定の場合は正常）'}")


async def test_alert_rules():
    """AlertRulesのテスト"""
    print("\n\n=== AlertRules テスト ===")

    async with AsyncSessionLocal() as db:
        # 全ルールチェック
        print("\n1. 全ルールチェック実行中...")
        alerts = await alert_engine.check_all_rules(db)

        if alerts:
            print(f"   {len(alerts)}件のアラートが検出されました:")
            for alert in alerts:
                print(f"   - {alert['rule']}: {alert['status']} (値: {alert.get('value', 'N/A')})")
        else:
            print("   アラートなし（全て正常範囲内）")

    # API Quotaルールのテスト
    print("\n2. API Quotaルールテスト...")
    quota_rule = APIQuotaRule()

    # 警告レベルのテスト（85%使用）
    print("   - 警告レベル（85%使用）:")
    result = await quota_rule.check(
        service="Claude API",
        used=85000,
        limit=100000
    )
    print(f"     結果: {result}")

    # クリティカルレベルのテスト（96%使用）
    print("   - クリティカルレベル（96%使用）:")
    result = await quota_rule.check(
        service="YouTube API",
        used=96000,
        limit=100000
    )
    print(f"     結果: {result}")


async def test_monitoring_api():
    """Monitoring APIエンドポイントの疑似テスト"""
    print("\n\n=== Monitoring API 疑似テスト ===")

    import psutil
    import time
    from sqlalchemy import text

    # システムメトリクス
    print("\n1. システムメトリクス:")
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    print(f"   CPU使用率: {cpu}%")
    print(f"   メモリ使用率: {memory.percent}%")
    print(f"   ディスク使用率: {disk.percent}%")

    # データベース接続
    print("\n2. データベース接続:")
    try:
        async with AsyncSessionLocal() as db:
            # 接続数
            result = await db.execute(text("SELECT count(*) FROM pg_stat_activity"))
            connections = result.scalar() or 0
            print(f"   接続数: {connections}")

            # クエリ時間測定
            start = time.time()
            await db.execute(text("SELECT 1"))
            query_time = (time.time() - start) * 1000
            print(f"   クエリ時間: {query_time:.2f}ms")
    except Exception as e:
        print(f"   エラー: {e}")


async def main():
    """メインテスト実行"""
    print("=" * 60)
    print("監視・アラート機能テスト")
    print("=" * 60)

    try:
        # NotificationServiceのテスト
        await test_notification_service()

        # AlertRulesのテスト
        await test_alert_rules()

        # Monitoring APIのテスト
        await test_monitoring_api()

        print("\n" + "=" * 60)
        print("✅ 全てのテストが完了しました")
        print("=" * 60)

        # Slack未設定の場合のメッセージ
        if not notification_service.is_slack_available():
            print("\n【注意】")
            print("Slack Webhook URLが設定されていないため、")
            print("通知機能は動作しませんが、システムは正常に動作します。")
            print("\n本番環境ではSLACK_WEBHOOK_URLを設定してください。")

    except Exception as e:
        print(f"\n❌ テスト中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
