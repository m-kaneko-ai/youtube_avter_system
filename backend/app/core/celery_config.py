"""
Celery設定モジュール

エージェント自動実行のためのCelery/Redis設定
"""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Celeryアプリケーション初期化
celery_app = Celery(
    "creator_studio",
    broker=settings.REDIS_URL,
    backend=f"{settings.REDIS_URL}/1",
    include=["app.tasks.agent_executor"],
)

# Celery設定
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tokyo",
    enable_utc=False,
    task_track_started=True,
    task_time_limit=600,  # 10分タイムアウト
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)

# スケジュール設定（エージェント自動実行）
celery_app.conf.beat_schedule = {
    # トレンド監視エージェント（1日3回）
    "trend-monitor-9am": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=9, minute=0),
        "args": ["trend_monitor"],
    },
    "trend-monitor-3pm": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=15, minute=0),
        "args": ["trend_monitor"],
    },
    "trend-monitor-9pm": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=21, minute=0),
        "args": ["trend_monitor"],
    },
    # 競合分析エージェント（1日1回）
    "competitor-analyzer-9pm": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=21, minute=30),
        "args": ["competitor_analyzer"],
    },
    # コメント返信エージェント（1日3回）
    "comment-responder-9am": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=9, minute=30),
        "args": ["comment_responder"],
    },
    "comment-responder-3pm": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=15, minute=30),
        "args": ["comment_responder"],
    },
    "comment-responder-9pm": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=21, minute=30),
        "args": ["comment_responder"],
    },
    # パフォーマンス追跡（毎日0時）
    "performance-tracker-midnight": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=0, minute=0),
        "args": ["performance_tracker"],
    },
    # コンテンツスケジューラー（毎日8時）
    "content-scheduler-8am": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=8, minute=0),
        "args": ["content_scheduler"],
    },
    # キーワードリサーチ（週1回、月曜9時）
    "keyword-researcher-weekly": {
        "task": "app.tasks.agent_executor.run_agent",
        "schedule": crontab(hour=9, minute=0, day_of_week=1),
        "args": ["keyword_researcher"],
    },
}
