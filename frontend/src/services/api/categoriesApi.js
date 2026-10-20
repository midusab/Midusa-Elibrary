import { API_BASE_URL, authHeader } from './client';

const DEFAULT_CATEGORIES = [
  { id: 'c1', name: 'Self Development', _count: { books: 4 } },
  { id: 'c2', name: 'Psychology', _count: { books: 2 } },
  { id: 'c3', name: 'Finance & Business', _count: { books: 3 } },
  { id: 'c4', name: 'Christianity', _count: { books: 2 } },
  { id: 'c5', name: 'Programming', _count: { books: 2 } },
  { id: 'c6', name: 'Marketing', _count: { books: 1 } },
];

/**
 * Fetch categories from backend database
 */
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
    return DEFAULT_CATEGORIES;
  } catch (err) {
    console.warn('Categories fetch failed, using fallback:', err.message);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Create Category (Admin)
 */
export async function createCategory(categoryData, token) {
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
