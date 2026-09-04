"""add resources table

Revision ID: d6b09dacd6ee
Revises: 595353480c37u
Create Date: 2026-09-05 05:59:22.724575

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6b09dacd6ee'
down_revision: Union[str, Sequence[str], None] = '6678bff1baf3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('resources',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('url', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resources_category'), 'resources', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_resources_category'), table_name='resources')
    op.drop_table('resources')
