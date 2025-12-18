"""Goal routes for activity tracking targets."""

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from athlo.api.deps import get_current_user
from athlo.api.schemas import (
    GoalCreate,
    GoalProgressResponse,
    GoalResponse,
    GoalUpdate,
)
from athlo.models.goal import ActivityType, Goal, GoalPeriod
from athlo.models.user import User
from athlo.models.activity import RunningActivity
from athlo.models.strength import StrengthActivity
from athlo.repositories.json_repository import JsonRepository

router = APIRouter(prefix="/goals", tags=["Goals"])

# Repositories
goal_repo = JsonRepository[Goal]("goals.json", Goal)
running_repo = JsonRepository[RunningActivity]("running_activities.json", RunningActivity)
strength_repo = JsonRepository[StrengthActivity]("strength_activities.json", StrengthActivity)


def get_week_start() -> datetime:
    """Get the start of the current week (Monday)."""
    today = datetime.now()
    days_since_monday = today.weekday()
    return (today - timedelta(days=days_since_monday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def get_month_start() -> datetime:
    """Get the start of the current month."""
    today = datetime.now()
    return today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def make_naive(dt: datetime) -> datetime:
    """Convert datetime to timezone-naive for comparison."""
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def calculate_progress(goal: Goal, user_id: UUID) -> GoalProgressResponse:
    """Calculate progress toward a goal."""
    # Determine date range
    if goal.period == GoalPeriod.WEEKLY:
        start_date = get_week_start()
    else:
        start_date = get_month_start()

    # Count activities in the period
    current = 0

    if goal.activity_type == ActivityType.RUNNING:
        activities = running_repo.find_by(user_id=user_id)
        current = sum(
            1 for a in activities
            if make_naive(a.start_time) >= start_date
        )
    elif goal.activity_type == ActivityType.STRENGTH:
        activities = strength_repo.find_by(user_id=user_id)
        current = sum(
            1 for a in activities
            if make_naive(a.start_time) >= start_date
        )

    # Calculate percentage
    percentage = min(100.0, (current / goal.target_frequency) * 100) if goal.target_frequency > 0 else 0

    return GoalProgressResponse(
        current=current,
        target=goal.target_frequency,
        percentage=round(percentage, 1),
    )


def goal_to_response(goal: Goal, user_id: UUID) -> GoalResponse:
    """Convert goal model to response schema with progress."""
    progress = calculate_progress(goal, user_id)

    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        activity_type=goal.activity_type.value,
        target_frequency=goal.target_frequency,
        period=goal.period.value,
        is_active=goal.is_active,
        notes=goal.notes,
        display_text=goal.display_text,
        progress=progress,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    request: GoalCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new goal."""
    # Validate activity type
    try:
        activity_type = ActivityType(request.activity_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid activity type: {request.activity_type}. Use 'running' or 'strength'.",
        )

    # Validate period
    try:
        period = GoalPeriod(request.period)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid period: {request.period}. Use 'weekly' or 'monthly'.",
        )

    # Check if user already has an active goal for this activity type and period
    existing_goals = goal_repo.find_by(user_id=current_user.id)
    for existing in existing_goals:
        if (
            existing.activity_type == activity_type
            and existing.period == period
            and existing.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have an active {period.value} goal for {activity_type.value}.",
            )

    goal = Goal(
        user_id=current_user.id,
        activity_type=activity_type,
        target_frequency=request.target_frequency,
        period=period,
        notes=request.notes,
    )

    saved = goal_repo.create(goal)
    return goal_to_response(saved, current_user.id)


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    active_only: bool = True,
):
    """List all goals for the current user."""
    goals = goal_repo.find_by(user_id=current_user.id)

    if active_only:
        goals = [g for g in goals if g.is_active]

    # Sort by activity type
    goals.sort(key=lambda g: g.activity_type.value)

    return [goal_to_response(g, current_user.id) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Get a specific goal."""
    goal = goal_repo.get(goal_id)

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    if goal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal",
        )

    return goal_to_response(goal, current_user.id)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    request: GoalUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a goal."""
    goal = goal_repo.get(goal_id)

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    if goal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this goal",
        )

    # Build update data
    update_data = {
        "id": goal.id,
        "user_id": goal.user_id,
        "created_at": goal.created_at,
        "activity_type": goal.activity_type,
        "target_frequency": request.target_frequency if request.target_frequency is not None else goal.target_frequency,
        "period": GoalPeriod(request.period) if request.period is not None else goal.period,
        "is_active": request.is_active if request.is_active is not None else goal.is_active,
        "notes": request.notes if request.notes is not None else goal.notes,
    }

    updated_goal = Goal(**update_data)
    updated = goal_repo.update(updated_goal)
    return goal_to_response(updated, current_user.id)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Delete a goal."""
    goal = goal_repo.get(goal_id)

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    if goal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this goal",
        )

    goal_repo.delete(goal_id)
    return None
