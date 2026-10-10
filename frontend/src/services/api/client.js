export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to build auth headers
 */
export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
