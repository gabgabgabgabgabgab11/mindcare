"""add_companion_pet_to_profiles

Revision ID: 51d032624ef8
Revises: a7f1c3d82e49
Create Date: 2026-09-24 01:56:07.647242

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51d032624ef8'
down_revision: Union[str, Sequence[str], None] = 'a7f1c3d82e49'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('profiles', sa.Column('companion_pet', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('profiles', 'companion_pet')
