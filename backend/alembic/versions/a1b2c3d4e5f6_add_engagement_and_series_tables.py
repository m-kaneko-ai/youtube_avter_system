"""Add engagement and series tables

Revision ID: a1b2c3d4e5f6
Revises: 9b3d4e5f6a7c
Create Date: 2025-12-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9b3d4e5f6a7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # Engagement Status Enum
    # ============================================================
    op.execute("CREATE TYPE engagementstatus AS ENUM ('draft', 'active', 'paused', 'completed', 'archived')")

    # ============================================================
    # Series Status and Type Enums
    # ============================================================
    op.execute("CREATE TYPE seriesstatus AS ENUM ('draft', 'active', 'paused', 'completed', 'archived')")
    op.execute("CREATE TYPE seriestype AS ENUM ('playlist', 'topic', 'tutorial', 'seasonal', 'campaign')")

    # ============================================================
    # Short to Long Links table
    # ============================================================
    op.create_table('short_to_long_links',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='連携ID（UUID）'),
        sa.Column('short_video_id', UUID(as_uuid=True), nullable=False, comment='ショート動画ID'),
        sa.Column('long_video_id', UUID(as_uuid=True), nullable=False, comment='長尺動画ID'),
        sa.Column('link_type', sa.String(50), nullable=False, server_default='description', comment='連携タイプ'),
        sa.Column('link_text', sa.Text(), nullable=True, comment='誘導テキスト'),
        sa.Column('link_position', sa.String(50), nullable=True, comment='リンク配置位置'),
        sa.Column('status', sa.Enum('draft', 'active', 'paused', 'completed', 'archived', name='engagementstatus', create_type=False), nullable=False, server_default='draft', comment='連携ステータス'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='有効/無効'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['short_video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['long_video_id'], ['videos.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_short_to_long_links_short_video_id', 'short_to_long_links', ['short_video_id'])
    op.create_index('ix_short_to_long_links_long_video_id', 'short_to_long_links', ['long_video_id'])
    op.create_index('ix_short_to_long_links_status', 'short_to_long_links', ['status'])

    # ============================================================
    # Engagement Metrics table
    # ============================================================
    op.create_table('engagement_metrics',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='指標ID（UUID）'),
        sa.Column('link_id', UUID(as_uuid=True), nullable=False, comment='連携ID'),
        sa.Column('recorded_date', sa.DateTime(), nullable=False, comment='記録日'),
        sa.Column('short_views', sa.Integer(), nullable=False, server_default='0', comment='ショート動画再生回数'),
        sa.Column('short_likes', sa.Integer(), nullable=False, server_default='0', comment='ショート動画いいね数'),
        sa.Column('short_comments', sa.Integer(), nullable=False, server_default='0', comment='ショート動画コメント数'),
        sa.Column('short_shares', sa.Integer(), nullable=False, server_default='0', comment='ショート動画共有数'),
        sa.Column('long_views', sa.Integer(), nullable=False, server_default='0', comment='長尺動画再生回数'),
        sa.Column('long_likes', sa.Integer(), nullable=False, server_default='0', comment='長尺動画いいね数'),
        sa.Column('long_comments', sa.Integer(), nullable=False, server_default='0', comment='長尺動画コメント数'),
        sa.Column('long_watch_time_minutes', sa.Float(), nullable=True, comment='長尺動画総視聴時間（分）'),
        sa.Column('click_through_count', sa.Integer(), nullable=False, server_default='0', comment='クリックスルー数'),
        sa.Column('click_through_rate', sa.Float(), nullable=True, comment='クリックスルー率（%）'),
        sa.Column('conversion_count', sa.Integer(), nullable=False, server_default='0', comment='コンバージョン数'),
        sa.Column('conversion_rate', sa.Float(), nullable=True, comment='コンバージョン率（%）'),
        sa.Column('extra_data', JSONB(), nullable=True, comment='追加指標データ（JSON）'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['link_id'], ['short_to_long_links.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_engagement_metrics_link_id', 'engagement_metrics', ['link_id'])
    op.create_index('ix_engagement_metrics_recorded_date', 'engagement_metrics', ['recorded_date'])

    # ============================================================
    # Short Video Clips table
    # ============================================================
    op.create_table('short_video_clips',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='切り抜きID（UUID）'),
        sa.Column('short_video_id', UUID(as_uuid=True), nullable=False, comment='ショート動画ID'),
        sa.Column('source_video_id', UUID(as_uuid=True), nullable=True, comment='元動画ID'),
        sa.Column('start_time_seconds', sa.Integer(), nullable=True, comment='元動画の開始時間（秒）'),
        sa.Column('end_time_seconds', sa.Integer(), nullable=True, comment='元動画の終了時間（秒）'),
        sa.Column('clip_title', sa.String(200), nullable=True, comment='切り抜きタイトル'),
        sa.Column('clip_description', sa.Text(), nullable=True, comment='切り抜き説明'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false', comment='公開済みフラグ'),
        sa.Column('published_at', sa.DateTime(), nullable=True, comment='公開日時'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['short_video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_video_id'], ['videos.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_short_video_clips_short_video_id', 'short_video_clips', ['short_video_id'])
    op.create_index('ix_short_video_clips_source_video_id', 'short_video_clips', ['source_video_id'])

    # ============================================================
    # Series table
    # ============================================================
    op.create_table('series',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='シリーズID（UUID）'),
        sa.Column('project_id', UUID(as_uuid=True), nullable=True, comment='プロジェクトID'),
        sa.Column('knowledge_id', UUID(as_uuid=True), nullable=True, comment='ナレッジID'),
        sa.Column('name', sa.String(255), nullable=False, comment='シリーズ名'),
        sa.Column('description', sa.Text(), nullable=True, comment='シリーズ説明'),
        sa.Column('series_type', sa.Enum('playlist', 'topic', 'tutorial', 'seasonal', 'campaign', name='seriestype', create_type=False), nullable=False, server_default='playlist', comment='シリーズタイプ'),
        sa.Column('status', sa.Enum('draft', 'active', 'paused', 'completed', 'archived', name='seriesstatus', create_type=False), nullable=False, server_default='draft', comment='シリーズステータス'),
        sa.Column('youtube_playlist_id', sa.String(100), nullable=True, comment='YouTube再生リストID'),
        sa.Column('youtube_playlist_url', sa.String(500), nullable=True, comment='YouTube再生リストURL'),
        sa.Column('thumbnail_url', sa.String(500), nullable=True, comment='シリーズサムネイルURL'),
        sa.Column('tags', ARRAY(sa.String(50)), nullable=True, comment='タグ配列'),
        sa.Column('start_date', sa.DateTime(), nullable=True, comment='開始日'),
        sa.Column('end_date', sa.DateTime(), nullable=True, comment='終了日'),
        sa.Column('target_video_count', sa.Integer(), nullable=True, comment='目標動画本数'),
        sa.Column('release_frequency', sa.String(50), nullable=True, comment='公開頻度'),
        sa.Column('total_videos', sa.Integer(), nullable=False, server_default='0', comment='総動画数'),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0', comment='総再生回数'),
        sa.Column('total_watch_time_hours', sa.Float(), nullable=True, comment='総視聴時間（時間）'),
        sa.Column('avg_view_duration_seconds', sa.Integer(), nullable=True, comment='平均視聴時間（秒）'),
        sa.Column('settings', JSONB(), nullable=True, comment='追加設定（JSON）'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='作成者ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_series_name', 'series', ['name'])
    op.create_index('ix_series_status', 'series', ['status'])
    op.create_index('ix_series_series_type', 'series', ['series_type'])
    op.create_index('ix_series_project_id', 'series', ['project_id'])
    op.create_index('ix_series_youtube_playlist_id', 'series', ['youtube_playlist_id'])

    # ============================================================
    # Series Video Items table
    # ============================================================
    op.create_table('series_video_items',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='アイテムID（UUID）'),
        sa.Column('series_id', UUID(as_uuid=True), nullable=False, comment='シリーズID'),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False, comment='動画ID'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0', comment='並び順インデックス'),
        sa.Column('episode_number', sa.Integer(), nullable=True, comment='エピソード番号'),
        sa.Column('episode_title', sa.String(255), nullable=True, comment='エピソードタイトル'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false', comment='公開済みフラグ'),
        sa.Column('published_at', sa.DateTime(), nullable=True, comment='公開日時'),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True, comment='公開予定日時'),
        sa.Column('views', sa.Integer(), nullable=False, server_default='0', comment='再生回数'),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0', comment='いいね数'),
        sa.Column('comments', sa.Integer(), nullable=False, server_default='0', comment='コメント数'),
        sa.Column('avg_view_duration_seconds', sa.Integer(), nullable=True, comment='平均視聴時間（秒）'),
        sa.Column('retention_rate', sa.Float(), nullable=True, comment='リテンション率（%）'),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='追加日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['series_id'], ['series.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_series_video_items_series_id', 'series_video_items', ['series_id'])
    op.create_index('ix_series_video_items_video_id', 'series_video_items', ['video_id'])

    # ============================================================
    # Series Performance Logs table
    # ============================================================
    op.create_table('series_performance_logs',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='ログID（UUID）'),
        sa.Column('series_id', UUID(as_uuid=True), nullable=False, comment='シリーズID'),
        sa.Column('recorded_date', sa.DateTime(), nullable=False, comment='記録日'),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0', comment='日次総再生回数'),
        sa.Column('new_subscribers', sa.Integer(), nullable=False, server_default='0', comment='新規登録者数'),
        sa.Column('watch_time_minutes', sa.Float(), nullable=True, comment='視聴時間（分）'),
        sa.Column('impressions', sa.Integer(), nullable=True, comment='インプレッション数'),
        sa.Column('impression_ctr', sa.Float(), nullable=True, comment='インプレッションCTR（%）'),
        sa.Column('extra_metrics', JSONB(), nullable=True, comment='追加指標（JSON）'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['series_id'], ['series.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_series_performance_logs_series_id', 'series_performance_logs', ['series_id'])
    op.create_index('ix_series_performance_logs_recorded_date', 'series_performance_logs', ['recorded_date'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_series_performance_logs_recorded_date', table_name='series_performance_logs')
    op.drop_index('ix_series_performance_logs_series_id', table_name='series_performance_logs')
    op.drop_table('series_performance_logs')

    op.drop_index('ix_series_video_items_video_id', table_name='series_video_items')
    op.drop_index('ix_series_video_items_series_id', table_name='series_video_items')
    op.drop_table('series_video_items')

    op.drop_index('ix_series_youtube_playlist_id', table_name='series')
    op.drop_index('ix_series_project_id', table_name='series')
    op.drop_index('ix_series_series_type', table_name='series')
    op.drop_index('ix_series_status', table_name='series')
    op.drop_index('ix_series_name', table_name='series')
    op.drop_table('series')

    op.drop_index('ix_short_video_clips_source_video_id', table_name='short_video_clips')
    op.drop_index('ix_short_video_clips_short_video_id', table_name='short_video_clips')
    op.drop_table('short_video_clips')

    op.drop_index('ix_engagement_metrics_recorded_date', table_name='engagement_metrics')
    op.drop_index('ix_engagement_metrics_link_id', table_name='engagement_metrics')
    op.drop_table('engagement_metrics')

    op.drop_index('ix_short_to_long_links_status', table_name='short_to_long_links')
    op.drop_index('ix_short_to_long_links_long_video_id', table_name='short_to_long_links')
    op.drop_index('ix_short_to_long_links_short_video_id', table_name='short_to_long_links')
    op.drop_table('short_to_long_links')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS seriestype')
    op.execute('DROP TYPE IF EXISTS seriesstatus')
    op.execute('DROP TYPE IF EXISTS engagementstatus')
