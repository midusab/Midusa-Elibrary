import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ADMIN_EMAIL } from '../../constants/auth';
import Logo from '../../assets/logo.jpg';

export default function AuthModal({ isOpen, onClose, redirectPath = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signInWithGoogle } = useAuth();
  const { success } = useToast();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const loggedInUser = result.user;
        const isAdmin =
          loggedInUser?.role === 'admin' ||
          loggedInUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        if (isAdmin) {
          success(`Welcome back, Administrator! Signed in as ${loggedInUser.fullname || loggedInUser.email}.`);
        } else {
          success(`Welcome, ${loggedInUser.fullname || 'Reader'}! Signed in successfully.`);
        }
        onClose();
        if (redirectPath && typeof window !== 'undefined') {
          window.location.href = redirectPath;
        }
      } else {
        setErrorMessage(result?.error || 'Google sign-in could not be completed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during Google sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden z-10 text-center"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E90FF] to-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-[#1E90FF]/25 border border-white/60 mb-3 overflow-hidden">
              <img src={Logo} alt="Midusa Elibrary" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Midusa <span className="text-[#1E90FF]">eLibrary</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
              Fast, 1-click access to your purchased books, reading library, and instant M-PESA checkout.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F40009]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300/90 bg-white hover:bg-slate-50 hover:border-[#1E90FF] text-slate-800 text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 shadow-xs"
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
              <span>{isLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Trust badges footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00A651]" />
            <span>Official Google OAuth 2.0 • No password needed</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
