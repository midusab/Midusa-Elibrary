import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Route guard requiring both authenticated session AND administrator privileges
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { error: toastError } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      toastError('Access denied. Administrator privileges required.');
    }
  }, [loading, isAuthenticated, isAdmin, toastError]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Checking administrator privileges…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate
        to={`/login?redirect=${redirectParam}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
