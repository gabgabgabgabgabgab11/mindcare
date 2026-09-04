import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.models.wellness_checkin import WellnessCheckIn
from app.security.consent_gate import require_consent
from app.security.encryption import decrypt_text
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


# ============================================================
# FAKE DATABASE SESSION
# ============================================================

class _FakeCheckInSession:
    def __init__(self):
        self._checkins = {}

    def add(self, obj):
        if isinstance(obj, WellnessCheckIn):
            if obj.id is None:
                obj.id = uuid.uuid4()
            if obj.created_at is None:
                obj.created_at = datetime.now(timezone.utc)
            self._checkins[obj.id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        if isinstance(obj, WellnessCheckIn):
            if obj.id is None:
                obj.id = uuid.uuid4()
            if obj.created_at is None:
                obj.created_at = datetime.now(timezone.utc)

    def execute(self, stmt):
        class _Result:
            def __init__(self, items):
                self._items = items

            def scalars(self):
                return self

            def all(self):
                return self._items

        items = sorted(self._checkins.values(), key=lambda c: c.created_at, reverse=True)
        return _Result(items)


# ============================================================
# HELPERS
# ============================================================

def _student_user(student_id: str):
    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")
    return override_user


def _student_profile(student_id: str):
    def override_require_consent():
        return Profile(id=uuid.UUID(student_id), role="student")
    return override_require_consent


def _override_db(fake_session):
    def override_db():
        yield fake_session
    return override_db


# ============================================================
# AUTH TEST
# ============================================================

def test_submit_checkin_without_token_returns_401():
    response = client.post("/api/v1/wellness/checkins", json={"mood_score": 3})
    assert response.status_code == 401


# ============================================================
# CONSENT GATING (real gate, not overridden - same pattern as test_phq9.py)
# ============================================================

def test_submit_checkin_without_consent_returns_403():
    student_id = str(uuid.uuid4())

    class _NoConsentSession:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

        def execute(self, stmt):
            class _Result:
                def scalars(self):
                    return self
                def first(self):
                    return None
            return _Result()

    app.dependency_overrides[get_current_supabase_user] = _student_user(student_id)
    app.dependency_overrides[get_db] = lambda: _NoConsentSession()
    # IMPORTANT: do NOT override require_consent here - the real gate must reject.

    try:
        response = client.post("/api/v1/wellness/checkins", json={"mood_score": 3})
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


# ============================================================
# VALIDATION TESTS
# ============================================================

def test_submit_checkin_out_of_range_score_returns_422():
    student_id = str(uuid.uuid4())
    fake_session = _FakeCheckInSession()

    app.dependency_overrides[get_current_supabase_user] = _student_user(student_id)
    app.dependency_overrides[require_consent] = _student_profile(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)

    try:
        response = client.post("/api/v1/wellness/checkins", json={"mood_score": 7})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_submit_checkin_oversized_note_returns_422():
    student_id = str(uuid.uuid4())
    fake_session = _FakeCheckInSession()

    app.dependency_overrides[get_current_supabase_user] = _student_user(student_id)
    app.dependency_overrides[require_consent] = _student_profile(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)

    try:
        response = client.post(
            "/api/v1/wellness/checkins",
            json={"mood_score": 3, "note": "x" * 501},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


# ============================================================
# CREATE + RETRIEVE ROUND TRIP
# ============================================================

def test_create_and_retrieve_checkin_round_trip():
    student_id = str(uuid.uuid4())
    fake_session = _FakeCheckInSession()

    app.dependency_overrides[get_current_supabase_user] = _student_user(student_id)
    app.dependency_overrides[require_consent] = _student_profile(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)

    try:
        create_response = client.post(
            "/api/v1/wellness/checkins",
            json={"mood_score": 4, "note": "Decent day overall."},
        )
        assert create_response.status_code == 201
        body = create_response.json()
        assert body["mood_label"] == "Good"
        assert body["note"] == "Decent day overall."

        # Confirm the note was actually encrypted internally
        stored = fake_session._checkins[uuid.UUID(body["id"])]
        assert stored.note != "Decent day overall."
        assert decrypt_text(stored.note) == "Decent day overall."

        history_response = client.get("/api/v1/wellness/checkins")
        assert history_response.status_code == 200
        assert len(history_response.json()) == 1
    finally:
        app.dependency_overrides.clear()


def test_checkin_without_note_returns_null():
    student_id = str(uuid.uuid4())
    fake_session = _FakeCheckInSession()

    app.dependency_overrides[get_current_supabase_user] = _student_user(student_id)
    app.dependency_overrides[require_consent] = _student_profile(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)

    try:
        response = client.post("/api/v1/wellness/checkins", json={"mood_score": 3})
        assert response.status_code == 201
        assert response.json()["note"] is None
    finally:
        app.dependency_overrides.clear()