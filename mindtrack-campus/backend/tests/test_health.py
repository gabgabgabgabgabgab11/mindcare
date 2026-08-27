from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


class _FakeWorkingSession:
    def execute(self, *_args, **_kwargs):
        return None


class _FakeBrokenSession:
    def execute(self, *_args, **_kwargs):
        raise RuntimeError("simulated database failure")


def test_health_db_returns_ok_when_database_reachable():

    def override_get_db():
        yield _FakeWorkingSession()

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.get("/health/db")

        assert response.status_code == 200
        assert response.json() == {
            "status": "ok",
            "database": "connected"
        }

    finally:
        app.dependency_overrides.clear()


def test_health_db_returns_error_when_database_unreachable():

    def override_get_db():
        yield _FakeBrokenSession()

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.get("/health/db")

        assert response.status_code == 200
        assert response.json() == {
            "status": "error",
            "database": "unreachable"
        }

    finally:
        app.dependency_overrides.clear()