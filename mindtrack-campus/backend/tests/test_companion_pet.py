import uuid
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.rbac import require_authenticated_user
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)

FAKE_USER_ID = str(uuid.uuid4())


class _FakeProfileSession:
    def __init__(self, profile: Profile):
        self.profile = profile
        self.added = []

    def get(self, model, pk):
        if pk == self.profile.id:
            return self.profile
        return None

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_update_companion_pet_valid():
    fake_profile = Profile(
        id=uuid.UUID(FAKE_USER_ID),
        role="student",
        companion_pet=None,
    )
    fake_session = _FakeProfileSession(fake_profile)

    app.dependency_overrides[require_authenticated_user] = lambda: fake_profile
    app.dependency_overrides[get_db] = lambda: fake_session
    try:
        response = client.put("/api/v1/profile", json={"companion_pet": "capybara"})
        assert response.status_code == 200
        body = response.json()
        assert body["companion_pet"] == "capybara"
        assert fake_profile.companion_pet == "capybara"

        # Test normalization for cappybara
        response2 = client.put("/api/v1/profile", json={"companion_pet": "cappybara"})
        assert response2.status_code == 200
        assert response2.json()["companion_pet"] == "capybara"

        # Test another valid pet
        response3 = client.put("/api/v1/profile", json={"companion_pet": "dog"})
        assert response3.status_code == 200
        assert response3.json()["companion_pet"] == "dog"

        # Test new pets (frog, otter, bombardino)
        response4 = client.put("/api/v1/profile", json={"companion_pet": "frog"})
        assert response4.status_code == 200
        assert response4.json()["companion_pet"] == "frog"

        response5 = client.put("/api/v1/profile", json={"companion_pet": "bombardino"})
        assert response5.status_code == 200
        assert response5.json()["companion_pet"] == "bombardino"
    finally:
        app.dependency_overrides.clear()


def test_update_companion_pet_invalid():
    fake_profile = Profile(
        id=uuid.UUID(FAKE_USER_ID),
        role="student",
        companion_pet=None,
    )
    fake_session = _FakeProfileSession(fake_profile)

    app.dependency_overrides[require_authenticated_user] = lambda: fake_profile
    app.dependency_overrides[get_db] = lambda: fake_session
    try:
        response = client.put("/api/v1/profile", json={"companion_pet": "dragon"})
        assert response.status_code == 422
        assert "Invalid companion pet" in response.text
    finally:
        app.dependency_overrides.clear()


def test_me_returns_companion_pet():
    fake_profile = Profile(
        id=uuid.UUID(FAKE_USER_ID),
        role="student",
        companion_pet="rabbit",
    )
    fake_session = _FakeProfileSession(fake_profile)

    app.dependency_overrides[get_current_supabase_user] = lambda: SupabaseUser(
        id=FAKE_USER_ID, email="student@example.com"
    )
    app.dependency_overrides[get_db] = lambda: fake_session
    try:
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer good-token"})
        assert response.status_code == 200
        assert response.json()["companion_pet"] == "rabbit"
    finally:
        app.dependency_overrides.clear()


def test_update_companion_nickname_persists_and_can_be_cleared():
    fake_profile = Profile(
        id=uuid.UUID(FAKE_USER_ID),
        role="student",
        companion_pet="rabbit",
        companion_nickname=None,
    )
    fake_session = _FakeProfileSession(fake_profile)

    app.dependency_overrides[require_authenticated_user] = lambda: fake_profile
    app.dependency_overrides[get_db] = lambda: fake_session
    try:
        saved = client.put("/api/v1/profile", json={"companion_nickname": " Mochi "})
        assert saved.status_code == 200
        assert saved.json()["companion_nickname"] == "Mochi"
        assert fake_profile.companion_nickname == "Mochi"

        cleared = client.put("/api/v1/profile", json={"companion_nickname": ""})
        assert cleared.status_code == 200
        assert cleared.json()["companion_nickname"] is None
        assert fake_profile.companion_nickname is None
    finally:
        app.dependency_overrides.clear()
