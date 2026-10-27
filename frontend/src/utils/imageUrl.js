export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';

/**
 * Resolves local and remote book cover image URLs cleanly.
 * Handles relative paths (/uploads/..., /api/upload/...),
 * localhost URLs across network environments, and provides fallback.
 */
export function resolveCoverUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_BOOK_COVER;
  }

  const trimmed = url.trim();

  // If already a full external web URL or data URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Handle local uploaded files
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads') || trimmed.startsWith('/api/upload') || trimmed.startsWith('api/upload')) {
    const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendBase = apiUrl.replace(/\/api\/?$/, '');
    return `${backendBase}${clean}`;
  }

  // If it's a localhost:5000 URL but accessed via a different host (e.g. LAN IP / production)
  if (trimmed.includes('localhost:5000')) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && !apiUrl.includes('localhost:5000')) {
      const backendBase = apiUrl.replace(/\/api\/?$/, '');
      return trimmed.replace(/http:\/\/localhost:5000/g, backendBase);
    }
  }

  return trimmed;
}
