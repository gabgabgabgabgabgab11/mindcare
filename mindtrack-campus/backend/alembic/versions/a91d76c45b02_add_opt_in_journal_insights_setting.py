"""Add an opt-in setting for journal sentiment insights.

Revision ID: a91d76c45b02
Revises: b684a2d1f930
Create Date: 2026-11-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a91d76c45b02"
down_revision: Union[str, Sequence[str], None] = "b684a2d1f930"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "privacy_settings",
        sa.Column(
            "journal_insights_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("privacy_settings", "journal_insights_enabled")
