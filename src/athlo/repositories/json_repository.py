"""JSON file-based repository implementation."""

import json
from datetime import datetime
from pathlib import Path
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

from athlo.config import settings
from athlo.repositories.base import BaseRepository

T = TypeVar("T", bound=BaseModel)


class JsonRepository(BaseRepository[T], Generic[T]):
    """Repository that stores entities in JSON files."""

    def __init__(self, filename: str, model_class: type[T]):
        """
        Initialize the JSON repository.

        Args:
            filename: Name of the JSON file (e.g., 'users.json')
            model_class: The Pydantic model class for deserialization
        """
        self.filepath = settings.data_dir / filename
        self.model_class = model_class
        self._ensure_file_exists()

    def _ensure_file_exists(self) -> None:
        """Create the JSON file if it doesn't exist."""
        if not self.filepath.exists():
            self.filepath.write_text("[]")

    def _read_all(self) -> list[dict]:
        """Read all records from the JSON file."""
        content = self.filepath.read_text()
        return json.loads(content) if content.strip() else []

    def _write_all(self, records: list[dict]) -> None:
        """Write all records to the JSON file."""
        self.filepath.write_text(json.dumps(records, indent=2, default=str))

    def get(self, id: UUID) -> T | None:
        """Get an entity by ID."""
        records = self._read_all()
        for record in records:
            if record.get("id") == str(id):
                return self.model_class.model_validate(record)
        return None

    def get_all(self) -> list[T]:
        """Get all entities."""
        records = self._read_all()
        return [self.model_class.model_validate(r) for r in records]

    def create(self, entity: T) -> T:
        """Create a new entity."""
        records = self._read_all()
        entity_dict = json.loads(entity.model_dump_json())
        records.append(entity_dict)
        self._write_all(records)
        return entity

    def update(self, entity: T) -> T:
        """Update an existing entity."""
        records = self._read_all()
        entity_id = str(entity.id)  # type: ignore

        for i, record in enumerate(records):
            if record.get("id") == entity_id:
                # Update the updated_at timestamp
                entity_dict = json.loads(entity.model_dump_json())
                entity_dict["updated_at"] = datetime.now().isoformat()
                records[i] = entity_dict
                self._write_all(records)
                return self.model_class.model_validate(entity_dict)

        raise ValueError(f"Entity with id {entity_id} not found")

    def delete(self, id: UUID) -> bool:
        """Delete an entity by ID. Returns True if deleted."""
        records = self._read_all()
        initial_count = len(records)
        records = [r for r in records if r.get("id") != str(id)]

        if len(records) < initial_count:
            self._write_all(records)
            return True
        return False

    def find_by(self, **kwargs) -> list[T]:
        """Find entities matching the given criteria."""
        records = self._read_all()
        results = []

        for record in records:
            match = True
            for key, value in kwargs.items():
                record_value = record.get(key)
                # Handle UUID comparison
                if isinstance(value, UUID):
                    value = str(value)
                if record_value != value:
                    match = False
                    break
            if match:
                results.append(self.model_class.model_validate(record))

        return results

    def find_one_by(self, **kwargs) -> T | None:
        """Find a single entity matching the given criteria."""
        results = self.find_by(**kwargs)
        return results[0] if results else None
