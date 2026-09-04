import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.journal import Journal
from app.models.profile import Profile
from app.security.encryption import decrypt_text, encrypt_text
from app.security.consent_gate import require_consent   
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user


client = TestClient(app)


# ============================================================
# FAKE DATABASE SESSION
# ============================================================

class _FakeJournalSession:
    def __init__(self):
        self._journals = {}
        self._profiles = {}

    def get(self, model, pk):
        if model is Journal:
            return self._journals.get(pk)

        if model is Profile:
            return self._profiles.get(pk)

        return None

    def add(self, obj):
        if isinstance(obj, Journal):

            # Simulate SQLAlchemy/database generating values
            if obj.id is None:
                obj.id = uuid.uuid4()

            if obj.created_at is None:
                obj.created_at = datetime.now(timezone.utc)

            if obj.updated_at is None:
                obj.updated_at = datetime.now(timezone.utc)

            self._journals[obj.id] = obj

        elif isinstance(obj, Profile):
            self._profiles[obj.id] = obj

    def delete(self, obj):
        if isinstance(obj, Journal):
            self._journals.pop(obj.id, None)

    def commit(self):
        pass

    def refresh(self, obj):
        if isinstance(obj, Journal):

            if obj.id is None:
                obj.id = uuid.uuid4()

            if obj.created_at is None:
                obj.created_at = datetime.now(timezone.utc)

            if obj.updated_at is None:
                obj.updated_at = datetime.now(timezone.utc)

    def execute(self, stmt):
        class _Result:
            def __init__(self, items):
                self._items = items

            def scalars(self):
                return self

            def all(self):
                return self._items

        return _Result(list(self._journals.values()))


# ============================================================
# HELPERS
# ============================================================

def _student_user(student_id: str):
    def override_user():
        return SupabaseUser(
            id=student_id,
            email="student@example.com",
        )

    return override_user


def _student_profile(student_id: str):
    def override_require_student():
        return Profile(
            id=uuid.UUID(student_id),
            role="student",
        )

    return override_require_student


def _override_db(fake_session):
    def override_db():
        yield fake_session

    return override_db


# ============================================================
# ENCRYPTION TEST
# ============================================================

def test_encrypt_decrypt_round_trip():
    original = "Today was a stressful day but I got through it."

    encrypted = encrypt_text(original)

    assert encrypted != original
    assert decrypt_text(encrypted) == original


# ============================================================
# AUTH TEST
# ============================================================

def test_create_journal_without_token_returns_401():
    response = client.post(
        "/api/v1/journals",
        json={
            "content": "hello"
        },
    )

    assert response.status_code == 401


# ============================================================
# VALIDATION TESTS
# ============================================================

def test_create_journal_with_empty_content_returns_422():

    student_id = str(uuid.uuid4())
    fake_session = _FakeJournalSession()

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(student_id)

    app.dependency_overrides[
        require_consent
    ] = _student_profile(student_id)

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        response = client.post(
            "/api/v1/journals",
            json={
                "content": "   "
            },
        )

        assert response.status_code == 422

    finally:
        app.dependency_overrides.clear()


def test_create_journal_oversized_content_returns_422():

    student_id = str(uuid.uuid4())
    fake_session = _FakeJournalSession()

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(student_id)

    app.dependency_overrides[
        require_consent
    ] = _student_profile(student_id)

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        response = client.post(
            "/api/v1/journals",
            json={
                "content": "x" * 5001
            },
        )

        assert response.status_code == 422

    finally:
        app.dependency_overrides.clear()


# ============================================================
# CREATE + RETRIEVE TEST
# ============================================================

