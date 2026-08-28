import uuid

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)

FAKE_USER_ID = str(uuid.uuid4())


class _FakeProfileSession:
    """Minimal in-memory stand-in for a SQLAlchemy Session — just
    enough to exercise get_or_create_profile without a real database."""

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


def test_me_without_token_returns_401():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token_returns_401():
    def override_get_current_user():
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    app.dependency_overrides[get_current_supabase_user] = override_get_current_user
    try:
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bad-token"})
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_me_with_valid_token_creates_default_student_profile():
    def override_get_current_user():
        return SupabaseUser(id=FAKE_USER_ID, email="student@example.com")

    def override_get_db():
        yield _FakeProfileSession()

    app.dependency_overrides[get_current_supabase_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer good-token"})
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == FAKE_USER_ID
        assert body["email"] == "student@example.com"
        assert body["role"] == "student"
    finally:
        app.dependency_overrides.clear()


def test_me_with_existing_profile_does_not_overwrite_role():
    def override_get_current_user():
        return SupabaseUser(id=FAKE_USER_ID, email="admin@example.com")

    fake_session = _FakeProfileSession()
    fake_session._profiles[uuid.UUID(FAKE_USER_ID)] = Profile(id=uuid.UUID(FAKE_USER_ID), role="admin")

    def override_get_db():
        yield fake_session

    app.dependency_overrides[get_current_supabase_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer good-token"})
        assert response.status_code == 200
        assert response.json()["role"] == "admin"
    finally:
        app.dependency_overrides.clear()