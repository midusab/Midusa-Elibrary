import { API_BASE_URL, authHeader } from './client';

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
      return {
        books: Array.isArray(data.books) ? data.books : [],
        total: data.pagination?.total ?? (Array.isArray(data.books) ? data.books.length : 0),
        pagination: data.pagination || null
      };
    }
    return { books: [], total: 0 };
  } catch (err) {
    console.error('Error fetching books from backend:', err);
    return { books: [], total: 0 };
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
    return null;
  } catch (err) {
    console.error(`Error fetching book ${id}:`, err);
    return null;
  }
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
