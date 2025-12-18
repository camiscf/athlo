"""Models for body measurements tracking."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BodyMeasurement(BaseModel):
    """A single body measurement record."""
    id: str
    user_id: str
    date: str  # YYYY-MM-DD

    # Weight
    weight: Optional[float] = Field(None, description="Weight in kg")

    # Body fat
    body_fat_percentage: Optional[float] = Field(None, description="Body fat percentage")

    # Measurements in cm
    chest: Optional[float] = Field(None, description="Chest circumference in cm")
    waist: Optional[float] = Field(None, description="Waist circumference in cm")
    hips: Optional[float] = Field(None, description="Hips circumference in cm")
    left_arm: Optional[float] = Field(None, description="Left arm circumference in cm")
    right_arm: Optional[float] = Field(None, description="Right arm circumference in cm")
    left_thigh: Optional[float] = Field(None, description="Left thigh circumference in cm")
    right_thigh: Optional[float] = Field(None, description="Right thigh circumference in cm")
    left_calf: Optional[float] = Field(None, description="Left calf circumference in cm")
    right_calf: Optional[float] = Field(None, description="Right calf circumference in cm")
    neck: Optional[float] = Field(None, description="Neck circumference in cm")
    shoulders: Optional[float] = Field(None, description="Shoulders width in cm")

    # Notes
    notes: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BodyMeasurementCreate(BaseModel):
    """Schema for creating a body measurement."""
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    left_arm: Optional[float] = None
    right_arm: Optional[float] = None
    left_thigh: Optional[float] = None
    right_thigh: Optional[float] = None
    left_calf: Optional[float] = None
    right_calf: Optional[float] = None
    neck: Optional[float] = None
    shoulders: Optional[float] = None
    notes: Optional[str] = None


class BodyMeasurementUpdate(BaseModel):
    """Schema for updating a body measurement."""
    date: Optional[str] = None
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    left_arm: Optional[float] = None
    right_arm: Optional[float] = None
    left_thigh: Optional[float] = None
    right_thigh: Optional[float] = None
    left_calf: Optional[float] = None
    right_calf: Optional[float] = None
    neck: Optional[float] = None
    shoulders: Optional[float] = None
    notes: Optional[str] = None