def test_create_and_retrieve_journal_round_trip():

    student_id = str(uuid.uuid4())
    fake_session = _FakeJournalSession()

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(student_id)

    app.dependency_overrides[
        require_consent
    ] = _student_profile(student_id)

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        # CREATE
        create_response = client.post(
            "/api/v1/journals",
            json={
                "content": "Feeling okay today."
            },
        )

        assert create_response.status_code == 201

        body = create_response.json()

        assert body["content"] == "Feeling okay today."

        journal_id = body["id"]

        # Make sure it was actually encrypted internally
        stored_journal = fake_session._journals[
            uuid.UUID(journal_id)
        ]

        assert stored_journal.content != "Feeling okay today."

        assert decrypt_text(
            stored_journal.content
        ) == "Feeling okay today."

        # RETRIEVE
        get_response = client.get(
            f"/api/v1/journals/{journal_id}"
        )

        assert get_response.status_code == 200

        assert (
            get_response.json()["content"]
            == "Feeling okay today."
        )

    finally:
        app.dependency_overrides.clear()


# ============================================================
# CROSS-USER SECURITY TEST
# ============================================================

def test_cross_user_journal_access_returns_404():

    owner_id = uuid.uuid4()
    requester_id = uuid.uuid4()

    fake_session = _FakeJournalSession()

    owned_journal = Journal(
        id=uuid.uuid4(),
        user_id=owner_id,
        content=encrypt_text("private entry"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    fake_session._journals[
        owned_journal.id
    ] = owned_journal

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(str(requester_id))

    app.dependency_overrides[
        require_consent
    ] = _student_profile(str(requester_id))

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        response = client.get(
            f"/api/v1/journals/{owned_journal.id}"
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


# ============================================================
# DELETE TEST
# ============================================================

def test_delete_journal_removes_it():

    student_id = str(uuid.uuid4())
    fake_session = _FakeJournalSession()

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(student_id)

    app.dependency_overrides[
        require_consent
    ] = _student_profile(student_id)

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        # CREATE
        create_response = client.post(
            "/api/v1/journals",
            json={
                "content": "temporary entry"
            },
        )

        assert create_response.status_code == 201

        journal_id = create_response.json()["id"]

        # DELETE
        delete_response = client.delete(
            f"/api/v1/journals/{journal_id}"
        )

        assert delete_response.status_code == 204

        # VERIFY IT IS GONE
        get_response = client.get(
            f"/api/v1/journals/{journal_id}"
        )

        assert get_response.status_code == 404

    finally:
        app.dependency_overrides.clear()


# ============================================================
# UPDATE TEST
# ============================================================

def test_update_journal_changes_content():

    student_id = str(uuid.uuid4())
    fake_session = _FakeJournalSession()

    app.dependency_overrides[
        get_current_supabase_user
    ] = _student_user(student_id)

    app.dependency_overrides[
        require_consent
    ] = _student_profile(student_id)

    app.dependency_overrides[
        get_db
    ] = _override_db(fake_session)

    try:

        # CREATE
        create_response = client.post(
            "/api/v1/journals",
            json={
                "content": "Old content"
            },
        )

        assert create_response.status_code == 201

        journal_id = create_response.json()["id"]

        # UPDATE
        update_response = client.put(
            f"/api/v1/journals/{journal_id}",
            json={
                "content": "New content"
            },
        )

        assert update_response.status_code == 200

        assert (
            update_response.json()["content"]
            == "New content"
        )

        # Check stored content is encrypted
        stored_journal = fake_session._journals[
            uuid.UUID(journal_id)
        ]

        assert stored_journal.content != "New content"

        assert (
            decrypt_text(stored_journal.content)
            == "New content"
        )

    finally:
        app.dependency_overrides.clear()


def test_create_journal_without_consent_returns_403():
    from app.db.session import get_db
    from app.security.rbac import require_student
    from app.security.supabase_auth import get_current_supabase_user

    student_id = str(uuid.uuid4())

    class _NoConsentSession:
        def get(self, model, pk):
            if model.__name__ == "Profile":
                return Profile(id=uuid.UUID(student_id), role="student")
            return None

        def execute(self, stmt):
            class _Result:
                def scalars(self):
                    return self
                def first(self):
                    return None  # no active consent record exists
            return _Result()

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = lambda: _NoConsentSession()
    # Deliberately NOT overriding require_student or require_consent —
    # this test needs the REAL chain to run, so the gate itself is proven.
    try:
        response = client.post("/api/v1/journals", json={"content": "test entry"})
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()        