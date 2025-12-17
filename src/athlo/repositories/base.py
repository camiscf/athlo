"""Abstract base repository interface."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseRepository(ABC, Generic[T]):
    """Abstract base repository defining CRUD operations."""

    @abstractmethod
    def get(self, id: UUID) -> T | None:
        """Get an entity by ID."""
        pass

    @abstractmethod
    def get_all(self) -> list[T]:
        """Get all entities."""
        pass

    @abstractmethod
    def create(self, entity: T) -> T:
        """Create a new entity."""
        pass

    @abstractmethod
    def update(self, entity: T) -> T:
        """Update an existing entity."""
        pass

    @abstractmethod
    def delete(self, id: UUID) -> bool:
        """Delete an entity by ID. Returns True if deleted."""
        pass

    @abstractmethod
    def find_by(self, **kwargs) -> list[T]:
        """Find entities matching the given criteria."""
        pass
