export const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_BASE_URL = API_URL.endsWith('/api/v1')
  ? API_URL
  : `${API_URL.replace(/\/$/, '')}/api/v1`;
