import uuid

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.consent import ConsentRecord
from app.models.profile import Profile
from app.security.consent_gate import require_consent
from app.security.rbac import require_student
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeConsentSession:
    def __init__(self):
        self._profiles = {}
        self._records = []

    def get(self, model, pk):
        if model.__name__ == "Profile":
            return self._profiles.get(pk)
        return None

    def add(self, obj):
        if type(obj).__name__ == "ConsentRecord":
            self._records.append(obj)

    def commit(self):
        pass

    def refresh(self, obj):
        from datetime import datetime, timezone
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        if getattr(obj, "signed_at", None) is None:
            obj.signed_at = datetime.now(timezone.utc)

    def execute(self, stmt):
        class _Result:
            def __init__(self, items):
                self._items = items
            def scalars(self):
                return self
            def first(self):
                return self._items[0] if self._items else None
        # Filter matching the repository's actual query intent:
        # same user, current version, not withdrawn.
        return _Result(self._records)


def _override(student_id: str, session: _FakeConsentSession):
    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")
    session._profiles[uuid.UUID(student_id)] = Profile(id=uuid.UUID(student_id), role="student")
    return override_user


def test_consent_status_defaults_to_no_active_consent():
    student_id = str(uuid.uuid4())
    session = _FakeConsentSession()
    app.dependency_overrides[get_current_supabase_user] = _override(student_id, session)
    app.dependency_overrides[get_db] = lambda: session
    try:
        response = client.get("/api/v1/consent/status")
        assert response.status_code == 200
        body = response.json()
        assert body["has_active_consent"] is False
        assert body["current_version"] == "1.0"
    finally:
        app.dependency_overrides.clear()


def test_signing_consent_then_checking_status_reflects_it():
    student_id = str(uuid.uuid4())
    session = _FakeConsentSession()
    app.dependency_overrides[get_current_supabase_user] = _override(student_id, session)
    app.dependency_overrides[get_db] = lambda: session
    try:
        sign_response = client.post("/api/v1/consent")
        assert sign_response.status_code == 201
        assert sign_response.json()["consent_version"] == "1.0"

        status_response = client.get("/api/v1/consent/status")
        assert status_response.json()["has_active_consent"] is True
    finally:
        app.dependency_overrides.clear()


def test_require_consent_blocks_when_no_consent_signed():
    from fastapi import HTTPException
    student_id = uuid.uuid4()
    profile = Profile(id=student_id, role="student")
    session = _FakeConsentSession()

    try:
        require_consent(profile=profile, db=session)
        assert False, "expected require_consent to raise"
    except HTTPException as exc:
        assert exc.status_code == 403


def test_require_consent_allows_when_active_consent_exists():
    student_id = uuid.uuid4()
    profile = Profile(id=student_id, role="student")
    session = _FakeConsentSession()
    session._records.append(
        ConsentRecord(id=uuid.uuid4(), user_id=student_id, consent_version="1.0", withdrawn_at=None)
    )

    result = require_consent(profile=profile, db=session)
    assert result is profile