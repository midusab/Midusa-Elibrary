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
 * Returns { active: bool, flashSale: { id, title, discountPercent, bookIds, ... } | null }
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
 * Admin: Get all flash sales (returns array of sale objects)
 */
export async function getAdminFlashSale(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/flashsale/admin`, {
      headers: { ...authHeader(token) }
    });
    if (res.ok) {
      const data = await res.json();
      // New API returns an array; find the most recent active or first sale for the form
      const sales = Array.isArray(data) ? data : [];
      const activeSale = sales.find((s) => s.isActive) || sales[0] || null;
      return {
        flashSale: activeSale,
        allSales: sales,
        isLive: activeSale
          ? activeSale.isActive && new Date() <= new Date(activeSale.endTime)
          : false,
        isExpired: activeSale
          ? !activeSale.isActive || new Date() > new Date(activeSale.endTime)
          : false,
      };
    }
    return { flashSale: null, allSales: [], isLive: false, isExpired: false };
  } catch (err) {
    console.error('Error fetching admin flash sale:', err);
    return { flashSale: null, allSales: [], isLive: false, isExpired: false };
  }
}

/**
 * Admin: Create or update flash sale
 * Pass { id } in saleData to update an existing sale.
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
 * Admin: Toggle flash sale on/off by its ID
 * @param {string} saleId  - UUID of the flash sale
 * @param {string} token   - Admin auth token
 */
export async function toggleFlashSale(saleId, token) {
  clearFlashSaleCache();
  const res = await fetch(`${API_BASE_URL}/flashsale/admin/${saleId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle flash sale');
  }
  return data;
}

/**
 * Admin: Delete a flash sale by its ID
 * @param {string} saleId  - UUID of the flash sale
 * @param {string} token   - Admin auth token
 */
export async function deleteFlashSale(saleId, token) {
  clearFlashSaleCache();
  const res = await fetch(`${API_BASE_URL}/flashsale/admin/${saleId}`, {
    method: 'DELETE',
    headers: { ...authHeader(token) }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete flash sale');
  }
  return data;
}
