// API Configuration - uses environment variable in production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_ADMIN_URL = `${API_BASE_URL}/admin`;

// Helper to get the backend base URL (without /api)
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';
