const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to build auth headers
 */
function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==========================================
// BOOKS API (Real-time Backend Data)
// ==========================================

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
 * Backend: Create Book (Admin)
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
 * Backend: Update Book (Admin)
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
 * Backend: Delete Book (Admin)
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

// ==========================================
// CATEGORIES API (Real-time Backend Data)
// ==========================================

/**
 * Fetch categories from backend database
 */
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching categories from backend:', err);
    return [];
  }
}

/**
 * Backend: Create Category (Admin)
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

// ==========================================
// ORDERS & CHECKOUT API (Real-time Backend Data)
// ==========================================

/**
 * Create Order in backend database
 */
export async function createOrder(orderData, token) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

/**
 * Fetch current user orders from backend
 */
export async function getUserOrders(token) {
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
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
    console.error('Error fetching user orders:', err);
    return [];
  }
}

/**
 * Fetch single order by ID
 */
export async function getOrderById(id, token) {
  const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
    headers: {
      ...authHeader(token)
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch order');
  }
  return res.json();
}

// ==========================================
// AUTHENTICATION API (Real-time Backend Data)
// ==========================================

/**
 * Register user in backend
 */
export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register');
  }
  return data;
}

/**
 * Login user in backend
 */
export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to login');
  }
  return data;
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...authHeader(token)
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get user profile');
  }
  return res.json();
}

// ==========================================
// ADMIN DASHBOARD API (Real-time Backend Data)
// ==========================================

/**
 * Fetch all orders for admin
 */
export async function getAllOrders(token, params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const res = await fetch(`${API_BASE_URL}/orders/admin/all?${query.toString()}`, {
      headers: {
        ...authHeader(token)
      }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        orders: Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []),
        total: data.total || (Array.isArray(data.orders) ? data.orders.length : (Array.isArray(data) ? data.length : 0))
      };
    }
    return { orders: [], total: 0 };
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return { orders: [], total: 0 };
  }
}

/**
 * Update order status (Admin)
 */
export async function updateOrderStatus(orderId, status, token) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update order status');
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

