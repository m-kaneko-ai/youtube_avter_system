"""Add CTA tables

Revision ID: 9b3d4e5f6a7c
Revises: 8a2c3f4b5d6e
Create Date: 2025-12-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision: str = '9b3d4e5f6a7c'
down_revision: Union[str, None] = '8a2c3f4b5d6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # CTA Templates table
    # ============================================================
    op.create_table('cta_templates',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='CTA ID（UUID）'),
        sa.Column('name', sa.String(200), nullable=False, comment='CTA名'),
        sa.Column('type', sa.Enum('line', 'email', 'download', 'discord', 'webinar', 'lp', 'custom', name='ctatype'), nullable=False, comment='CTAタイプ'),
        sa.Column('url', sa.Text(), nullable=False, comment='リンクURL'),
        sa.Column('utm_params', JSONB(), nullable=True, comment='UTMパラメータ（source, medium, campaign）'),
        sa.Column('short_url', sa.String(500), nullable=True, comment='短縮URL'),
        sa.Column('display_text', sa.Text(), nullable=False, comment='表示テキスト'),
        sa.Column('placement', sa.Enum('description_top', 'description_bottom', 'pinned_comment', name='ctaplacement'), nullable=False, comment='配置場所'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='有効/無効'),
        sa.Column('conversion_count', sa.Integer(), nullable=False, default=0, comment='コンバージョン数（クリック数）'),
        sa.Column('ctr', sa.Float(), nullable=True, default=0.0, comment='CTR（クリック率 %）'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='作成者ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_cta_templates_name', 'cta_templates', ['name'])
    op.create_index('ix_cta_templates_type', 'cta_templates', ['type'])
    op.create_index('ix_cta_templates_placement', 'cta_templates', ['placement'])
    op.create_index('ix_cta_templates_is_active', 'cta_templates', ['is_active'])

    # ============================================================
    # Video CTA Assignments table
    # ============================================================
    op.create_table('video_cta_assignments',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='割り当てID（UUID）'),
        sa.Column('video_id', UUID(as_uuid=True), nullable=False, comment='動画ID'),
        sa.Column('cta_id', UUID(as_uuid=True), nullable=False, comment='CTA ID'),
        sa.Column('placement', sa.Enum('description_top', 'description_bottom', 'pinned_comment', name='ctaplacement', create_type=False), nullable=False, comment='配置場所'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='有効/無効'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cta_id'], ['cta_templates.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_video_cta_assignments_video_id', 'video_cta_assignments', ['video_id'])
    op.create_index('ix_video_cta_assignments_cta_id', 'video_cta_assignments', ['cta_id'])
    op.create_index('ix_video_cta_assignments_placement', 'video_cta_assignments', ['placement'])

    # ============================================================
    # UTM Default Settings table
    # ============================================================
    op.create_table('utm_default_settings',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='設定ID（UUID）'),
        sa.Column('default_source', sa.String(100), nullable=False, server_default='youtube', comment='デフォルトソース'),
        sa.Column('default_medium', sa.String(100), nullable=False, server_default='video', comment='デフォルトメディウム'),
        sa.Column('campaign_naming_rule', sa.String(200), nullable=False, server_default='{video_id}_{cta_type}', comment='キャンペーン命名規則'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='作成日時'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='更新日時'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ============================================================
    # CTA Click Logs table
    # ============================================================
    op.create_table('cta_click_logs',
        sa.Column('id', UUID(as_uuid=True), nullable=False, comment='ログID（UUID）'),
        sa.Column('cta_id', UUID(as_uuid=True), nullable=False, comment='CTA ID'),
        sa.Column('video_id', UUID(as_uuid=True), nullable=True, comment='動画ID'),
        sa.Column('clicked_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), comment='クリック日時'),
        sa.Column('ip_address', sa.String(50), nullable=True, comment='IPアドレス'),
        sa.Column('user_agent', sa.String(500), nullable=True, comment='ユーザーエージェント'),
        sa.Column('referrer', sa.Text(), nullable=True, comment='リファラー'),
        sa.Column('utm_params', JSONB(), nullable=True, comment='クリック時のUTMパラメータ'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cta_id'], ['cta_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_cta_click_logs_cta_id', 'cta_click_logs', ['cta_id'])
    op.create_index('ix_cta_click_logs_video_id', 'cta_click_logs', ['video_id'])
    op.create_index('ix_cta_click_logs_clicked_at', 'cta_click_logs', ['clicked_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_cta_click_logs_clicked_at', table_name='cta_click_logs')
    op.drop_index('ix_cta_click_logs_video_id', table_name='cta_click_logs')
    op.drop_index('ix_cta_click_logs_cta_id', table_name='cta_click_logs')
    op.drop_table('cta_click_logs')

    op.drop_table('utm_default_settings')

    op.drop_index('ix_video_cta_assignments_placement', table_name='video_cta_assignments')
    op.drop_index('ix_video_cta_assignments_cta_id', table_name='video_cta_assignments')
    op.drop_index('ix_video_cta_assignments_video_id', table_name='video_cta_assignments')
    op.drop_table('video_cta_assignments')

    op.drop_index('ix_cta_templates_is_active', table_name='cta_templates')
    op.drop_index('ix_cta_templates_placement', table_name='cta_templates')
    op.drop_index('ix_cta_templates_type', table_name='cta_templates')
    op.drop_index('ix_cta_templates_name', table_name='cta_templates')
    op.drop_table('cta_templates')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS ctaplacement')
    op.execute('DROP TYPE IF EXISTS ctatype')
