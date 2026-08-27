from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Basic liveness check. Confirms the API process is running.
    Does NOT check the database — see /health/db for that."""
    return {"status": "ok"}


@router.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Confirms the API can successfully reach PostgreSQL/Supabase.
    Never returns connection strings, credentials, or raw exception
    details — only a generic status."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        # Intentionally generic — see Step 26 (Error Handling) for the
        # project-wide error envelope this will be upgraded to later.
        return {"status": "error", "database": "unreachable"}