import json
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import EVENT_TYPES, AuditLog


def log_event(
    db: Session,
    event_type: str,
    description: str,
    actor_id: Optional[uuid.UUID] = None,
    metadata: Optional[dict] = None,
) -> AuditLog:
    """Internal helper - NOT called from anywhere yet (see Phase 20B).

    CALLER RESPONSIBILITY, not enforced here:
    - `description` must NEVER contain journal content, passwords, or tokens.
    - `metadata` must only hold small structured extras (e.g. {"resource_id": "..."})
      - never full request/response bodies.
    """
    if event_type not in EVENT_TYPES:
        raise ValueError(f"event_type must be one of {EVENT_TYPES}")

    entry = AuditLog(
        event_type=event_type,
        actor_id=actor_id,
        description=description,
        event_metadata=json.dumps(metadata) if metadata else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_audit_logs(
    db: Session,
    event_type: Optional[str] = None,
    actor_id: Optional[uuid.UUID] = None,
    limit: int = 100,
) -> list[AuditLog]:
    stmt = select(AuditLog)
    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type)
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)
    stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars().all())