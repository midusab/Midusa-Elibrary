import { API_BASE_URL, authHeader } from './client';
import { DEFAULT_BOOKS } from '../../data/books';

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
 * Fetch books from backend API with filtering, search, and pagination
 */
export async function getBooks(params = {}) {
  try {
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
      if (Array.isArray(data.books) && data.books.length > 0) {
        return {
          books: data.books,
          total: data.pagination?.total ?? data.books.length,
          pagination: data.pagination || null
        };
      }
    }
    return filterFallbackBooks(params);
  } catch (err) {
    console.warn('Backend books query offline, using catalog fallback:', err.message);
    return filterFallbackBooks(params);
  }
}

/**
 * Fetch a single book by ID from backend
 */
export async function getBookById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/books/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Book fetch error for ${id}, checking fallback:`, err.message);
  }

  const fallback = DEFAULT_BOOKS.find(b =>
    b.id === id ||
    String(b.id) === String(id) ||
    b.title.toLowerCase().replace(/[^a-z0-9]/g, '') === String(id).toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  return fallback || null;
}

/**
 * Create Book (Admin / Publisher)
 */
export async function createBook(bookData, token) {
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
    throw new Error(err.error || 'Failed to create book');
  }
  return res.json();
}

/**
 * Update Book (Admin)
 */
export async function updateBook(id, bookData, token) {
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
    throw new Error(err.error || 'Failed to update book');
  }
  return res.json();
}

/**
 * Delete Book (Admin)
 */
export async function deleteBook(id, token) {
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
 * Record a book click/view event (Analytics)
 */
export async function recordBookClick(bookId, data = {}) {
  try {
    if (!bookId) return null;
    const res = await fetch(`${API_BASE_URL}/books/${bookId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
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
