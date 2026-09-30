import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from localStorage on page load
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Google Sign-In flow:
   * 1. Firebase popup → get idToken
   * 2. Send idToken to our backend → receive JWT + user profile
   * 3. Store session in state + localStorage
   */
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
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
    // data = { token, user: { id, email, fullname, avatar, role } }
    const sessionUser = { ...data.user, token: data.token };

    setUser(sessionUser);
    localStorage.setItem('user', JSON.stringify(sessionUser));

    return sessionUser;
  };

  /** Sign out from Firebase AND clear our session */
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore firebase sign-out errors
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  // Keep legacy helpers for any existing code that calls login() directly
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
