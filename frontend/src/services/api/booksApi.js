import { API_BASE_URL, authHeader } from './client';
import { DEFAULT_BOOKS } from '../../data/books';

// Memory cache
const booksCache = new Map();
// In-flight request deduplication
const pendingRequests = new Map();

const CACHE_TTL_MS = 60 * 1000; // 60s fresh
const STALE_TTL_MS = 300 * 1000; // 5 min stale-while-revalidate

const STORAGE_PREFIX = 'elib_bcache_';

function getStorage(key) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStorage(key, entry) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing
  }
}

export function clearBooksCache() {
  booksCache.clear();
  pendingRequests.clear();
  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(k);
    });
  } catch {}
}

function getCacheKey(params = {}) {
  return JSON.stringify(params);
}

function indexBooks(booksList) {
  if (!Array.isArray(booksList)) return;
  const now = Date.now();
  for (const b of booksList) {
    if (b && b.id) {
      const singleKey = `single_${b.id}`;
      booksCache.set(singleKey, { data: b, timestamp: now });
      setStorage(singleKey, { data: b, timestamp: now });
    }
  }
}

function filterFallbackBooks(params = {}) {
  let list = [...DEFAULT_BOOKS];
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s));
  }
  if (params.category && params.category !== 'all') {
    list = list.filter(b => b.category.toLowerCase() === params.category.toLowerCase());
  }
  if (params.featured) {
    list = list.filter(b => b.featured);
  }
  if (params.bestseller) {
    list = list.filter(b => b.bestseller);
  }
  if (params.limit) {
    list = list.slice(0, parseInt(params.limit));
  }
  return {
    books: list,
    total: list.length,
    pagination: { page: 1, limit: params.limit || list.length, total: list.length, totalPages: 1 }
  };
}

/**
 * Perform actual network fetch for books
 */
async function fetchBooksFromNetwork(params, cacheKey) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.featured) query.append('featured', 'true');
  if (params.bestseller) query.append('bestseller', 'true');
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);

  const res = await fetch(`${API_BASE_URL}/books?${query.toString()}`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data.books)) {
      const result = {
        books: data.books,
        total: data.pagination?.total ?? data.books.length,
        pagination: data.pagination || null
      };
      const entry = { data: result, timestamp: Date.now() };
      booksCache.set(cacheKey, entry);
      setStorage(cacheKey, entry);
      indexBooks(data.books);
      return result;
    }
  }

  const fallback = filterFallbackBooks(params);
  const entry = { data: fallback, timestamp: Date.now() };
  booksCache.set(cacheKey, entry);
  setStorage(cacheKey, entry);
  return fallback;
}

/**
 * Fetch books from backend API with SWR caching, request deduplication, and indexing
 */
export async function getBooks(params = {}) {
  const cacheKey = getCacheKey(params);
  const now = Date.now();

  // 1. Check in-memory cache
  let cached = booksCache.get(cacheKey);

  // 2. Check session storage cache if memory missed
  if (!cached) {
    cached = getStorage(cacheKey);
    if (cached) booksCache.set(cacheKey, cached);
  }

  if (cached) {
    const age = now - cached.timestamp;
    // Fresh cache: return instantly
    if (age < CACHE_TTL_MS) {
      return cached.data;
    }
    // Stale cache (within 5 minutes): return immediately and revalidate in background
    if (age < STALE_TTL_MS) {
      if (!pendingRequests.has(cacheKey)) {
        const bgPromise = fetchBooksFromNetwork(params, cacheKey)
          .catch((err) => console.warn('Background books revalidation notice:', err.message))
          .finally(() => pendingRequests.delete(cacheKey));
        pendingRequests.set(cacheKey, bgPromise);
      }
      return cached.data;
    }
  }

  // 3. Deduplicate concurrent network requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const reqPromise = fetchBooksFromNetwork(params, cacheKey)
    .catch((err) => {
      console.warn('Backend books query offline, using catalog fallback:', err.message);
      const fallback = filterFallbackBooks(params);
      return fallback;
    })
    .finally(() => pendingRequests.delete(cacheKey));

  pendingRequests.set(cacheKey, reqPromise);
  return reqPromise;
}

