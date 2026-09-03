import uuid

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.privacy import PrivacySettings
from app.models.profile import Profile
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakePrivacySession:
    def __init__(self):
        self._profiles = {}
        self._settings = {}

    def get(self, model, pk):
        if model.__name__ == "Profile":
            return self._profiles.get(pk)
        if model.__name__ == "PrivacySettings":
            return self._settings.get(pk)
        return None

    def add(self, obj):
        if type(obj).__name__ == "PrivacySettings":
            if obj.allow_activity_tracking is None:
                obj.allow_activity_tracking = True
            if obj.anonymize_activity is None:
                obj.anonymize_activity = False
            self._settings[obj.user_id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        from datetime import datetime, timezone
        obj.updated_at = datetime.now(timezone.utc)


def _override(student_id: str, session: _FakePrivacySession):
    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")
    session._profiles[uuid.UUID(student_id)] = Profile(id=uuid.UUID(student_id), role="student")
    return override_user


def test_get_privacy_settings_creates_defaults_on_first_access():
    student_id = str(uuid.uuid4())
    session = _FakePrivacySession()
    app.dependency_overrides[get_current_supabase_user] = _override(student_id, session)
    app.dependency_overrides[get_db] = lambda: session
    try:
        response = client.get("/api/v1/privacy/settings")
        assert response.status_code == 200
        body = response.json()
        assert body["allow_activity_tracking"] is True
        assert body["anonymize_activity"] is False
        assert "Hide your name and dates" in body["anonymize_activity_description"]
    finally:
        app.dependency_overrides.clear()


def test_put_privacy_settings_updates_values():
    student_id = str(uuid.uuid4())
    session = _FakePrivacySession()
    app.dependency_overrides[get_current_supabase_user] = _override(student_id, session)
    app.dependency_overrides[get_db] = lambda: session
    try:
        client.get("/api/v1/privacy/settings")  # create defaults first
        response = client.put(
            "/api/v1/privacy/settings",
            json={"allow_activity_tracking": False, "anonymize_activity": True},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["allow_activity_tracking"] is False
        assert body["anonymize_activity"] is True
    finally:
        app.dependency_overrides.clear()


def test_privacy_settings_without_token_returns_401():
    response = client.get("/api/v1/privacy/settings")
    assert response.status_code == 401