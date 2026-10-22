import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CookieProvider } from './context/CookieContext';
import { CategoryProvider } from './context/CategoryContext';
import { WishlistProvider } from './context/WishlistContext';
import { FlashSaleProvider } from './context/FlashSaleContext';
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

import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { recordSiteVisit } from './services/api';
import { popOAuthRedirect } from './utils/redirectProtection';

import { ProtectedRoute, AdminRoute, AuthModal } from './components/auth';

function AppLifecycleHandlers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useToast();

  useEffect(() => {
    let visitorId = localStorage.getItem('elibrary_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('elibrary_visitor_id', visitorId);
    }

    recordSiteVisit({
      visitorId,
      userId: user?.id || null,
      pagePath: location.pathname,
      referrer: document.referrer || ''
    });
  }, [location.pathname, user?.id]);

  // Handle post-redirect OAuth welcome toast and navigation
  useEffect(() => {
    const pendingToast = sessionStorage.getItem('pending_login_toast');
    if (pendingToast) {
      try {
        const data = JSON.parse(pendingToast);
        if (data.isAdmin) {
          success(`Welcome back, Administrator! Signed in as ${data.name}.`);
        } else {
          success(`Welcome, ${data.name}! Signed in successfully.`);
        }
      } catch {
        // ignore
      }
      sessionStorage.removeItem('pending_login_toast');
      const target = popOAuthRedirect(null);
      if (target) {
        navigate(target, { replace: true });
      }
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
                      <main className="flex-1 pt-20 bg-transparent">
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