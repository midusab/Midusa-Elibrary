export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://midusa-elibrary-api.onrender.com/api'
    : 'http://localhost:5000/api');

/**
 * Helper to build auth headers
 */
export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
