import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  getIdToken,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ADMIN_EMAIL, checkIsAdmin } from '../constants/auth';
import {
  refreshTokenApi,
  checkSessionApi,
  requestPasswordReset as apiRequestPasswordReset,
  resetPasswordWithToken as apiResetPasswordWithToken
} from '../services/api';

/** 5 Hours of Inactivity Timeout in milliseconds */
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 60 * 1000; // 5 hours (18,000,000 ms)
const LAST_ACTIVITY_KEY = 'elib_last_activity_time';

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

/** Check if JWT is expired */
function isTokenExpired(token) {
  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

/** Record user activity timestamp */
function recordActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // LocalStorage quota or restricted mode
  }
}

/** Get last activity timestamp */
function getLastActivity() {
  try {
    const val = localStorage.getItem(LAST_ACTIVITY_KEY);
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? Date.now() : parsed;
  } catch {
    return Date.now();
  }
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
  const inactivityTimerRef = useRef(null);
  const lastThrottleRef = useRef(0);

  // Global authentication popup modal state
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    initialMode: 'signin',
    redirectPath: null
  });

  const openAuthModal = useCallback((options = {}) => {
    setAuthModalState({
      isOpen: true,
      initialMode: options.initialMode || 'signin',
      redirectPath: options.redirectPath || null
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Normalizes user object and ensures admin status consistency
  const processUser = useCallback((rawUser, token) => {
    const email = (rawUser.email || '').trim().toLowerCase();
    const isAdmin = checkIsAdmin(email) || rawUser.role === 'admin';
    return {
      ...rawUser,
      email,
      token: token || rawUser.token || 'jwt-token-' + Date.now(),
      role: isAdmin ? 'admin' : (rawUser.role || 'user'),
      isAdmin: isAdmin,
    };
  }, []);

  /** Sign out and clear stored session */
  const logout = useCallback(async (reasonMessage) => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem('pending_login_toast');

    if (reasonMessage) {
      sessionStorage.setItem('session_logout_reason', reasonMessage);
    }
  }, []);

  const scheduleInactivityCheckRef = useRef(null);

  /**
   * Evaluates 5-hour inactivity timeout.
   * If inactive >= 5 hours: logs out.
   * Else: schedules next check at remaining time.
   */
  const scheduleInactivityCheck = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    const lastActive = getLastActivity();
    const elapsed = Date.now() - lastActive;

    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      logout('You were signed out due to 5 hours of inactivity.');
      return;
    }

    const remaining = Math.max(1000, INACTIVITY_TIMEOUT_MS - elapsed);
    inactivityTimerRef.current = setTimeout(() => {
      const currentElapsed = Date.now() - getLastActivity();
      if (currentElapsed >= INACTIVITY_TIMEOUT_MS) {
        logout('You were signed out due to 5 hours of inactivity.');
      } else if (scheduleInactivityCheckRef.current) {
        scheduleInactivityCheckRef.current();
      }
    }, remaining);
  }, [logout]);

  useEffect(() => {
    scheduleInactivityCheckRef.current = scheduleInactivityCheck;
  }, [scheduleInactivityCheck]);

  const saveUserSession = useCallback((sessionUser) => {
    const processed = processUser(sessionUser, sessionUser.token);
    setUser(processed);
    recordActivity();
    try {
      localStorage.setItem('user', JSON.stringify(processed));
    } catch {
      // LocalStorage error ignore
    }
    scheduleInactivityCheck();
    return processed;
  }, [processUser, scheduleInactivityCheck]);

  /**
   * Check if current session is still valid on backend
   */
  const checkSessionValidity = useCallback(async () => {
    if (!user?.token) return false;
    try {
      const res = await checkSessionApi(user.token);
      if (res?.active === false) {
        logout('Your session is no longer active. Please sign in again.');
        return false;
      }
      return true;
    } catch {
      return true; // Keep optimistic on transient network error
    }
  }, [user?.token, logout]);

  /**
   * Refresh the active session token
   */
  const refreshSessionToken = useCallback(async () => {
    if (!user?.token) return null;
    try {
      // 1. If Firebase Auth is active, get a fresh ID token directly
      const fbUser = auth.currentUser;
      if (fbUser) {
        const freshIdToken = await getIdToken(fbUser, false);
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: freshIdToken }),
        });
        if (res.ok) {
          const data = await res.json();
          const refreshed = processUser(data.user || user, data.token);
          saveUserSession(refreshed);
          return refreshed;
        }
      }

      // 2. Fallback to API refresh token
      const data = await refreshTokenApi(user.token);
      if (data?.token) {
        const refreshed = processUser(data.user || user, data.token);
        saveUserSession(refreshed);
        return refreshed;
      }
    } catch (err) {
      if (err.code === 'TOKEN_EXPIRED') {
        logout('Your session has expired. Please sign in again.');
      }
      throw err;
    }
  }, [user, processUser, saveUserSession, logout]);

  /**
   * Exchange Firebase credential for backend JWT
   */
  async function exchangeFirebaseToken(result) {
    const idToken = await result.user.getIdToken();
    const email = (result.user.email || '').trim().toLowerCase();
    const name = result.user.displayName || email.split('@')[0] || 'User';
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
      isAdmin: isAdmin,
      token: idToken || ('firebase-' + Date.now())
    };
    return saveUserSession(sessionUser);
  }

  // ─── 1. Rehydrate session on mount & check 5-hour inactivity ─────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const saved = localStorage.getItem('user');

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const lastActive = getLastActivity();

          // Check if 5 hours have passed since last action
          if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
            localStorage.removeItem('user');
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            if (!cancelled) {
              setUser(null);
              setLoading(false);
            }
            return;
          }

          const activeUser = processUser(parsed, parsed.token);
          if (!cancelled) {
            setUser(activeUser);
            scheduleInactivityCheck();
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
        }
      } catch (err) {
        if (err?.code !== 'auth/no-auth-event') {
          console.error('Redirect result error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [processUser, scheduleInactivityCheck]);

  // ─── 2. User Activity Tracker (Resets 5-hour inactivity window) ───────────
  useEffect(() => {
    if (!user) return;

    const handleUserAction = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 15 seconds for peak performance
      if (now - lastThrottleRef.current > 15_000) {
        lastThrottleRef.current = now;
        recordActivity();
        scheduleInactivityCheck();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserAction, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserAction));
    };
  }, [user, scheduleInactivityCheck]);

  // ─── 3. Multi-tab Session Synchronization ────────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null);
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        } else {
          // Logged in or updated in another tab
          try {
            const newUser = JSON.parse(e.newValue);
            setUser(newUser);
            scheduleInactivityCheck();
          } catch {
            // Ignore parse error
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [scheduleInactivityCheck]);

  // ─── 4. Window Focus Heartbeat & Inactivity Check ────────────────────────
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        const elapsed = Date.now() - getLastActivity();
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          logout('You were signed out due to 5 hours of inactivity.');
        } else {
          scheduleInactivityCheck();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, logout, scheduleInactivityCheck]);

  // ─── 5. Firebase Auth State Listener (Silent refresh token) ──────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && user) {
        try {
          const freshToken = await getIdToken(fbUser, false);
          if (freshToken && freshToken !== user.token) {
            const updated = { ...user, token: freshToken };
            setUser(updated);
            try {
              localStorage.setItem('user', JSON.stringify(updated));
            } catch {
              // Ignore storage errors in restricted environments (e.g. private browsing)
            }
          }
        } catch (e) {
          // Silent ignore
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

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
        throw new Error(data.error || 'Incorrect email or password. Please try again.');
      }

      const sessionUser = processUser(data.user, data.token);
      saveUserSession(sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Unable to connect to the server. Please check your internet connection.', { cause: err });
      }
      throw err;
    }
  };

  /**
   * Register with Email
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
        throw new Error(data.error || 'Failed to create account. Please try again.');
      }

      const sessionUser = processUser(data.user, data.token);
      saveUserSession(sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Unable to connect to the server. Please check your internet connection.', { cause: err });
      }
      throw err;
    }
  };

  /**
   * Update Profile
   */
  const updateProfile = async (updatedData) => {
    if (!user) throw new Error('Please sign in to update your profile.');

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
      authModalState,
      openAuthModal,
      closeAuthModal,
      isAuthenticated: !!user,
      isAdmin: Boolean(user?.role === 'admin' || checkIsAdmin(user?.email)),
      adminEmail: ADMIN_EMAIL
    }}>
      {children}
    </AuthContext.Provider>
  );
};
