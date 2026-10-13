import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiKey,
  FiCheckCircle,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
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

  // Password / Token Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: request token, 2: set new password
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState({ type: '', text: '' });
  const [generatedTokenPreview, setGeneratedTokenPreview] = useState('');

  const {
    user,
    loginWithEmail,
    signInWithGoogle,
    requestPasswordReset,
    resetPasswordWithToken
  } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check query string ?redirect=... or location.state
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect') || location.state?.from?.pathname || '/dashboard';

  // Check if user was automatically logged out due to session expiration
  useEffect(() => {
    const logoutReason = sessionStorage.getItem('session_logout_reason');
    if (logoutReason) {
      error(logoutReason);
      sessionStorage.removeItem('session_logout_reason');
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

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
        navigate(redirectTarget, { replace: true });
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
        navigate(redirectTarget, { replace: true });
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

  // --------------------------------------------------------------------------
  // Password Reset Token Flow
  // --------------------------------------------------------------------------
  const handleOpenResetModal = () => {
    setResetEmail(email.trim());
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetStep(1);
    setResetFeedback({ type: '', text: '' });
    setGeneratedTokenPreview('');
    setIsResetModalOpen(true);
  };

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetFeedback({ type: 'error', text: 'Please enter your account email.' });
      return;
    }

    setIsResetLoading(true);
    setResetFeedback({ type: '', text: '' });
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      setGeneratedTokenPreview(res.resetToken);
      setResetToken(res.resetToken);
      setResetFeedback({
        type: 'success',
        text: 'Reset token generated! Enter your new password below.'
      });
      setResetStep(2);
    } catch (err) {
      setResetFeedback({
        type: 'error',
        text: err.message || 'Failed to generate reset token. Verify email.'
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetPasswordWithToken = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      setResetFeedback({ type: 'error', text: 'Reset token is required.' });
      return;
    }
    if (newPassword.length < 8) {
      setResetFeedback({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsResetLoading(true);
    setResetFeedback({ type: '', text: '' });
    try {
      const res = await resetPasswordWithToken(resetToken.trim(), newPassword, confirmNewPassword);
      success(res.message || 'Password reset successfully! Please sign in.');
      setIsResetModalOpen(false);
      setEmail(resetEmail);
      setPassword(newPassword);
    } catch (err) {
      setResetFeedback({
        type: 'error',
        text: err.message || 'Failed to reset password. Token may be expired.'
      });
    } finally {
      setIsResetLoading(false);
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
          <div className="mb-4">
            <Link to="/">
              <button className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-[#1E90FF] transition-colors cursor-pointer">
                <FiArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>

          <Card className="p-6 sm:p-8 border border-slate-200/90 rounded-lg bg-white">
            {/* Header / Logo */}
            <div className="text-center mb-6">
              <div className="mx-auto w-11 h-11 rounded-md bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center mb-3">
                <span className="text-xl font-black">M</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
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
                  className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700"
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
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer mb-4"
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
            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
                or sign in with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-[11px] font-semibold text-[#1E90FF] hover:underline cursor-pointer"
                  >
                    Forgot Password / Reset Token?
                  </button>
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
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
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
                className="w-full py-2.5 px-4 rounded-md bg-[#1E90FF] hover:bg-[#1C86EE] text-white font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
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

            {/* Register Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#1E90FF] hover:underline">
                Create Account
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* PASSWORD RESET / TOKEN RESET MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 sm:p-7 max-w-md w-full border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-blue-50 text-[#1E90FF] flex items-center justify-center">
                    <FiKey className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Token Reset & Recovery
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {resetStep === 1 ? 'Step 1: Request Reset Token' : 'Step 2: Set New Password'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {resetFeedback.text && (
                <div
                  className={`mb-4 p-2.5 rounded-md text-xs border flex items-start gap-2 ${
                    resetFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {resetFeedback.type === 'success' ? (
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{resetFeedback.text}</span>
                </div>
              )}

              {/* STEP 1: REQUEST TOKEN */}
              {resetStep === 1 && (
                <form onSubmit={handleRequestToken} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. reader@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      A secure, 15-minute password reset token will be created for this email.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(2)}
                      className="text-[#1E90FF] hover:underline font-semibold"
                    >
                      Already have a token? →
                    </button>
                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="px-4 py-2 bg-[#1E90FF] hover:bg-[#1873cc] text-white rounded-md font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {isResetLoading ? 'Generating…' : 'Generate Token'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: ENTER TOKEN AND NEW PASSWORD */}
              {resetStep === 2 && (
                <form onSubmit={handleResetPasswordWithToken} className="space-y-3 text-xs">
                  {generatedTokenPreview && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md">
                      <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider block mb-1">
                        Active Reset Token (auto-filled):
                      </span>
                      <p className="font-mono text-[10px] text-slate-700 break-all select-all">
                        {generatedTokenPreview}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Paste your reset token here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      New Password (8+ characters, uppercase, symbol)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {isResetLoading ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
