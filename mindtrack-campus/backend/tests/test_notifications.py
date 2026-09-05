import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.notification import Notification
from app.models.profile import Profile
from app.security.rbac import require_authenticated_user

client = TestClient(app)


class _FakeNotificationSession:
    def __init__(self, notifications=None):
        self._notifications = {n.id: n for n in (notifications or [])}

    def get(self, model, pk):
        return self._notifications.get(pk) if model is Notification else None

    def add(self, obj):
        if isinstance(obj, Notification):
            obj.id = obj.id or uuid.uuid4()
            obj.created_at = obj.created_at or datetime.now(timezone.utc)
            self._notifications[obj.id] = obj

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
        return _Result(sorted(self._notifications.values(), key=lambda n: n.created_at, reverse=True))


def _override_db(fake_session):
    def override_db():
        yield fake_session
    return override_db


def _student(profile_id):
    def override():
        return Profile(id=profile_id, role="student")
    return override


def test_list_notifications_without_token_returns_401():
    response = client.get("/api/v1/notifications")
    assert response.status_code == 401


def test_list_notifications_returns_own_only():
    student_id = uuid.uuid4()
    own = Notification(
        id=uuid.uuid4(), user_id=student_id, notification_type="system",
        title="Welcome", message="Thanks for joining.", is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeNotificationSession(notifications=[own])
    app.dependency_overrides[require_authenticated_user] = _student(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.get("/api/v1/notifications")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Welcome"
    finally:
        app.dependency_overrides.clear()


def test_mark_read_sets_is_read_and_read_at():
    student_id = uuid.uuid4()
    notif = Notification(
        id=uuid.uuid4(), user_id=student_id, notification_type="system",
        title="Heads up", message="Something happened.", is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeNotificationSession(notifications=[notif])
    app.dependency_overrides[require_authenticated_user] = _student(student_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.patch(f"/api/v1/notifications/{notif.id}/read")
        assert response.status_code == 200
        body = response.json()
        assert body["is_read"] is True
        assert body["read_at"] is not None
    finally:
        app.dependency_overrides.clear()


def test_mark_read_on_someone_elses_notification_returns_404():
    owner_id = uuid.uuid4()
    requester_id = uuid.uuid4()
    notif = Notification(
        id=uuid.uuid4(), user_id=owner_id, notification_type="system",
        title="Private", message="Not yours.", is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    fake_session = _FakeNotificationSession(notifications=[notif])
    app.dependency_overrides[require_authenticated_user] = _student(requester_id)
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.patch(f"/api/v1/notifications/{notif.id}/read")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_mark_read_on_nonexistent_notification_returns_404():
    fake_session = _FakeNotificationSession()
    app.dependency_overrides[require_authenticated_user] = _student(uuid.uuid4())
    app.dependency_overrides[get_db] = _override_db(fake_session)
    try:
        response = client.patch(f"/api/v1/notifications/{uuid.uuid4()}/read")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()