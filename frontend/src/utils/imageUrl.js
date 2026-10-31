export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';

/**
 * Resolves local and remote book cover image URLs cleanly.
 * Handles relative paths (/uploads/..., /api/upload/...),
 * replaces localhost:5000 URLs with the active production backend base,
 * upgrades insecure HTTP to HTTPS, and provides safe fallbacks.
 */
export function resolveCoverUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_BOOK_COVER;
  }

  let trimmed = url.trim();

  // If already a data URL or blob
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'https://midusa-elibrary-api.onrender.com/api'
      : 'http://localhost:5000/api');
  const backendBase = apiUrl.replace(/\/api\/?$/, '');

  // If it's a localhost or 127.0.0.1 development URL, replace with backendBase
  if (trimmed.includes('localhost:5000') || trimmed.includes('127.0.0.1:5000')) {
    trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/i, backendBase);
  }

  // Handle local uploaded files
  if (
    trimmed.startsWith('/uploads') ||
    trimmed.startsWith('uploads') ||
    trimmed.startsWith('/api/upload') ||
    trimmed.startsWith('api/upload')
  ) {
    const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBase}${clean}`;
  }

  // Prevent mixed content: If on HTTPS or in production, upgrade any http:// URL to https://
  if (
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    import.meta.env.PROD
  ) {
    if (trimmed.startsWith('http://') && !trimmed.includes('localhost')) {
      trimmed = trimmed.replace(/^http:\/\//i, 'https://');
    }
  }

  return trimmed;
}
