import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.mantra_wall import MantraWallPost, MantraWallReport
from app.models.profile import Profile
from app.security.consent_gate import require_consent
from app.security.rbac import require_admin, require_authenticated_user
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


class _FakeMantraWallSession:
    """NOTE: like the fake session in test_resources.py, this does NOT
    replicate real SQL WHERE-clause filtering (approved OR own-post
    visibility rule; the reports<->posts join). Those are proven
    against real Supabase in the manual pass (Step 7), not here."""

    def __init__(self, posts=None, reports=None):
        self._posts = {p.id: p for p in (posts or [])}
        self._reports = {r.id: r for r in (reports or [])}

    def get(self, model, pk):
        if model is MantraWallPost:
            return self._posts.get(pk)
        if model is MantraWallReport:
            return self._reports.get(pk)
        return None

    def add(self, obj):
        now = datetime.now(timezone.utc)
        if isinstance(obj, MantraWallPost):
            obj.id = obj.id or uuid.uuid4()
            obj.created_at = obj.created_at or now
            self._posts[obj.id] = obj
        elif isinstance(obj, MantraWallReport):
            obj.id = obj.id or uuid.uuid4()
            obj.created_at = obj.created_at or now
            self._reports[obj.id] = obj

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

        compiled = str(stmt)
        if "mantra_wall_reports" in compiled and "JOIN" in compiled.upper():
            rows = []
            for report in self._reports.values():
                post = self._posts.get(report.post_id)
                rows.append((report, post))
            rows.sort(key=lambda r: r[0].created_at, reverse=True)
            return _Result(rows)

        return _Result(sorted(self._posts.values(), key=lambda p: p.created_at, reverse=True))


def _override_db(fake_session):
    def override_db():
        yield fake_session
    return override_db


def _student(profile_id=None):
    pid = profile_id or uuid.uuid4()
    def override():
        return Profile(id=pid, role="student")
    return override


def _admin():
    def override():
        return Profile(id=uuid.uuid4(), role="admin")
    return override


# ============================================================
# AUTH
# ============================================================

def test_create_post_without_token_returns_401():
    response = client.post(
        "/api/v1/mantra-wall/posts",
        json={"post_type": "affirmation", "content": "You've got this."},
    )
    assert response.status_code == 401


def test_list_posts_without_token_returns_401():
    response = client.get("/api/v1/mantra-wall/posts")
    assert response.status_code == 401


# ============================================================
# CONSENT GATING ON CREATE (real gate, not overridden)
# ============================================================

def test_create_post_without_consent_returns_403():
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

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _NoConsentSession()
    # IMPORTANT: do NOT override require_consent - the real gate must reject.

    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "affirmation", "content": "You've got this."},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


# ============================================================
# VALIDATION
# ============================================================

def test_create_post_rejects_invalid_post_type():
    fake_session = _FakeMantraWallSession()
    app.dependency_overrides[require_consent] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "vent", "content": "I'm having a rough day"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_create_post_rejects_whitespace_only_content():
    fake_session = _FakeMantraWallSession()
    app.dependency_overrides[require_consent] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "win", "content": "   "},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_create_post_rejects_oversized_content():
    fake_session = _FakeMantraWallSession()
    app.dependency_overrides[require_consent] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "gratitude", "content": "x" * 301},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


# ============================================================
# CREATE -> DEFAULTS TO PENDING, NEVER EXPOSES user_id
# ============================================================

def test_create_post_defaults_to_pending_and_hides_user_id():
    fake_session = _FakeMantraWallSession()
    app.dependency_overrides[require_consent] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(
            "/api/v1/mantra-wall/posts",
            json={"post_type": "win", "content": "Finished my thesis draft today!", "nickname": "quietowl"},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["moderation_status"] == "pending"
        assert body["nickname"] == "quietowl"
        assert "user_id" not in body
        assert "seek_assistance_notice" in body
        assert "anonymity_notice" in body
    finally:
        app.dependency_overrides.clear()


# ============================================================
# REPORTING
# ============================================================

def test_report_nonexistent_post_returns_404():
    fake_session = _FakeMantraWallSession()
    app.dependency_overrides[require_authenticated_user] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(f"/api/v1/mantra-wall/posts/{uuid.uuid4()}/report", json={"reason": "Names someone"})
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_report_existing_post_succeeds():
    post = MantraWallPost(
        id=uuid.uuid4(), user_id=uuid.uuid4(), post_type="affirmation",
        content="Test post", moderation_status="approved", created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeMantraWallSession(posts=[post])
    app.dependency_overrides[require_authenticated_user] = _student()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.post(f"/api/v1/mantra-wall/posts/{post.id}/report", json={"reason": "Names someone"})
        assert response.status_code == 201
        assert response.json()["post_id"] == str(post.id)
    finally:
        app.dependency_overrides.clear()


# ============================================================
# ADMIN
# ============================================================

def test_admin_routes_reject_student():
    student_id = str(uuid.uuid4())

    class _StudentProfileSession:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _StudentProfileSession()
    try:
        response = client.get("/api/v1/admin/mantra-wall/reports")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_admin_can_list_reports_with_post_content():
    post = MantraWallPost(
        id=uuid.uuid4(), user_id=uuid.uuid4(), post_type="win",
        content="I passed my board exam!", moderation_status="pending", created_at=datetime.now(timezone.utc),
    )
    report = MantraWallReport(
        id=uuid.uuid4(), post_id=post.id, reporter_id=uuid.uuid4(),
        reason="Might be identifying", created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeMantraWallSession(posts=[post], reports=[report])
    app.dependency_overrides[require_admin] = _admin()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.get("/api/v1/admin/mantra-wall/reports")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["post_content"] == "I passed my board exam!"
        assert body[0]["reporter_id"] == str(report.reporter_id)
    finally:
        app.dependency_overrides.clear()


def test_admin_can_moderate_post_to_approved():
    post = MantraWallPost(
        id=uuid.uuid4(), user_id=uuid.uuid4(), post_type="affirmation",
        content="You are doing great.", moderation_status="pending", created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeMantraWallSession(posts=[post])
    app.dependency_overrides[require_admin] = _admin()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.patch(
            f"/api/v1/admin/mantra-wall/posts/{post.id}/moderate",
            json={"moderation_status": "approved"},
        )
        assert response.status_code == 200
        assert response.json()["moderation_status"] == "approved"
    finally:
        app.dependency_overrides.clear()


def test_admin_moderate_rejects_invalid_status():
    post = MantraWallPost(
        id=uuid.uuid4(), user_id=uuid.uuid4(), post_type="affirmation",
        content="You are doing great.", moderation_status="pending", created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeMantraWallSession(posts=[post])
    app.dependency_overrides[require_admin] = _admin()
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.patch(
            f"/api/v1/admin/mantra-wall/posts/{post.id}/moderate",
            json={"moderation_status": "hidden"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()