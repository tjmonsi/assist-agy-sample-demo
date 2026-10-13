# [spec-budget-app -> BR-002 -> FR-001 -> NFR-004 -> NFR-006] FastAPI application entrypoint and middleware configuration
from datetime import datetime, timezone
import json
import logging
import os
import traceback
from typing import Callable, Coroutine

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from database import DatabaseServiceError
from routes import router


# Structured JSON logger per assist-plugin logging standards
class _JSONFormatter(logging.Formatter):
    _STANDARD_ATTRS = {
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "process",
        "taskName",
        "message",
    }

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in self._STANDARD_ATTRS and not key.startswith("_"):
                log_entry[key] = value
        if record.exc_info:
            log_entry["stack"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, default=str)


logger = logging.getLogger("budget.main")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(_JSONFormatter())
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


# [spec-budget-app -> NFR-006] Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Coroutine[None, None, Response]],
    ) -> Response:
        response: Response = await call_next(request)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data:; frame-ancestors 'none'; "
            "base-uri 'none'; object-src 'none'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# [spec-budget-app -> FR-001 -> NFR-004] FastAPI application initialization
app = FastAPI(
    title="Budget Tracking API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# [spec-budget-app -> NFR-006] CORS middleware configuration
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# [spec-budget-app -> NFR-007] Storage failure exception handler returning HTTP 503
@app.exception_handler(DatabaseServiceError)
async def database_service_error_handler(
    request: Request, exc: DatabaseServiceError
) -> JSONResponse:
    logger.error(
        "Database service unavailable",
        extra={"error_type": "DatabaseServiceError", "error_message": exc.message},
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service unavailable. Please retry."},
    )


# [spec-budget-app -> NFR-004] General unhandled exception handler returning HTTP 500
@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        raise exc
    logger.error(
        "Unhandled server exception during request processing",
        extra={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "stack": traceback.format_exc(),
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# [spec-budget-app -> NFR-004] Liveness / readiness health probe endpoint
@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(router)
