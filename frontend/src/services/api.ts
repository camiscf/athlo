import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  RunningActivity,
  RunningActivityCreate,
  Exercise,
  ExerciseCreate,
  WorkoutDivision,
  WorkoutDivisionCreate,
  WorkoutDivisionUpdate,
  StrengthActivity,
  StrengthActivityCreate,
  StrengthActivityUpdate,
  ExerciseHistory,
  BodyMeasurement,
  BodyMeasurementCreate,
  BodyMeasurementUpdate,
  WeightRecord,
  Goal,
  GoalCreate,
  GoalUpdate,
} from '../types';

import { Platform } from 'react-native';

// API URL based on platform
// Web/iOS: localhost works directly
// Android emulator: needs 10.0.2.2 to reach host machine
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  default: 'http://localhost:8000',
});

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
              const tokens = await this.refreshToken(refreshToken);
              await this.saveTokens(tokens);
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.clearTokens();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  async saveTokens(tokens: TokenResponse): Promise<void> {
    await AsyncStorage.setItem('access_token', tokens.access_token);
    await AsyncStorage.setItem('refresh_token', tokens.refresh_token);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  }

  async getStoredTokens(): Promise<TokenResponse | null> {
    const access_token = await AsyncStorage.getItem('access_token');
    const refresh_token = await AsyncStorage.getItem('refresh_token');
    if (access_token && refresh_token) {
      return { access_token, refresh_token };
    }
    return null;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', data);
    await this.saveTokens(response.data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.client.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        // Ignore logout errors
      }
    }
    await this.clearTokens();
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/users/me');
    return response.data;
  }

  async updateProfile(data: { name?: string; preferred_units?: 'metric' | 'imperial' }): Promise<User> {
    const response = await this.client.put<User>('/users/me', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.put('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  // Running activity endpoints
  async getRunningActivities(params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<RunningActivity[]> {
    const response = await this.client.get<RunningActivity[]>('/activities/running', { params });
    return response.data;
  }

  async getRunningActivity(id: string): Promise<RunningActivity> {
    const response = await this.client.get<RunningActivity>(`/activities/running/${id}`);
    return response.data;
  }

  async createRunningActivity(data: RunningActivityCreate): Promise<RunningActivity> {
    const response = await this.client.post<RunningActivity>('/activities/running', data);
    return response.data;
  }

  async updateRunningActivity(id: string, data: Partial<RunningActivityCreate>): Promise<RunningActivity> {
    const response = await this.client.put<RunningActivity>(`/activities/running/${id}`, data);
    return response.data;
  }

  async deleteRunningActivity(id: string): Promise<void> {
    await this.client.delete(`/activities/running/${id}`);
  }

  // ==================== STRENGTH TRAINING ====================

  // Exercises
  async getExercises(muscleGroup?: string): Promise<Exercise[]> {
    const params = muscleGroup ? { muscle_group: muscleGroup } : undefined;
    const response = await this.client.get<Exercise[]>('/strength/exercises', { params });
    return response.data;
  }

  async getMuscleGroups(): Promise<string[]> {
    const response = await this.client.get<string[]>('/strength/muscle-groups');
    return response.data;
  }

  async createCustomExercise(data: ExerciseCreate): Promise<Exercise> {
    const response = await this.client.post<Exercise>('/strength/exercises', data);
    return response.data;
  }

  async deleteCustomExercise(id: string): Promise<void> {
    await this.client.delete(`/strength/exercises/${id}`);
  }

  // Workout Divisions
  async getWorkoutDivisions(): Promise<WorkoutDivision[]> {
    const response = await this.client.get<WorkoutDivision[]>('/strength/divisions');
    return response.data;
  }

  async getWorkoutDivision(id: string): Promise<WorkoutDivision> {
    const response = await this.client.get<WorkoutDivision>(`/strength/divisions/${id}`);
    return response.data;
  }

  async createWorkoutDivision(data: WorkoutDivisionCreate): Promise<WorkoutDivision> {
    const response = await this.client.post<WorkoutDivision>('/strength/divisions', data);
    return response.data;
  }

  async updateWorkoutDivision(id: string, data: WorkoutDivisionUpdate): Promise<WorkoutDivision> {
    const response = await this.client.put<WorkoutDivision>(`/strength/divisions/${id}`, data);
    return response.data;
  }

  async deleteWorkoutDivision(id: string): Promise<void> {
    await this.client.delete(`/strength/divisions/${id}`);
  }

  // Strength Activities
  async getStrengthActivities(params?: { limit?: number; offset?: number }): Promise<StrengthActivity[]> {
    const response = await this.client.get<StrengthActivity[]>('/strength/activities', { params });
    return response.data;
  }

  async getStrengthActivity(id: string): Promise<StrengthActivity> {
    const response = await this.client.get<StrengthActivity>(`/strength/activities/${id}`);
    return response.data;
  }

  async createStrengthActivity(data: StrengthActivityCreate): Promise<StrengthActivity> {
    const response = await this.client.post<StrengthActivity>('/strength/activities', data);
    return response.data;
  }

  async updateStrengthActivity(id: string, data: StrengthActivityUpdate): Promise<StrengthActivity> {
    const response = await this.client.put<StrengthActivity>(`/strength/activities/${id}`, data);
    return response.data;
  }

  async deleteStrengthActivity(id: string): Promise<void> {
    await this.client.delete(`/strength/activities/${id}`);
  }

  // Exercise History
  async getExerciseHistory(exerciseName: string, limit?: number): Promise<ExerciseHistory> {
    const params = limit ? { limit } : undefined;
    const response = await this.client.get<ExerciseHistory>(`/strength/history/${encodeURIComponent(exerciseName)}`, { params });
    return response.data;
  }

  // ==================== BODY MEASUREMENTS ====================

  async getBodyMeasurements(limit?: number): Promise<BodyMeasurement[]> {
    const params = limit ? { limit } : undefined;
    const response = await this.client.get<BodyMeasurement[]>('/body/measurements', { params });
    return response.data;
  }

  async getBodyMeasurement(id: string): Promise<BodyMeasurement> {
    const response = await this.client.get<BodyMeasurement>(`/body/measurements/${id}`);
    return response.data;
  }

  async createBodyMeasurement(data: BodyMeasurementCreate): Promise<BodyMeasurement> {
    const response = await this.client.post<BodyMeasurement>('/body/measurements', data);
    return response.data;
  }

  async updateBodyMeasurement(id: string, data: BodyMeasurementUpdate): Promise<BodyMeasurement> {
    const response = await this.client.put<BodyMeasurement>(`/body/measurements/${id}`, data);
    return response.data;
  }

  async deleteBodyMeasurement(id: string): Promise<void> {
    await this.client.delete(`/body/measurements/${id}`);
  }

  async getLatestBodyMeasurement(): Promise<BodyMeasurement | null> {
    const response = await this.client.get<BodyMeasurement | null>('/body/latest');
    return response.data;
  }

  async getWeightHistory(limit?: number): Promise<WeightRecord[]> {
    const params = limit ? { limit } : undefined;
    const response = await this.client.get<WeightRecord[]>('/body/weight-history', { params });
    return response.data;
  }

  // ==================== GOALS ====================

  async getGoals(activeOnly: boolean = true): Promise<Goal[]> {
    const params = { active_only: activeOnly };
    const response = await this.client.get<Goal[]>('/goals', { params });
    return response.data;
  }

  async getGoal(id: string): Promise<Goal> {
    const response = await this.client.get<Goal>(`/goals/${id}`);
    return response.data;
  }

  async createGoal(data: GoalCreate): Promise<Goal> {
    const response = await this.client.post<Goal>('/goals', data);
    return response.data;
  }

  async updateGoal(id: string, data: GoalUpdate): Promise<Goal> {
    const response = await this.client.put<Goal>(`/goals/${id}`, data);
    return response.data;
  }

  async deleteGoal(id: string): Promise<void> {
    await this.client.delete(`/goals/${id}`);
  }
}

export const api = new ApiService();
