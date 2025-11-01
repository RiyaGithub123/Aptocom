/**
 * Backend API Client
 * 
 * Axios instance configured for the AptoCom backend API.
 * Includes request/response interceptors for error handling and auth.
 */

import axios from 'axios';
import { toast } from 'react-toastify';

// Get backend URL from environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Handle errors
    console.error('[API Response Error]', error);
    
    // Network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(new Error('Network error'));
    }
    
    // Server error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        toast.error(data.error || 'Bad request');
        break;
      case 401:
        toast.error('Unauthorized. Please connect your wallet.');
        // Clear auth token
        localStorage.removeItem('authToken');
        break;
      case 403:
        toast.error('Forbidden. You do not have permission.');
        break;
      case 404:
        toast.error(data.error || 'Resource not found');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data.error || 'An error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
