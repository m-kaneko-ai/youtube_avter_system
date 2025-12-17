"""add_youtube_oauth_fields_to_user

Revision ID: 4a2b3c4d5e6f
Revises: 3f1f9a01d400
Create Date: 2025-12-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a2b3c4d5e6f'
down_revision: Union[str, None] = '3f1f9a01d400'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add YouTube OAuth fields to users table"""
    op.add_column('users', sa.Column(
        'youtube_access_token',
        sa.String(length=500),
        nullable=True,
        comment='YouTube Analytics API アクセストークン'
    ))
    op.add_column('users', sa.Column(
        'youtube_refresh_token',
        sa.String(length=500),
        nullable=True,
        comment='YouTube Analytics API リフレッシュトークン'
    ))
    op.add_column('users', sa.Column(
        'youtube_token_expires_at',
        sa.Integer(),
        nullable=True,
        comment='YouTube トークン有効期限（UNIX timestamp）'
    ))
    op.add_column('users', sa.Column(
        'youtube_channel_id',
        sa.String(length=255),
        nullable=True,
        comment='YouTube チャンネルID'
    ))


def downgrade() -> None:
    """Remove YouTube OAuth fields from users table"""
    op.drop_column('users', 'youtube_channel_id')
    op.drop_column('users', 'youtube_token_expires_at')
    op.drop_column('users', 'youtube_refresh_token')
    op.drop_column('users', 'youtube_access_token')
