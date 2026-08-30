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


settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# --- CORS ---
# Development: http://localhost:5173 (Vite default) via .env.
# Production: set CORS_ORIGINS in the deployment environment to the
# real deployed frontend URL(s) — comma-separated for multiple, e.g.
# a Vercel production + preview URL. Never "*" — this would allow any
# website on the internet to make authenticated requests on a
# logged-in student's behalf.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting ---
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# --- Consistent error envelope ---
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(assessments_router)
app.include_router(gad7_router)