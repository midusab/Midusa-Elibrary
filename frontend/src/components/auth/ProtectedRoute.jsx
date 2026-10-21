import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard requiring an authenticated active session.
 * Seamlessly triggers the auth popup and preserves destination.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      openAuthModal({
        redirectPath: location.pathname + location.search,
        initialMode: 'signin'
      });
    }
  }, [loading, isAuthenticated, openAuthModal, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Verifying session credentials…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
