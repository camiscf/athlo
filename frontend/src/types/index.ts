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
