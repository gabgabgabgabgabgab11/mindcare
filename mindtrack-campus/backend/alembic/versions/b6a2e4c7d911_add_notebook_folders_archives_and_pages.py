"""Add journal folders, archive state, and private page decorations.

Revision ID: b6a2e4c7d911
Revises: fc48e0764766
Create Date: 2026-11-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b6a2e4c7d911"
down_revision: Union[str, Sequence[str], None] = "fc48e0764766"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "journal_folders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("cover_color", sa.String(length=20), server_default="sage", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_journal_folders_user_id", "journal_folders", ["user_id"], unique=False)

    op.add_column("journals", sa.Column("title", sa.Text(), nullable=True))
    op.add_column("journals", sa.Column("folder_id", sa.UUID(), nullable=True))
    op.add_column(
        "journals",
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("journals", sa.Column("decorations", sa.Text(), nullable=True))
    op.add_column(
        "journals",
        sa.Column("decoration_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_index("ix_journals_folder_id", "journals", ["folder_id"], unique=False)
    op.create_foreign_key(
        "fk_journals_folder_id_journal_folders",
        "journals",
        "journal_folders",
        ["folder_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_journals_folder_id_journal_folders", "journals", type_="foreignkey")
    op.drop_index("ix_journals_folder_id", table_name="journals")
    op.drop_column("journals", "decorations")
    op.drop_column("journals", "decoration_count")
    op.drop_column("journals", "is_archived")
    op.drop_column("journals", "folder_id")
    op.drop_column("journals", "title")
    op.drop_index("ix_journal_folders_user_id", table_name="journal_folders")
    op.drop_table("journal_folders")
