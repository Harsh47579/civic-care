// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configure axios defaults
import axios from 'axios';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

// Add request interceptor for auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 errors - let components handle authentication
    // This prevents infinite redirect loops
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Remove the redirect to prevent infinite loops
      console.log('Authentication failed, token removed');
    }
    return Promise.reject(error);
  }
);

export default axios;
