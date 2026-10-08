import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheck,
  FiShield
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../constants/auth';
import { useToast } from '../context/ToastContext';

// Password Security Validation Criteria
const PASSWORD_CRITERIA = [
  { id: 'length', label: '8+ characters', test: (pwd) => pwd.length >= 8 },
  { id: 'uppercase', label: 'Uppercase letter (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'Lowercase letter (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'Number (0-9)', test: (pwd) => /\d/.test(pwd) },
  { id: 'special', label: 'Special symbol (!@#$%^&*)', test: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd) }
];

export default function Register() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { user, registerWithEmail, signInWithGoogle } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Real-time password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, label: '', textColor: '', barColor: 'bg-slate-200', count: 0 };
    }
    let count = 0;
    PASSWORD_CRITERIA.forEach((c) => {
      if (c.test(password)) count++;
    });

    if (count <= 1) {
      return { score: 1, label: 'Very Weak', textColor: 'text-rose-500', barColor: 'bg-rose-500', count };
    }
    if (count === 2) {
      return { score: 2, label: 'Weak', textColor: 'text-orange-500', barColor: 'bg-orange-500', count };
    }
    if (count === 3) {
      return { score: 3, label: 'Fair', textColor: 'text-amber-500', barColor: 'bg-amber-500', count };
    }
    if (count === 4) {
      return { score: 4, label: 'Good', textColor: 'text-blue-500', barColor: 'bg-blue-500', count };
    }
    return { score: 5, label: 'Strong & Secure', textColor: 'text-emerald-500', barColor: 'bg-emerald-500', count };
  }, [password]);

  const passwordsMatch = Boolean(confirmPassword && password && password === confirmPassword);
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!fullname.trim()) {
      setFormError('Please enter your full name');
      error('Please enter your full name');
      return;
    }

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
      setFormError('Please enter a password');
      error('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      error('Password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setFormError('Password must contain uppercase, lowercase, number, and special character');
      error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (!confirmPassword) {
      setFormError('Please confirm your password');
      error('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithEmail(fullname.trim(), trimmedEmail, password, confirmPassword);
      if (result?.success) {
        const isAdmin = result.user?.role === 'admin' || trimmedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          success(`Account created! Welcome Administrator ${fullname}.`);
        } else {
          success(`Account created successfully! Welcome, ${fullname}.`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.message || 'Failed to register account. Please try again.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const loggedInUser = result.user;
        const isAdmin = loggedInUser?.role === 'admin' || loggedInUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          success(`Welcome Administrator ${loggedInUser.fullname || 'Brian'}!`);
        } else {
          success(`Welcome to Midusa Elibrary, ${loggedInUser.fullname || 'Reader'}!`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google sign-up failed:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = err.message || 'Google sign-up failed. Please try again.';
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
          <div className="mb-5">
            <Link to="/">
              <button className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-[#1E90FF] transition-colors cursor-pointer">
                <FiArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>

          <Card className="p-7 sm:p-9 border border-slate-200 shadow-md rounded-2xl bg-white">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-xl bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center mb-3">
                <span className="text-2xl font-black">M</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Join Midusa Elibrary to read, save favorites, and access premium digital books.
              </p>
            </div>

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

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
                or sign up with email
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => {
                      setFullname(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Brian Midusa"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

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
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF] transition-all"
                  />
                </div>
              </div>

              {/* Password Field with Security Indicators */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {password && (
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${passwordStrength.textColor}`}>
                      <FiShield className="w-3 h-3" />
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setIsPasswordFocused(true)}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Create a strong password"
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

                {/* Password Strength Segmented Bar & Checklist */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2.5 space-y-2"
                  >
                    {/* Visual Segmented Progress Bar */}
                    <div className="grid grid-cols-5 gap-1.5 h-1.5">
                      {[1, 2, 3, 4, 5].map((seg) => (
                        <div
                          key={seg}
                          className={`h-full rounded-full transition-all duration-300 ${
                            seg <= passwordStrength.score ? passwordStrength.barColor : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria checklist */}
                    {(isPasswordFocused || passwordStrength.score < 5) && (
                      <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                        {PASSWORD_CRITERIA.map((crit) => {
                          const passed = crit.test(password);
                          return (
                            <div
                              key={crit.id}
                              className={`flex items-center gap-1.5 transition-colors ${
                                passed ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                  passed ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                {passed ? <FiCheck className="w-2.5 h-2.5" /> : '•'}
                              </span>
                              <span>{crit.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Confirm Password Field with Match Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  {confirmPassword && (
                    <span className="text-[11px] font-semibold flex items-center gap-1">
                      {passwordsMatch ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <FiCheck className="w-3.5 h-3.5" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1">
                          <FiAlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Re-enter password to confirm"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      passwordsMismatch
                        ? 'border-rose-300 focus:ring-rose-400/25 focus:border-rose-500'
                        : passwordsMatch
                        ? 'border-emerald-300 focus:ring-emerald-400/25 focus:border-emerald-500'
                        : 'border-slate-200 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1E90FF] hover:bg-[#1C86EE] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1E90FF]/25 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#1E90FF] hover:underline">
                Sign In
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
