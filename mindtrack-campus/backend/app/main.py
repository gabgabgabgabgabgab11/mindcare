from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.middleware.error_handlers import (
    http_exception_handler,
    rate_limit_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.middleware.rate_limit import limiter
from app.api.routes.assessments import router as assessments_router
from app.api.routes.gad7 import router as gad7_router
from app.api.routes.journals import router as journals_router
from app.api.routes.journal_folders import router as journal_folders_router
from app.api.routes.wellness import router as wellness_router

from app.api.routes.privacy import router as privacy_router
from app.api.routes.consent import router as consent_router
from app.api.routes.wellness_checkins import router as wellness_checkins_router
from app.api.routes.resources import router as resources_router, admin_router as admin_resources_router
from app.api.routes.mantra_wall import router as mantra_wall_router, admin_router as admin_mantra_wall_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.routes.admin_analytics import router as admin_analytics_router, wellness_router as admin_wellness_router
from app.api.routes.profile import router as profile_router





settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# --- Rate limiting (inner middleware) ---
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# --- CORS (outermost middleware so all responses, errors, and preflights get headers) ---
cors_origins = [o.strip() for o in settings.cors_origins_list if o.strip()]
for default_dev in ("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://127.0.0.1:3000"):
    if default_dev not in cors_origins:
        cors_origins.append(default_dev)

cors_kwargs = {
    "allow_origins": cors_origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["*"],
}

if not settings.is_production:
    cors_kwargs["allow_origin_regex"] = r"^https?://((localhost|127\.0\.0\.1)(:[0-9]+)?|([a-zA-Z0-9-]+\.)*trycloudflare\.com)$"

app.add_middleware(CORSMiddleware, **cors_kwargs)

# --- Consistent error envelope ---
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(assessments_router)
app.include_router(gad7_router)
app.include_router(journals_router)
app.include_router(journal_folders_router)
app.include_router(wellness_router)
app.include_router(privacy_router)
app.include_router(consent_router)
app.include_router(wellness_checkins_router)
app.include_router(resources_router)
app.include_router(admin_resources_router)
app.include_router(mantra_wall_router)
app.include_router(admin_mantra_wall_router)
app.include_router(notifications_router)
app.include_router(audit_logs_router)
app.include_router(admin_analytics_router)
app.include_router(admin_wellness_router)
app.include_router(profile_router)
