from __future__ import annotations

import logging
from typing import Optional

import firebase_admin
from fastapi import Request
from firebase_admin import auth, credentials
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from app.config import get_settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app: Optional[firebase_admin.App] = None


def init_firebase() -> None:
    """Initialize Firebase Admin SDK."""
    global _firebase_app
    if _firebase_app is not None:
        return

    settings = get_settings()
    if settings.firebase_service_account_path:
        cred = credentials.Certificate(settings.firebase_service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
    elif settings.firebase_project_id:
        # Use Application Default Credentials
        _firebase_app = firebase_admin.initialize_app(
            options={"projectId": settings.firebase_project_id}
        )
    else:
        logger.warning("Firebase not configured - auth will be disabled")


def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify Firebase ID token and return decoded claims."""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


# Routes that don't require authentication
PUBLIC_PATHS = {
    "/api/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}


class FirebaseAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to verify Firebase ID tokens."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip auth for public paths
        if request.url.path in PUBLIC_PATHS or request.url.path.startswith("/docs"):
            return await call_next(request)

        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if Firebase is configured
        settings = get_settings()
        if not settings.firebase_project_id and not settings.firebase_service_account_path:
            # Auth disabled - use a test user ID
            request.state.user_id = "test-user"
            request.state.user_email = "test@example.com"
            return await call_next(request)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth_header.split(" ", 1)[1]
        decoded_token = verify_firebase_token(token)

        if not decoded_token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        # Add user info to request state
        request.state.user_id = decoded_token["uid"]
        request.state.user_email = decoded_token.get("email", "")

        return await call_next(request)
