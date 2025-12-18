"""Domain models for Athlo."""

from athlo.models.base import BaseModel
from athlo.models.goal import ActivityType, Goal, GoalPeriod

__all__ = ["BaseModel", "Goal", "ActivityType", "GoalPeriod"]
