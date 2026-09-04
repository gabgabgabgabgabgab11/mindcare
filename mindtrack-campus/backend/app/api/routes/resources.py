from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.resource import ResourceCreateRequest, ResourceResponse, ResourceUpdateRequest
from app.security.rbac import require_authenticated_user, require_admin
from app.services.resource_repository import (
    create_resource,
    delete_resource,
    get_active_resource,
    get_resource_for_admin,
    list_active_resources,
    update_resource,
)

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])
admin_router = APIRouter(prefix="/api/v1/admin/resources", tags=["admin-resources"])


# --- Public (read-only, any authenticated role) ---

@router.get("", response_model=list[ResourceResponse])
def list_resources(
    category: Optional[str] = None,
    q: Optional[str] = None,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return list_active_resources(db, category=category, q=q)


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: UUID,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return get_active_resource(db, resource_id)


# --- Admin (CRUD) ---

@admin_router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def admin_create_resource(
    payload: ResourceCreateRequest,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return create_resource(db, payload)


@admin_router.put("/{resource_id}", response_model=ResourceResponse)
def admin_update_resource(
    resource_id: UUID,
    payload: ResourceUpdateRequest,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return update_resource(db, resource_id, payload)


@admin_router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_resource(
    resource_id: UUID,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    delete_resource(db, resource_id)