"""add section to profiles

Revision ID: d8a2e4f01b3c
Revises: c19d77b5f804
Create Date: 2026-09-17 18:34:00.000000+08:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8a2e4f01b3c'
down_revision: Union[str, None] = '2c409dc1b07c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('section', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'section')
