import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const response = await this.refreshToken();
            const { token } = response.data;
            localStorage.setItem('auth_token', token);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    return await this.instance.post('/auth/refresh');
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

const apiClient = new ApiClient().getInstance();

// API Endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  register: (data: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  }) => apiClient.post('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: () => apiClient.post('/auth/refresh'),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};

export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),

  updateProfile: (data: any) => apiClient.patch('/users/profile', data),

  getPreferences: () => apiClient.get('/users/preferences'),

  updatePreferences: (data: any) => apiClient.patch('/users/preferences', data),

  getSubscription: () => apiClient.get('/users/subscription'),

  getUsageStats: () => apiClient.get('/users/usage'),
};

export const predictionsAPI = {
  // Get predictions
  getPredictions: (params?: {
    page?: number;
    limit?: number;
    league?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get('/predictions', { params }),

  getPrediction: (id: string) => apiClient.get(`/predictions/${id}`),

  // Create predictions
  createPrediction: (data: {
    homeTeamId: string;
    awayTeamId: string;
    league: string;
    matchDate: string;
    matchType?: string;
  }) => apiClient.post('/predictions', data),

  // Batch predictions
  createBatchPrediction: (data: {
    matches: Array<{
      homeTeamId: string;
      awayTeamId: string;
      league: string;
      matchDate: string;
      matchType?: string;
    }>;
  }) => apiClient.post('/predictions/batch', data),

  // ML-specific endpoints
  getMLPrediction: (data: {
    homeTeamId: string;
    awayTeamId: string;
    league: string;
    matchDate: string;
    features?: any;
  }) => apiClient.post('/predictions/ml', data),

  getMLBatchPrediction: (data: {
    matches: Array<{
      homeTeamId: string;
      awayTeamId: string;
      league: string;
      matchDate: string;
    }>;
  }) => apiClient.post('/predictions/ml/batch', data),

  // Prediction analytics
  getPredictionHistory: (params?: {
    teamId?: string;
    league?: string;
    period?: string;
  }) => apiClient.get('/predictions/history', { params }),

  getAccuracyStats: () => apiClient.get('/predictions/accuracy'),

  getConfidenceAnalysis: (params?: {
    confidence?: string;
    league?: string;
  }) => apiClient.get('/predictions/confidence', { params }),
};

export const teamsAPI = {
  getTeams: (params?: {
    league?: string;
    search?: string;
  }) => apiClient.get('/teams', { params }),

  getTeam: (id: string) => apiClient.get(`/teams/${id}`),

  getTeamStats: (id: string, params?: {
    season?: string;
    league?: string;
  }) => apiClient.get(`/teams/${id}/stats`, { params }),

  getTeamForm: (id: string, limit?: number) =>
    apiClient.get(`/teams/${id}/form`, { params: { limit } }),

  getHeadToHead: (team1Id: string, team2Id: string) =>
    apiClient.get(`/teams/${team1Id}/h2h/${team2Id}`),
};

export const analyticsAPI = {
  getDashboardStats: () => apiClient.get('/analytics/dashboard'),

  getPredictionTrends: (params?: {
    period?: string;
    league?: string;
  }) => apiClient.get('/analytics/trends', { params }),

  getModelPerformance: (params?: {
    model?: string;
    period?: string;
  }) => apiClient.get('/analytics/models', { params }),

  getLeagueAnalysis: (params?: {
    league?: string;
    period?: string;
  }) => apiClient.get('/analytics/league', { params }),

  getAccuracyByConfidence: () => apiClient.get('/analytics/confidence'),

  getFeatureImportance: (params?: {
    model?: string;
  }) => apiClient.get('/analytics/features', { params }),

  getLiveStats: () => apiClient.get('/analytics/live'),

  exportData: (params: {
    type: 'predictions' | 'analytics' | 'teams';
    format: 'csv' | 'json';
    filters?: any;
  }) => apiClient.post('/analytics/export', params),
};

export const dataCollectionAPI = {
  getStatus: () => apiClient.get('/data-collection/status'),

  startCollection: (params?: {
    leagues?: string[];
    types?: string[];
  }) => apiClient.post('/data-collection/start', params),

  stopCollection: () => apiClient.post('/data-collection/stop'),

  getLogs: (params?: {
    level?: string;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get('/data-collection/logs', { params }),

  getSchedule: () => apiClient.get('/data-collection/schedule'),

  updateSchedule: (data: {
    interval: number;
    enabled: boolean;
    leagues: string[];
  }) => apiClient.patch('/data-collection/schedule', data),

  triggerManualCollection: (params: {
    leagues: string[];
    types: string[];
  }) => apiClient.post('/data-collection/trigger', params),
};

export const liveAPI = {
  getLiveMatches: () => apiClient.get('/live/matches'),

  getLiveMatch: (id: string) => apiClient.get(`/live/matches/${id}`),

  getMatchEvents: (id: string) => apiClient.get(`/live/matches/${id}/events`),

  subscribeToMatch: (id: string) =>
    apiClient.post(`/live/matches/${id}/subscribe`),

  unsubscribeFromMatch: (id: string) =>
    apiClient.post(`/live/matches/${id}/unsubscribe`),
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data?.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    return 'Network error. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export default apiClient;