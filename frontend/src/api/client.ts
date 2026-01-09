import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, username }),
  getMe: () => api.get('/auth/me'),
};

export const dataAPI = {
  uploadFile: (formData: FormData) =>
    api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  importFromAPI: (data: any) => api.post('/data/import/api', data),
  getDatasets: () => api.get('/data/datasets'),
  getTeams: (sportTypeId?: number) =>
    api.get('/data/teams', { params: { sportTypeId } }),
  getPlayers: (teamId?: number) =>
    api.get('/data/players', { params: { teamId } }),
  getGames: (params?: any) => api.get('/data/games', { params }),
  getSports: () => api.get('/data/sports'),
};

export const analyticsAPI = {
  getPlayerTrends: (playerId: number, params?: any) =>
    api.get(`/analytics/player/${playerId}/trends`, { params }),
  getTeamPerformance: (teamId: number, season?: string) =>
    api.get(`/analytics/team/${teamId}/performance`, {
      params: { season },
    }),
  getGameStats: (gameId: number) =>
    api.get(`/analytics/game/${gameId}/stats`),
  comparePlayers: (data: any) => api.post('/analytics/compare/players', data),
  getStandings: (sportTypeId: number, season?: string) =>
    api.get(`/analytics/standings/${sportTypeId}`, { params: { season } }),
};

export const mlAPI = {
  trainModel: (data: any) => api.post('/ml/train', data),
  predictGame: (gameId: number, modelId?: number) =>
    api.post('/ml/predict/game', { gameId, modelId }),
  predictPlayer: (playerId: number, gameId: number, metrics: string[]) =>
    api.post('/ml/predict/player', { playerId, gameId, metrics }),
  getInjuryRisk: (playerId: number) =>
    api.get(`/ml/predict/injury/${playerId}`),
  getModels: () => api.get('/ml/models'),
  getModelMetrics: (modelId: number) =>
    api.get(`/ml/models/${modelId}/metrics`),
};
