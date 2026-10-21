import { API_BASE_URL, authHeader } from './client';

const DEFAULT_CATEGORIES = [
  { id: 'c1', name: 'Self Development', _count: { books: 0 } },
  { id: 'c2', name: 'Psychology', _count: { books: 0 } },
  { id: 'c3', name: 'Finance & Business', _count: { books: 0 } },
  { id: 'c4', name: 'Christianity', _count: { books: 0 } },
  { id: 'c5', name: 'Programming', _count: { books: 0 } },
  { id: 'c6', name: 'Marketing', _count: { books: 0 } },
];

let categoriesCache = null;
let categoriesCacheTime = 0;
let pendingCategoriesPromise = null;
const CATEGORIES_TTL_MS = 60 * 1000;
const CATEGORIES_STALE_TTL_MS = 300 * 1000;
const STORAGE_KEY = 'elib_categories_cache';

export function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTime = 0;
  pendingCategoriesPromise = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

async function fetchFromNetwork() {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data)) {
      categoriesCache = data;
      categoriesCacheTime = Date.now();
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: categoriesCacheTime }));
      } catch {}
      return data;
    }
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Fetch categories with SWR caching, session storage persistence, and request deduplication
 */
export async function getCategories() {
  const now = Date.now();

  // 1. Check memory cache
  if (!categoriesCache) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        categoriesCache = parsed.data;
        categoriesCacheTime = parsed.timestamp;
      }
    } catch {}
  }

  if (categoriesCache) {
    const age = now - categoriesCacheTime;
    // Fresh
    if (age < CATEGORIES_TTL_MS) {
      return categoriesCache;
    }
    // Stale: return immediately, refresh in background
    if (age < CATEGORIES_STALE_TTL_MS) {
      if (!pendingCategoriesPromise) {
        pendingCategoriesPromise = fetchFromNetwork()
          .catch(() => {})
          .finally(() => { pendingCategoriesPromise = null; });
      }
      return categoriesCache;
    }
  }

  // 2. In-flight request deduplication
  if (pendingCategoriesPromise) {
    return pendingCategoriesPromise;
  }

  pendingCategoriesPromise = fetchFromNetwork()
    .catch((err) => {
      console.warn('Categories fetch failed, using fallback:', err.message);
      return categoriesCache || DEFAULT_CATEGORIES;
    })
    .finally(() => {
      pendingCategoriesPromise = null;
    });

  return pendingCategoriesPromise;
}

/**
 * Create Category (Admin)
 */
export async function createCategory(categoryData, token) {
  clearCategoriesCache();
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(categoryData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create category');
  }
  return res.json();
}

/**
 * Update Category (Admin)
 */
export async function updateCategory(id, categoryData, token) {
  clearCategoriesCache();
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(categoryData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update category');
  }
  return res.json();
}

/**
 * Delete Category (Admin)
 */
export async function deleteCategory(id, token) {
  clearCategoriesCache();
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeader(token)
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete category');
  }
  return res.json();
}
