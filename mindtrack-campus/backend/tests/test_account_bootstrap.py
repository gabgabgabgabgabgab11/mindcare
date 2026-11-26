from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request

from app.api.routes.auth import account_rate_limit_key
from app.api.routes import auth as auth_route
from app.models.profile import Profile
from app.services.profile_service import get_or_create_profile
from app.security import supabase_auth


def test_account_limit_is_applied_after_identity_verification(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from app.middleware.rate_limit import limiter

    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth_route.router)
    app.dependency_overrides[auth_route.get_db] = lambda: None
    monkeypatch.setattr(supabase_auth, "verify_supabase_token", lambda token: supabase_auth.SupabaseUser(token, "student@example.com"))
    monkeypatch.setattr(auth_route, "get_or_create_profile", lambda db, user_id: Profile(id=user_id, role="student"))
    limiter.reset()
    try:
        with TestClient(app) as client:
            first_id, second_id = str(uuid4()), str(uuid4())
            for _ in range(30):
                assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {first_id}"}).status_code == 200
            assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {first_id}"}).status_code == 429
            assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {second_id}"}).status_code == 200
    finally:
        limiter.reset()


def test_campus_students_have_separate_account_limits(monkeypatch):
    request = Request({"type": "http", "client": ("192.0.2.1", 1000), "headers": []})
    monkeypatch.setattr(supabase_auth, "verify_supabase_token", lambda token: supabase_auth.SupabaseUser(token, None))
    supabase_auth.get_current_supabase_user(request, "Bearer student-one")
    first = account_rate_limit_key(request)
    supabase_auth.get_current_supabase_user(request, "Bearer student-two")
    assert first != account_rate_limit_key(request)
    assert first == "account:student-one"


@pytest.mark.parametrize("winner_exists", [True, False])
def test_concurrent_profile_creation_recovers_only_if_profile_exists(winner_exists):
    user_id = uuid4()
    winner = Profile(id=user_id, role="admin") if winner_exists else None

    class Session:
        reads = 0
        rolled_back = False

        def get(self, model, key):
            self.reads += 1
            return None if self.reads == 1 else winner

        def add(self, obj):
            pass

        def commit(self):
            raise IntegrityError("insert", {}, Exception("duplicate"))

        def rollback(self):
            self.rolled_back = True

    db = Session()
    if winner_exists:
        assert get_or_create_profile(db, str(user_id)) is winner
        assert winner.role == "admin"
    else:
        with pytest.raises(IntegrityError):
            get_or_create_profile(db, str(user_id))
    assert db.rolled_back
