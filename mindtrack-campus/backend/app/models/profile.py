import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, Table
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base

# Reference-only table: represents Supabase Auth's auth.users table so
# SQLAlchemy can resolve the foreign key below. This table is NEVER
# created, altered, or dropped by our Alembic migrations — see
# alembic/env.py, where autogenerate only tracks the public schema.
auth_users = Table(
    "users",
    Base.metadata,
    Column("id", PG_UUID(as_uuid=True), primary_key=True),
    schema="auth",
)


class Profile(Base):
    """Extends Supabase's auth.users with app-specific fields.

    Design decision (see docs/DECISIONS.md ADR-002): role is stored as
    a plain String + CHECK constraint rather than a native Postgres
    ENUM, so adding a role later is a simple migration instead of an
    ALTER TYPE operation.
    """

    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("role IN ('student', 'admin')", name="ck_profiles_role"),
    )

    id = Column(PG_UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
    role = Column(String, nullable=False, server_default="student")
    year_level = Column(String, nullable=True)
    program = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )