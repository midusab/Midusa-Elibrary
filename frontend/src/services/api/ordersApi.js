import { API_BASE_URL, authHeader } from './client';

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
