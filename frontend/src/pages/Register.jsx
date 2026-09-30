import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    setTimeout(() => {
      const googleUser = {
        id: 'google-usr-' + Date.now(),
        email: 'newuser@gmail.com',
        fullname: 'New Reader',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        role: 'user',
        provider: 'google'
      };

      register(googleUser);
      success('Account created with Google!');
      setIsLoading(false);
      navigate('/dashboard', { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-[82vh] bg-white py-12 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-6">
            <Link to="/">
              <button className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                <FiArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>

          <Card className="p-8 sm:p-10 border border-slate-200/80 shadow-sm rounded-2xl bg-white text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Create an Account
            </h1>
            <p className="text-sm text-slate-600 mb-8 max-w-xs mx-auto">
              Get instant access to curated eBooks in Self Development, Psychology, Finance, and Christianity.
            </p>

            {/* Direct Google Sign-Up Button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Creating account...' : 'Sign up with Google'}</span>
            </button>

            <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <FiShield className="w-3.5 h-3.5 text-emerald-500" />
              <span>No password needed • 1-click Google authentication</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
