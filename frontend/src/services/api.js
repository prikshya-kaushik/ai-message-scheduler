/**
 * API Service
 * Centralized Axios instance with interceptors for auth and error handling
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle Errors ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';

    // Auto-logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }

    // Don't toast for 401 (handled by redirect)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

// ─── Messages API ─────────────────────────────────────────────────────────────
export const messagesAPI = {
  getAll: (params) => api.get('/messages', { params }),
  getStats: () => api.get('/messages/stats'),
  getById: (id) => api.get(`/messages/${id}`),
  create: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  delete: (id) => api.delete(`/messages/${id}`),
  cancel: (id) => api.patch(`/messages/${id}/cancel`),
};

// ─── History API ──────────────────────────────────────────────────────────────
export const historyAPI = {
  getHistory: (params) => api.get('/history', { params }),
  getAnalytics: () => api.get('/history/analytics'),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
  generate: (data) => api.post('/ai/generate', data),
  getSuggestions: () => api.get('/ai/suggestions'),
};

export default api;
