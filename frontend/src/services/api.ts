import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  RunningActivity,
  RunningActivityCreate,
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
}

export const api = new ApiService();
