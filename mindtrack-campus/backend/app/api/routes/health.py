from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Basic liveness check. Confirms the API process is running.
    Database connectivity is checked separately by /health/db,
    added in Phase 4 once the database connection exists."""
    return {"status": "ok"}