from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.audit_log import AuditLogResponse
from app.security.rbac import require_admin
from app.services.audit_log_repository import list_audit_logs

router = APIRouter(prefix="/api/v1/admin/audit-logs", tags=["admin-audit-logs"])


@router.get("", response_model=list[AuditLogResponse])
def get_audit_logs(
    event_type: Optional[str] = None,
    actor_id: Optional[UUID] = None,
    limit: int = 100,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return list_audit_logs(db, event_type=event_type, actor_id=actor_id, limit=limit)