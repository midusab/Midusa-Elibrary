import { API_BASE_URL, authHeader } from './client';

/**
 * Get all registered users for admin
 */
export async function getAdminUsers(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        ...authHeader(token)
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return [];
  }
}

/**
 * Get live analytics for admin
 */
export async function getAdminAnalytics(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: {
        ...authHeader(token)
      }
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error('Error fetching admin analytics:', err);
    return null;
  }
}

/**
 * Sync bestsellers according to sales count
 */
export async function syncBestsellers(token) {
  const res = await fetch(`${API_BASE_URL}/admin/sync-bestsellers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to sync bestsellers');
  }
  return res.json();
}

/**
 * Record a page visit (Analytics)
 */
export async function recordSiteVisit(visitData = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visitData)
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    // Non-blocking for UI
    return null;
  }
}
