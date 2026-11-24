"""add profile avatar and cover images

Revision ID: b684a2d1f930
Revises: f0d238a74c91
Create Date: 2026-11-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b684a2d1f930"
down_revision: Union[str, Sequence[str], None] = "f0d238a74c91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("avatar_image", sa.Text(), nullable=True))
    op.add_column("profiles", sa.Column("cover_image", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "cover_image")
    op.drop_column("profiles", "avatar_image")
