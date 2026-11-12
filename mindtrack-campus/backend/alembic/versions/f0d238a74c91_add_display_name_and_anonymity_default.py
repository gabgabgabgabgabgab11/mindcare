"""add profile display name and default activity anonymization on

Revision ID: f0d238a74c91
Revises: e4a1d9c7b2f0
Create Date: 2026-11-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0d238a74c91"
down_revision: Union[str, Sequence[str], None] = "e4a1d9c7b2f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("display_name", sa.String(length=50), nullable=True))
    op.alter_column(
        "privacy_settings",
        "anonymize_activity",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.true(),
    )


def downgrade() -> None:
    op.alter_column(
        "privacy_settings",
        "anonymize_activity",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=None,
    )
    op.drop_column("profiles", "display_name")
