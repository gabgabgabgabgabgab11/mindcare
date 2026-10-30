"""Admin Wellness Analytics API routes.

All endpoints require admin RBAC.  They return only aggregate statistics
— no individual student identifiers, scores, or wellness records.

Endpoint map
────────────
GET /api/v1/admin/analytics/overview          – existing (unchanged)
GET /api/v1/admin/analytics/audit-timeline    – existing (unchanged)
GET /api/v1/admin/analytics/moderation-timeline – existing (unchanged)

NEW:
GET /api/v1/admin/wellness/overview       – participation KPIs
GET /api/v1/admin/wellness/screening      – avg PHQ-9, GAD-7, distributions
GET /api/v1/admin/wellness/by-group       – group breakdown
GET /api/v1/admin/wellness/trend          – time-series
GET /api/v1/admin/wellness/filter-options – dropdown values
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.profile import Profile
from app.security.rbac import require_admin
from app.services.admin_analytics_service import (
    get_audit_timeline,
    get_filter_options,
    get_moderation_timeline,
    get_overview_kpis,
    get_wellness_by_group,
    get_wellness_overview,
    get_wellness_screening,
    get_wellness_trend,
)
from app.services.audit_log_repository import log_event

# ── Existing operational analytics router (prefix unchanged) ───────────────
router = APIRouter(prefix="/api/v1/admin/analytics", tags=["admin-analytics"])

# ── New wellness analytics router ──────────────────────────────────────────
wellness_router = APIRouter(prefix="/api/v1/admin/wellness", tags=["admin-wellness-analytics"])


# ---------------------------------------------------------------------------
# Existing operational endpoints (untouched)
# ---------------------------------------------------------------------------

@router.get("/overview")
def overview_kpis(
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns aggregated KPI tile counts for the admin overview dashboard."""
    log_event(db, "admin_action", "Viewed analytics overview", actor_id=profile.id)
    return get_overview_kpis(db)


@router.get("/audit-timeline")
def audit_timeline(
    days: int = Query(default=30, ge=1, le=365),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns audit event counts grouped by day and event type."""
    log_event(db, "admin_action", f"Viewed audit timeline ({days}d)", actor_id=profile.id)
    return {"timeline": get_audit_timeline(db, days)}


@router.get("/moderation-timeline")
def moderation_timeline(
    days: int = Query(default=30, ge=1, le=365),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns post counts grouped by day and moderation status."""
    log_event(db, "admin_action", f"Viewed moderation timeline ({days}d)", actor_id=profile.id)
    return {"timeline": get_moderation_timeline(db, days)}


# ---------------------------------------------------------------------------
# Wellness Analytics — participation overview
# ---------------------------------------------------------------------------

@wellness_router.get("/overview")
def wellness_overview(
    program: Optional[str] = Query(default=None),
    year_level: Optional[str] = Query(default=None),
    section: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    semester: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Participation KPIs for the selected student cohort.

    Returns total students, assessment/check-in/journal participation rates,
    and follow-up flag count.  No individual student data is returned.
    """
    log_event(db, "admin_action", "Viewed wellness analytics overview", actor_id=profile.id)
    return get_wellness_overview(
        db,
        program=program,
        year_level=year_level,
        section=section,
        academic_year=academic_year,
        semester=semester,
        start_date=start_date,
        end_date=end_date,
    )


# ---------------------------------------------------------------------------
# Wellness Analytics — screening averages + distributions
# ---------------------------------------------------------------------------

@wellness_router.get("/screening")
def wellness_screening(
    program: Optional[str] = Query(default=None),
    year_level: Optional[str] = Query(default=None),
    section: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    semester: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Average PHQ-9 and GAD-7 scores plus severity distributions.

    Returns cohort_hidden=True when the matching student group is smaller
    than the configured minimum cohort size (default: 5).
    """
    log_event(db, "admin_action", "Viewed wellness screening analytics", actor_id=profile.id)
    return get_wellness_screening(
        db,
        program=program,
        year_level=year_level,
        section=section,
        academic_year=academic_year,
        semester=semester,
        start_date=start_date,
        end_date=end_date,
    )


# ---------------------------------------------------------------------------
# Wellness Analytics — group breakdown (program / year / section)
# ---------------------------------------------------------------------------

@wellness_router.get("/by-group")
def wellness_by_group(
    group_by: str = Query(default="program", pattern="^(program|year_level|section)$"),
    program: Optional[str] = Query(default=None),
    year_level: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    semester: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Aggregate wellness metrics broken down by program, year level, or section.

    Pass group_by=program for program comparison, group_by=year_level for
    year comparison, or group_by=section for section comparison.

    Groups smaller than the privacy threshold have cohort_hidden=True and
    wellness averages set to null.
    """
    log_event(
        db, "admin_action",
        f"Viewed wellness by-group analytics (group_by={group_by})",
        actor_id=profile.id,
    )
    return get_wellness_by_group(
        db,
        group_by=group_by,
        program=program,
        year_level=year_level,
        academic_year=academic_year,
        semester=semester,
        start_date=start_date,
        end_date=end_date,
    )


# ---------------------------------------------------------------------------
# Wellness Analytics — historical trend
# ---------------------------------------------------------------------------

@wellness_router.get("/trend")
def wellness_trend(
    program: Optional[str] = Query(default=None),
    year_level: Optional[str] = Query(default=None),
    section: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    semester: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Daily time-series of aggregate PHQ-9 and GAD-7 averages.

    Defaults to the trailing 90 days when no date range is provided.
    Only observed data is returned — no predictive forecasting.
    """
    log_event(db, "admin_action", "Viewed wellness trend analytics", actor_id=profile.id)
    return get_wellness_trend(
        db,
        program=program,
        year_level=year_level,
        section=section,
        academic_year=academic_year,
        semester=semester,
        start_date=start_date,
        end_date=end_date,
    )


# ---------------------------------------------------------------------------
# Wellness Analytics — filter option lists
# ---------------------------------------------------------------------------

@wellness_router.get("/filter-options")
def wellness_filter_options(
    program: Optional[str] = Query(default=None),
    year_level: Optional[str] = Query(default=None),
    profile: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns distinct programs, year levels, sections, and academic years
    from actual profile data — used to populate filter dropdowns.
    Section list is filtered by the selected program and year_level.
    """
    return get_filter_options(db, program=program, year_level=year_level)
