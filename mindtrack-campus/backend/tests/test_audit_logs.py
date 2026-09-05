import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.models.profile import Profile
from app.security.rbac import require_admin
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeAuditLogSession:
    def __init__(self, logs=None):
        self._logs = {l.id: l for l in (logs or [])}

    def execute(self, stmt):
        class _Result:
            def __init__(self, items):
                self._items = items
            def scalars(self):
                return self
            def all(self):
                return self._items
        return _Result(sorted(self._logs.values(), key=lambda l: l.created_at, reverse=True))


def _override_db(fake_session):
    def override_db():
        yield fake_session
    return override_db


def _admin():
    def override():
        return Profile(id=uuid.uuid4(), role="admin")
    return override


def test_get_audit_logs_without_token_returns_401():
    response = client.get("/api/v1/admin/audit-logs")
    assert response.status_code == 401


def test_get_audit_logs_rejects_student():
    student_id = str(uuid.uuid4())

    class _StudentProfileSession:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _StudentProfileSession()
    try:
        response = client.get("/api/v1/admin/audit-logs")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_admin_can_list_audit_logs():
    log = AuditLog(
        id=uuid.uuid4(), event_type="admin_action", actor_id=uuid.uuid4(),
        description="Approved a Mantra Wall post.", event_metadata=None,
        created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeAuditLogSession(logs=[log])
    app.dependency_overrides[require_admin] = _admin()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.get("/api/v1/admin/audit-logs")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["event_type"] == "admin_action"
    finally:
        app.dependency_overrides.clear()


def test_no_write_endpoint_exists():
    """Confirms the spec's read-only constraint - there is deliberately
    no POST route for audit logs anywhere."""
    response = client.post("/api/v1/admin/audit-logs", json={"event_type": "login"})
    assert response.status_code in (404, 405)