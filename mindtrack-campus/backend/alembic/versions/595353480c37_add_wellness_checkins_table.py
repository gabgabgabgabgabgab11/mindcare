"""add wellness_checkins table

Revision ID: 595353480c37
Revises: 429fc9474422
Create Date: <fill in>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6678bff1baf3'
down_revision: Union[str, Sequence[str], None] = '429fc9474422'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('wellness_checkins',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('mood_score', sa.SmallInteger(), nullable=False),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("mood_score >= 1 AND mood_score <= 5", name='ck_wellness_checkins_mood_score'),
    sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wellness_checkins_user_id'), 'wellness_checkins', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_wellness_checkins_user_id'), table_name='wellness_checkins')
    op.drop_table('wellness_checkins')