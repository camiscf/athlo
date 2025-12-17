"""Running activity model."""

from datetime import datetime
from uuid import UUID

from pydantic import field_validator, model_validator

from athlo.models.base import BaseModel


class RunningActivity(BaseModel):
    """Running activity with automatic pace/time calculation."""

    user_id: UUID
    title: str | None = None
    start_time: datetime  # date and hour of the activity

    # Core metrics (at least 2 of 3 required for calculation)
    distance: float | None = None  # kilometers
    duration: float | None = None  # seconds
    pace: float | None = None  # seconds per kilometer

    # Additional metrics
    cadence: int | None = None  # steps per minute (rpm)
    calories: int | None = None
    effort: int | None = None  # RPE 1-10
    avg_heart_rate: int | None = None
    notes: str | None = None

    @field_validator("effort")
    @classmethod
    def validate_effort(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError("Effort must be between 1 and 10")
        return v

    @model_validator(mode="after")
    def calculate_missing_metric(self):
        """
        Auto-calculate the missing metric:
        - distance + duration → pace
        - pace + distance → duration
        - pace + duration → distance
        """
        distance = self.distance
        duration = self.duration
        pace = self.pace

        # Count how many are provided
        provided = sum(x is not None for x in [distance, duration, pace])

        if provided >= 2:
            if distance is not None and duration is not None and pace is None:
                # Calculate pace from distance and duration
                if distance > 0:
                    self.pace = duration / distance  # seconds per km
            elif pace is not None and distance is not None and duration is None:
                # Calculate duration from pace and distance
                self.duration = pace * distance  # seconds
            elif pace is not None and duration is not None and distance is None:
                # Calculate distance from pace and duration
                if pace > 0:
                    self.distance = duration / pace  # km

        return self

    @property
    def pace_formatted(self) -> str | None:
        """Format pace as MM:SS per km."""
        if self.pace:
            minutes = int(self.pace // 60)
            seconds = int(self.pace % 60)
            return f"{minutes}:{seconds:02d}/km"
        return None

    @property
    def duration_formatted(self) -> str | None:
        """Format duration as HH:MM:SS."""
        if self.duration:
            hours = int(self.duration // 3600)
            minutes = int((self.duration % 3600) // 60)
            seconds = int(self.duration % 60)
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return None

    @property
    def speed_kmh(self) -> float | None:
        """Calculate speed in km/h."""
        if self.distance and self.duration and self.duration > 0:
            return (self.distance) / (self.duration / 3600)
        return None
