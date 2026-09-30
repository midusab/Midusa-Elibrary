import { BOOKS } from '../data/books';
import { CATEGORIES } from '../constants/categories';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch books from backend API with fallback to local seed data
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/books?${query.toString()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.books) && data.books.length > 0) {
        return { books: data.books, total: data.pagination?.total || data.books.length };
      }
    }
  } catch (err) {
    // Backend offline or unreachable, fall back to clean local state
  }

  // Fallback to local books
  let result = [...BOOKS];
  if (params.category && params.category !== 'all') {
    result = result.filter(b => b.category.toLowerCase() === params.category.toLowerCase());
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }
  if (params.featured) {
    result = result.filter(b => b.featured);
  }
  if (params.bestseller) {
    result = result.filter(b => b.bestseller);
  }

  return { books: result, total: result.length };
}

/**
 * Fetch a single book by ID
 */
export async function getBookById(id) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/books/${id}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  return BOOKS.find(b => String(b.id) === String(id)) || null;
}

/**
 * Fetch categories
 */
export async function getCategories() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/categories`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Fallback
  }
  return CATEGORIES;
}

/**
 * Direct Backend Manipulation: Create Book
 */
export async function createBook(bookData, token) {
  const res = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) throw new Error('Failed to create book');
  return res.json();
}

/**
 * Direct Backend Manipulation: Update Book
 */
export async function updateBook(id, bookData, token) {
  const res = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) throw new Error('Failed to update book');
  return res.json();
}

/**
 * Direct Backend Manipulation: Delete Book
 */
export async function deleteBook(id, token) {
  const res = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to delete book');
  return res.json();
}
