import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Route guard requiring both authenticated session AND administrator privileges
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, openAuthModal } = useAuth();
  const { error: toastError } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      toastError('Access denied. Administrator privileges required.');
    } else if (!loading && !isAuthenticated) {
      openAuthModal({
        redirectPath: location.pathname + location.search,
        initialMode: 'signin'
      });
    }
  }, [loading, isAuthenticated, isAdmin, toastError, openAuthModal, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Checking administrator privileges…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
