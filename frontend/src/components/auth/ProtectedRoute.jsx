import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard requiring an authenticated active session
 * Preserves the requested destination in location state for seamless redirect after login
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Verifying session credentials…</p>
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

  return children;
}
