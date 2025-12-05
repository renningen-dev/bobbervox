from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, Request


@dataclass
class CurrentUser:
    """Current authenticated user."""

    user_id: str
    email: str


def get_current_user(request: Request) -> CurrentUser:
    """Get the current authenticated user from request state."""
    user_id = getattr(request.state, "user_id", None)
    email = getattr(request.state, "user_email", "")

    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return CurrentUser(user_id=user_id, email=email)
