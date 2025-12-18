"""Strength training models."""

from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from athlo.models.base import BaseModel


# Grupos musculares pré-definidos
MUSCLE_GROUPS = [
    "Peito",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Pernas",
    "Core",
    "Glúteos",
    "Outro",
]

# Banco de exercícios pré-definidos por grupo muscular
DEFAULT_EXERCISES = {
    "Peito": [
        "Supino Reto",
        "Supino Inclinado",
        "Supino Declinado",
        "Supino com Halteres",
        "Crucifixo",
        "Crucifixo Inclinado",
        "Crossover",
        "Flexão de Braço",
        "Fly na Máquina",
        "Pullover",
    ],
    "Costas": [
        "Puxada Frontal",
        "Puxada Supinada",
        "Remada Curvada",
        "Remada Unilateral",
        "Remada Cavalinho",
        "Remada Baixa",
        "Barra Fixa",
        "Pulldown",
        "Levantamento Terra",
        "Good Morning",
    ],
    "Ombros": [
        "Desenvolvimento com Barra",
        "Desenvolvimento com Halteres",
        "Elevação Lateral",
        "Elevação Frontal",
        "Crucifixo Inverso",
        "Face Pull",
        "Encolhimento",
        "Arnold Press",
        "Remada Alta",
    ],
    "Bíceps": [
        "Rosca Direta",
        "Rosca Alternada",
        "Rosca Martelo",
        "Rosca Concentrada",
        "Rosca Scott",
        "Rosca no Cabo",
        "Rosca Inclinada",
        "Rosca 21",
    ],
    "Tríceps": [
        "Tríceps Pulley",
        "Tríceps Corda",
        "Tríceps Testa",
        "Tríceps Francês",
        "Tríceps Coice",
        "Mergulho",
        "Supino Fechado",
        "Tríceps na Máquina",
    ],
    "Pernas": [
        "Agachamento Livre",
        "Agachamento no Smith",
        "Agachamento Frontal",
        "Leg Press",
        "Leg Press 45°",
        "Cadeira Extensora",
        "Mesa Flexora",
        "Cadeira Flexora",
        "Stiff",
        "Passada",
        "Afundo",
        "Búlgaro",
        "Panturrilha em Pé",
        "Panturrilha Sentado",
        "Hack Squat",
        "Agachamento Sumô",
    ],
    "Core": [
        "Abdominal Crunch",
        "Abdominal Infra",
        "Prancha",
        "Prancha Lateral",
        "Abdominal na Máquina",
        "Abdominal com Corda",
        "Russian Twist",
        "Elevação de Pernas",
        "Abdominal Bicicleta",
        "Dead Bug",
    ],
    "Glúteos": [
        "Hip Thrust",
        "Elevação Pélvica",
        "Glúteo na Máquina",
        "Kickback",
        "Abdução de Quadril",
        "Agachamento Sumô",
        "Passada",
        "Step Up",
    ],
}


class Exercise(BaseModel):
    """Exercício do banco de exercícios."""

    user_id: UUID | None = None  # None = exercício padrão do sistema
    name: str
    muscle_group: str
    is_custom: bool = False  # True se foi criado pelo usuário

    @field_validator("muscle_group")
    @classmethod
    def validate_muscle_group(cls, v):
        if v not in MUSCLE_GROUPS:
            raise ValueError(f"Muscle group must be one of: {', '.join(MUSCLE_GROUPS)}")
        return v


class PlannedExercise(BaseModel):
    """Exercício planejado dentro de uma divisão de treino."""

    exercise_name: str
    muscle_group: str
    sets: int = Field(ge=1, le=20)  # séries
    reps: str  # pode ser "10" ou "8-12"
    rest_seconds: int | None = None  # descanso entre séries
    suggested_weight: float | None = None  # carga sugerida pelo treinador (kg)
    notes: str | None = None  # observações do treinador
    order: int = 0  # ordem do exercício na divisão


class WorkoutDivision(BaseModel):
    """Divisão de treino (A, B, C, etc)."""

    user_id: UUID
    name: str = Field(min_length=1, max_length=50)  # ex: "Treino A - Peito e Tríceps"
    exercises: list[PlannedExercise] = []
    is_active: bool = True
    order: int = 0  # ordem da divisão

    @field_validator("exercises")
    @classmethod
    def validate_exercises(cls, v):
        if len(v) > 30:
            raise ValueError("Maximum 30 exercises per division")
        return v


class ExerciseLog(BaseModel):
    """Registro de um exercício realizado durante o treino."""

    exercise_name: str
    muscle_group: str
    planned_sets: int | None = None  # séries planejadas
    planned_reps: str | None = None  # reps planejadas

    # O que foi realmente feito
    sets_completed: int = Field(ge=0, le=20)
    reps_completed: str  # ex: "10, 10, 8, 8" ou "10"
    weight: float | None = None  # carga usada (kg)
    rpe: int | None = Field(None, ge=1, le=10)  # esforço percebido
    notes: str | None = None

    # Histórico (preenchido automaticamente)
    previous_weight: float | None = None  # carga da última vez
    previous_reps: str | None = None  # reps da última vez


class StrengthActivity(BaseModel):
    """Registro de treino de força."""

    user_id: UUID
    title: str | None = None  # ex: "Treino A - Peito e Tríceps"
    division_id: UUID | None = None  # referência à divisão usada
    division_name: str | None = None  # nome da divisão no momento do treino
    start_time: datetime

    # Exercícios realizados
    exercises: list[ExerciseLog] = []

    # Métricas gerais
    duration: float | None = None  # segundos
    effort: int | None = Field(None, ge=1, le=10)  # RPE geral do treino
    notes: str | None = None

    @property
    def duration_formatted(self) -> str | None:
        """Format duration as HH:MM:SS."""
        if self.duration:
            hours = int(self.duration // 3600)
            minutes = int((self.duration % 3600) // 60)
            seconds = int(self.duration % 60)
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return None

    @property
    def total_sets(self) -> int:
        """Total de séries realizadas."""
        return sum(ex.sets_completed for ex in self.exercises)

    @property
    def total_exercises(self) -> int:
        """Total de exercícios realizados."""
        return len(self.exercises)

    @property
    def muscle_groups_worked(self) -> list[str]:
        """Lista de grupos musculares trabalhados."""
        return list(set(ex.muscle_group for ex in self.exercises))
