"""merge migration heads

Revision ID: fc48e0764766
Revises: a91d76c45b02, c03a91e84d72
Create Date: 2026-11-28 17:18:31.294267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc48e0764766'
down_revision: Union[str, Sequence[str], None] = ('a91d76c45b02', 'c03a91e84d72')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
