"""Running activity routes."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from athlo.api.deps import get_current_user
from athlo.api.schemas import (
    RunningActivityCreate,
    RunningActivityResponse,
    RunningActivityUpdate,
)
from athlo.models.activity import RunningActivity
from athlo.models.user import User
from athlo.repositories.json_repository import JsonRepository

router = APIRouter(prefix="/activities/running", tags=["Running Activities"])

# Repository for running activities
activity_repo = JsonRepository[RunningActivity]("running_activities.json", RunningActivity)


def activity_to_response(activity: RunningActivity) -> RunningActivityResponse:
    """Convert activity model to response schema."""
    return RunningActivityResponse(
        id=activity.id,
        user_id=activity.user_id,
        title=activity.title,
        start_time=activity.start_time,
        distance=activity.distance,
        duration=activity.duration,
        pace=activity.pace,
        pace_formatted=activity.pace_formatted,
        duration_formatted=activity.duration_formatted,
        speed_kmh=activity.speed_kmh,
        cadence=activity.cadence,
        calories=activity.calories,
        effort=activity.effort,
        avg_heart_rate=activity.avg_heart_rate,
        notes=activity.notes,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
    )


@router.post(
    "",
    response_model=RunningActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_running_activity(
    request: RunningActivityCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Create a new running activity.

    Provide at least 2 of: distance, duration, pace.
    The third will be calculated automatically.
    """
    # Validate that at least 2 metrics are provided
    metrics = [request.distance, request.duration, request.pace]
    provided = sum(m is not None for m in metrics)
    if provided < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least 2 of: distance, duration, pace",
        )

    activity = RunningActivity(
        user_id=current_user.id,
        title=request.title,
        start_time=request.start_time,
        distance=request.distance,
        duration=request.duration,
        pace=request.pace,
        cadence=request.cadence,
        calories=request.calories,
        effort=request.effort,
        avg_heart_rate=request.avg_heart_rate,
        notes=request.notes,
    )

    saved = activity_repo.create(activity)
    return activity_to_response(saved)


@router.get("", response_model=list[RunningActivityResponse])
async def list_running_activities(
    current_user: User = Depends(get_current_user),
    date: str | None = Query(None, description="Filter by date (dd-MM-yyyy)"),
    start_date: str | None = Query(None, description="Filter from this date (dd-MM-yyyy)"),
    end_date: str | None = Query(None, description="Filter until this date (dd-MM-yyyy)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List running activities for the current user.

    Date format: dd-MM-yyyy (e.g., 07-12-2025)
    """
    activities = activity_repo.find_by(user_id=current_user.id)

    # Parse dates from dd-MM-yyyy or dd/MM/yyyy format
    def parse_date(date_str: str) -> datetime:
        for fmt in ("%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {date_str}. Use dd-MM-yyyy or dd/MM/yyyy",
        )

    # Filter by specific date
    if date:
        target_date = parse_date(date)
        activities = [
            a for a in activities
            if a.start_time.date() == target_date.date()
        ]

    # Filter by date range
    if start_date:
        start = parse_date(start_date)
        activities = [a for a in activities if a.start_time >= start]
    if end_date:
        end = parse_date(end_date)
        # Include the entire end day
        end = end.replace(hour=23, minute=59, second=59)
        activities = [a for a in activities if a.start_time <= end]

    # Sort by start_time descending (most recent first)
    activities.sort(key=lambda a: a.start_time, reverse=True)

    # Pagination
    activities = activities[offset : offset + limit]

    return [activity_to_response(a) for a in activities]


@router.get("/{activity_id}", response_model=RunningActivityResponse)
async def get_running_activity(
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Get a specific running activity."""
    activity = activity_repo.get(activity_id)

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    if activity.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this activity",
        )

    return activity_to_response(activity)


@router.put("/{activity_id}", response_model=RunningActivityResponse)
async def update_running_activity(
    activity_id: UUID,
    request: RunningActivityUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a running activity."""
    activity = activity_repo.get(activity_id)

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    if activity.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this activity",
        )

    # Build updated data
    update_data = {
        "id": activity.id,
        "user_id": activity.user_id,
        "created_at": activity.created_at,
        "title": request.title if request.title is not None else activity.title,
        "start_time": request.start_time if request.start_time is not None else activity.start_time,
        "distance": request.distance if request.distance is not None else activity.distance,
        "duration": request.duration if request.duration is not None else activity.duration,
        "pace": request.pace if request.pace is not None else activity.pace,
        "cadence": request.cadence if request.cadence is not None else activity.cadence,
        "calories": request.calories if request.calories is not None else activity.calories,
        "effort": request.effort if request.effort is not None else activity.effort,
        "avg_heart_rate": request.avg_heart_rate if request.avg_heart_rate is not None else activity.avg_heart_rate,
        "notes": request.notes if request.notes is not None else activity.notes,
    }

    # Recreate model to trigger auto-calculation
    updated_activity = RunningActivity(**update_data)
    updated = activity_repo.update(updated_activity)
    return activity_to_response(updated)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_running_activity(
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Delete a running activity."""
    activity = activity_repo.get(activity_id)

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    if activity.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this activity",
        )

    activity_repo.delete(activity_id)
    return None
