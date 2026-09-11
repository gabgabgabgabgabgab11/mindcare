import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base


def _require_test_database_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip(
            "TEST_DATABASE_URL not set - integration tests require a "
            "dedicated test database, never the real Supabase project."
        )
    if "supabase.co" in url and "test" not in url.lower():
        pytest.fail(
            "TEST_DATABASE_URL looks like it may point at a real "
            "Supabase project, not a test one. Refusing to run - "
            "use a separate test project or local Postgres instead."
        )
    return url


@pytest.fixture(scope="session")
def engine():
    url = _require_test_database_url()
    return create_engine(url)


@pytest.fixture
def db_session(engine):
    """Real DB session wrapped in a transaction that's always rolled
    back - the test database is never actually mutated persistently,
    even though everything inside a test runs against real SQL."""
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()