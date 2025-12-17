"""User and authentication models."""

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from athlo.models.base import BaseModel


class User(BaseModel):
    """User account model."""

    email: EmailStr
    password_hash: str
    name: str
    preferred_units: str = "metric"  # "metric" or "imperial"
    is_active: bool = True


class RefreshToken(BaseModel):
    """Refresh token for JWT authentication."""

    user_id: UUID
    token: str
    expires_at: datetime
    revoked: bool = False
