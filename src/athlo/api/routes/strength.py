"""Strength training routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from athlo.api.deps import get_current_user
from athlo.api.schemas import (
    ErrorResponse,
    ExerciseCreate,
    ExerciseResponse,
    StrengthActivityCreate,
    StrengthActivityResponse,
    StrengthActivityUpdate,
    WorkoutDivisionCreate,
    WorkoutDivisionResponse,
    WorkoutDivisionUpdate,
    ExerciseHistoryResponse,
)
from athlo.models.user import User
from athlo.models.strength import (
    Exercise,
    WorkoutDivision,
    StrengthActivity,
    PlannedExercise,
    ExerciseLog,
    MUSCLE_GROUPS,
    DEFAULT_EXERCISES,
)
from athlo.repositories.json_repository import JsonRepository

# Repositories
exercise_repo = JsonRepository[Exercise]("exercises.json", Exercise)
division_repo = JsonRepository[WorkoutDivision]("workout_divisions.json", WorkoutDivision)
strength_activity_repo = JsonRepository[StrengthActivity]("strength_activities.json", StrengthActivity)

router = APIRouter(prefix="/strength", tags=["Strength Training"])


# ==================== EXERCISES ====================

@router.get("/exercises", response_model=list[ExerciseResponse])
async def list_exercises(
    muscle_group: str | None = None,
    current_user: User = Depends(get_current_user),
):
    """List all exercises (default + user's custom)."""
    exercises = []

    # Add default exercises
    for group, exercise_names in DEFAULT_EXERCISES.items():
        if muscle_group and group != muscle_group:
            continue
        for name in exercise_names:
            exercises.append(
                ExerciseResponse(
                    id=UUID("00000000-0000-0000-0000-000000000000"),  # Placeholder for default
                    name=name,
                    muscle_group=group,
                    is_custom=False,
                    user_id=None,
                )
            )

    # Add user's custom exercises
    custom_exercises = exercise_repo.find_by(user_id=current_user.id)
    for ex in custom_exercises:
        if muscle_group and ex.muscle_group != muscle_group:
            continue
        exercises.append(
            ExerciseResponse(
                id=ex.id,
                name=ex.name,
                muscle_group=ex.muscle_group,
                is_custom=True,
                user_id=ex.user_id,
            )
        )

    return exercises


@router.get("/muscle-groups", response_model=list[str])
async def list_muscle_groups():
    """List all available muscle groups."""
    return MUSCLE_GROUPS


@router.post(
    "/exercises",
    response_model=ExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_custom_exercise(
    request: ExerciseCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a custom exercise."""
    if request.muscle_group not in MUSCLE_GROUPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid muscle group. Must be one of: {', '.join(MUSCLE_GROUPS)}",
        )

    exercise = Exercise(
        user_id=current_user.id,
        name=request.name,
        muscle_group=request.muscle_group,
        is_custom=True,
    )
    created = exercise_repo.create(exercise)

    return ExerciseResponse(
        id=created.id,
        name=created.name,
        muscle_group=created.muscle_group,
        is_custom=True,
        user_id=created.user_id,
    )


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Delete a custom exercise."""
    exercise = exercise_repo.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if exercise.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's exercise")

    exercise_repo.delete(exercise_id)
    return None


# ==================== WORKOUT DIVISIONS ====================

@router.get("/divisions", response_model=list[WorkoutDivisionResponse])
async def list_divisions(
    current_user: User = Depends(get_current_user),
):
    """List user's workout divisions."""
    divisions = division_repo.find_by(user_id=current_user.id)
    divisions = sorted(divisions, key=lambda d: d.order)

    return [
        WorkoutDivisionResponse(
            id=d.id,
            user_id=d.user_id,
            name=d.name,
            exercises=[
                {
                    "exercise_name": e.exercise_name,
                    "muscle_group": e.muscle_group,
                    "sets": e.sets,
                    "reps": e.reps,
                    "rest_seconds": e.rest_seconds,
                    "suggested_weight": e.suggested_weight,
                    "notes": e.notes,
                    "order": e.order,
                }
                for e in sorted(d.exercises, key=lambda x: x.order)
            ],
            is_active=d.is_active,
            order=d.order,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in divisions
    ]


@router.get("/divisions/{division_id}", response_model=WorkoutDivisionResponse)
async def get_division(
    division_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Get a specific workout division."""
    division = division_repo.get(division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    if division.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return WorkoutDivisionResponse(
        id=division.id,
        user_id=division.user_id,
        name=division.name,
        exercises=[
            {
                "exercise_name": e.exercise_name,
                "muscle_group": e.muscle_group,
                "sets": e.sets,
                "reps": e.reps,
                "rest_seconds": e.rest_seconds,
                "suggested_weight": e.suggested_weight,
                "notes": e.notes,
                "order": e.order,
            }
            for e in sorted(division.exercises, key=lambda x: x.order)
        ],
        is_active=division.is_active,
        order=division.order,
        created_at=division.created_at,
        updated_at=division.updated_at,
    )


@router.post(
    "/divisions",
    response_model=WorkoutDivisionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_division(
    request: WorkoutDivisionCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a workout division (max 5)."""
    existing = division_repo.find_by(user_id=current_user.id)
    if len(existing) >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 workout divisions allowed",
        )

    exercises = [
        PlannedExercise(
            exercise_name=e.exercise_name,
            muscle_group=e.muscle_group,
            sets=e.sets,
            reps=e.reps,
            rest_seconds=e.rest_seconds,
            suggested_weight=e.suggested_weight,
            notes=e.notes,
            order=e.order,
        )
        for e in request.exercises
    ]

    division = WorkoutDivision(
        user_id=current_user.id,
        name=request.name,
        exercises=exercises,
        order=request.order,
    )
    created = division_repo.create(division)

    return WorkoutDivisionResponse(
        id=created.id,
        user_id=created.user_id,
        name=created.name,
        exercises=[
            {
                "exercise_name": e.exercise_name,
                "muscle_group": e.muscle_group,
                "sets": e.sets,
                "reps": e.reps,
                "rest_seconds": e.rest_seconds,
                "suggested_weight": e.suggested_weight,
                "notes": e.notes,
                "order": e.order,
            }
            for e in sorted(created.exercises, key=lambda x: x.order)
        ],
        is_active=created.is_active,
        order=created.order,
        created_at=created.created_at,
        updated_at=created.updated_at,
    )


@router.put("/divisions/{division_id}", response_model=WorkoutDivisionResponse)
async def update_division(
    division_id: UUID,
    request: WorkoutDivisionUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a workout division."""
    division = division_repo.get(division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    if division.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if request.name is not None:
        division.name = request.name
    if request.is_active is not None:
        division.is_active = request.is_active
    if request.order is not None:
        division.order = request.order
    if request.exercises is not None:
        division.exercises = [
            PlannedExercise(
                exercise_name=e.exercise_name,
                muscle_group=e.muscle_group,
                sets=e.sets,
                reps=e.reps,
                rest_seconds=e.rest_seconds,
                suggested_weight=e.suggested_weight,
                notes=e.notes,
                order=e.order,
            )
            for e in request.exercises
        ]

    updated = division_repo.update(division)

    return WorkoutDivisionResponse(
        id=updated.id,
        user_id=updated.user_id,
        name=updated.name,
        exercises=[
            {
                "exercise_name": e.exercise_name,
                "muscle_group": e.muscle_group,
                "sets": e.sets,
                "reps": e.reps,
                "rest_seconds": e.rest_seconds,
                "suggested_weight": e.suggested_weight,
                "notes": e.notes,
                "order": e.order,
            }
            for e in sorted(updated.exercises, key=lambda x: x.order)
        ],
        is_active=updated.is_active,
        order=updated.order,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete("/divisions/{division_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_division(
    division_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Delete a workout division."""
    division = division_repo.get(division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    if division.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    division_repo.delete(division_id)
    return None


# ==================== STRENGTH ACTIVITIES ====================

@router.get("/activities", response_model=list[StrengthActivityResponse])
async def list_strength_activities(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """List user's strength training activities."""
    activities = strength_activity_repo.find_by(user_id=current_user.id)
    activities = sorted(activities, key=lambda a: a.start_time, reverse=True)
    activities = activities[offset : offset + limit]

    return [_activity_to_response(a) for a in activities]


@router.get("/activities/{activity_id}", response_model=StrengthActivityResponse)
async def get_strength_activity(
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Get a specific strength training activity."""
    activity = strength_activity_repo.get(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _activity_to_response(activity)


@router.post(
    "/activities",
    response_model=StrengthActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_strength_activity(
    request: StrengthActivityCreate,
    current_user: User = Depends(get_current_user),
):
    """Record a strength training activity."""
    # Get previous records for each exercise to show progression
    exercises_with_history = []
    for ex in request.exercises:
        previous = _get_previous_exercise_record(current_user.id, ex.exercise_name)
        exercises_with_history.append(
            ExerciseLog(
                exercise_name=ex.exercise_name,
                muscle_group=ex.muscle_group,
                planned_sets=ex.planned_sets,
                planned_reps=ex.planned_reps,
                sets_completed=ex.sets_completed,
                reps_completed=ex.reps_completed,
                weight=ex.weight,
                rpe=ex.rpe,
                notes=ex.notes,
                previous_weight=previous.get("weight") if previous else None,
                previous_reps=previous.get("reps") if previous else None,
            )
        )

    activity = StrengthActivity(
        user_id=current_user.id,
        title=request.title,
        division_id=request.division_id,
        division_name=request.division_name,
        start_time=request.start_time,
        exercises=exercises_with_history,
        duration=request.duration,
        effort=request.effort,
        notes=request.notes,
    )
    created = strength_activity_repo.create(activity)

    return _activity_to_response(created)


@router.put("/activities/{activity_id}", response_model=StrengthActivityResponse)
async def update_strength_activity(
    activity_id: UUID,
    request: StrengthActivityUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a strength training activity."""
    activity = strength_activity_repo.get(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if request.title is not None:
        activity.title = request.title
    if request.division_id is not None:
        activity.division_id = request.division_id
    if request.division_name is not None:
        activity.division_name = request.division_name
    if request.start_time is not None:
        activity.start_time = request.start_time
    if request.duration is not None:
        activity.duration = request.duration
    if request.effort is not None:
        activity.effort = request.effort
    if request.notes is not None:
        activity.notes = request.notes
    if request.exercises is not None:
        activity.exercises = [
            ExerciseLog(
                exercise_name=ex.exercise_name,
                muscle_group=ex.muscle_group,
                planned_sets=ex.planned_sets,
                planned_reps=ex.planned_reps,
                sets_completed=ex.sets_completed,
                reps_completed=ex.reps_completed,
                weight=ex.weight,
                rpe=ex.rpe,
                notes=ex.notes,
            )
            for ex in request.exercises
        ]

    updated = strength_activity_repo.update(activity)
    return _activity_to_response(updated)


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strength_activity(
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Delete a strength training activity."""
    activity = strength_activity_repo.get(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    strength_activity_repo.delete(activity_id)
    return None


# ==================== EXERCISE HISTORY ====================

@router.get("/history/{exercise_name}", response_model=ExerciseHistoryResponse)
async def get_exercise_history(
    exercise_name: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
):
    """Get history of a specific exercise for progression tracking."""
    activities = strength_activity_repo.find_by(user_id=current_user.id)
    activities = sorted(activities, key=lambda a: a.start_time, reverse=True)

    records = []
    for activity in activities:
        for ex in activity.exercises:
            if ex.exercise_name.lower() == exercise_name.lower():
                records.append({
                    "date": activity.start_time.isoformat(),
                    "weight": ex.weight,
                    "reps": ex.reps_completed,
                    "sets": ex.sets_completed,
                    "rpe": ex.rpe,
                })
                break

        if len(records) >= limit:
            break

    return ExerciseHistoryResponse(
        exercise_name=exercise_name,
        records=records,
    )


# ==================== HELPERS ====================

def _get_previous_exercise_record(user_id: UUID, exercise_name: str) -> dict | None:
    """Get the most recent record of an exercise."""
    activities = strength_activity_repo.find_by(user_id=user_id)
    activities = sorted(activities, key=lambda a: a.start_time, reverse=True)

    for activity in activities:
        for ex in activity.exercises:
            if ex.exercise_name.lower() == exercise_name.lower():
                return {
                    "weight": ex.weight,
                    "reps": ex.reps_completed,
                }

    return None


def _activity_to_response(activity: StrengthActivity) -> StrengthActivityResponse:
    """Convert StrengthActivity to response model."""
    return StrengthActivityResponse(
        id=activity.id,
        user_id=activity.user_id,
        title=activity.title,
        division_id=activity.division_id,
        division_name=activity.division_name,
        start_time=activity.start_time,
        exercises=[
            {
                "exercise_name": ex.exercise_name,
                "muscle_group": ex.muscle_group,
                "planned_sets": ex.planned_sets,
                "planned_reps": ex.planned_reps,
                "sets_completed": ex.sets_completed,
                "reps_completed": ex.reps_completed,
                "weight": ex.weight,
                "rpe": ex.rpe,
                "notes": ex.notes,
                "previous_weight": ex.previous_weight,
                "previous_reps": ex.previous_reps,
            }
            for ex in activity.exercises
        ],
        duration=activity.duration,
        duration_formatted=activity.duration_formatted,
        effort=activity.effort,
        notes=activity.notes,
        total_sets=activity.total_sets,
        total_exercises=activity.total_exercises,
        muscle_groups_worked=activity.muscle_groups_worked,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
    )
