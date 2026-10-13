import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../constants/auth';
import { useToast } from '../context/ToastContext';
import Logo from '../assets/logo.jpg';

export default function Register() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { user, signInWithGoogle } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignUp = async () => {
    setFormError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const loggedInUser = result.user;
        const isAdmin = loggedInUser?.role === 'admin' || loggedInUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          success(`Welcome Administrator! Signed in as ${loggedInUser.fullname || loggedInUser.email}.`);
        } else {
          success(`Welcome to Midusa Elibrary, ${loggedInUser.fullname || 'Reader'}!`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = err.message || 'Google registration failed. Please try again.';
        setFormError(msg);
        error(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-6 group"
        >
          <FiArrowLeft className="mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Library</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-7 sm:p-9 bg-white border border-slate-200/90 rounded-lg shadow-none">
            
            {/* Header: Brand Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white mx-auto mb-4 border border-white/60 ring-2 ring-primary/20 overflow-hidden">
                <img src={Logo} alt="Midusa Elibrary" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Create Reader Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Join with Google for instant single-click access.
              </p>
            </div>

            {/* Error Notification Banner */}
            {formError && (
              <div className="mb-6 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Google Authentication Button */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-none hover:border-primary"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
              </button>
            </div>

            {/* Session & Security Feature Strip */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <FiClock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>2-Hour Protected Session with automatic logout</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant access across all your devices</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <FiShield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Zero password vulnerabilities — verified by Google</span>
              </div>
            </div>

            {/* Legal / Policy Note */}
            <p className="mt-6 text-[11px] text-slate-400 text-center leading-relaxed">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-bold">
                Sign in here
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
