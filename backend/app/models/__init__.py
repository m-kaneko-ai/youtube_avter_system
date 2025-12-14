"""
SQLAlchemyモデル集約モジュール

データベーステーブル定義を集約し、Alembicマイグレーションから参照可能にする
"""
from app.models.user import User, UserRole
from app.models.client import Client, ClientPlan
from app.models.category import Category
from app.models.tag import Tag
from app.models.knowledge import Knowledge, KnowledgeType
from app.models.chat_session import ChatSession, ChatSessionStatus
from app.models.project import (
    Project,
    ProjectStatus,
    Video,
    VideoStatus,
    WorkflowStep,
    WorkflowStepName,
    WorkflowStepStatus,
)
from app.models.research import Research, ResearchType
from app.models.planning import (
    PlanningChatSession,
    PlanningSessionStatus,
    AISuggestion,
    SuggestionType,
    ProjectSchedule,
)
from app.models.script import (
    Script,
    ScriptStatus,
    GeneratorType,
    Thumbnail,
    ThumbnailStatus,
    MetadataGeneration,
)
from app.models.production import (
    AudioGeneration,
    AvatarGeneration,
    BrollGeneration,
    GenerationStatus,
)
from app.models.publish import (
    Publication,
    PublishSchedule,
    PublishPlatform,
    PublishStatus,
)
from app.models.analytics import (
    VideoAnalytics,
    ChannelAnalytics,
    AnalyticsReport,
    ReportType,
    ReportStatus,
)
from app.models.admin import (
    SystemSetting,
    ApiConnection,
    ApiConnectionStatus,
    AuditLog,
    AuditAction,
)
from app.models.dashboard import (
    Task,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    Notification,
    NotificationType,
)
from app.models.cta import (
    CTATemplate,
    CTAType,
    CTAPlacement,
    VideoCTAAssignment,
    UTMDefaultSettings,
    CTAClickLog,
)

__all__ = [
    "User",
    "UserRole",
    "Client",
    "ClientPlan",
    "Category",
    "Tag",
    "Knowledge",
    "KnowledgeType",
    "ChatSession",
    "ChatSessionStatus",
    "Project",
    "ProjectStatus",
    "Video",
    "VideoStatus",
    "WorkflowStep",
    "WorkflowStepName",
    "WorkflowStepStatus",
    "Research",
    "ResearchType",
    "PlanningChatSession",
    "PlanningSessionStatus",
    "AISuggestion",
    "SuggestionType",
    "ProjectSchedule",
    "Script",
    "ScriptStatus",
    "GeneratorType",
    "Thumbnail",
    "ThumbnailStatus",
    "MetadataGeneration",
    "AudioGeneration",
    "AvatarGeneration",
    "BrollGeneration",
    "GenerationStatus",
    "Publication",
    "PublishSchedule",
    "PublishPlatform",
    "PublishStatus",
    "VideoAnalytics",
    "ChannelAnalytics",
    "AnalyticsReport",
    "ReportType",
    "ReportStatus",
    "SystemSetting",
    "ApiConnection",
    "ApiConnectionStatus",
    "AuditLog",
    "AuditAction",
    "Task",
    "TaskStatus",
    "TaskPriority",
    "TaskCategory",
    "Notification",
    "NotificationType",
    "CTATemplate",
    "CTAType",
    "CTAPlacement",
    "VideoCTAAssignment",
    "UTMDefaultSettings",
    "CTAClickLog",
]
