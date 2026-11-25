from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.mantra_wall import MantraWallPost
from app.models.profile import Profile
from app.schemas.mantra_wall import (
    AdminGroupedReportItem,
    AdminMantraWallReportItem,
    BulkModerateRequest,
    MantraWallModerateRequest,
    MantraWallPostCreateRequest,
    MantraWallPostResponse,
    MantraWallReportCreateRequest,
    MantraWallReportResponse,
    MantraWallHeartRequest,
    MantraWallHeartResponse,
)
from app.security.consent_gate import require_consent
from app.security.rbac import require_admin, require_authenticated_user
from app.services.mantra_wall_repository import (
    bulk_moderate_posts,
    create_post,
    create_report,
    list_grouped_reports_for_admin,
    list_posts_for_admin,
    list_reports_for_admin,
    list_visible_posts,
    moderate_post,
    get_heart_summaries,
    set_post_heart,
    resolve_reports_for_post,
)
from app.services.audit_log_repository import log_event
from app.services.notification_repository import create_notification

router = APIRouter(prefix="/api/v1/mantra-wall", tags=["mantra-wall"])
admin_router = APIRouter(prefix="/api/v1/admin/mantra-wall", tags=["admin-mantra-wall"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _post_response(post: MantraWallPost, heart_count: int = 0, has_sent_heart: bool = False) -> MantraWallPostResponse:
    return MantraWallPostResponse(
        id=post.id, post_type=post.post_type, content=post.content,
        nickname=post.nickname, moderation_status=post.moderation_status,
        filter_reason=post.filter_reason, created_at=post.created_at,
        heart_count=heart_count, has_sent_heart=has_sent_heart,
    )


def _notify_author(db: Session, post: MantraWallPost, action: str) -> None:
    """Send a notification to the post author based on the moderation
    outcome.  Notifications are best-effort — failures here must never
    break moderation itself."""
    messages = {
        "auto_rejected": (
            "mantra_wall_auto_rejected",
            "Post not published",
            "Your MantraWall post was not published because it didn't match our "
            "positive-content guidelines. If you're struggling, please visit our "
            "Resources page.",
        ),
        "rejected": (
            "mantra_wall_rejected",
            "Post removed",
            "A MantraWall post you shared was reviewed and removed by a moderator. "
            "Please review our community guidelines.",
        ),
        "archived": (
            "mantra_wall_archived",
            "Post archived",
            "A MantraWall post you shared was reviewed after community feedback and "
            "has been archived. Please reflect on our community guidelines.",
        ),
        "approved": (
            "mantra_wall_approved",
            "Post published!",
            "Your MantraWall post is now live on the wall. Thank you for sharing "
            "positivity!",
        ),
    }
    if action not in messages:
        return
    try:
        ntype, title, message = messages[action]
        create_notification(db, post.user_id, ntype, title, message)
    except Exception:
        pass  # best-effort; never break the moderation flow


# ---------------------------------------------------------------------------
# Student routes
# ---------------------------------------------------------------------------

@router.post("/posts", response_model=MantraWallPostResponse, status_code=status.HTTP_201_CREATED)
def create_mantra_post(
    payload: MantraWallPostCreateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    post = create_post(db, profile.id, payload.post_type, payload.content, payload.nickname)

    # Notify author if their post was auto-rejected
    if post.moderation_status == "rejected":
        _notify_author(db, post, "auto_rejected")

    return _post_response(post)


@router.get("/posts", response_model=list[MantraWallPostResponse])
def list_mantra_posts(
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    posts = list_visible_posts(db, profile.id)
    hearts = get_heart_summaries(db, [p.id for p in posts], profile.id)
    return [_post_response(p, **hearts.get(p.id, {})) for p in posts]


@router.put("/posts/{post_id}/heart", response_model=MantraWallHeartResponse)
def save_mantra_heart(
    post_id: UUID,
    payload: MantraWallHeartRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    return set_post_heart(db, post_id, profile.id, payload.hearted)


@router.post("/posts/{post_id}/report", response_model=MantraWallReportResponse, status_code=status.HTTP_201_CREATED)
def report_mantra_post(
    post_id: UUID,
    payload: MantraWallReportCreateRequest,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    report = create_report(db, post_id, profile.id, payload.reason)
    return MantraWallReportResponse(id=report.id, post_id=report.post_id, created_at=report.created_at)


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@admin_router.get("/posts", response_model=list[MantraWallPostResponse])
def admin_list_posts(
    status: str | None = None,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    posts = list_posts_for_admin(db, status)
    return [_post_response(p) for p in posts]


@admin_router.get("/reports", response_model=list[AdminMantraWallReportItem])
def admin_list_reports(
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Flat report list — backward compatible, used by dashboard feed."""
    return list_reports_for_admin(db)


@admin_router.get("/reports/grouped", response_model=list[AdminGroupedReportItem])
def admin_list_grouped_reports(
    resolved: bool = Query(False, description="Show resolved (True) or unresolved (False) reports"),
    sort_by: str = Query("reports_count", description="Sort by 'reports_count' or 'newest'"),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Grouped report view — one card per reported post (ADR-011)."""
    return list_grouped_reports_for_admin(db, resolved=resolved, sort_by=sort_by)


@admin_router.patch("/posts/{post_id}/moderate", response_model=MantraWallPostResponse)
def admin_moderate_post(
    post_id: UUID,
    payload: MantraWallModerateRequest,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = moderate_post(db, post_id, profile.id, payload.moderation_status)

    # Resolve any associated reports when admin takes action
    resolve_reports_for_post(db, post_id, profile.id)

    log_event(
        db, "mantra_wall_moderation", f"Post moderated to '{payload.moderation_status}'",
        actor_id=profile.id, metadata={"post_id": str(post_id)},
    )

    # Notify the post author
    if payload.moderation_status in ("approved", "rejected", "archived"):
        _notify_author(db, post, payload.moderation_status)

    return _post_response(post)


@admin_router.post("/bulk-moderate", response_model=list[MantraWallPostResponse])
def admin_bulk_moderate(
    payload: BulkModerateRequest,
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Bulk-moderate multiple posts at once (ADR-011)."""
    posts = bulk_moderate_posts(db, payload.post_ids, profile.id, payload.moderation_status)

    for post in posts:
        # Resolve reports and log each action
        resolve_reports_for_post(db, post.id, profile.id)
        log_event(
            db, "mantra_wall_moderation",
            f"Post bulk-moderated to '{payload.moderation_status}'",
            actor_id=profile.id, metadata={"post_id": str(post.id)},
        )
        if payload.moderation_status in ("approved", "rejected", "archived"):
            _notify_author(db, post, payload.moderation_status)

    return [_post_response(p) for p in posts]