/**
 * Fetch a single book by ID from backend with 0ms fast lookup
 */
export async function getBookById(id) {
  const cacheKey = `single_${id}`;
  const now = Date.now();

  // 1. Check memory cache
  let cached = booksCache.get(cacheKey);
  if (!cached) {
    cached = getStorage(cacheKey);
    if (cached) booksCache.set(cacheKey, cached);
  }

  if (cached && now - cached.timestamp < STALE_TTL_MS) {
    return cached.data;
  }

  // 2. Quick search across any active cached lists
  for (const [, val] of booksCache.entries()) {
    if (val?.data?.books && Array.isArray(val.data.books)) {
      const found = val.data.books.find(
        (b) => b.id === id || String(b.id) === String(id)
      );
      if (found) {
        const entry = { data: found, timestamp: now };
        booksCache.set(cacheKey, entry);
        setStorage(cacheKey, entry);
        return found;
      }
    }
  }

  // 3. Deduplicate single book request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const reqPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/books/${id}`);
      if (res.ok) {
        const data = await res.json();
        const entry = { data, timestamp: Date.now() };
        booksCache.set(cacheKey, entry);
        setStorage(cacheKey, entry);
        return data;
      }
    } catch (err) {
      console.warn(`Book fetch error for ${id}:`, err.message);
    }

    const fallback = DEFAULT_BOOKS.find(b =>
      b.id === id ||
      String(b.id) === String(id) ||
      b.title.toLowerCase().replace(/[^a-z0-9]/g, '') === String(id).toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (fallback) {
      const entry = { data: fallback, timestamp: Date.now() };
      booksCache.set(cacheKey, entry);
      setStorage(cacheKey, entry);
    }
    return fallback || null;
  })().finally(() => pendingRequests.delete(cacheKey));

  pendingRequests.set(cacheKey, reqPromise);
  return reqPromise;
}

/**
 * Create Book (Admin / Publisher)
 */
export async function createBook(bookData, token) {
  clearBooksCache();
  const res = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorObj = new Error(err.error || 'Failed to create book');
    errorObj.status = res.status;
    errorObj.code = err.code;
    throw errorObj;
  }
  return res.json();
}

/**
 * Update Book (Admin)
 */
export async function updateBook(id, bookData, token) {
  clearBooksCache();
  const res = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorObj = new Error(err.error || 'Failed to update book');
    errorObj.status = res.status;
    errorObj.code = err.code;
    throw errorObj;
  }
  return res.json();
}

/**
 * Delete Book (Admin)
 */
export async function deleteBook(id, token) {
  clearBooksCache();
  const res = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeader(token)
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete book');
  }
  return res.json();
}

/**
 * Toggle Book Featured Status (Admin)
 */
export async function toggleBookFeatured(id, featured, token) {
  clearBooksCache();
  const res = await fetch(`${API_BASE_URL}/books/${id}/featured`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify({ featured })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to toggle featured status');
  }
  return res.json();
}

/**
 * Toggle Book Bestseller Status (Admin)
 */
export async function toggleBookBestseller(id, bestseller, token) {
  clearBooksCache();
  const res = await fetch(`${API_BASE_URL}/books/${id}/bestseller`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify({ bestseller })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to toggle bestseller status');
  }
  return res.json();
}

/**
 * Record a reader click / view on a book
 */
export async function recordBookClick(bookId) {
  try {
    let visitorId = localStorage.getItem('elibrary_visitor_id');
    fetch(`${API_BASE_URL}/books/${bookId}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * Get author details and all books written by this author
 */
export async function getAuthorByName(authorName) {
  if (!authorName) return null;
  const res = await fetch(`${API_BASE_URL}/books/author/${encodeURIComponent(authorName.trim())}`);
  if (!res.ok) {
    throw new Error('Failed to fetch author details');
  }
  return res.json();
}

