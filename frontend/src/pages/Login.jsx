import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, /** FiCheckCircle*/ } from 'react-icons/fi';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../constants/auth';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { user, loginWithEmail, signInWithGoogle } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Quick fill for Admin testing
  const handleQuickAdmin = () => {
    setEmail(ADMIN_EMAIL);
    setPassword('Admin@1234');
    setFormError('');
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Please enter your email address');
      error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address');
      error('Please enter a valid email address');
      return;
    }

    if (!password) {
      setFormError('Please enter your password');
      error('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmail(trimmedEmail, password);
      if (result?.success) {
        const isAdmin = result.user?.role === 'admin' || trimmedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          success(`Welcome back, Administrator! Signed in as ${result.user.fullname || trimmedEmail}.`);
        } else {
          success(`Welcome back, ${result.user.fullname || trimmedEmail}! Signed in successfully.`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Email sign-in error:', err);
      const msg = err.message || 'Failed to sign in. Please verify your credentials.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const loggedInUser = result.user;
        const isAdmin = loggedInUser?.role === 'admin' || loggedInUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          success(`Welcome back, Administrator! Signed in as ${loggedInUser.fullname || loggedInUser.email}.`);
        } else {
          success(`Welcome back, ${loggedInUser.fullname || 'Reader'}! Successfully signed in.`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google sign-in failed:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = err.message || 'Google sign-in failed. Please try again.';
        setFormError(msg);
        error(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-slate-50/50 py-12 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Back Link */}
          <div className="mb-5">
            <Link to="/">
              <button className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-[#1E90FF] transition-colors cursor-pointer">
                <FiArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>

          <Card className="p-7 sm:p-9 border border-slate-200 shadow-md rounded-2xl bg-white">
            {/* Header / Logo */}
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-xl bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center mb-3">
                <span className="text-2xl font-black">M</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign In to Your Account
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Access your digital library, purchased books, and personal profile.
              </p>
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700"
                >
                  <FiAlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">{formError}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer mb-5"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
                or sign in with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. reader@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1E90FF] hover:bg-[#1C86EE] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1E90FF]/25 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Quick Admin Account Helper Box 
            <div className="mt-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <FiShield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Sign In</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAdmin}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Fill Admin
                </button>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Admin email: <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono font-bold text-amber-900">{ADMIN_EMAIL}</code>
              </p>
            </div>*/}

            {/* Register Link */}
            <div className="mt-5 text-center text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#1E90FF] hover:underline">
                Create Account
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
