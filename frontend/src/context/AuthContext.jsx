import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  getIdToken,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ADMIN_EMAIL, checkIsAdmin } from '../constants/auth';
import {
  refreshTokenApi,
  checkSessionApi,
  requestPasswordReset as apiRequestPasswordReset,
  resetPasswordWithToken as apiResetPasswordWithToken
} from '../services/api';

/** Safely decode JWT payload without external libraries */
function getJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // Strictly 2 hours session limit

/** Check if JWT is expired or exceeds 2-hour max session lifespan */
function isTokenExpired(token, sessionStartedAt) {
  if (sessionStartedAt && Date.now() - sessionStartedAt >= TWO_HOURS_MS) {
    return true;
  }
  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

/** Returns true if string looks like a signed JWT */
function isRealJwt(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
}

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef(null);

  // Normalizes user object and ensures admin status consistency
  const processUser = useCallback((rawUser, token) => {
    const isAdmin = checkIsAdmin(rawUser.email);
    return {
      ...rawUser,
      token: token || rawUser.token || 'jwt-token-' + Date.now(),
      role: isAdmin ? 'admin' : (rawUser.role || 'user'),
      isAdmin: isAdmin,
    };
  }, []);

  /** Sign out and clear stored session */
  const logout = useCallback(async (reasonMessage) => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('pending_login_toast');

    if (reasonMessage) {
      sessionStorage.setItem('session_logout_reason', reasonMessage);
    }
  }, []);

  /**
   * Schedule automatic logout when the current token/session expires (2-hour limit)
   */
  const scheduleTokenExpiration = useCallback((token, sessionStartedAt) => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    const startedAt = sessionStartedAt || Date.now();
    const timeSinceStart = Math.max(0, Date.now() - startedAt);
    const maxSessionRemaining = Math.max(0, TWO_HOURS_MS - timeSinceStart);

    let tokenRemaining = maxSessionRemaining;
    const payload = getJwtPayload(token);
    if (payload && payload.exp) {
      tokenRemaining = Math.max(0, payload.exp * 1000 - Date.now());
    }

    const effectiveRemainingMs = Math.min(maxSessionRemaining, tokenRemaining);

    if (effectiveRemainingMs <= 0) {
      // Already expired
      logout('Your 2-hour session has expired. Please sign in again with Google.');
      return;
    }

    // Schedule auto-logout right at token/session expiry
    expiryTimerRef.current = setTimeout(() => {
      logout('Your 2-hour session has expired. Please sign in again with Google.');
    }, effectiveRemainingMs);
  }, [logout]);

  const saveUserSession = useCallback((sessionUser) => {
    const sessionStartedAt = sessionUser.sessionStartedAt || Date.now();
    const processed = {
      ...processUser(sessionUser, sessionUser.token),
      sessionStartedAt
    };
    setUser(processed);
    localStorage.setItem('user', JSON.stringify(processed));
    scheduleTokenExpiration(processed.token, processed.sessionStartedAt);
    return processed;
  }, [processUser, scheduleTokenExpiration]);

  /**
   * Refresh the active session token
   */
  const refreshSessionToken = useCallback(async () => {
    if (!user?.token) return null;
    try {
      const data = await refreshTokenApi(user.token);
      if (data?.token) {
        const refreshed = processUser(data.user || user, data.token);
        saveUserSession(refreshed);
        scheduleTokenExpiration(data.token);
        return refreshed;
      }
    } catch (err) {
      if (err.code === 'TOKEN_EXPIRED') {
        logout('Session expired. Please log in again.');
      }
      throw err;
    }
  }, [user, processUser, saveUserSession, scheduleTokenExpiration, logout]);

  /**
   * Check if current session is still valid on backend
   */
  const checkSessionValidity = useCallback(async () => {
    if (!user?.token) return false;
    try {
      const res = await checkSessionApi(user.token);
      if (res?.active === false) {
        logout('Your session is no longer active. Please sign in.');
        return false;
      }
      return true;
    } catch {
      return true; // Keep optimistic on transient network error
    }
  }, [user?.token, logout]);

  /**
   * Exchange Firebase credential for backend JWT
   */
  async function exchangeFirebaseToken(result) {
    const idToken = await result.user.getIdToken();
    const email = result.user.email;
    const name = result.user.displayName || email?.split('@')[0] || 'User';
    const avatar = result.user.photoURL || '';
    const isAdmin = checkIsAdmin(email);

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const sessionUser = processUser(data.user, data.token);
        scheduleTokenExpiration(data.token);
        return saveUserSession(sessionUser);
      }
    } catch (apiErr) {
      console.warn('Backend /auth/google not reachable, falling back to Firebase profile:', apiErr.message);
    }

    const sessionUser = {
      id: result.user.uid,
      email: email,
      fullname: name,
      avatar: avatar,
      role: isAdmin ? 'admin' : 'user',
      token: idToken || ('firebase-' + Date.now())
    };
    return saveUserSession(sessionUser);
  }

  // ─── 1. Rehydrate session on mount & set up expiry timer ─────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const saved = localStorage.getItem('user');
      let restoredUser = null;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.token && isTokenExpired(parsed.token, parsed.sessionStartedAt)) {
            // Stored token is already expired
            localStorage.removeItem('user');
            if (!cancelled) {
              setUser(null);
              setLoading(false);
            }
            return;
          }

          restoredUser = {
            ...processUser(parsed, parsed.token),
            sessionStartedAt: parsed.sessionStartedAt || Date.now()
          };
          if (!cancelled) {
            setUser(restoredUser);
            scheduleTokenExpiration(parsed.token, restoredUser.sessionStartedAt);
          }
        } catch {
          localStorage.removeItem('user');
        }
      }

      // Check for pending Google OAuth redirect result
      try {
        const result = await getRedirectResult(auth);
        if (result && !cancelled) {
          const loggedInUser = await exchangeFirebaseToken(result);
          sessionStorage.setItem('pending_login_toast', JSON.stringify({
            name: loggedInUser.fullname || loggedInUser.email,
            isAdmin: loggedInUser.role === 'admin'
          }));
          restoredUser = loggedInUser;
        }
      } catch (err) {
        if (err?.code !== 'auth/no-auth-event') {
          console.error('Redirect result error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Silent Firebase refresh if token is placeholder
      if (restoredUser && !isRealJwt(restoredUser.token) && !cancelled) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          try {
            const freshIdToken = await getIdToken(firebaseUser, true);
            const res = await fetch(`${API_BASE}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: freshIdToken }),
            });
            if (res.ok) {
              const data = await res.json();
              const refreshed = processUser(data.user, data.token);
              if (!cancelled) {
                setUser(refreshed);
                localStorage.setItem('user', JSON.stringify(refreshed));
                scheduleTokenExpiration(data.token);
              }
            }
          } catch (refreshErr) {
            console.warn('Silent token refresh failed:', refreshErr.message);
          }
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, [processUser, scheduleTokenExpiration]);

  // ─── 2. Multi-tab Session Synchronization ────────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null);
          if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        } else {
          // Logged in or updated in another tab
          try {
            const newUser = JSON.parse(e.newValue);
            setUser(newUser);
            scheduleTokenExpiration(newUser.token);
          } catch {
            // Ignore parse error
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [scheduleTokenExpiration]);

  // ─── 3. Session Heartbeat on Window Focus ────────────────────────────────
  useEffect(() => {
    const handleFocus = () => {
      if (user?.token) {
        if (isTokenExpired(user.token, user.sessionStartedAt)) {
          logout('Your 2-hour session has expired. Please sign in again with Google.');
        } else {
          checkSessionValidity();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.token, logout, checkSessionValidity]);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const sessionUser = await exchangeFirebaseToken(result);
        return { success: true, user: sessionUser };
      }
    } catch (popupErr) {
      console.warn('Popup closed or blocked, falling back to redirect:', popupErr.message);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return { redirecting: true };
      }
      throw popupErr;
    }
  };

  /**
   * Sign in with Email and Password
   */
  const loginWithEmail = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      const sessionUser = processUser(data.user, data.token);
      saveUserSession(sessionUser);
      scheduleTokenExpiration(data.token);
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Cannot connect to the server. Please make sure the backend is running and try again.');
      }
      throw err;
    }
  };

  /**
   * Register with Email, Full Name and Password
   */
  const registerWithEmail = async (fullname, email, password, confirmPassword) => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email: normalizedEmail, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      const sessionUser = processUser(data.user, data.token);
      saveUserSession(sessionUser);
      scheduleTokenExpiration(data.token);
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Cannot connect to the server. Please make sure the backend is running and try again.');
      }
      throw err;
    }
  };

  /**
   * Update Profile
   */
  const updateProfile = async (updatedData) => {
    if (!user) throw new Error('Not authenticated');

    const newUserData = {
      ...user,
      fullname: updatedData.fullname || user.fullname,
      avatar: updatedData.avatar !== undefined ? updatedData.avatar : user.avatar,
    };

    saveUserSession(newUserData);

    try {
      await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(updatedData)
      });
    } catch (e) {
      console.warn('Backend profile update notice:', e.message);
    }

    return newUserData;
  };

  /**
   * Password Reset Flow
   */
  const requestPasswordReset = async (email) => {
    return await apiRequestPasswordReset(email);
  };

  const resetPasswordWithToken = async (token, newPassword, confirmPassword) => {
    return await apiResetPasswordWithToken(token, newPassword, confirmPassword);
  };

  const login = (userData) => {
    saveUserSession(userData);
    if (userData?.token) scheduleTokenExpiration(userData.token);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      loginWithEmail,
      registerWithEmail,
      updateProfile,
      signInWithGoogle,
      refreshSessionToken,
      checkSessionValidity,
      requestPasswordReset,
      resetPasswordWithToken,
      isAuthenticated: !!user,
      isAdmin: Boolean(user?.role === 'admin' || checkIsAdmin(user?.email)),
      adminEmail: ADMIN_EMAIL
    }}>
      {children}
    </AuthContext.Provider>
  );
};
