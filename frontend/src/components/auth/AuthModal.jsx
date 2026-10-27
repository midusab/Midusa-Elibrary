import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ADMIN_EMAIL } from '../../constants/auth';
import { storeOAuthRedirect, popOAuthRedirect } from '../../utils/redirectProtection';
import Logo from '../../assets/logo.jpg';

export default function AuthModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  redirectPath: propRedirectPath,
}) {
  const {
    authModalState,
    closeAuthModal,
    signInWithGoogle,
  } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const isOpen = propIsOpen !== undefined ? propIsOpen : (authModalState?.isOpen ?? false);
  const onClose = propOnClose || closeAuthModal;
  const redirectPath = propRedirectPath !== undefined ? propRedirectPath : (authModalState?.redirectPath || null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
      // Mark as handled so App.jsx doesn't also navigate (prevents double redirect)
      sessionStorage.setItem('oauth_redirect_handled', '1');
      navigate(destination, { replace: true });
    }
  };

  /**
   * Translates technical Firebase/OAuth error codes into clear, user-friendly language.
   */
  const getFriendlyErrorMessage = (err) => {
    if (!err) return 'An error occurred during sign-in. Please try again.';
    const code = err.code || '';
    const msg = (err.message || '').toLowerCase();

    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in was cancelled because the Google window was closed. Click below to try again.';
    }
    if (code === 'auth/popup-blocked') {
      return 'The Google sign-in window was blocked by your browser. Please allow popups for this site and try again.';
    }
    if (code === 'auth/cancelled-popup-request') {
      return 'Sign-in was cancelled. Please click the button below to continue.';
    }
    if (code === 'auth/network-request-failed' || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Unable to connect to Google authentication. Please check your internet connection and try again.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This website domain is not authorized in Google authentication settings. Please contact the administrator.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google sign-in is currently undergoing maintenance. Please try again shortly.';
    }
    return 'Google sign-in could not be completed. Please check your internet connection and try again.';
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
        // Redirect flow in progress
      } else {
        setErrorMessage(result?.error || 'Google sign-in could not be completed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
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
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden z-10 text-center my-auto"
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
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-md bg-white flex items-center justify-center border border-slate-200 mb-3 overflow-hidden">
                <img src={Logo} alt="Midusa Elibrary" className="w-full h-full object-cover rounded-md" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                Sign In to Midusa <span className="text-[#1E90FF]">eLibrary</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                Sign in with your Google account to access your eBooks, manage downloads, and read instantly.
              </p>
            </div>

            {/* Error Banner with User-Friendly Message */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F40009]" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Google Sign In Button (Single One-Click Sign In) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#1E90FF] text-slate-800 text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 shadow-xs hover:shadow-md"
            >
              {isLoading ? (
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
              <span>{isLoading ? 'Connecting to Google…' : 'Sign in with Google'}</span>
            </button>

            {/* Reassurance text */}
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Fast, secure one-click sign-in. No separate password or account creation needed.
            </p>

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
