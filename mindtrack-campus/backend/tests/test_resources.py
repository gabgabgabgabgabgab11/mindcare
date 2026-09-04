import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.models.resource import Resource
from app.security.rbac import require_authenticated_user, require_admin
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeResourceSession:
    def __init__(self, seed: list[Resource] = None):
        self._resources = {r.id: r for r in (seed or [])}

    def get(self, model, pk):
        return self._resources.get(pk) if model is Resource else None

    def add(self, obj):
        if isinstance(obj, Resource):
            if obj.id is None:
                obj.id = uuid.uuid4()
            now = datetime.now(timezone.utc)
            obj.created_at = obj.created_at or now
            obj.updated_at = obj.updated_at or now
            self._resources[obj.id] = obj

    def delete(self, obj):
        self._resources.pop(obj.id, None)

    def commit(self):
        pass

    def refresh(self, obj):
        pass

    def execute(self, stmt):
        class _Result:
            def __init__(self, items):
                self._items = items
            def scalars(self):
                return self
            def all(self):
                return self._items
        # naive: ignore WHERE compilation, filter manually per-test instead
        return _Result(list(self._resources.values()))


def _override_db(fake_session):
    def override_db():
        yield fake_session
    return override_db


def _student():
    def override():
        return Profile(id=uuid.uuid4(), role="student")
    return override


def _admin():
    def override():
        return Profile(id=uuid.uuid4(), role="admin")
    return override


# ============================================================
# AUTH
# ============================================================

def test_list_resources_without_token_returns_401():
    response = client.get("/api/v1/resources")
    assert response.status_code == 401


def test_admin_create_resource_as_student_returns_403():
    fake_session = _FakeResourceSession()
    app.dependency_overrides[require_authenticated_user] = _student()
    app.dependency_overrides[require_admin] = _student()  # real dependency would 403 a student; simulate via direct call
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        # NOTE: require_admin itself does the role check against a real
        # Profile - override supabase user + let the real require_admin run.
        pass
    finally:
        app.dependency_overrides.clear()

    # Exercise the REAL require_admin instead of overriding it, same
    # pattern as test_phq9.py's consent test - only override auth + db.
    student_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    class _StudentProfileSession:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _StudentProfileSession()
    try:
        response = client.post(
            "/api/v1/admin/resources",
            json={"category": "hotline", "title": "Test", "description": "Test desc"},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


# ============================================================
# ADMIN CRUD
# ============================================================

def test_admin_create_and_public_list_round_trip():
    fake_session = _FakeResourceSession()

    app.dependency_overrides[require_admin] = _admin()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        create_response = client.post(
            "/api/v1/admin/resources",
            json={
                "category": "hotline",
                "title": "Campus Crisis Line",
                "description": "24/7 campus crisis support line.",
                "url": "https://example.edu/crisis",
            },
        )
        assert create_response.status_code == 201
        resource_id = create_response.json()["id"]
    finally:
        app.dependency_overrides.clear()

    app.dependency_overrides[require_authenticated_user] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        list_response = client.get("/api/v1/resources")
        assert list_response.status_code == 200
        assert any(r["id"] == resource_id for r in list_response.json())
    finally:
        app.dependency_overrides.clear()


def test_inactive_resource_not_returned_to_students():
    inactive = Resource(
        id=uuid.uuid4(),
        category="article",
        title="Old Article",
        description="No longer relevant.",
        is_active=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeResourceSession(seed=[inactive])

    app.dependency_overrides[require_authenticated_user] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.get(f"/api/v1/resources/{inactive.id}")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()