import { API_BASE_URL, authHeader } from './client';

let cachedFlashSale = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

export function clearFlashSaleCache() {
  cachedFlashSale = null;
  cacheTimestamp = 0;
}

/**
 * Public: Fetch currently active flash sale
 */
export async function getActiveFlashSale() {
  if (cachedFlashSale && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFlashSale;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/flashsale`);
    if (res.ok) {
      const data = await res.json();
      cachedFlashSale = data;
      cacheTimestamp = Date.now();
      return data;
    }
    return { active: false, flashSale: null };
  } catch (err) {
    console.warn('Flash sale fetch error:', err.message);
    return { active: false, flashSale: null };
  }
}

/**
 * Admin: Get flash sale settings and history
 */
export async function getAdminFlashSale(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/flashsale/admin`, {
      headers: { ...authHeader(token) }
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error('Error fetching admin flash sale:', err);
    return null;
  }
}

/**
 * Admin: Create or update flash sale
 */
export async function saveFlashSale(saleData, token) {
  clearFlashSaleCache();
  const res = await fetch(`${API_BASE_URL}/flashsale/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(saleData)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save flash sale');
  }
  return data;
}

/**
 * Admin: Toggle flash sale on/off
 */
export async function toggleFlashSale(isActive, token) {
  clearFlashSaleCache();
  const res = await fetch(`${API_BASE_URL}/flashsale/admin/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify({ isActive })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle flash sale');
  }
  return data;
}

/**
 * Admin: End / delete active flash sale
 */
export async function deleteFlashSale(token) {
  clearFlashSaleCache();
  const res = await fetch(`${API_BASE_URL}/flashsale/admin`, {
    method: 'DELETE',
    headers: { ...authHeader(token) }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to end flash sale');
  }
  return data;
}
