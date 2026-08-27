from app.db.session import Base
import app.models  # noqa: F401 — ensure models are registered


def test_profiles_table_is_registered():
    assert "profiles" in Base.metadata.tables


def test_profiles_table_has_expected_columns():
    columns = Base.metadata.tables["profiles"].columns.keys()
    assert "id" in columns
    assert "role" in columns
    assert "year_level" in columns
    assert "program" in columns
    assert "created_at" in columns
    assert "updated_at" in columns


def test_auth_users_reference_table_is_not_managed_for_creation():
    # auth.users must be known to SQLAlchemy (for the FK) but must be
    # in the "auth" schema, not "public" — this is what keeps Alembic
    # from ever trying to create/drop Supabase's own table.
    table = Base.metadata.tables["auth.users"]
    assert table.schema == "auth"