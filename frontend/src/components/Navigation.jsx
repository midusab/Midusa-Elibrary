import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  ArrowRight,
  FileText,
  Heart,
  BookOpen,
  Flame
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFlashSale } from '../context/FlashSaleContext';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import Logo from '../assets/logo.jpg';

export default function Navigation() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [cartAnimate, setCartAnimate] = useState(false);

  const userMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout, isAdmin, openAuthModal } = useAuth();
  const { success } = useToast();
  const { isLive: isFlashSaleLive, flashSale, countdown: flashCountdown } = useFlashSale();

  // Trigger subtle visual pulse on cart badge whenever cart count changes
  const prevCountRef = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setCartAnimate(true);
      const t = setTimeout(() => setCartAnimate(false), 800);
      return () => clearTimeout(t);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

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
    setIsUserMenuOpen(false);
    setIsSuggestionsOpen(false);
  }

  // Handle outside click to close popups
  useEffect(() => {
    function handleClickOutside(event) {
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

  // Live debounced search suggestions
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      {/* ── Optional Flash Sale Top Ticker ── */}
      {isFlashSaleLive && flashSale && (
        <div className="bg-red-600 text-white text-[11px] sm:text-xs font-bold py-1 px-4 text-center flex items-center justify-center gap-2 tracking-wide shadow-inner">
          <Flame className="w-3.5 h-3.5 fill-white animate-pulse" />
          <span>FLASH SALE: {flashSale.discountPercent}% OFF • Ends in {flashCountdown.hours}h {flashCountdown.minutes}m {flashCountdown.seconds}s</span>
          <Link to="/" className="underline hover:text-white/80 ml-1 font-semibold">View Deals →</Link>
        </div>
      )}

      {/* ── Top Main Navbar (80px height) ── */}
      <nav className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-3 md:gap-6">
          
          {/* 1. Left: Brand Logo */}
          <div className="flex items-center justify-start flex-shrink-0 sm:min-w-[180px] md:min-w-[210px]">
            <Link to="/" className="flex items-center gap-2.5 group py-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1E90FF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-[#1E90FF]/25 border border-white/60 ring-2 ring-[#1E90FF]/15 group-hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0">
                <img className="w-full h-full object-cover" src={Logo} alt="Midusa Elibrary" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight select-none">
                <span className="text-black">Midusa</span>
                <span className="text-[#1E90FF]">Elibrary</span>
              </span>
            </Link>
          </div>

          {/* 2. Center: Centered Navigation Items (Shop + Extended Search Bar) */}
          <div className="flex-1 flex items-center justify-center gap-3.5 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
            {/* Centered Shop Link */}
            <Link
              to="/library"
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex-shrink-0 ${
                isActive('/library')
                  ? 'text-white bg-[#1E90FF] shadow-xs shadow-[#1E90FF]/25'
                  : 'text-slate-700 hover:text-[#1E90FF] hover:bg-blue-50/70 border border-slate-200/80 bg-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Shop</span>
            </Link>

            {/* Extended Width Search Bar with 12px rounded-xl radius */}
            <div
              className="flex-1 w-full relative hidden sm:flex"
              ref={searchContainerRef}
            >
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <button
                type="submit"
                aria-label="Submit search"
                title="Search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E90FF] transition-colors p-1 rounded-xl cursor-pointer z-10"
              >
                <Search className="w-4 h-4" />
              </button>

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
                placeholder="Search thousands of books, authors, or genres..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-[#1E90FF] rounded-xl text-sm text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1E90FF]/15 transition-all shadow-xs"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black cursor-pointer p-1 rounded-xl z-10"
                  aria-label="Clear search"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Instant Live Search Suggestions Dropdown */}
            {isSuggestionsOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white backdrop-blur-2xl rounded-xl p-2.5 border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Titles</span>
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
                          className="w-9 h-12 object-cover rounded-xl shadow-xs bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-black group-hover:text-[#1E90FF] truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span>by {book.author}</span> · 
                            <span className="font-bold text-[#F40009]">{formatPrice(book.price)}</span>
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
                        <ArrowRight className="w-3.5 h-3.5" />
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
          </div>

          {/* 3. Right: Wishlist + Cart + User Profile / Sign In */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 sm:min-w-[180px] md:min-w-[210px]">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-[#F40009] hover:bg-red-50/70 border border-slate-200/80 transition-all focus:outline-none cursor-pointer"
              aria-label={`Wishlist with ${wishlistCount} items`}
              title="Your Wishlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'text-[#F40009] fill-[#F40009]/15' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F40009] text-white text-[10px] font-bold rounded-xl h-4.5 min-w-[18px] px-1 flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart with smooth visual counter badge update */}
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl text-slate-700 hover:text-[#1E90FF] hover:bg-blue-50/70 border border-slate-200/80 transition-all focus:outline-none cursor-pointer ${
                cartAnimate ? 'scale-110 border-[#1E90FF]' : ''
              }`}
              aria-label={`Shopping cart with ${cartCount} items`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 bg-[#1E90FF] text-white text-[10px] font-extrabold rounded-xl h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-md shadow-[#1E90FF]/30 transition-transform duration-300 ${
                    cartAnimate ? 'scale-125 bg-[#00A651]' : 'scale-100'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#1E90FF]/40 transition-all cursor-pointer focus:outline-none flex items-center justify-center"
                  aria-expanded={isUserMenuOpen}
                  title={user.fullname || user.email}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullname || 'User'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1E90FF]/30 shadow-xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E90FF] flex items-center justify-center text-xs font-black ring-2 ring-[#1E90FF]/25 shadow-xs">
                      {(user.fullname || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl p-2 border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-bold text-black text-sm truncate">{user.fullname}</p>
                        {isAdmin ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xl bg-black text-white uppercase tracking-wider">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-xl bg-blue-50 text-[#1E90FF]">
                            Reader
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1 mt-1">
                      <Link
                        to="/dashboard"
                        state={{ tab: 'library' }}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E90FF] rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Library</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        state={{ tab: 'orders' }}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E90FF] rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Orders &amp; Payments</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1E90FF] bg-blue-50/70 hover:bg-blue-100/70 rounded-xl transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#1E90FF]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F40009] hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-[#F40009]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 sm:hidden rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Dropdown ── */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder="Search books, authors, genres..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
            />
          </form>

          {/* Quick links */}
          <div className="space-y-1 text-sm font-semibold text-slate-800">
            <Link
              to="/library"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              <span>Shop</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              <span>Wishlist ({wishlistCount})</span>
              <Heart className="w-4 h-4 text-[#F40009]" />
            </Link>

            {!user && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E90FF] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
