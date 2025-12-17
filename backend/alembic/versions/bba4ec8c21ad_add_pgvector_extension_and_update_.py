"""add_pgvector_extension_and_update_embedding_column

Revision ID: bba4ec8c21ad
Revises: 4a2b3c4d5e6f
Create Date: 2025-12-17 23:47:09.545040

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = 'bba4ec8c21ad'
down_revision: Union[str, None] = '4a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pgvector拡張を有効化
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # TEXTからVECTORへの型変換（既存のNULLデータはそのまま維持）
    # 既存のTEXT型データをクリアしてからVECTOR型に変更
    op.execute('ALTER TABLE knowledges ALTER COLUMN embedding DROP DEFAULT')
    op.execute('ALTER TABLE knowledges ALTER COLUMN embedding TYPE vector(1536) USING NULL')

    # コメント更新
    op.execute("COMMENT ON COLUMN knowledges.embedding IS 'ベクトル埋め込み（RAG用・1536次元）'")

    # HNSWインデックスを作成
    op.create_index(
        'ix_knowledges_embedding_hnsw',
        'knowledges',
        ['embedding'],
        unique=False,
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'}
    )


def downgrade() -> None:
    # HNSWインデックスを削除
    op.drop_index(
        'ix_knowledges_embedding_hnsw',
        table_name='knowledges',
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'}
    )

    # VECTORからTEXTへの型変換
    op.execute('ALTER TABLE knowledges ALTER COLUMN embedding TYPE TEXT USING NULL')

    # コメント更新
    op.execute("COMMENT ON COLUMN knowledges.embedding IS 'ベクトル埋め込み（RAG用）'")

    # pgvector拡張を削除（注意: 他のテーブルで使用している場合は削除しない）
    # op.execute('DROP EXTENSION IF EXISTS vector')
