from typing import Optional

import httpx
from fastapi import Header, HTTPException, status

from app.core.config import get_settings

settings = get_settings()


class SupabaseUser:
    """Minimal identity confirmed by Supabase — NOT our application's
    Profile model. This only proves who the caller is."""

    def __init__(self, id: str, email: Optional[str]):
        self.id = id
        self.email = email


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    return authorization.removeprefix("Bearer ").strip()


def verify_supabase_token(token: str) -> SupabaseUser:
    """Verifies a Supabase-issued JWT by asking Supabase's own Auth API
    directly, rather than decoding/verifying it locally.

    Trade-off (docs/DECISIONS.md ADR-003): one extra network call per
    authenticated request, in exchange for never having to store or
    rotate a JWT signing secret ourselves. Acceptable at capstone scale.
    """
    try:
        response = httpx.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_ANON_KEY,
            },
            timeout=5.0,
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify authentication token",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    data = response.json()
    return SupabaseUser(id=data["id"], email=data.get("email"))


def get_current_supabase_user(
    authorization: Optional[str] = Header(default=None),
) -> SupabaseUser:
    """FastAPI dependency: extracts and verifies the bearer token.
    Does not touch our database — see profile_service for that."""
    token = _extract_bearer_token(authorization)
    return verify_supabase_token(token)