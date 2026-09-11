import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.journal import Journal
from app.models.notification import Notification
from app.models.profile import Profile
from app.security.consent_gate import require_consent
from app.security.rbac import require_admin, require_authenticated_user
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


def _clear():
    app.dependency_overrides.clear()


# ============================================================
# 1. MISSING AUTHENTICATION
# ============================================================

def test_missing_auth_rejected_across_routers():
    routes = [
        ("get", "/api/v1/journals"),
        ("get", "/api/v1/notifications"),
        ("get", "/api/v1/resources"),
        ("get", "/api/v1/mantra-wall/posts"),
        ("get", "/api/v1/admin/audit-logs"),
        ("post", "/api/v1/wellness/checkins"),
    ]
    for method, path in routes:
        response = getattr(client, method)(path)
        assert response.status_code == 401, f"{method.upper()} {path} did not reject a missing token"


# ============================================================
# 2. INVALID AUTHENTICATION
# ============================================================

def test_garbage_token_rejected():
    response = client.get(
        "/api/v1/journals",
        headers={"Authorization": "Bearer this-is-not-a-real-token"},
    )
    assert response.status_code == 401


def test_malformed_authorization_header_rejected():
    response = client.get("/api/v1/journals", headers={"Authorization": "NotBearer sometoken"})
    assert response.status_code == 401


# ============================================================
# 3. WRONG ROLE (student on every admin route)
# ============================================================

def test_student_rejected_on_every_admin_route():
    student_id = str(uuid.uuid4())

    class _StudentProfileSession:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    admin_routes = [
        ("post", "/api/v1/admin/resources", {"category": "x", "title": "x", "description": "x"}),
        ("put", f"/api/v1/admin/resources/{uuid.uuid4()}", {"title": "x"}),
        ("delete", f"/api/v1/admin/resources/{uuid.uuid4()}", None),
        ("get", "/api/v1/admin/mantra-wall/reports", None),
        ("patch", f"/api/v1/admin/mantra-wall/posts/{uuid.uuid4()}/moderate", {"moderation_status": "approved"}),
        ("get", "/api/v1/admin/audit-logs", None),
    ]

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _StudentProfileSession()
    try:
        for method, path, body in admin_routes:
            kwargs = {"json": body} if body is not None else {}
            response = getattr(client, method)(path, **kwargs)
            assert response.status_code == 403, f"{method.upper()} {path} did not reject a student"
    finally:
        _clear()


# ============================================================
# 4. CROSS-USER ACCESS (IDOR) — the core requirement of this phase
# ============================================================

def test_cannot_read_another_students_journal_by_id():
    owner_id = uuid.uuid4()
    attacker_id = uuid.uuid4()
    journal = Journal(
        id=uuid.uuid4(), user_id=owner_id, content="ciphertext-placeholder",
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )

    class _FakeSession:
        def get(self, model, pk):
            return journal if model is Journal and pk == journal.id else None

    def _attacker():
        return Profile(id=attacker_id, role="student")

    app.dependency_overrides[require_consent] = _attacker
    app.dependency_overrides[get_db] = lambda: _FakeSession()
    try:
        for method, path in [
            ("get", f"/api/v1/journals/{journal.id}"),
            ("get", f"/api/v1/journals/{journal.id}/analysis"),
            ("put", f"/api/v1/journals/{journal.id}"),
            ("delete", f"/api/v1/journals/{journal.id}"),
        ]:
            kwargs = {"json": {"content": "hacked"}} if method == "put" else {}
            response = getattr(client, method)(path, **kwargs)
            assert response.status_code == 404, f"{method.upper()} {path} leaked another student's journal"
    finally:
        _clear()


def test_cannot_read_another_students_phq9_result_by_id():
    from app.models.assessment import AssessmentResult

    owner_id = uuid.uuid4()
    attacker_id = uuid.uuid4()
    result = AssessmentResult(
        id=uuid.uuid4(), user_id=owner_id, assessment_code="phq9",
        severity_band="moderate", escalated=False, created_at=datetime.now(timezone.utc),
    )

    class _FakeSession:
        def get(self, model, pk):
            return result if pk == result.id else None

    def _attacker():
        return Profile(id=attacker_id, role="student")

    app.dependency_overrides[require_consent] = _attacker
    app.dependency_overrides[get_db] = lambda: _FakeSession()
    try:
        response = client.get(f"/api/v1/assessments/phq9/{result.id}")
        assert response.status_code == 404
        response = client.get(f"/api/v1/assessments/gad7/{result.id}")
        assert response.status_code == 404
    finally:
        _clear()


def test_cannot_mark_another_students_notification_read():
    owner_id = uuid.uuid4()
    attacker_id = uuid.uuid4()
    notif = Notification(
        id=uuid.uuid4(), user_id=owner_id, notification_type="system",
        title="Private", message="Not yours.", is_read=False,
        created_at=datetime.now(timezone.utc),
    )

    class _FakeSession:
        def get(self, model, pk):
            return notif if model is Notification and pk == notif.id else None

    def _attacker():
        return Profile(id=attacker_id, role="student")

    app.dependency_overrides[require_authenticated_user] = _attacker
    app.dependency_overrides[get_db] = lambda: _FakeSession()
    try:
        response = client.patch(f"/api/v1/notifications/{notif.id}/read")
        assert response.status_code == 404
    finally:
        _clear()


