"""add tiered auto-moderation columns

Revision ID: a7f1c3d82e49
Revises: d8a2e4f01b3c
Create Date: 2026-09-19 01:57:00.000000+08:00

ADR-011: Adds 'review' and 'archived' to mantra_wall_posts
moderation_status CHECK constraint, adds filter_reason column,
and adds report resolution columns to mantra_wall_reports.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f1c3d82e49'
down_revision: Union[str, None] = 'd8a2e4f01b3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- mantra_wall_posts ---
    # 1. Drop the old CHECK constraint and recreate with new statuses
    op.drop_constraint('ck_mantra_wall_moderation_status', 'mantra_wall_posts', type_='check')
    op.create_check_constraint(
        'ck_mantra_wall_moderation_status',
        'mantra_wall_posts',
        "moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'review', 'archived')",
    )

    # 2. Add filter_reason column
    op.add_column('mantra_wall_posts', sa.Column('filter_reason', sa.String(), nullable=True))

    # --- mantra_wall_reports ---
    # 3. Add resolution tracking columns
    op.add_column('mantra_wall_reports', sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('mantra_wall_reports', sa.Column('resolved_by', sa.UUID(), nullable=True))
    op.add_column('mantra_wall_reports', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        'fk_mantra_wall_reports_resolved_by',
        'mantra_wall_reports',
        'profiles',
        ['resolved_by'],
        ['id'],
    )


def downgrade() -> None:
    # --- mantra_wall_reports ---
    op.drop_constraint('fk_mantra_wall_reports_resolved_by', 'mantra_wall_reports', type_='foreignkey')
    op.drop_column('mantra_wall_reports', 'resolved_at')
    op.drop_column('mantra_wall_reports', 'resolved_by')
    op.drop_column('mantra_wall_reports', 'resolved')

    # --- mantra_wall_posts ---
    op.drop_column('mantra_wall_posts', 'filter_reason')
    op.drop_constraint('ck_mantra_wall_moderation_status', 'mantra_wall_posts', type_='check')
    op.create_check_constraint(
        'ck_mantra_wall_moderation_status',
        'mantra_wall_posts',
        "moderation_status IN ('pending', 'approved', 'rejected', 'flagged')",
    )
