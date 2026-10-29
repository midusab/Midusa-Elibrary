import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CookieProvider } from './context/CookieContext';
import { CategoryProvider } from './context/CategoryContext';
import { WishlistProvider } from './context/WishlistContext';
import { FlashSaleProvider, useFlashSale } from './context/FlashSaleContext';
import Navigation from './components/Navigation';
import Footer from './components/layout/Footer';
import ScrollProgressBar from './components/common/ScrollProgressBar';
import WhatsAppButton from './components/common/WhatsAppButton';
import { PageSkeleton } from './components/ui/LoadingSkeleton';

// Primary landing is eager for instant First Contentful Paint
import Hero from './pages/Hero';

// Secondary views are lazily code-split to dramatically shrink initial bundle download
const Categories = lazy(() => import('./pages/Categories'));
const Library = lazy(() => import('./pages/Library'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Legal = lazy(() => import('./pages/Legal'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));

import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { recordSiteVisit } from './services/api';
import { popOAuthRedirect } from './utils/redirectProtection';

import { ProtectedRoute, AdminRoute, AuthModal } from './components/auth';

/**
 * Fixed full-width flash sale banner pinned to the bottom of the viewport.
 * Only visible when a flash sale is live. Dismissible for the session.
 */
function FlashSaleBottomBar() {
  const { isLive, flashSale, countdown } = useFlashSale();
  const [dismissed, setDismissed] = useState(false);

  if (!isLive || !flashSale || dismissed) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9990] w-full"
      role="banner"
      aria-label="Flash sale promotion"
    >
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Left spacer for centering on desktop */}
          <div className="hidden sm:block w-24 flex-shrink-0" />

          {/* Centre content */}
          <div className="flex-1 flex items-center justify-center gap-2 text-center flex-wrap">
            <Flame className="w-4 h-4 fill-white animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide">
              FLASH SALE &mdash; {flashSale.discountPercent}% OFF ALL BOOKS
            </span>
            <span className="hidden sm:inline text-xs font-medium text-red-100">
              &bull; Ends in {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
            </span>
            <span className="sm:hidden text-xs font-medium text-red-100">
              {countdown.hours}h {countdown.minutes}m {countdown.seconds}s left
            </span>
            <Link
              to="/library"
              className="inline-flex items-center gap-1 ml-2 px-3 py-0.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-xs font-bold transition-colors flex-shrink-0"
            >
              Shop Now &rarr;
            </Link>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss flash sale banner"
            className="w-24 flex-shrink-0 flex items-center justify-end"
          >
            <span className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AppLifecycleHandlers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useToast();

  useEffect(() => {
    // Weekly site visit cycle: visitor session expires after 7 days, recorded data rolls over, and resets for next week
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let visitorId = localStorage.getItem('elibrary_visitor_id');
    const weekStartStr = localStorage.getItem('elibrary_visitor_week_start');
    const weekStart = weekStartStr ? parseInt(weekStartStr, 10) : 0;

    if (!visitorId || !weekStart || (now - weekStart > SEVEN_DAYS_MS)) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('elibrary_visitor_id', visitorId);
      localStorage.setItem('elibrary_visitor_week_start', String(now));
    }

    recordSiteVisit({
      visitorId,
      userId: user?.id || null,
      pagePath: location.pathname,
      referrer: document.referrer || ''
    });
  }, [location.pathname, user?.id]);

  // Handle post-redirect OAuth welcome toast and navigation.
  // This only runs after a full-page Google OAuth redirect (not popup).
  // The 'pending_login_toast' key is set by AuthContext after getRedirectResult() resolves.
  // We check for a 'oauth_redirect_handled' sentinel to prevent double navigation
  // if the AuthModal's handlePostAuth already navigated the user.
  useEffect(() => {
    const pendingToast = sessionStorage.getItem('pending_login_toast');
    if (!pendingToast) return;

    // If AuthModal already handled post-auth navigation, skip navigating again
    const alreadyHandled = sessionStorage.getItem('oauth_redirect_handled');
    sessionStorage.removeItem('pending_login_toast');
    sessionStorage.removeItem('oauth_redirect_handled');

    try {
      const data = JSON.parse(pendingToast);
      if (!alreadyHandled) {
        if (data.isAdmin) {
          success(`Welcome back, Administrator! Signed in as ${data.name}.`);
        } else {
          success(`Welcome, ${data.name}! Signed in successfully.`);
        }
        const target = popOAuthRedirect(null);
        if (target) {
          navigate(target, { replace: true });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [success, navigate]);

  return null;
}

/**
 * Fallback handler when users access /login or /register URLs directly.
 * Instead of separate auth pages, opens the unified popup modal seamlessly.
 */
function AuthPopupRedirect({ mode = 'signin' }) {
  const { openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const redirectTarget = queryParams.get('redirect') || null;
    openAuthModal({ initialMode: mode, redirectPath: redirectTarget });
  }, [openAuthModal, mode, location.search]);

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CookieProvider>
                <CategoryProvider>
                  <WishlistProvider>
                    <FlashSaleProvider>
                      <AppLifecycleHandlers />
                      {/* Global UI overlays */}
                      <ScrollProgressBar />
                      <WhatsAppButton />
                      <AuthModal />
                    <div className="min-h-screen flex flex-col text-slate-900 overflow-x-hidden w-full relative">
                      {/* ── Apple Liquid Glass Ambient Mesh Gradient Canvas (Cobalt Blue, Deep Violet, Soft Amber) ── */}
                      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#fafbfe]" aria-hidden="true">
                        <div className="liquid-mesh-orb-1" />
                        <div className="liquid-mesh-orb-2" />
                        <div className="liquid-mesh-orb-3" />
                        <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
                      </div>

                      <Navigation />

                      {/* ── Fixed Flash Sale Bottom Bar ── */}
                      <FlashSaleBottomBar />

                      <main className="flex-1 pt-24 sm:pt-28 bg-transparent">
                        <Suspense fallback={<PageSkeleton />}>
                          <Routes>
                            <Route path="/" element={<Hero />} />
                            <Route path="/categories" element={<Categories />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/book/:id" element={<BookDetails />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route
                              path="/checkout"
                              element={
                                <ProtectedRoute>
                                  <Checkout />
                                </ProtectedRoute>
                              }
                            />
                            {/* Authentication is handled purely via modal popup */}
                            <Route path="/login" element={<AuthPopupRedirect mode="signin" />} />
                            <Route path="/register" element={<AuthPopupRedirect mode="register" />} />
                            <Route
                              path="/dashboard"
                              element={
                                <ProtectedRoute>
                                  <Dashboard />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/wishlist"
                              element={
                                <ProtectedRoute>
                                  <Dashboard initialTab="favorites" />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/admin"
                              element={
                                <AdminRoute>
                                  <AdminDashboard />
                                </AdminRoute>
                              }
                            />
                            <Route path="/author/:name" element={<AuthorPage />} />
                            <Route path="/legal" element={<Legal />} />
                            <Route path="/refund-policy" element={<Legal />} />
                            <Route path="/privacy" element={<Legal />} />
                            <Route path="/terms" element={<Legal />} />
                          </Routes>
                        </Suspense>
                      </main>
                      <Footer />
                    </div>
                    </FlashSaleProvider>
                  </WishlistProvider>
                </CategoryProvider>
              </CookieProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}