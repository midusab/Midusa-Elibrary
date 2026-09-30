import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── On mount: rehydrate session + pick up any redirect result ────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Restore saved session from localStorage
      const saved = localStorage.getItem('user');
      if (saved) {
        try { if (!cancelled) setUser(JSON.parse(saved)); }
        catch { localStorage.removeItem('user'); }
      }

      // 2. Check for a pending Google redirect result
      try {
        const result = await getRedirectResult(auth);
        if (result && !cancelled) {
          await exchangeFirebaseToken(result);
        }
      } catch (err) {
        // auth/no-auth-event is normal when there's no pending redirect
        if (err?.code !== 'auth/no-auth-event') {
          console.error('Redirect result error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  /**
   * Exchange a Firebase credential result for our backend JWT.
   * Used after redirect completes on page load.
   */
  async function exchangeFirebaseToken(result) {
    const idToken = await result.user.getIdToken();

    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Backend authentication failed');
    }

    const data = await res.json();
    const sessionUser = { ...data.user, token: data.token };
    setUser(sessionUser);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    return sessionUser;
  }

  /**
   * Kick off Google sign-in via redirect (no popup, avoids COOP issues).
   * The result is handled in the useEffect above on the next page load.
   */
  const signInWithGoogle = () => signInWithRedirect(auth, googleProvider);

  /** Sign out from Firebase AND clear our session */
  const logout = async () => {
    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
  };

  // Backwards-compat helper for code that still calls login() directly
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      signInWithGoogle,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
