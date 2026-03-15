import axios from 'axios';
import config from './config';
import { secureStorage } from '../utils/encryption';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 60*10*1000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from secure storage
    const token = secureStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    // Handle authentication errors - redirect to login (except when login itself failed)
    const errorMessage = error.response?.data?.error || '';
    const isAuthError =
      error.response?.status === 401 ||
      errorMessage.toLowerCase().includes('invalid or expired token') ||
      errorMessage.toLowerCase().includes('invalid token') ||
      errorMessage.toLowerCase().includes('expired token') ||
      errorMessage.toLowerCase().includes('unauthorized');

    if (isAuthError && !isLoginRequest) {
      // Clear authentication data from secure storage
      secureStorage.removeItem('token');
      secureStorage.removeItem('user');

      // Redirect to login: use hash for file:// (Electron) to avoid file:///C:/login
      const isFileProtocol = window.location.protocol === 'file:';
      if (isFileProtocol) {
        window.location.hash = '#/login';
      } else if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;













