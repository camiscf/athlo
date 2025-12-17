"""Repository layer for data persistence."""

from athlo.repositories.base import BaseRepository
from athlo.repositories.json_repository import JsonRepository

__all__ = ["BaseRepository", "JsonRepository"]
