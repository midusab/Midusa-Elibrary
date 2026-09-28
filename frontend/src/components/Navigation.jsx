import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiMoon, FiSun, FiChevronDown } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants/categories';

export default function Navigation() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/src/assets/logo.jpg" alt="MidusaElibrary" className="h-10 w-10 rounded-full" />
            <span className="ml-2 text-2xl font-bold text-primary">MidusaElibrary</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Library with Dropdown */}
            <div className="relative">
              <button
                className="text-slate-700 dark:text-slate-300 hover:text-primary font-medium flex items-center"
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              >
                Library
                <FiChevronDown className={`ml-1 h-4 w-4 transition-transform ${isLibraryOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLibraryOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-2 z-50 border border-slate-200 dark:border-slate-700">
                  {CATEGORIES.map(category => (
                    <Link
                      key={category.id}
                      to={`/library?category=${category.name}`}
                      className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors"
                      onClick={() => setIsLibraryOpen(false)}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/categories" className="text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors">
              Categories
            </Link>
            <Link to="/about" className="text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors">
              Contact
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <Link to="/dashboard" className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                <FiUser className="w-6 h-6" />
                <span className="font-medium">{user.fullname?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link to="/login">
                <button className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="text-slate-700 dark:text-slate-300 hover:text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
            <div className="relative">
              <button
                className="text-slate-700 dark:text-slate-300 hover:text-primary font-medium flex items-center w-full"
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              >
                Library
                <FiChevronDown className={`ml-1 h-4 w-4 transition-transform ${isLibraryOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLibraryOpen && (
                <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 border border-slate-200 dark:border-slate-700">
                  {CATEGORIES.map(category => (
                    <Link
                      key={category.id}
                      to={`/library?category=${category.name}`}
                      className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors"
                      onClick={() => {
                        setIsLibraryOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/categories" className="block text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              Categories
            </Link>
            <Link to="/about" className="block text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="block text-slate-700 dark:text-slate-300 hover:text-primary font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
            
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </form>

            {/* Mobile Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
              >
                {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
              </button>
              
              <Link to="/cart" className="relative text-slate-700 dark:text-slate-300 hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <FiShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <Link to="/dashboard" className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  <FiUser className="w-6 h-6" />
                  <span className="font-medium">{user.fullname?.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
