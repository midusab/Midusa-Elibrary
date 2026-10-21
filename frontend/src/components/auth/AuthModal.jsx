import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertCircle, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ADMIN_EMAIL } from '../../constants/auth';
import { storeOAuthRedirect, popOAuthRedirect } from '../../utils/redirectProtection';
import Logo from '../../assets/logo.jpg';

export default function AuthModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  redirectPath: propRedirectPath,
  initialMode: propInitialMode
}) {
  const {
    authModalState,
    closeAuthModal,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail
  } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const isOpen = propIsOpen !== undefined ? propIsOpen : (authModalState?.isOpen ?? false);
  const onClose = propOnClose || closeAuthModal;
  const redirectPath = propRedirectPath !== undefined ? propRedirectPath : (authModalState?.redirectPath || null);
  const effectiveInitialMode = propInitialMode || authModalState?.initialMode || 'signin';

  const [mode, setMode] = useState(effectiveInitialMode); // 'signin' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Reset error and sync mode when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setMode(effectiveInitialMode);
      if (effectiveInitialMode === 'register') {
        setShowEmailForm(true);
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, effectiveInitialMode]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePostAuth = (user) => {
    const isAdmin =
      user?.role === 'admin' ||
      user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isAdmin) {
      success(`Welcome back, Administrator! Signed in as ${user.fullname || user.email}.`);
    } else {
      success(`Welcome, ${user.fullname || 'Reader'}! Signed in successfully.`);
    }
    onClose();
    const destination = redirectPath || popOAuthRedirect(null);
    if (destination) {
      navigate(destination, { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    if (redirectPath) {
      storeOAuthRedirect(redirectPath);
    }
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        handlePostAuth(result.user);
      } else if (result?.redirecting) {
        // Redirect flow started
      } else {
        setErrorMessage(result?.error || 'Google sign-in could not be completed.');
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. You closed the Google popup.');
      } else {
        setErrorMessage(err.message || 'An error occurred during Google sign-in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const result = await loginWithEmail(email, password);
        if (result?.success) {
          handlePostAuth(result.user);
        }
      } else {
        if (!fullname.trim()) {
          setErrorMessage('Full name is required.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        const result = await registerWithEmail(fullname, email, password, confirmPassword);
        if (result?.success) {
          handlePostAuth(result.user);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden z-10 text-center my-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo & Brand Header */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#1E90FF] to-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-[#1E90FF]/25 border border-white/60 mb-2.5 overflow-hidden">
                <img src={Logo} alt="Midusa Elibrary" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                {mode === 'signin' ? 'Sign In to ' : 'Join '}
                Midusa <span className="text-[#1E90FF]">eLibrary</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Instant access to your digital library, reader downloads, and direct M-PESA checkout.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F40009]" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Google Sign In Button (Primary 1-Click Action) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#1E90FF] text-slate-800 text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isLoading && !showEmailForm ? (
                <div className="w-5 h-5 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
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
              <span>{isLoading && !showEmailForm ? 'Connecting…' : (mode === 'register' ? 'Sign up with Google' : 'Continue with Google')}</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="bg-white px-2.5 text-slate-400 hover:text-[#1E90FF] font-bold cursor-pointer transition-colors"
                >
                  {showEmailForm ? 'Hide Email Form' : 'Or with Email'}
                </button>
              </div>
            </div>

            {/* Email / Password Form (Collapsible) */}
            {showEmailForm && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left animate-in fade-in duration-200">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isLoading && showEmailForm ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In with Email' : 'Create My Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Mode switch helper link */}
            <div className="mt-4 text-center">
              {mode === 'signin' ? (
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setShowEmailForm(true);
                      setErrorMessage('');
                    }}
                    className="font-bold text-[#1E90FF] hover:underline cursor-pointer"
                  >
                    Create one now
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage('');
                    }}
                    className="font-bold text-[#1E90FF] hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>

            {/* Trust badge footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#00A651]" />
              <span>Official Google OAuth 2.0 &amp; SSL Encrypted</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
