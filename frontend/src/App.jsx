
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import About from './pages/About';
import Contact from './pages/Contact';

export default function App(){
  return(
    <Router>
      <ThemeProvider>
        <CartProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden w-full">
                <Navigation/>
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Hero/>} />
                    <Route path="/categories" element={<Categories/>} />
                    <Route path="/library" element={<Library/>} />
                    <Route path="/book/:id" element={<BookDetails/>} />
                    <Route path="/cart" element={<Cart/>} />
                    <Route path="/checkout" element={<Checkout/>} />
                    <Route path="/login" element={<Login/>} />
                    <Route path="/register" element={<Register/>} />
                    <Route path="/dashboard" element={<Dashboard/>} />
                    <Route path="/about" element={<About/>} />
                    <Route path="/contact" element={<Contact/>} />
                    {/* More routes will be added */}
                  </Routes>
                </main>
                <Footer/>
              </div>
            </ToastProvider>
          </AuthProvider>
        </CartProvider>
      </ThemeProvider>
    </Router>
  )
}