"""
AIエージェント統合テスト

7種類のエージェントサービスの動作確認テスト
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from uuid import uuid4

# Test imports
from app.models.agent import (
    AgentType,
    AgentStatus,
    TaskStatus,
    TaskPriority,
    CommentSentiment,
    ReplyStatus,
    Agent,
    AgentTask,
)


class TestTrendMonitorService:
    """トレンド監視サービスのテスト"""

    @pytest.mark.asyncio
    async def test_get_monitoring_keywords_default(self):
        """デフォルトキーワードが返されることを確認"""
        from app.services.agents.trend_monitor_service import TrendMonitorService

        mock_db = AsyncMock()
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        service = TrendMonitorService(mock_db)
        keywords = await service._get_monitoring_keywords(None)

        assert len(keywords) > 0
        assert "YouTube 収益化" in keywords or "AIアバター" in keywords

    @pytest.mark.asyncio
    async def test_calculate_trends_score(self):
        """トレンドスコア計算のテスト"""
        from app.services.agents.trend_monitor_service import TrendMonitorService

        mock_db = AsyncMock()
        service = TrendMonitorService(mock_db)

        # 急上昇キーワードなし
        score = service._calculate_trends_score([])
        assert score == 0

        # 急上昇キーワード3個
        trends_data = [
            {"trend_direction": "up"},
            {"trend_direction": "up"},
            {"trend_direction": "up"},
            {"trend_direction": "stable"},
        ]
        score = service._calculate_trends_score(trends_data)
        assert score == 45  # 3 * 15

    @pytest.mark.asyncio
    async def test_calculate_youtube_score(self):
        """YouTubeスコア計算のテスト"""
        from app.services.agents.trend_monitor_service import TrendMonitorService

        mock_db = AsyncMock()
        service = TrendMonitorService(mock_db)

        # 動画なし
        score = service._calculate_youtube_score([])
        assert score == 0

        # 平均10万再生
        videos = [{"view_count": 100000}, {"view_count": 100000}]
        score = service._calculate_youtube_score(videos)
        assert score == 100  # 10万再生で100点


class TestCompetitorAnalyzerService:
    """競合分析サービスのテスト"""

    @pytest.mark.asyncio
    async def test_analyze_performance_viral(self):
        """バイラル判定のテスト"""
        from app.services.agents.competitor_analyzer_service import CompetitorAnalyzerService

        mock_db = AsyncMock()
        service = CompetitorAnalyzerService(mock_db)

        competitor = {
            "recent_videos": [
                {"view_count": 10000},
                {"view_count": 10000},
            ]
        }
        video = {"view_count": 20000}  # 平均の2倍

        is_viral = await service._analyze_performance(competitor, video)
        assert is_viral is True

    @pytest.mark.asyncio
    async def test_analyze_performance_not_viral(self):
        """非バイラル判定のテスト"""
        from app.services.agents.competitor_analyzer_service import CompetitorAnalyzerService

        mock_db = AsyncMock()
        service = CompetitorAnalyzerService(mock_db)

        competitor = {
            "recent_videos": [
                {"view_count": 10000},
                {"view_count": 10000},
            ]
        }
        video = {"view_count": 10000}  # 平均と同じ

        is_viral = await service._analyze_performance(competitor, video)
        assert is_viral is False


class TestCommentResponderService:
    """コメント返信サービスのテスト"""

    @pytest.mark.asyncio
    async def test_analyze_sentiment_question(self):
        """質問判定のテスト"""
        from app.services.agents.comment_responder_service import CommentResponderService

        mock_db = AsyncMock()
        service = CommentResponderService(mock_db)

        # Claude APIが使えない場合のフォールバック
        with patch("app.services.agents.comment_responder_service.claude_client") as mock_claude:
            mock_claude.is_available.return_value = False

            sentiment = await service._analyze_sentiment("これはどういうことですか?")
            assert sentiment == CommentSentiment.QUESTION


class TestContentSchedulerService:
    """コンテンツスケジューラーサービスのテスト"""

    def test_hours_until_publish(self):
        """公開までの時間計算テスト"""
        from app.services.agents.content_scheduler_service import ContentSchedulerService
        from datetime import timedelta

        mock_db = AsyncMock()
        service = ContentSchedulerService(mock_db)

        future = datetime.utcnow() + timedelta(hours=12)
        hours = service._hours_until_publish(future)

        assert 11.9 < hours < 12.1


class TestQACheckerService:
    """QAチェッカーサービスのテスト"""

    @pytest.mark.asyncio
    async def test_evaluate_script_fallback(self):
        """AI使用不可時のフォールバック評価"""
        from app.services.agents.qa_checker_service import QACheckerService

        mock_db = AsyncMock()
        service = QACheckerService(mock_db)

        with patch("app.services.agents.qa_checker_service.claude_client") as mock_claude:
            mock_claude.is_available.return_value = False

            evaluation = await service._evaluate_script("テスト台本です")

            assert evaluation["overall_score"] == 50
            assert "AI評価が利用できません" in evaluation["feedback"]


class TestKeywordResearcherService:
    """キーワードリサーチサービスのテスト"""

    def test_deduplicate_keywords(self):
        """キーワード重複除去テスト"""
        from app.services.agents.keyword_researcher_service import KeywordResearcherService

        mock_db = AsyncMock()
        service = KeywordResearcherService(mock_db)

        keywords = [
            {"keyword": "YouTube"},
            {"keyword": "youtube"},  # 重複（大文字小文字違い）
            {"keyword": "動画編集"},
        ]

        unique = service._deduplicate_keywords(keywords)

        assert len(unique) == 2


class TestAgentOrchestratorService:
    """オーケストレーターサービスのテスト"""

    @pytest.mark.asyncio
    async def test_register_agent_service(self):
        """エージェントサービス登録テスト"""
        from app.services.agent_orchestrator_service import AgentOrchestratorService

        mock_db = AsyncMock()
        orchestrator = AgentOrchestratorService(mock_db)

        mock_service = MagicMock()
        orchestrator.register_agent_service(AgentType.TREND_MONITOR, mock_service)

        assert AgentType.TREND_MONITOR in orchestrator._agent_services


class TestNotificationService:
    """通知サービスのテスト"""

    @pytest.mark.asyncio
    async def test_build_slack_blocks(self):
        """Slackブロック構築テスト"""
        from app.services.notification_service import NotificationService

        service = NotificationService()

        # メソッドが存在することを確認
        assert hasattr(service, 'send_slack')
        assert hasattr(service, 'notify_trend_alert')
        assert hasattr(service, 'notify_competitor_alert')
        assert hasattr(service, 'notify_comments_pending')
        assert hasattr(service, 'notify_task_completed')
        assert hasattr(service, 'notify_error')


class TestCeleryConfig:
    """Celery設定のテスト"""

    def test_beat_schedule_exists(self):
        """スケジュール設定が存在することを確認"""
        from app.core.celery_config import celery_app

        assert hasattr(celery_app, 'conf')
        assert celery_app.conf.beat_schedule is not None

        # 最低限のスケジュールが設定されていることを確認
        schedule = celery_app.conf.beat_schedule
        assert "trend-monitor-9am" in schedule
        assert "comment-responder-9am" in schedule


# テスト実行
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
