"""
QAチェッカーエージェントサービス

台本・サムネイルの品質を評価
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.agent import Agent, AgentTask
from app.models.script import Script
from app.services.external import claude_client

logger = logging.getLogger(__name__)


class QACheckerService:
    """QAチェッカーエージェントサービス"""

    QUALITY_THRESHOLD = 70

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute(
        self,
        agent: Agent,
        task: AgentTask,
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """エージェントを実行"""
        try:
            # 入力データから対象を取得
            script_id = input_data.get("script_id")
            script_text = input_data.get("script_text")

            if script_id:
                script = await self._get_script(script_id)
                if script:
                    script_text = script.content

            if not script_text:
                return {"error": "No script to evaluate", "score": 0}

            # 品質評価
            evaluation = await self._evaluate_script(script_text)

            return {
                "score": evaluation.get("overall_score", 0),
                "passed": evaluation.get("overall_score", 0) >= self.QUALITY_THRESHOLD,
                "evaluation": evaluation,
            }

        except Exception as e:
            logger.error(f"QA checker execution failed: {e}")
            raise

    async def _get_script(self, script_id: str) -> Optional[Script]:
        """台本を取得"""
        try:
            result = await self.db.execute(
                select(Script).where(Script.id == script_id)
            )
            return result.scalar_one_or_none()
        except Exception:
            return None

    async def _evaluate_script(
        self,
        script_text: str
    ) -> Dict[str, Any]:
        """台本を評価"""
        if not claude_client.is_available():
            return {
                "overall_score": 50,
                "hook_score": 50,
                "structure_score": 50,
                "target_score": 50,
                "cta_score": 50,
                "feedback": "AI評価が利用できません",
            }

        try:
            prompt = f"""以下のYouTube動画台本を評価してください。

台本:
{script_text[:2000]}

以下の4項目を0-100点で評価し、JSON形式で回答してください:
1. hook_score: 冒頭30秒のフック力
2. structure_score: 構成の論理性
3. target_score: ターゲット適合性
4. cta_score: CTAの明確さ

回答形式:
{{"hook_score": 80, "structure_score": 75, "target_score": 85, "cta_score": 70, "feedback": "改善点のコメント"}}"""

            response = await claude_client.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )

            import json
            result_text = response.content[0].text
            # JSONを抽出
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            if start >= 0 and end > start:
                evaluation = json.loads(result_text[start:end])
                evaluation["overall_score"] = (
                    evaluation.get("hook_score", 0) +
                    evaluation.get("structure_score", 0) +
                    evaluation.get("target_score", 0) +
                    evaluation.get("cta_score", 0)
                ) / 4
                return evaluation

            return {"overall_score": 50, "feedback": "評価結果のパースに失敗"}

        except Exception as e:
            logger.error(f"Script evaluation failed: {e}")
            return {"overall_score": 50, "feedback": str(e)}
