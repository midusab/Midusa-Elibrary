/**
 * Protection against Open Redirect attacks and OAuth state preservation
 */

const SAFE_PATH_PATTERN = /^\/[a-zA-Z0-9_\-.~%/?=&#[\]]*$/;
const STORAGE_KEY = 'midusa_secure_oauth_redirect';

/**
 * Validates and sanitizes a redirect target URL.
 * Only allows relative paths on the same origin (starting with '/' and not '//').
 *
 * @param {string|null|undefined} target - The untrusted target path
 * @param {string} fallback - Safe fallback route (defaults to '/dashboard')
 * @returns {string} Sanitized safe relative route
 */
export function sanitizeRedirect(target, fallback = '/dashboard') {
  if (!target || typeof target !== 'string') return fallback;

  const trimmed = target.trim();

  // Block protocol-relative URLs (e.g., "//evil.com")
  if (trimmed.startsWith('//')) return fallback;

  // Block full URLs with schemes (e.g., "http://", "https:", "javascript:", "data:")
  if (trimmed.includes(':')) return fallback;

  // Block backslashes which browsers sometimes normalize to slashes
  if (trimmed.includes('\\')) return fallback;

  // Must begin with a single '/'
  if (!trimmed.startsWith('/')) return fallback;

  // Validate characters against allowed safe path pattern
  if (!SAFE_PATH_PATTERN.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/**
 * Stores a safe redirect target before starting Google OAuth redirect flow
 * @param {string} target - Target destination
 */
export function storeOAuthRedirect(target) {
  try {
    const safe = sanitizeRedirect(target);
    sessionStorage.setItem(STORAGE_KEY, safe);
  } catch (err) {
    console.warn('Could not store OAuth redirect destination:', err);
  }
}

/**
 * Retrieves and clears the stored post-OAuth redirect target
 * @param {string} fallback
 * @returns {string} Safe target path
 */
export function popOAuthRedirect(fallback = '/dashboard') {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return sanitizeRedirect(saved, fallback);
  } catch {
    return fallback;
  }
}
