"""User and authentication models."""

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from athlo.models.base import BaseModel


class User(BaseModel):
    """User account model."""

    email: EmailStr
    password_hash: str | None = None  # Optional for OAuth users
    name: str
    preferred_units: str = "metric"  # "metric" or "imperial"
    is_active: bool = True

    # OAuth fields
    google_id: str | None = None
    auth_provider: str = "email"  # "email" or "google"
    avatar_url: str | None = None


class RefreshToken(BaseModel):
    """Refresh token for JWT authentication."""

    user_id: UUID
    token: str
    expires_at: datetime
    revoked: bool = False
