import { API_BASE_URL, authHeader } from './client';

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

/**
 * Session Management: Refresh and reset active session token
 */
export async function refreshTokenApi(token) {
  const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to refresh token');
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Session Management: Check if current session token is still valid
 */
export async function checkSessionApi(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: {
        ...authHeader(token)
      }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { active: false, code: data.code || 'INVALID' };
    }
    return await res.json();
  } catch {
    return { active: false, error: 'Network error checking session' };
  }
}

/**
 * Token Reset: Request a password reset token
 */
export async function requestPasswordReset(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request password reset token');
  }
  return data;
}

/**
 * Token Reset: Verify reset token validity
 */
export async function verifyResetToken(token) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Invalid reset token');
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Token Reset: Reset password using verified reset token
 */
export async function resetPasswordWithToken(token, newPassword, confirmPassword) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, newPassword, confirmPassword })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to reset password');
    err.code = data.code;
    throw err;
  }
  return data;
}
