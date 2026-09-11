import os
import uuid

import httpx
import pytest
from fastapi import HTTPException

import app.security.supabase_auth as supabase_auth_module
from app.core.config import get_settings
from app.security.supabase_auth import verify_supabase_token
from app.services.audit_log_repository import list_audit_logs

pytestmark = pytest.mark.integration


def _require_test_supabase_credentials():
    url = os.environ.get("TEST_SUPABASE_URL", "").strip()
    key = os.environ.get("TEST_SUPABASE_ANON_KEY", "").strip()
    if not url or not key:
        pytest.skip("TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY not set - skipping real auth integration test.")

    production_url = get_settings().SUPABASE_URL
    if url == production_url:
        pytest.fail(
            "TEST_SUPABASE_URL is identical to your production SUPABASE_URL. "
            "Refusing to run real auth calls against what appears to be production - "
            "use a genuinely separate Supabase project."
        )
    return url, key


@pytest.fixture
def use_test_supabase_project(monkeypatch):
    """Points the app's Supabase verification target at the TEST
    project for the duration of this test only. monkeypatch restores
    the original (production) values automatically afterward - this
    is the correct, safe way to do this, never a permanent change."""
    url, key = _require_test_supabase_credentials()
    monkeypatch.setattr(supabase_auth_module.settings, "SUPABASE_URL", url)
    monkeypatch.setattr(supabase_auth_module.settings, "SUPABASE_ANON_KEY", key)
    yield url, key


@pytest.fixture
def real_test_user(use_test_supabase_project):
    url, key = use_test_supabase_project
    email = f"integration-test-{uuid.uuid4().hex}@example.com"
    password = "TestPassword123!"

    response = httpx.post(
        f"{url}/auth/v1/signup",
        headers={"apikey": key, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=10.0,
    )
    if response.status_code != 200:
        pytest.fail(f"Real Supabase signup failed ({response.status_code}): {response.text}")

    data = response.json()
    access_token = data.get("access_token")
    if not access_token:
        pytest.fail("Signup succeeded but no access_token was returned.")

    return access_token, data["user"]["id"], email


def test_real_valid_token_verifies_successfully(db_session, real_test_user):
    access_token, expected_user_id, expected_email = real_test_user

    result = verify_supabase_token(access_token, db_session)

    assert str(result.id) == expected_user_id
    assert result.email == expected_email


def test_real_invalid_token_rejected_and_audit_logged(db_session, use_test_supabase_project):
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token("this-is-not-a-real-token", db_session)

    assert exc_info.value.status_code == 401

    logs = list_audit_logs(db_session, event_type="failed_authentication")
    assert len(logs) >= 1, "A failed real-network auth attempt did not produce an audit log entry"