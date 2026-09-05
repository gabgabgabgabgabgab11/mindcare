"""add mantra wall posts and reports tables

Revision ID: 1a3126e15cee
Revises: d6b09dacd6ee
Create Date: 2026-09-06 02:01:19.302133

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a3126e15cee'
down_revision: Union[str, Sequence[str], None] = 'd6b09dacd6ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('mantra_wall_posts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('post_type', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('nickname', sa.String(), nullable=True),
    sa.Column('moderation_status', sa.String(), nullable=False),
    sa.Column('moderated_by', sa.UUID(), nullable=True),
    sa.Column('moderated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("post_type IN ('affirmation', 'gratitude', 'win')", name='ck_mantra_wall_post_type'),
    sa.CheckConstraint("moderation_status IN ('pending', 'approved', 'rejected', 'flagged')", name='ck_mantra_wall_moderation_status'),
    sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ),
    sa.ForeignKeyConstraint(['moderated_by'], ['profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mantra_wall_posts_user_id'), 'mantra_wall_posts', ['user_id'], unique=False)
    op.create_index(op.f('ix_mantra_wall_posts_moderation_status'), 'mantra_wall_posts', ['moderation_status'], unique=False)

    op.create_table('mantra_wall_reports',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('post_id', sa.UUID(), nullable=False),
    sa.Column('reporter_id', sa.UUID(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['mantra_wall_posts.id'], ),
    sa.ForeignKeyConstraint(['reporter_id'], ['profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mantra_wall_reports_post_id'), 'mantra_wall_reports', ['post_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_mantra_wall_reports_post_id'), table_name='mantra_wall_reports')
    op.drop_table('mantra_wall_reports')
    op.drop_index(op.f('ix_mantra_wall_posts_moderation_status'), table_name='mantra_wall_posts')
    op.drop_index(op.f('ix_mantra_wall_posts_user_id'), table_name='mantra_wall_posts')
    op.drop_table('mantra_wall_posts')
