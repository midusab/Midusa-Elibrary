import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CategoryProvider } from './context/CategoryContext';
import Navigation from './components/Navigation';
import Footer from './components/layout/Footer';
import Hero from './pages/Hero';
import Categories from './pages/Categories';
import Library from './pages/Library';
import BookDetails from './pages/BookDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Legal from './pages/Legal';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { recordSiteVisit } from './services/api';

function PageVisitTracker() {
  const location = useLocation();
  const { user } = useAuth();

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

  return null;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CategoryProvider>
                <PageVisitTracker />
                <div className="min-h-screen flex flex-col bg-white text-slate-900 overflow-x-hidden w-full">
                  <Navigation />
                  <main className="flex-1 pt-20 bg-white">
                    <Routes>
                      <Route path="/" element={<Hero />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="/book/:id" element={<BookDetails />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/legal" element={<Legal />} />
                      <Route path="/refund-policy" element={<Legal />} />
                      <Route path="/privacy" element={<Legal />} />
                      <Route path="/terms" element={<Legal />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </CategoryProvider>
            </ToastProvider>
          </AuthProvider>
        </CartProvider>
      </ThemeProvider>
    </Router>
  );
}