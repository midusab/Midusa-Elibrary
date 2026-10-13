import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard for guest/public-only authentication pages (/login, /register)
 * Automatically forwards already logged-in users to their destination or dashboard
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Checking credentials…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // Check if there was a previous redirect target in location.state or query string
    const queryParams = new URLSearchParams(location.search);
    const redirectUrl = queryParams.get('redirect');
    const destination = location.state?.from?.pathname || redirectUrl || (isAdmin ? '/admin' : '/dashboard');

    return <Navigate to={destination} replace />;
  }

  return children;
}
