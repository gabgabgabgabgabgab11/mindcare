"""Persist Mantra Wall hearts.

Revision ID: c03a91e84d72
Revises: b684a2d1f930
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c03a91e84d72"
down_revision = "b684a2d1f930"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mantra_wall_hearts",
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["mantra_wall_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "user_id"),
    )
    # This app accesses data through FastAPI's database connection. No browser
    # Data API role should be able to read the identities behind hearts.
    op.execute('ALTER TABLE public.mantra_wall_hearts ENABLE ROW LEVEL SECURITY')


def downgrade():
    op.drop_table("mantra_wall_hearts")
