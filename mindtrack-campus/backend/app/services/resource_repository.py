import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resource import Resource


def list_active_resources(
    db: Session, category: Optional[str] = None, q: Optional[str] = None
) -> list[Resource]:
    stmt = select(Resource).where(Resource.is_active.is_(True))
    if category:
        stmt = stmt.where(Resource.category == category)
    if q:
        stmt = stmt.where(Resource.title.ilike(f"%{q}%"))
    stmt = stmt.order_by(Resource.category, Resource.title)
    return list(db.execute(stmt).scalars().all())


def get_active_resource(db: Session, resource_id: uuid.UUID) -> Resource:
    """404s on inactive resources too - an inactive resource does not
    exist from a student's point of view."""
    resource: Optional[Resource] = db.get(Resource, resource_id)
    if resource is None or not resource.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return resource


def get_resource_for_admin(db: Session, resource_id: uuid.UUID) -> Resource:
    """Admin can see inactive resources too, for editing/reactivating."""
    resource: Optional[Resource] = db.get(Resource, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return resource


def create_resource(db: Session, payload) -> Resource:
    resource = Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def update_resource(db: Session, resource_id: uuid.UUID, payload) -> Resource:
    resource = get_resource_for_admin(db, resource_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


def delete_resource(db: Session, resource_id: uuid.UUID) -> None:
    resource = get_resource_for_admin(db, resource_id)
    db.delete(resource)
    db.commit()