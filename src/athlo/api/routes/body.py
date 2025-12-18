"""API routes for body measurements."""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from athlo.models.body import BodyMeasurement, BodyMeasurementCreate, BodyMeasurementUpdate
from athlo.api.deps import get_current_user

router = APIRouter(prefix="/body", tags=["body"])

DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data"


def get_body_file(user_id: str) -> Path:
    """Get path to user's body measurements file."""
    user_dir = DATA_DIR / "users" / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir / "body_measurements.json"


def load_measurements(user_id: str) -> List[dict]:
    """Load body measurements from file."""
    file_path = get_body_file(user_id)
    if file_path.exists():
        with open(file_path, "r") as f:
            return json.load(f)
    return []


def save_measurements(user_id: str, measurements: List[dict]):
    """Save body measurements to file."""
    file_path = get_body_file(user_id)
    with open(file_path, "w") as f:
        json.dump(measurements, f, indent=2, default=str)


@router.get("/measurements", response_model=List[BodyMeasurement])
async def get_measurements(
    limit: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get all body measurements for the current user."""
    measurements = load_measurements(current_user["id"])
    # Sort by date descending
    measurements.sort(key=lambda x: x.get("date", ""), reverse=True)
    if limit:
        measurements = measurements[:limit]
    return measurements


@router.get("/measurements/{measurement_id}", response_model=BodyMeasurement)
async def get_measurement(
    measurement_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific body measurement."""
    measurements = load_measurements(current_user["id"])
    for m in measurements:
        if m["id"] == measurement_id:
            return m
    raise HTTPException(status_code=404, detail="Measurement not found")


@router.post("/measurements", response_model=BodyMeasurement)
async def create_measurement(
    data: BodyMeasurementCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new body measurement."""
    measurements = load_measurements(current_user["id"])

    # Use today's date if not provided
    date = data.date or datetime.now().strftime("%Y-%m-%d")

    measurement = BodyMeasurement(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        date=date,
        weight=data.weight,
        body_fat_percentage=data.body_fat_percentage,
        chest=data.chest,
        waist=data.waist,
        hips=data.hips,
        left_arm=data.left_arm,
        right_arm=data.right_arm,
        left_thigh=data.left_thigh,
        right_thigh=data.right_thigh,
        left_calf=data.left_calf,
        right_calf=data.right_calf,
        neck=data.neck,
        shoulders=data.shoulders,
        notes=data.notes,
    )

    measurements.append(measurement.model_dump())
    save_measurements(current_user["id"], measurements)

    return measurement


@router.put("/measurements/{measurement_id}", response_model=BodyMeasurement)
async def update_measurement(
    measurement_id: str,
    data: BodyMeasurementUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a body measurement."""
    measurements = load_measurements(current_user["id"])

    for i, m in enumerate(measurements):
        if m["id"] == measurement_id:
            # Update fields
            update_data = data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                m[key] = value
            m["updated_at"] = datetime.utcnow().isoformat()

            save_measurements(current_user["id"], measurements)
            return m

    raise HTTPException(status_code=404, detail="Measurement not found")


@router.delete("/measurements/{measurement_id}")
async def delete_measurement(
    measurement_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a body measurement."""
    measurements = load_measurements(current_user["id"])

    for i, m in enumerate(measurements):
        if m["id"] == measurement_id:
            measurements.pop(i)
            save_measurements(current_user["id"], measurements)
            return {"message": "Measurement deleted"}

    raise HTTPException(status_code=404, detail="Measurement not found")


@router.get("/latest", response_model=Optional[BodyMeasurement])
async def get_latest_measurement(
    current_user: dict = Depends(get_current_user),
):
    """Get the latest body measurement."""
    measurements = load_measurements(current_user["id"])
    if not measurements:
        return None

    # Sort by date descending and return first
    measurements.sort(key=lambda x: x.get("date", ""), reverse=True)
    return measurements[0]


@router.get("/weight-history")
async def get_weight_history(
    limit: Optional[int] = 30,
    current_user: dict = Depends(get_current_user),
):
    """Get weight history for charting."""
    measurements = load_measurements(current_user["id"])

    # Filter only measurements with weight
    weight_records = [
        {"date": m["date"], "weight": m["weight"]}
        for m in measurements
        if m.get("weight") is not None
    ]

    # Sort by date ascending for charts
    weight_records.sort(key=lambda x: x["date"])

    if limit:
        weight_records = weight_records[-limit:]

    return weight_records
