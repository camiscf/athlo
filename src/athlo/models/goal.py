"""Goal model for tracking activity targets."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import Field

from athlo.models.base import BaseModel


class ActivityType(str, Enum):
    """Types of activities that can have goals."""

    RUNNING = "running"
    STRENGTH = "strength"


class GoalPeriod(str, Enum):
    """Period for goal tracking."""

    WEEKLY = "weekly"
    MONTHLY = "monthly"


class Goal(BaseModel):
    """A goal for tracking activity targets.

    Examples:
    - 3x running per week
    - 5x strength training per week
    - 20km running per week
    """

    user_id: UUID
    activity_type: ActivityType
    target_frequency: int = Field(ge=1, le=14, description="Target number of activities per period")
    period: GoalPeriod = GoalPeriod.WEEKLY
    is_active: bool = True
    notes: str | None = None

    @property
    def display_text(self) -> str:
        """Get human-readable goal text."""
        activity_names = {
            ActivityType.RUNNING: "corrida",
            ActivityType.STRENGTH: "academia",
        }
        period_names = {
            GoalPeriod.WEEKLY: "semana",
            GoalPeriod.MONTHLY: "mês",
        }
        activity = activity_names.get(self.activity_type, self.activity_type.value)
        period = period_names.get(self.period, self.period.value)
        return f"{self.target_frequency}x {activity} por {period}"
