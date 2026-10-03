import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  getIdToken,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ADMIN_EMAIL, checkIsAdmin } from '../constants/auth';

/** Returns true if the string looks like a real signed JWT (three base64 parts). */
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
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to normalize user object and ensure admin role
  const processUser = (rawUser, token) => {
    const isAdmin = checkIsAdmin(rawUser.email);
    const processed = {
      ...rawUser,
      token: token || rawUser.token || 'jwt-token-' + Date.now(),
      role: isAdmin ? 'admin' : (rawUser.role || 'user'),
      isAdmin: isAdmin,
    };
    return processed;
  };

  const saveUserSession = (sessionUser) => {
    const processed = processUser(sessionUser, sessionUser.token);
    setUser(processed);
    localStorage.setItem('user', JSON.stringify(processed));
    return processed;
  };

  /**
   * Exchange a Firebase credential result for our backend JWT.
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
        return saveUserSession(sessionUser);
      }
    } catch (apiErr) {
      console.warn('Backend /auth/google not reachable, falling back to Firebase profile:', apiErr.message);
    }

    // Direct fallback if backend is offline or unseeded
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

  // ─── On mount: rehydrate session + pick up any redirect result ────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Restore saved session from localStorage
      const saved = localStorage.getItem('user');
      let restoredUser = null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          restoredUser = processUser(parsed, parsed.token);
          if (!cancelled) setUser(restoredUser);
        } catch {
          localStorage.removeItem('user');
        }
      }

      // 2. Check for a pending Google redirect result
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

      // 3. If the stored token is stale/fake, silently refresh it via Firebase
      if (restoredUser && !isRealJwt(restoredUser.token) && !cancelled) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          try {
            const freshIdToken = await getIdToken(firebaseUser, /* forceRefresh */ true);
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
              }
            }
          } catch (refreshErr) {
            console.warn('Silent token refresh failed:', refreshErr.message);
          }
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  /**
   * Sign in with Google:
   * First attempts popup for immediate feedback without page reloads.
   * Falls back to redirect if popup is blocked or fails.
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
    const isAdmin = checkIsAdmin(normalizedEmail);

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
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot connect to the server. Please make sure the backend is running and try again.');
      }
      throw err;
    }
  };

  /**
   * Register with Email, Full Name and Password
   */
  const registerWithEmail = async (fullname, email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isAdmin = checkIsAdmin(normalizedEmail);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email: normalizedEmail, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      const sessionUser = processUser(data.user, data.token);
      saveUserSession(sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
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

  /** Sign out from Firebase AND clear our session */
  const logout = async () => {
    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('pending_login_toast');
  };

  // Backwards-compat helper
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
      isAuthenticated: !!user,
      isAdmin: Boolean(user?.role === 'admin' || checkIsAdmin(user?.email)),
      adminEmail: ADMIN_EMAIL
    }}>
      {children}
    </AuthContext.Provider>
  );
};

