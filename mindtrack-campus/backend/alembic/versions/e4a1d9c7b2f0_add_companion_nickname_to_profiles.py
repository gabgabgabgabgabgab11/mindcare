"""add companion nickname to profiles

Revision ID: e4a1d9c7b2f0
Revises: 51d032624ef8
Create Date: 2026-10-23 00:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4a1d9c7b2f0"
down_revision: Union[str, Sequence[str], None] = "51d032624ef8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("companion_nickname", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "companion_nickname")
