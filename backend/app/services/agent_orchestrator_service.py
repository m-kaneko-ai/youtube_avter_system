"""
エージェントオーケストレーターサービス

エージェントの実行統括、タスク管理、ログ記録
"""
import logging
from typing import Optional, Dict, Any, List, Type
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.agent import (
    Agent, AgentTask, AgentLog, AgentSchedule,
    AgentType, AgentStatus, TaskStatus, TaskPriority
)
from app.core.database import get_db

logger = logging.getLogger(__name__)


class AgentOrchestratorService:
    """エージェントオーケストレーターサービス"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._agent_services: Dict[AgentType, Any] = {}

    def register_agent_service(self, agent_type: AgentType, service: Any):
        """エージェントサービスを登録"""
        self._agent_services[agent_type] = service

    async def get_agent_by_type(
        self,
        agent_type: AgentType,
        knowledge_id: Optional[UUID] = None
    ) -> Optional[Agent]:
        """エージェントタイプでエージェントを取得"""
        query = select(Agent).where(
            Agent.agent_type == agent_type,
            Agent.is_enabled == True
        )
        if knowledge_id:
            query = query.where(Agent.knowledge_id == knowledge_id)

        result = await self.db.execute(query.limit(1))
        return result.scalar_one_or_none()

    async def get_or_create_default_agent(
        self,
        agent_type: AgentType,
        knowledge_id: Optional[UUID] = None
    ) -> Agent:
        """デフォルトエージェントを取得または作成"""
        agent = await self.get_agent_by_type(agent_type, knowledge_id)

        if not agent:
            agent = Agent(
                name=f"{agent_type.value} Agent",
                description=f"Auto-created {agent_type.value} agent",
                agent_type=agent_type,
                status=AgentStatus.IDLE,
                is_enabled=True,
                auto_execute=True,
                knowledge_id=knowledge_id,
            )
            self.db.add(agent)
            await self.db.commit()
            await self.db.refresh(agent)
            logger.info(f"Created default agent: {agent_type.value}")

        return agent

    async def create_task(
        self,
        agent: Agent,
        name: str,
        description: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        priority: TaskPriority = TaskPriority.NORMAL,
        schedule_id: Optional[UUID] = None,
    ) -> AgentTask:
        """タスクを作成"""
        task = AgentTask(
            agent_id=agent.id,
            schedule_id=schedule_id,
            name=name,
            description=description,
            task_type=agent.agent_type.value,
            priority=priority,
            status=TaskStatus.PENDING,
            input_data=input_data,
        )
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def start_task(self, task: AgentTask) -> AgentTask:
        """タスクを開始"""
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()

        # エージェントのステータスも更新
        await self.db.execute(
            update(Agent)
            .where(Agent.id == task.agent_id)
            .values(status=AgentStatus.RUNNING, last_run_at=datetime.utcnow())
        )

        await self.db.commit()
        await self.db.refresh(task)

        await self.log(
            task.agent_id,
            "INFO",
            f"Task started: {task.name}",
            task_id=task.id
        )
        return task

    async def complete_task(
        self,
        task: AgentTask,
        output_data: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> AgentTask:
        """タスクを完了"""
        task.completed_at = datetime.utcnow()
        task.status = TaskStatus.COMPLETED if success else TaskStatus.FAILED
        task.output_data = output_data

        if task.started_at:
            task.duration_seconds = (task.completed_at - task.started_at).total_seconds()

        if error_message:
            task.error_message = error_message

        # エージェントの統計を更新
        agent_update = {
            "status": AgentStatus.IDLE,
            "total_tasks_run": Agent.total_tasks_run + 1,
        }
        if success:
            agent_update["successful_tasks"] = Agent.successful_tasks + 1
            agent_update["last_success_at"] = datetime.utcnow()
            agent_update["last_error"] = None
        else:
            agent_update["failed_tasks"] = Agent.failed_tasks + 1
            agent_update["last_error"] = error_message

        await self.db.execute(
            update(Agent)
            .where(Agent.id == task.agent_id)
            .values(**agent_update)
        )

        await self.db.commit()
        await self.db.refresh(task)

        log_level = "INFO" if success else "ERROR"
        log_message = f"Task completed: {task.name}" if success else f"Task failed: {task.name} - {error_message}"
        await self.log(task.agent_id, log_level, log_message, task_id=task.id)

        return task

    async def log(
        self,
        agent_id: UUID,
        level: str,
        message: str,
        task_id: Optional[UUID] = None,
        details: Optional[Dict[str, Any]] = None,
        source: Optional[str] = None,
        action: Optional[str] = None,
    ):
        """ログを記録"""
        log_entry = AgentLog(
            agent_id=agent_id,
            task_id=task_id,
            level=level,
            message=message,
            details=details,
            source=source,
            action=action,
        )
        self.db.add(log_entry)
        await self.db.commit()

    async def execute_agent(
        self,
        agent_type: AgentType,
        knowledge_id: Optional[UUID] = None,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """エージェントを実行"""
        try:
            # エージェント取得または作成
            agent = await self.get_or_create_default_agent(agent_type, knowledge_id)

            if agent.status == AgentStatus.RUNNING:
                return {
                    "success": False,
                    "error": "Agent is already running",
                    "agent_id": str(agent.id),
                }

            if agent.status == AgentStatus.DISABLED:
                return {
                    "success": False,
                    "error": "Agent is disabled",
                    "agent_id": str(agent.id),
                }

            # タスク作成
            task = await self.create_task(
                agent=agent,
                name=f"{agent_type.value} execution",
                input_data=input_data,
            )

            # タスク開始
            task = await self.start_task(task)

            # エージェントサービスを取得して実行
            service = self._agent_services.get(agent_type)
            if not service:
                raise ValueError(f"No service registered for agent type: {agent_type}")

            # 実行
            result = await service.execute(
                agent=agent,
                task=task,
                input_data=input_data or {},
            )

            # 完了
            task = await self.complete_task(
                task=task,
                output_data=result,
                success=True,
            )

            return {
                "success": True,
                "agent_id": str(agent.id),
                "task_id": str(task.id),
                "duration": task.duration_seconds,
                "result": result,
            }

        except Exception as e:
            logger.error(f"Agent execution failed: {e}")

            if 'task' in locals():
                await self.complete_task(
                    task=task,
                    success=False,
                    error_message=str(e),
                )

            return {
                "success": False,
                "error": str(e),
                "agent_id": str(agent.id) if 'agent' in locals() else None,
            }

    async def get_agent_summary(
        self,
        knowledge_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """エージェントサマリーを取得"""
        query = select(Agent)
        if knowledge_id:
            query = query.where(Agent.knowledge_id == knowledge_id)

        result = await self.db.execute(query)
        agents = result.scalars().all()

        summary = {
            "total_agents": len(agents),
            "enabled_agents": sum(1 for a in agents if a.is_enabled),
            "running_agents": sum(1 for a in agents if a.status == AgentStatus.RUNNING),
            "total_tasks": sum(a.total_tasks_run for a in agents),
            "successful_tasks": sum(a.successful_tasks for a in agents),
            "failed_tasks": sum(a.failed_tasks for a in agents),
            "agents": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "type": a.agent_type.value,
                    "status": a.status.value,
                    "is_enabled": a.is_enabled,
                    "last_run_at": a.last_run_at.isoformat() if a.last_run_at else None,
                    "success_rate": (
                        a.successful_tasks / a.total_tasks_run * 100
                        if a.total_tasks_run > 0 else 0
                    ),
                }
                for a in agents
            ],
        }
        return summary
