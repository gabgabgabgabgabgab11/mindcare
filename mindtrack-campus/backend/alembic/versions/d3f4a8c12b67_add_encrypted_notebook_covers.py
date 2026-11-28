"""Add encrypted cover images to journal notebooks.

Revision ID: d3f4a8c12b67
Revises: b6a2e4c7d911
Create Date: 2026-11-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3f4a8c12b67"
down_revision: Union[str, Sequence[str], None] = "b6a2e4c7d911"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("journal_folders", sa.Column("cover_image", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("journal_folders", "cover_image")
