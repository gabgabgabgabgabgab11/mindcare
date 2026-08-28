import uuid

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeProfileSession:
    def __init__(self, seed_profile: Profile | None = None):
        self._profiles = {}
        if seed_profile:
            self._profiles[seed_profile.id] = seed_profile

    def get(self, model, pk):
        return self._profiles.get(pk)

    def add(self, obj):
        self._profiles[obj.id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def _override_as(role: str):
    user_id = uuid.uuid4()
    fake_profile = Profile(id=user_id, role=role)

    def override_user():
        return SupabaseUser(id=str(user_id), email=f"{role}@example.com")

    def override_db():
        yield _FakeProfileSession(seed_profile=fake_profile)

    return override_user, override_db


def test_admin_check_blocks_student_with_403():
    override_user, override_db = _override_as("student")
    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/auth/admin-check")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_admin_check_allows_admin_with_200():
    override_user, override_db = _override_as("admin")
    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/auth/admin-check")
        assert response.status_code == 200
        assert response.json()["role"] == "admin"
    finally:
        app.dependency_overrides.clear()


def test_admin_check_without_token_returns_401_not_403():
    # No auth override at all — should fail at the authentication
    # layer (401), before RBAC's role check ever runs (403).
    response = client.get("/api/v1/auth/admin-check")
    assert response.status_code == 401