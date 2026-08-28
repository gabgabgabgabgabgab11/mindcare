import uuid

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.middleware.rate_limit import limiter
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeProfileSession:
    def __init__(self):
        self._profiles = {}

    def get(self, model, pk):
        return self._profiles.get(pk)

    def add(self, obj):
        self._profiles[obj.id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_me_endpoint_returns_429_after_rate_limit_exceeded():
    limiter.reset()  # start from a clean slate regardless of test order

    user_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(id=user_id, email="ratelimit-test@example.com")

    def override_db():
        yield _FakeProfileSession()

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        for _ in range(30):
            response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer x"})
            assert response.status_code == 200

        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer x"})
        assert response.status_code == 429
        assert response.json()["error"]["code"] == "RATE_LIMITED"
    finally:
        app.dependency_overrides.clear()
        limiter.reset()  # don't leak state into other tests