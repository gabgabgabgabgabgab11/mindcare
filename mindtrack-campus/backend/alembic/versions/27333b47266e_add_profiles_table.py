"""add profiles table

Revision ID: 27333b47266e
Revises: 4a6c332df6ae
Create Date: 2026-08-28 03:39:32.960220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '27333b47266e'
down_revision: Union[str, Sequence[str], None] = '4a6c332df6ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('profiles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('role', sa.String(), server_default='student', nullable=False),
    sa.Column('year_level', sa.String(), nullable=True),
    sa.Column('program', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("role IN ('student', 'admin')", name='ck_profiles_role'),
    sa.ForeignKeyConstraint(['id'], ['auth.users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('profiles')