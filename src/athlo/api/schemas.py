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


class GoogleLoginRequest(BaseModel):
    """Google OAuth login request."""

    id_token: str


# User schemas
class UserResponse(BaseModel):
    """User profile response (excludes sensitive data)."""

    id: UUID
    email: EmailStr
    name: str
    preferred_units: str
    is_active: bool
    auth_provider: str = "email"
    avatar_url: str | None = None
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

# Lap schemas
class LapCreate(BaseModel):
    """Create a lap for a running activity."""

    number: int = Field(ge=1)  # lap number
    distance: float = Field(ge=0)  # kilometers
    duration_seconds: float = Field(ge=0)  # seconds
    pace_seconds: float = Field(ge=0)  # seconds per km


class LapResponse(BaseModel):
    """Lap response with formatted fields."""

    number: int
    distance: float  # km
    duration_seconds: float  # seconds
    pace_seconds: float  # seconds per km
    time: str  # formatted time "M:SS"
    pace: str  # formatted pace "M:SS/km"


class RunningActivityCreate(BaseModel):
    """Create a running activity. Provide at least 2 of: distance, duration, pace."""

    title: str | None = None
    start_time: datetime

    # Core metrics (provide at least 2 for auto-calculation)
    distance: float | None = None  # kilometers
    duration: float | None = None  # seconds
    pace: float | None = None  # seconds per kilometer

    # Laps
    laps: list[LapCreate] = []

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
    laps: list[LapCreate] | None = None
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

    # Laps
    laps: list[LapResponse] = []

    # Additional metrics
    cadence: int | None
    calories: int | None
    effort: int | None
    avg_heart_rate: int | None
    notes: str | None

    created_at: datetime
    updated_at: datetime


# ==================== STRENGTH TRAINING SCHEMAS ====================

# Exercise schemas
class ExerciseResponse(BaseModel):
    """Exercise from the exercise bank."""

    id: UUID
    name: str
    muscle_group: str
    is_custom: bool
    user_id: UUID | None


class ExerciseCreate(BaseModel):
    """Create a custom exercise."""

    name: str = Field(min_length=1, max_length=100)
    muscle_group: str


# Planned Exercise schemas (for divisions)
class PlannedExerciseCreate(BaseModel):
    """Planned exercise in a workout division."""

    exercise_name: str
    muscle_group: str
    sets: int = Field(ge=1, le=20)
    reps: str  # "10" or "8-12"
    rest_seconds: int | None = None
    suggested_weight: float | None = None
    notes: str | None = None
    order: int = 0


class PlannedExerciseResponse(BaseModel):
    """Planned exercise response."""

    exercise_name: str
    muscle_group: str
    sets: int
    reps: str
    rest_seconds: int | None
    suggested_weight: float | None
    notes: str | None
    order: int


# Workout Division schemas
class WorkoutDivisionCreate(BaseModel):
    """Create a workout division."""

    name: str = Field(min_length=1, max_length=50)
    exercises: list[PlannedExerciseCreate] = []
    order: int = 0


class WorkoutDivisionUpdate(BaseModel):
    """Update a workout division."""

    name: str | None = Field(None, min_length=1, max_length=50)
    exercises: list[PlannedExerciseCreate] | None = None
    is_active: bool | None = None
    order: int | None = None


class WorkoutDivisionResponse(BaseModel):
    """Workout division response."""

    id: UUID
    user_id: UUID
    name: str
    exercises: list[PlannedExerciseResponse]
    is_active: bool
    order: int
    created_at: datetime
    updated_at: datetime


# Exercise Log schemas (for recording workouts)
class ExerciseLogCreate(BaseModel):
    """Record of an exercise performed."""

    exercise_name: str
    muscle_group: str
    planned_sets: int | None = None
    planned_reps: str | None = None
    sets_completed: int = Field(ge=0, le=20)
    reps_completed: str
    weight: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


class ExerciseLogResponse(BaseModel):
    """Exercise log response with history."""

    exercise_name: str
    muscle_group: str
    planned_sets: int | None
    planned_reps: str | None
    sets_completed: int
    reps_completed: str
    weight: float | None
    rpe: int | None
    notes: str | None
    previous_weight: float | None
    previous_reps: str | None


# Strength Activity schemas
class StrengthActivityCreate(BaseModel):
    """Create a strength training activity."""

    title: str | None = None
    division_id: UUID | None = None
    division_name: str | None = None
    start_time: datetime
    exercises: list[ExerciseLogCreate] = []
    duration: float | None = None  # seconds
    effort: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


class StrengthActivityUpdate(BaseModel):
    """Update a strength training activity."""

    title: str | None = None
    division_id: UUID | None = None
    division_name: str | None = None
    start_time: datetime | None = None
    exercises: list[ExerciseLogCreate] | None = None
    duration: float | None = None
    effort: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


class StrengthActivityResponse(BaseModel):
    """Strength training activity response."""

    id: UUID
    user_id: UUID
    title: str | None
    division_id: UUID | None
    division_name: str | None
    start_time: datetime
    exercises: list[ExerciseLogResponse]
    duration: float | None
    duration_formatted: str | None
    effort: int | None
    notes: str | None
    total_sets: int
    total_exercises: int
    muscle_groups_worked: list[str]
    created_at: datetime
    updated_at: datetime


# Exercise history for progression tracking
class ExerciseHistoryResponse(BaseModel):
    """History of an exercise for progression tracking."""

    exercise_name: str
    records: list[dict]  # List of {date, weight, reps, rpe}


# ==================== GOAL SCHEMAS ====================


class GoalCreate(BaseModel):
    """Create a goal for tracking activity targets."""

    activity_type: str  # "running" or "strength"
    target_frequency: int = Field(ge=1, le=14)  # e.g., 3x per week
    period: str = "weekly"  # "weekly" or "monthly"
    notes: str | None = None


class GoalUpdate(BaseModel):
    """Update a goal."""

    target_frequency: int | None = Field(None, ge=1, le=14)
    period: str | None = None
    is_active: bool | None = None
    notes: str | None = None


class GoalProgressResponse(BaseModel):
    """Progress toward a goal."""

    current: int  # activities completed this period
    target: int  # target frequency
    percentage: float  # 0-100


class GoalResponse(BaseModel):
    """Goal response with progress."""

    id: UUID
    user_id: UUID
    activity_type: str
    target_frequency: int
    period: str
    is_active: bool
    notes: str | None
    display_text: str
    progress: GoalProgressResponse
    created_at: datetime
    updated_at: datetime
