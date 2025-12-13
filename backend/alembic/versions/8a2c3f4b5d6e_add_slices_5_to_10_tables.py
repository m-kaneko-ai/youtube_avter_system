"""Add slices 5 to 10 tables

Revision ID: 8a2c3f4b5d6e
Revises: 670db495bfb6
Create Date: 2025-12-13 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision: str = '8a2c3f4b5d6e'
down_revision: Union[str, None] = '670db495bfb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # Planning tables (Slice 5)
    # ============================================================

    # planning_chat_sessions table
    op.create_table('planning_chat_sessions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'ABANDONED', name='planningsessionstatus'), nullable=False),
        sa.Column('messages', JSONB, nullable=True),
        sa.Column('context', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_planning_chat_sessions_project_id'), 'planning_chat_sessions', ['project_id'], unique=False)
    op.create_index(op.f('ix_planning_chat_sessions_user_id'), 'planning_chat_sessions', ['user_id'], unique=False)

    # ai_suggestions table
    op.create_table('ai_suggestions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', UUID(as_uuid=True), nullable=False),
        sa.Column('suggestion_type', sa.Enum('TITLE', 'TOPIC', 'OUTLINE', 'HOOK', 'CTA', 'TARGET_AUDIENCE', name='suggestiontype'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('is_adopted', sa.Boolean(), nullable=False, default=False),
        sa.Column('adopted_at', sa.DateTime(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['planning_chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_suggestions_session_id'), 'ai_suggestions', ['session_id'], unique=False)
    op.create_index(op.f('ix_ai_suggestions_suggestion_type'), 'ai_suggestions', ['suggestion_type'], unique=False)
    op.create_index(op.f('ix_ai_suggestions_is_adopted'), 'ai_suggestions', ['is_adopted'], unique=False)

    # project_schedules table
    op.create_table('project_schedules',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', UUID(as_uuid=True), nullable=False),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('publish_time', sa.Time(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_schedules_project_id'), 'project_schedules', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_schedules_scheduled_date'), 'project_schedules', ['scheduled_date'], unique=False)

    # ============================================================
    # Script tables (Slice 6)
    # ============================================================

    # scripts table
    op.create_table('scripts',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('generator_type', sa.Enum('CLAUDE', 'GEMINI', 'MANUAL', name='generatortype'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'REJECTED', name='scriptstatus'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('word_count', sa.Integer(), nullable=True),
        sa.Column('estimated_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scripts_video_id'), 'scripts', ['video_id'], unique=False)
    op.create_index(op.f('ix_scripts_status'), 'scripts', ['status'], unique=False)

    # thumbnails table
    op.create_table('thumbnails',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('image_url', sa.String(length=1000), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'REJECTED', name='thumbnailstatus'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_thumbnails_video_id'), 'thumbnails', ['video_id'], unique=False)
    op.create_index(op.f('ix_thumbnails_status'), 'thumbnails', ['status'], unique=False)

    # metadata_generations table
    op.create_table('metadata_generations',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', JSONB, nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_metadata_generations_video_id'), 'metadata_generations', ['video_id'], unique=False)

    # ============================================================
    # Production tables (Slice 7)
    # ============================================================

    # audio_generations table
    op.create_table('audio_generations',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('script_id', UUID(as_uuid=True), nullable=True),
        sa.Column('voice_id', sa.String(length=100), nullable=True),
        sa.Column('voice_name', sa.String(length=200), nullable=True),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('audio_url', sa.String(length=1000), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='generationstatus'), nullable=False),
        sa.Column('speed', sa.Float(), nullable=True),
        sa.Column('pitch', sa.Float(), nullable=True),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['script_id'], ['scripts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audio_generations_video_id'), 'audio_generations', ['video_id'], unique=False)
    op.create_index(op.f('ix_audio_generations_status'), 'audio_generations', ['status'], unique=False)

    # avatar_generations table
    op.create_table('avatar_generations',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('audio_id', UUID(as_uuid=True), nullable=True),
        sa.Column('avatar_id', sa.String(length=100), nullable=True),
        sa.Column('avatar_name', sa.String(length=200), nullable=True),
        sa.Column('video_url', sa.String(length=1000), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=1000), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='generationstatus'), nullable=False),
        sa.Column('heygen_task_id', sa.String(length=200), nullable=True),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['audio_id'], ['audio_generations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_avatar_generations_video_id'), 'avatar_generations', ['video_id'], unique=False)
    op.create_index(op.f('ix_avatar_generations_status'), 'avatar_generations', ['status'], unique=False)

    # broll_generations table
    op.create_table('broll_generations',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('style', sa.String(length=100), nullable=True),
        sa.Column('video_url', sa.String(length=1000), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=1000), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='generationstatus'), nullable=False),
        sa.Column('veo_task_id', sa.String(length=200), nullable=True),
        sa.Column('timestamp_start', sa.Float(), nullable=True),
        sa.Column('timestamp_end', sa.Float(), nullable=True),
        sa.Column('generation_params', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_broll_generations_video_id'), 'broll_generations', ['video_id'], unique=False)
    op.create_index(op.f('ix_broll_generations_status'), 'broll_generations', ['status'], unique=False)

    # ============================================================
    # Publish tables (Slice 8)
    # ============================================================

    # publications table
    op.create_table('publications',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('platform', sa.Enum('YOUTUBE', 'TIKTOK', 'INSTAGRAM', name='publishplatform'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', name='publishstatus'), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', JSONB, nullable=True),
        sa.Column('platform_video_id', sa.String(length=200), nullable=True),
        sa.Column('platform_url', sa.String(length=1000), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('publish_options', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_publications_video_id'), 'publications', ['video_id'], unique=False)
    op.create_index(op.f('ix_publications_platform'), 'publications', ['platform'], unique=False)
    op.create_index(op.f('ix_publications_status'), 'publications', ['status'], unique=False)

    # publish_schedules table
    op.create_table('publish_schedules',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('platforms', JSONB, nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', name='publishstatus'), nullable=False),
        sa.Column('recurrence', sa.String(length=50), nullable=True),
        sa.Column('schedule_options', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_publish_schedules_video_id'), 'publish_schedules', ['video_id'], unique=False)
    op.create_index(op.f('ix_publish_schedules_scheduled_at'), 'publish_schedules', ['scheduled_at'], unique=False)

    # ============================================================
    # Analytics tables (Slice 9)
    # ============================================================

    # video_analytics table
    op.create_table('video_analytics',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('views', sa.Integer(), nullable=False, default=0),
        sa.Column('watch_time_minutes', sa.Integer(), nullable=False, default=0),
        sa.Column('average_view_duration', sa.Float(), nullable=True),
        sa.Column('likes', sa.Integer(), nullable=False, default=0),
        sa.Column('dislikes', sa.Integer(), nullable=False, default=0),
        sa.Column('comments', sa.Integer(), nullable=False, default=0),
        sa.Column('shares', sa.Integer(), nullable=False, default=0),
        sa.Column('subscribers_gained', sa.Integer(), nullable=False, default=0),
        sa.Column('subscribers_lost', sa.Integer(), nullable=False, default=0),
        sa.Column('ctr', sa.Float(), nullable=True),
        sa.Column('impressions', sa.Integer(), nullable=False, default=0),
        sa.Column('traffic_sources', JSONB, nullable=True),
        sa.Column('demographics', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_video_analytics_video_id'), 'video_analytics', ['video_id'], unique=False)
    op.create_index(op.f('ix_video_analytics_date'), 'video_analytics', ['date'], unique=False)

    # channel_analytics table
    op.create_table('channel_analytics',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_views', sa.Integer(), nullable=False, default=0),
        sa.Column('total_watch_time_minutes', sa.Integer(), nullable=False, default=0),
        sa.Column('subscribers', sa.Integer(), nullable=False, default=0),
        sa.Column('subscribers_change', sa.Integer(), nullable=False, default=0),
        sa.Column('total_videos', sa.Integer(), nullable=False, default=0),
        sa.Column('average_ctr', sa.Float(), nullable=True),
        sa.Column('revenue', sa.Float(), nullable=True),
        sa.Column('top_videos', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_channel_analytics_client_id'), 'channel_analytics', ['client_id'], unique=False)
    op.create_index(op.f('ix_channel_analytics_date'), 'channel_analytics', ['date'], unique=False)

    # analytics_reports table
    op.create_table('analytics_reports',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), nullable=False),
        sa.Column('report_type', sa.Enum('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', name='reporttype'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='reportstatus'), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('date_from', sa.Date(), nullable=False),
        sa.Column('date_to', sa.Date(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('data', JSONB, nullable=True),
        sa.Column('file_url', sa.String(length=1000), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_reports_client_id'), 'analytics_reports', ['client_id'], unique=False)
    op.create_index(op.f('ix_analytics_reports_report_type'), 'analytics_reports', ['report_type'], unique=False)

    # ============================================================
    # Admin tables (Slice 10)
    # ============================================================

    # system_settings table
    op.create_table('system_settings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('value_type', sa.String(length=50), nullable=False, default='string'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, default=False),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=True)

    # api_connections table
    op.create_table('api_connections',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('service', sa.String(length=50), nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'ERROR', name='apiconnectionstatus'), nullable=False),
        sa.Column('credentials', JSONB, nullable=True),
        sa.Column('settings', JSONB, nullable=True),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_connections_name'), 'api_connections', ['name'], unique=False)
    op.create_index(op.f('ix_api_connections_service'), 'api_connections', ['service'], unique=False)
    op.create_index(op.f('ix_api_connections_client_id'), 'api_connections', ['client_id'], unique=False)
    op.create_index(op.f('ix_api_connections_status'), 'api_connections', ['status'], unique=False)

    # audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.Enum('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'GENERATE', name='auditaction'), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('extra_data', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_type'), 'audit_logs', ['resource_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_id'), 'audit_logs', ['resource_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # Admin tables
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_resource_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_resource_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index(op.f('ix_api_connections_status'), table_name='api_connections')
    op.drop_index(op.f('ix_api_connections_client_id'), table_name='api_connections')
    op.drop_index(op.f('ix_api_connections_service'), table_name='api_connections')
    op.drop_index(op.f('ix_api_connections_name'), table_name='api_connections')
    op.drop_table('api_connections')

    op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    op.drop_table('system_settings')

    # Analytics tables
    op.drop_index(op.f('ix_analytics_reports_report_type'), table_name='analytics_reports')
    op.drop_index(op.f('ix_analytics_reports_client_id'), table_name='analytics_reports')
    op.drop_table('analytics_reports')

    op.drop_index(op.f('ix_channel_analytics_date'), table_name='channel_analytics')
    op.drop_index(op.f('ix_channel_analytics_client_id'), table_name='channel_analytics')
    op.drop_table('channel_analytics')

    op.drop_index(op.f('ix_video_analytics_date'), table_name='video_analytics')
    op.drop_index(op.f('ix_video_analytics_video_id'), table_name='video_analytics')
    op.drop_table('video_analytics')

    # Publish tables
    op.drop_index(op.f('ix_publish_schedules_scheduled_at'), table_name='publish_schedules')
    op.drop_index(op.f('ix_publish_schedules_video_id'), table_name='publish_schedules')
    op.drop_table('publish_schedules')

    op.drop_index(op.f('ix_publications_status'), table_name='publications')
    op.drop_index(op.f('ix_publications_platform'), table_name='publications')
    op.drop_index(op.f('ix_publications_video_id'), table_name='publications')
    op.drop_table('publications')

    # Production tables
    op.drop_index(op.f('ix_broll_generations_status'), table_name='broll_generations')
    op.drop_index(op.f('ix_broll_generations_video_id'), table_name='broll_generations')
    op.drop_table('broll_generations')

    op.drop_index(op.f('ix_avatar_generations_status'), table_name='avatar_generations')
    op.drop_index(op.f('ix_avatar_generations_video_id'), table_name='avatar_generations')
    op.drop_table('avatar_generations')

    op.drop_index(op.f('ix_audio_generations_status'), table_name='audio_generations')
    op.drop_index(op.f('ix_audio_generations_video_id'), table_name='audio_generations')
    op.drop_table('audio_generations')

    # Script tables
    op.drop_index(op.f('ix_metadata_generations_video_id'), table_name='metadata_generations')
    op.drop_table('metadata_generations')

    op.drop_index(op.f('ix_thumbnails_status'), table_name='thumbnails')
    op.drop_index(op.f('ix_thumbnails_video_id'), table_name='thumbnails')
    op.drop_table('thumbnails')

    op.drop_index(op.f('ix_scripts_status'), table_name='scripts')
    op.drop_index(op.f('ix_scripts_video_id'), table_name='scripts')
    op.drop_table('scripts')

    # Planning tables
    op.drop_index(op.f('ix_project_schedules_scheduled_date'), table_name='project_schedules')
    op.drop_index(op.f('ix_project_schedules_project_id'), table_name='project_schedules')
    op.drop_table('project_schedules')

    op.drop_index(op.f('ix_ai_suggestions_is_adopted'), table_name='ai_suggestions')
    op.drop_index(op.f('ix_ai_suggestions_suggestion_type'), table_name='ai_suggestions')
    op.drop_index(op.f('ix_ai_suggestions_session_id'), table_name='ai_suggestions')
    op.drop_table('ai_suggestions')

    op.drop_index(op.f('ix_planning_chat_sessions_user_id'), table_name='planning_chat_sessions')
    op.drop_index(op.f('ix_planning_chat_sessions_project_id'), table_name='planning_chat_sessions')
    op.drop_table('planning_chat_sessions')

    # Drop enums
    sa.Enum('ACTIVE', 'INACTIVE', 'ERROR', name='apiconnectionstatus').drop(op.get_bind())
    sa.Enum('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'GENERATE', name='auditaction').drop(op.get_bind())
    sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='reportstatus').drop(op.get_bind())
    sa.Enum('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', name='reporttype').drop(op.get_bind())
    sa.Enum('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', name='publishstatus').drop(op.get_bind())
    sa.Enum('YOUTUBE', 'TIKTOK', 'INSTAGRAM', name='publishplatform').drop(op.get_bind())
    sa.Enum('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', name='generationstatus').drop(op.get_bind())
    sa.Enum('DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'REJECTED', name='thumbnailstatus').drop(op.get_bind())
    sa.Enum('DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'REJECTED', name='scriptstatus').drop(op.get_bind())
    sa.Enum('CLAUDE', 'GEMINI', 'MANUAL', name='generatortype').drop(op.get_bind())
    sa.Enum('TITLE', 'TOPIC', 'OUTLINE', 'HOOK', 'CTA', 'TARGET_AUDIENCE', name='suggestiontype').drop(op.get_bind())
    sa.Enum('ACTIVE', 'COMPLETED', 'ABANDONED', name='planningsessionstatus').drop(op.get_bind())
