"""Request and response schemas for the API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# Auth schemas
class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response after login/refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Token refresh request."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request."""

    refresh_token: str


# User schemas
class UserResponse(BaseModel):
    """User profile response (excludes sensitive data)."""

    id: UUID
    email: EmailStr
    name: str
    preferred_units: str
    is_active: bool
    created_at: datetime


class UserUpdateRequest(BaseModel):
    """User profile update request."""

    name: str | None = None
    preferred_units: str | None = None


class PasswordChangeRequest(BaseModel):
    """Password change request."""

    current_password: str
    new_password: str = Field(min_length=8)


# Error response
class ErrorResponse(BaseModel):
    """Error response."""

    detail: str


# Running Activity schemas
class RunningActivityCreate(BaseModel):
    """Create a running activity. Provide at least 2 of: distance, duration, pace."""

    title: str | None = None
    start_time: datetime

    # Core metrics (provide at least 2 for auto-calculation)
    distance: float | None = None  # kilometers
    duration: float | None = None  # seconds
    pace: float | None = None  # seconds per kilometer

    # Additional metrics
    cadence: int | None = None  # steps per minute
    calories: int | None = None
    effort: int | None = Field(None, ge=1, le=10)  # RPE 1-10
    avg_heart_rate: int | None = None
    notes: str | None = None


class RunningActivityUpdate(BaseModel):
    """Update a running activity."""

    title: str | None = None
    start_time: datetime | None = None
    distance: float | None = None
    duration: float | None = None
    pace: float | None = None
    cadence: int | None = None
    calories: int | None = None
    effort: int | None = Field(None, ge=1, le=10)
    avg_heart_rate: int | None = None
    notes: str | None = None


class RunningActivityResponse(BaseModel):
    """Running activity response with calculated fields."""

    id: UUID
    user_id: UUID
    title: str | None
    start_time: datetime

    # Core metrics
    distance: float | None  # km
    duration: float | None  # seconds
    pace: float | None  # seconds per km

    # Formatted values
    pace_formatted: str | None  # "MM:SS/km"
    duration_formatted: str | None  # "HH:MM:SS"
    speed_kmh: float | None  # km/h

    # Additional metrics
    cadence: int | None
    calories: int | None
    effort: int | None
    avg_heart_rate: int | None
    notes: str | None

    created_at: datetime
    updated_at: datetime
