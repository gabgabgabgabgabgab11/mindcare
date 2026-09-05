from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.mantra_wall import (
    AdminMantraWallReportItem,
    MantraWallModerateRequest,
    MantraWallPostCreateRequest,
    MantraWallPostResponse,
    MantraWallReportCreateRequest,
    MantraWallReportResponse,
)
from app.security.consent_gate import require_consent
from app.security.rbac import require_admin, require_authenticated_user
from app.services.mantra_wall_repository import (
    create_post,
    create_report,
    list_reports_for_admin,
    list_visible_posts,
    moderate_post,
)

router = APIRouter(prefix="/api/v1/mantra-wall", tags=["mantra-wall"])
admin_router = APIRouter(prefix="/api/v1/admin/mantra-wall", tags=["admin-mantra-wall"])


@router.post("/posts", response_model=MantraWallPostResponse, status_code=status.HTTP_201_CREATED)
def create_mantra_post(
    payload: MantraWallPostCreateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    post = create_post(db, profile.id, payload.post_type, payload.content, payload.nickname)
    return MantraWallPostResponse(
        id=post.id, post_type=post.post_type, content=post.content, nickname=post.nickname,
        moderation_status=post.moderation_status, created_at=post.created_at,
    )


@router.get("/posts", response_model=list[MantraWallPostResponse])
def list_mantra_posts(
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    posts = list_visible_posts(db, profile.id)
    return [
        MantraWallPostResponse(
            id=p.id, post_type=p.post_type, content=p.content, nickname=p.nickname,
            moderation_status=p.moderation_status, created_at=p.created_at,
        )
        for p in posts
    ]


@router.post("/posts/{post_id}/report", response_model=MantraWallReportResponse, status_code=status.HTTP_201_CREATED)
def report_mantra_post(
    post_id: UUID,
    payload: MantraWallReportCreateRequest,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    report = create_report(db, post_id, profile.id, payload.reason)
    return MantraWallReportResponse(id=report.id, post_id=report.post_id, created_at=report.created_at)


@admin_router.get("/reports", response_model=list[AdminMantraWallReportItem])
def admin_list_reports(
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return list_reports_for_admin(db)


@admin_router.patch("/posts/{post_id}/moderate", response_model=MantraWallPostResponse)
def admin_moderate_post(
    post_id: UUID,
    payload: MantraWallModerateRequest,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = moderate_post(db, post_id, profile.id, payload.moderation_status)
    return MantraWallPostResponse(
        id=post.id, post_type=post.post_type, content=post.content, nickname=post.nickname,
        moderation_status=post.moderation_status, created_at=post.created_at,
    )