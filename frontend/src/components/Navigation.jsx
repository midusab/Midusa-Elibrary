import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiShield,
  FiArrowRight
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../context/CategoryContext';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import CategoryIcon from './ui/CategoryIcon';
import Logo from '../assets/logo.jpg';

export default function Navigation() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { cartCount } = useCart();
  const { categories } = useCategories();
  const { user, logout, isAdmin } = useAuth();
  const { success } = useToast();

  // Keep search input in sync with URL search param on /library page during render
  const currentUrlSearch = location.pathname === '/library'
    ? (new URLSearchParams(location.search).get('search') || '')
    : '';
  const [prevUrlSearch, setPrevUrlSearch] = useState(currentUrlSearch);
  if (currentUrlSearch !== prevUrlSearch) {
    setPrevUrlSearch(currentUrlSearch);
    setSearchQuery(currentUrlSearch);
  }

  // Close menus when route changes
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
    setIsUserMenuOpen(false);
    setIsSuggestionsOpen(false);
  }

  // Handle outside click to close popups
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live debounced search suggestions (asynchronous timer callback only)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await getBooks({ search: trimmed, limit: 4 });
        if (isMounted) {
          setSuggestions(Array.isArray(res?.books) ? res.books : []);
          setIsSuggestionsOpen(true);
        }
      } catch {
        if (isMounted) setSuggestions([]);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 220);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  };

  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    setIsSuggestionsOpen(false);
    setIsMobileMenuOpen(false);

    if (trimmed) {
      navigate(`/library?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/library');
    }
  }, [searchQuery, navigate]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    if (location.pathname === '/library') {
      navigate('/library');
    }
  };

  const handleSelectBook = (bookId) => {
    setIsSuggestionsOpen(false);
    setIsMobileMenuOpen(false);
    navigate(`/book/${bookId}`);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    success('You have been signed out successfully.');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2 sm:gap-4 lg:gap-6">
          
          {/* ========================================================= */}
          {/* 1. BRAND LOGO + CORE NAVIGATION LINKS                     */}
          {/* ========================================================= */}
          <div className="flex items-center gap-4 lg:gap-7 flex-shrink-0">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1E90FF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-[#1E90FF]/25 border border-white/60 ring-2 ring-[#1E90FF]/15 group-hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0">
                <img className="w-full h-full object-cover" src={Logo} alt="Midusa Elibrary" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight select-none">
                <span className="text-slate-900">Midusa</span>
                <span className="text-[#1E90FF]">Elibrary</span>
              </span>
            </Link>

            {/* Streamlined Desktop Navigation Links (eBooks, Categories, Bestsellers) */}
            <div className="hidden lg:flex items-center gap-1">
              {/* eBooks Store */}
              <Link
                to="/library"
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/library') && !location.search.includes('bestseller')
                    ? 'text-[#1E90FF] bg-blue-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                eBooks
              </Link>

              {/* Categories with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isCategoriesOpen || isActive('/categories')
                      ? 'text-[#1E90FF] bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  aria-expanded={isCategoriesOpen}
                  aria-haspopup="true"
                >
                  <span>Categories</span>
                  <FiChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCategoriesOpen ? 'rotate-180 text-[#1E90FF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Categories Dropdown Menu */}
                {isCategoriesOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl p-2.5 shadow-2xl border border-slate-200/90 ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Book Categories
                    </div>
                    <div className="space-y-1 mt-1 max-h-72 overflow-y-auto">
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">Loading categories...</div>
                      ) : (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/library?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E90FF] flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 group-hover/item:bg-[#1E90FF] group-hover/item:text-white transition-all">
                              <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 group-hover/item:text-[#1E90FF] truncate transition-colors">
                                {cat.name}
                              </p>
                              {cat._count?.books !== undefined && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {cat._count.books} {cat._count.books === 1 ? 'book' : 'books'}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <Link
                        to="/categories"
                        onClick={() => setIsCategoriesOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#1E90FF] hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <span>Explore All Categories</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Bestsellers Link */}
              <Link
                to="/library?bestseller=true"
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  location.search.includes('bestseller')
                    ? 'text-amber-700 bg-amber-50 font-bold'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/60'
                }`}
              >
                <span>Bestsellers</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ★
                </span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. PROMINENT, FUNCTIONAL SEARCH BAR (MD & UP)              */}
          {/* ========================================================= */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-2 lg:mx-4 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              {/* Clickable Search Magnifier Button */}
              <button
                type="submit"
                aria-label="Submit search"
                title="Search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E90FF] transition-colors p-1 rounded-full cursor-pointer z-10"
              >
                <FiSearch className="w-4 h-4" />
              </button>

              {/* Main Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                    setIsSuggestionsOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSuggestionsOpen(false);
                  }
                }}
                placeholder="Search books, authors, genres..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white border border-slate-200/90 focus:border-[#1E90FF] rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1E90FF]/15 transition-all shadow-xs"
              />

              {/* Clear Search Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full z-10"
                  aria-label="Clear search"
                  title="Clear"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Instant Live Search Suggestions Dropdown */}
            {isSuggestionsOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white/98 backdrop-blur-2xl rounded-2xl p-2.5 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Books</span>
                      <span>{suggestions.length} found</span>
                    </div>

                    {suggestions.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectBook(book.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/70 text-left transition-colors group cursor-pointer"
                      >
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-8 h-11 object-cover rounded-md shadow-xs bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-[#1E90FF] truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            by {book.author} · <span className="font-semibold text-slate-700">{formatPrice(book.price)}</span>
                          </p>
                        </div>
                      </button>
                    ))}

                    <div className="border-t border-slate-100 mt-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-[#1E90FF] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <span>View all catalog results for &ldquo;{searchQuery}&rdquo;</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : !isSearching ? (
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-slate-500 font-medium">No direct book matches found</p>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="mt-1 text-xs text-[#1E90FF] font-bold hover:underline cursor-pointer"
                    >
                      Search catalog for &ldquo;{searchQuery}&rdquo; &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-slate-400 font-medium">
                    Searching catalog...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. RIGHT SECTION: CART + USER ACCOUNT / SIGN IN           */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            {/* Cart Icon with Notification Badge */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/80 border border-slate-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/30 cursor-pointer"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1E90FF] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-md shadow-[#1E90FF]/30 animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth: Authenticated Profile Menu OR Clean Sign In Pill */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/30"
                  aria-expanded={isUserMenuOpen}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullname}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#1E90FF]/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E90FF] flex items-center justify-center text-xs font-bold ring-2 ring-[#1E90FF]/20">
                      {user.fullname?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[90px] truncate">
                    {user.fullname?.split(' ')[0]}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                      Admin
                    </span>
                  )}
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white/98 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-bold text-slate-900 text-sm truncate">{user.fullname}</p>
                        {isAdmin ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            Reader
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1 mt-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1E90FF] rounded-xl transition-colors"
                      >
                        <FiUser className="w-4 h-4 text-slate-400" />
                        <span>My Library &amp; Orders</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                        >
                          <FiShield className="w-4 h-4 text-amber-600" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <FiLogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In Button */
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-[#1E90FF] hover:bg-[#1C86EE] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <FiUser className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/80 rounded-full md:hidden transition-colors border border-slate-200/80 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. MOBILE NAVIGATION DRAWER (FOR MOBILE SCREENS)          */}
        {/* ========================================================= */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-white/98 backdrop-blur-2xl border-t border-slate-200/80 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative" ref={mobileSearchRef}>
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E90FF] p-0.5 cursor-pointer"
                >
                  <FiSearch className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleQueryChange}
                  placeholder="Search books, authors, categories..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Clear search"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-800">
                <Link
                  to="/library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors flex items-center justify-between"
                >
                  <span>eBooks Catalog</span>
                  <FiArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                
                <Link
                  to="/library?bestseller=true"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center justify-between"
                >
                  <span>Top Bestsellers</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">★ Popular</span>
                </Link>

                <div className="px-3.5 pt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Browse by Category
                </div>
                {categories.length === 0 ? (
                  <div className="px-3.5 py-1 text-xs text-slate-400">Loading categories...</div>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/library?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3.5 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-slate-600 hover:text-[#1E90FF] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E90FF] flex items-center justify-center flex-shrink-0">
                        <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </Link>
                  ))
                )}

                <div className="border-t border-slate-100 pt-2 my-1" />
                
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors"
                >
                  Contact &amp; Support
                </Link>

                {user ? (
                  <>
                    <div className="border-t border-slate-100 pt-2 my-1" />
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-slate-400" />
                        <span>My Profile &amp; Library</span>
                      </div>
                      {isAdmin && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Admin
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-3.5 py-2.5 rounded-xl hover:bg-amber-50 text-amber-700 font-semibold transition-colors flex items-center gap-2"
                      >
                        <FiShield className="w-4 h-4 text-amber-500" />
                        <span>Admin Portal</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors flex items-center gap-2 cursor-pointer text-left font-medium"
                    >
                      <FiLogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-[#1E90FF] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <FiUser className="w-4 h-4" />
                        <span>Sign In to Account</span>
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
