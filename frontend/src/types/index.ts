// User types
export interface User {
  id: string;
  email: string;
  name: string;
  preferred_units: 'metric' | 'imperial';
  is_active: boolean;
  created_at: string;
}

// Auth types
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Activity types
export interface RunningActivity {
  id: string;
  user_id: string;
  title: string | null;
  start_time: string;
  distance: number | null;
  duration: number | null; // seconds
  pace: number | null; // seconds per km
  pace_formatted: string | null;
  duration_formatted: string | null;
  speed_kmh: number | null;
  cadence?: number | null;
  calories?: number | null;
  effort?: number | null; // RPE 1-10
  avg_heart_rate?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunningActivityCreate {
  title?: string;
  start_time: string;
  distance?: number; // kilometers
  duration?: number; // seconds
  pace?: number; // seconds per km
  cadence?: number;
  calories?: number;
  effort?: number; // RPE 1-10
  avg_heart_rate?: number;
  notes?: string;
}

// ==================== STRENGTH TRAINING TYPES ====================

// Exercise from the exercise bank
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  is_custom: boolean;
  user_id: string | null;
}

export interface ExerciseCreate {
  name: string;
  muscle_group: string;
}

// Planned exercise in a division
export interface PlannedExercise {
  exercise_name: string;
  muscle_group: string;
  sets: number;
  reps: string; // "10" or "8-12"
  rest_seconds: number | null;
  suggested_weight: number | null;
  notes: string | null;
  order: number;
}

export interface PlannedExerciseCreate {
  exercise_name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  suggested_weight?: number;
  notes?: string;
  order?: number;
}

// Workout division
export interface WorkoutDivision {
  id: string;
  user_id: string;
  name: string;
  exercises: PlannedExercise[];
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDivisionCreate {
  name: string;
  exercises?: PlannedExerciseCreate[];
  order?: number;
}

export interface WorkoutDivisionUpdate {
  name?: string;
  exercises?: PlannedExerciseCreate[];
  is_active?: boolean;
  order?: number;
}

// Exercise log (record of exercise performed)
export interface ExerciseLog {
  exercise_name: string;
  muscle_group: string;
  planned_sets: number | null;
  planned_reps: string | null;
  sets_completed: number;
  reps_completed: string;
  weight: number | null;
  rpe: number | null;
  notes: string | null;
  previous_weight: number | null;
  previous_reps: string | null;
}

export interface ExerciseLogCreate {
  exercise_name: string;
  muscle_group: string;
  planned_sets?: number;
  planned_reps?: string;
  sets_completed: number;
  reps_completed: string;
  weight?: number;
  rpe?: number;
  notes?: string;
}

// Strength training activity
export interface StrengthActivity {
  id: string;
  user_id: string;
  title: string | null;
  division_id: string | null;
  division_name: string | null;
  start_time: string;
  exercises: ExerciseLog[];
  duration: number | null;
  duration_formatted: string | null;
  effort: number | null;
  notes: string | null;
  total_sets: number;
  total_exercises: number;
  muscle_groups_worked: string[];
  created_at: string;
  updated_at: string;
}

export interface StrengthActivityCreate {
  title?: string;
  division_id?: string;
  division_name?: string;
  start_time: string;
  exercises?: ExerciseLogCreate[];
  duration?: number;
  effort?: number;
  notes?: string;
}

export interface StrengthActivityUpdate {
  title?: string;
  division_id?: string;
  division_name?: string;
  start_time?: string;
  exercises?: ExerciseLogCreate[];
  duration?: number;
  effort?: number;
  notes?: string;
}

// Exercise history for progression
export interface ExerciseHistory {
  exercise_name: string;
  records: {
    date: string;
    weight: number | null;
    reps: string;
    sets: number;
    rpe: number | null;
  }[];
}

// ==================== BODY MEASUREMENTS TYPES ====================

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat_percentage: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  left_calf: number | null;
  right_calf: number | null;
  neck: number | null;
  shoulders: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurementCreate {
  date?: string;
  weight?: number;
  body_fat_percentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  left_arm?: number;
  right_arm?: number;
  left_thigh?: number;
  right_thigh?: number;
  left_calf?: number;
  right_calf?: number;
  neck?: number;
  shoulders?: number;
  notes?: string;
}

export interface BodyMeasurementUpdate {
  date?: string;
  weight?: number;
  body_fat_percentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  left_arm?: number;
  right_arm?: number;
  left_thigh?: number;
  right_thigh?: number;
  left_calf?: number;
  right_calf?: number;
  neck?: number;
  shoulders?: number;
  notes?: string;
}

export interface WeightRecord {
  date: string;
  weight: number;
}
