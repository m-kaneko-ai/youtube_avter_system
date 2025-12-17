"""
Celeryタスクエグゼキュータ

スケジュールされたエージェントタスクの実行
"""
import logging
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.celery_config import celery_app
from app.core.database import AsyncSessionLocal
from app.models.agent import AgentType
from app.services.agent_orchestrator_service import AgentOrchestratorService
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


def run_async(coro):
    """非同期関数を同期的に実行"""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # 既存のループがある場合は新しいループで実行
        import nest_asyncio
        nest_asyncio.apply()
        return loop.run_until_complete(coro)
    else:
        return asyncio.run(coro)


async def _execute_agent(
    agent_type_str: str,
    knowledge_id: Optional[str] = None,
    input_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """エージェント実行の内部関数"""
    try:
        agent_type = AgentType(agent_type_str)
    except ValueError:
        return {"success": False, "error": f"Invalid agent type: {agent_type_str}"}

    async with AsyncSessionLocal() as db:
        orchestrator = AgentOrchestratorService(db)

        # エージェントサービスを動的にインポートして登録
        await _register_agent_services(orchestrator)

        # 実行
        result = await orchestrator.execute_agent(
            agent_type=agent_type,
            knowledge_id=knowledge_id,
            input_data=input_data,
        )

        # 通知送信
        if result.get("success"):
            await notification_service.notify_task_completed(
                agent_name=agent_type.value,
                task_name=f"{agent_type.value} execution",
                duration_seconds=result.get("duration", 0),
                result_summary=_summarize_result(result.get("result")),
            )
        else:
            await notification_service.notify_error(
                source=f"Agent: {agent_type.value}",
                error_message=result.get("error", "Unknown error"),
            )

        return result


async def _register_agent_services(orchestrator: AgentOrchestratorService):
    """エージェントサービスを登録"""
    # 遅延インポート（循環参照回避）
    from app.services.agents.trend_monitor_service import TrendMonitorService
    from app.services.agents.competitor_analyzer_service import CompetitorAnalyzerService
    from app.services.agents.comment_responder_service import CommentResponderService
    from app.services.agents.content_scheduler_service import ContentSchedulerService
    from app.services.agents.performance_tracker_service import PerformanceTrackerService
    from app.services.agents.qa_checker_service import QACheckerService
    from app.services.agents.keyword_researcher_service import KeywordResearcherService

    orchestrator.register_agent_service(
        AgentType.TREND_MONITOR,
        TrendMonitorService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.COMPETITOR_ANALYZER,
        CompetitorAnalyzerService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.COMMENT_RESPONDER,
        CommentResponderService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.CONTENT_SCHEDULER,
        ContentSchedulerService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.PERFORMANCE_TRACKER,
        PerformanceTrackerService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.QA_CHECKER,
        QACheckerService(orchestrator.db)
    )
    orchestrator.register_agent_service(
        AgentType.KEYWORD_RESEARCHER,
        KeywordResearcherService(orchestrator.db)
    )


def _summarize_result(result: Optional[Dict[str, Any]]) -> Optional[str]:
    """結果をサマリー化"""
    if not result:
        return None

    summaries = []
    if "alerts_created" in result:
        summaries.append(f"アラート: {result['alerts_created']}件")
    if "comments_processed" in result:
        summaries.append(f"コメント: {result['comments_processed']}件")
    if "videos_analyzed" in result:
        summaries.append(f"動画分析: {result['videos_analyzed']}件")
    if "keywords_found" in result:
        summaries.append(f"キーワード: {result['keywords_found']}件")

    return ", ".join(summaries) if summaries else None


@celery_app.task(
    bind=True,
    name="app.tasks.agent_executor.run_agent",
    max_retries=3,
    default_retry_delay=60,
)
def run_agent(
    self,
    agent_type: str,
    knowledge_id: Optional[str] = None,
    input_data: Optional[Dict[str, Any]] = None,
):
    """エージェントを実行するCeleryタスク"""
    logger.info(f"Starting agent task: {agent_type}")

    try:
        result = run_async(_execute_agent(agent_type, knowledge_id, input_data))

        if not result.get("success"):
            logger.error(f"Agent task failed: {result.get('error')}")
            # リトライ可能なエラーの場合
            if self.request.retries < self.max_retries:
                raise self.retry(exc=Exception(result.get("error")))

        logger.info(f"Agent task completed: {agent_type}")
        return result

    except Exception as e:
        logger.error(f"Agent task error: {e}")
        raise


@celery_app.task(name="app.tasks.agent_executor.run_agent_manual")
def run_agent_manual(
    agent_type: str,
    knowledge_id: Optional[str] = None,
    input_data: Optional[Dict[str, Any]] = None,
):
    """手動実行用のエージェントタスク（リトライなし）"""
    logger.info(f"Starting manual agent task: {agent_type}")
    result = run_async(_execute_agent(agent_type, knowledge_id, input_data))
    logger.info(f"Manual agent task completed: {agent_type}")
    return result


@celery_app.task(name="app.tasks.agent_executor.health_check")
def health_check():
    """Celeryワーカーのヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "worker": "agent_executor",
    }