# ============================================================
# 5. SQL INJECTION ATTEMPTS
# ============================================================

def test_sql_injection_style_path_param_rejected_cleanly():
    """FastAPI's UUID path converter should reject this before it ever
    reaches a query - proving injection-shaped input can't even reach
    the DB layer, let alone succeed."""
    injection_payloads = [
        "1' OR '1'='1",
        "'; DROP TABLE journals; --",
        "1 UNION SELECT * FROM profiles",
    ]
    for payload in injection_payloads:
        response = client.get(f"/api/v1/journals/{payload}")
        assert response.status_code in (401, 422), f"Injection-shaped path param produced unexpected status: {response.status_code}"


def test_sql_injection_style_content_stored_safely_not_executed():
    """Content containing SQL-looking text should be stored/rejected by
    normal validation rules, never cause a 500 (which would suggest it
    reached raw SQL)."""
    fake_session_calls = []

    class _FakeSession:
        def add(self, obj):
            fake_session_calls.append(obj)
        def commit(self):
            pass
        def refresh(self, obj):
            obj.id = obj.id or uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
            obj.updated_at = datetime.now(timezone.utc)

    def _student():
        return Profile(id=uuid.uuid4(), role="student")

    app.dependency_overrides[require_consent] = _student
    app.dependency_overrides[get_db] = lambda: _FakeSession()
    try:
        response = client.post(
            "/api/v1/journals",
            json={"content": "'; DROP TABLE journals; --"},
        )
        assert response.status_code in (201, 422)
        assert response.status_code != 500
    finally:
        _clear()


# ============================================================
# 6. MALFORMED INPUT
# ============================================================

def test_malformed_input_wrong_types_rejected():
    def _student():
        return Profile(id=uuid.uuid4(), role="student")

    app.dependency_overrides[require_consent] = _student
    app.dependency_overrides[get_db] = lambda: None
    try:
        response = client.post("/api/v1/wellness/checkins", json={"mood_score": "not-a-number"})
        assert response.status_code == 422

        response = client.post("/api/v1/mantra-wall/posts", json={"post_type": 12345, "content": True})
        assert response.status_code == 422
    finally:
        _clear()


# ============================================================
# 7. OVERSIZED PAYLOAD
# ============================================================

def test_oversized_mantra_wall_content_rejected():
    def _student():
        return Profile(id=uuid.uuid4(), role="student")

    app.dependency_overrides[require_consent] = _student
    app.dependency_overrides[get_db] = lambda: None
    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "win", "content": "x" * 10_000},
        )
        assert response.status_code == 422
    finally:
        _clear()


def test_oversized_checkin_note_rejected():
    def _student():
        return Profile(id=uuid.uuid4(), role="student")

    app.dependency_overrides[require_consent] = _student
    app.dependency_overrides[get_db] = lambda: None
    try:
        response = client.post(
            "/api/v1/wellness/checkins",
            json={"mood_score": 3, "note": "x" * 10_000},
        )
        assert response.status_code == 422
    finally:
        _clear()


# ============================================================
# 8. UNAUTHORIZED ADMIN ENDPOINT — covered by test_student_rejected_on_every_admin_route above
# ============================================================


# ============================================================
# 9. PRIVACY SETTING BYPASS
# ============================================================

def test_privacy_update_ignores_injected_user_id_in_body():
    """A student cannot use the request body to target a DIFFERENT
    user's privacy settings - the endpoint must always resolve the
    target from the authenticated token, never from the payload."""
    from app.models.privacy import PrivacySettings

    real_user_id = uuid.uuid4()
    victim_id = uuid.uuid4()
    get_calls = []

    class _FakeSession:
        def __init__(self):
            self.settings_obj = PrivacySettings(
                user_id=real_user_id, allow_activity_tracking=True,
                anonymize_activity=False, updated_at=datetime.now(timezone.utc),
            )

        def get(self, model, pk):
            get_calls.append(pk)
            if model is PrivacySettings and pk == real_user_id:
                return self.settings_obj
            return None

        def add(self, obj):
            pass

        def commit(self):
            pass

        def refresh(self, obj):
            pass

    def _real_user():
        return Profile(id=real_user_id, role="student")

    from app.security.rbac import require_student
    app.dependency_overrides[require_student] = _real_user
    app.dependency_overrides[get_db] = lambda: _FakeSession()
    try:
        response = client.put(
            "/api/v1/privacy/settings",
            json={
                "allow_activity_tracking": False,
                "anonymize_activity": True,
                "user_id": str(victim_id),  # attempted injection - must be ignored
            },
        )
        assert response.status_code == 200
        assert victim_id not in get_calls, "Privacy update looked up the injected user_id from the body instead of ignoring it"
        assert real_user_id in get_calls, "Privacy update never looked up the authenticated user's own settings"
    finally:
        _clear()


# ============================================================
# 10. JOURNAL ACCESS BYPASS — covered by test_cannot_read_another_students_journal_by_id above
# ============================================================