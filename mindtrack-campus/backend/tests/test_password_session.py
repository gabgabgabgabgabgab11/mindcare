"""Regression: valid password sessions do not require an authenticator factor."""
import httpx
import pytest
from fastapi import HTTPException

from app.security import supabase_auth


def test_password_session_accepted_after_supabase_verifies_it(monkeypatch):
    observed = {}

    def get(url, **kwargs):
        observed.update(kwargs)
        return httpx.Response(200, json={"id": "student-id", "email": "student@example.com"})

    monkeypatch.setattr(supabase_auth.httpx, "get", get)
    result = supabase_auth.verify_supabase_token("provider-verified-password-token")
    assert result.id == "student-id"
    assert observed["headers"]["Authorization"] == "Bearer provider-verified-password-token"


def test_invalid_password_session_still_rejected(monkeypatch):
    monkeypatch.setattr(supabase_auth.httpx, "get", lambda *a, **k: httpx.Response(401))
    with pytest.raises(HTTPException) as error:
        supabase_auth.verify_supabase_token("invalid-token")
    assert error.value.status_code == 401


def test_auth_provider_timeout_still_rejects_unverified_token(monkeypatch):
    def timeout(*args, **kwargs):
        raise httpx.ConnectTimeout("timeout")

    monkeypatch.setattr(supabase_auth.httpx, "get", timeout)
    with pytest.raises(HTTPException) as error:
        supabase_auth.verify_supabase_token("unverified-token")
    assert error.value.status_code == 503


@pytest.mark.parametrize("status_code", [429, 500, 502, 503])
def test_provider_outage_does_not_claim_session_is_invalid(monkeypatch, status_code):
    monkeypatch.setattr(supabase_auth.httpx, "get", lambda *a, **k: httpx.Response(status_code))
    with pytest.raises(HTTPException) as error:
        supabase_auth.verify_supabase_token("unverified-token")
    assert error.value.status_code == 503
