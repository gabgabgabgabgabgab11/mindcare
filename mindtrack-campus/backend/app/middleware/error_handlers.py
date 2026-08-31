import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger("mindtrack")

_STATUS_CODE_NAMES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_SERVER_ERROR",
}


def _code_for(status_code: int) -> str:
    return _STATUS_CODE_NAMES.get(status_code, "ERROR")


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Covers every HTTPException raised anywhere in the app (401s from
    supabase_auth, 403s from rbac, 404s from routing, etc.)."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": _code_for(exc.status_code), "message": exc.detail}},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic/FastAPI request validation failures (bad request bodies,
    missing required fields, wrong types)."""
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "One or more fields failed validation.",
                "details": exc.errors(),
            }
        },
    )


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMITED",
                "message": "Too many requests. Please wait a moment and try again.",
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort catch-all. Logs full detail server-side, but NEVER
    sends stack traces, exception messages, or internals to the client
    — see Section 26's explicit prohibition on leaking this."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            }
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic/FastAPI request validation failures (bad request bodies,
    missing required fields, wrong types, or custom validator failures)."""
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "One or more fields failed validation.",
                "details": jsonable_encoder(exc.errors()),  # <-- the fix
            }
        },
    )