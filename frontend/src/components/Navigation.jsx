import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiChevronDown, FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../context/CategoryContext';
import CategoryIcon from './ui/CategoryIcon';
import Logo from '../assets/logo.jpg';

export default function Navigation() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { cartCount } = useCart();
  const { categories } = useCategories();
  const { user, logout, isAdmin } = useAuth();
  const { success } = useToast();

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    success('You have been signed out successfully.');
    navigate('/');
  };

  // Close dropdowns on outside click or navigation
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus when route changes without triggering an extra cascading effect render
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
    setIsUserMenuOpen(false);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4 lg:gap-6">
          
          {/* Left Section: Logo + Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group rounded-xl py-1">
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1E90FF] via-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-md shadow-[#1E90FF]/25 border border-white/50 ring-2 ring-[#1E90FF]/15 group-hover:scale-105 transition-transform duration-200">
              <img className='rounded-xl w-full h-full object-cover' src={Logo}></img>
              </div>

              {/* Logo Text: hidden on very small screens, visible from xs+ */}
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight select-none">
                <span className="text-[#0F172A]">Midusa</span>
                <span className="text-[#1E90FF]">Elibrary</span>
              </span>
            </Link>

            {/* Desktop Navigation Links: Inter Medium 16px */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {/* Browse */}
              <Link
                to="/library"
                className={`px-3.5 py-2 rounded-full text-base font-medium transition-all duration-200 ${
                  isActive('/library')
                    ? 'text-[#1E90FF] bg-[#1E90FF]/10 font-semibold'
                    : 'text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/70'
                }`}
              >
                Browse
              </Link>

              {/* Categories with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-base font-medium transition-all duration-200 cursor-pointer ${
                    isCategoriesOpen || isActive('/categories')
                      ? 'text-[#1E90FF] bg-[#1E90FF]/10 font-semibold'
                      : 'text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/70'
                  }`}
                  aria-expanded={isCategoriesOpen}
                  aria-haspopup="true"
                >
                  <span>Categories</span>
                  <FiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCategoriesOpen ? 'rotate-180 text-[#1E90FF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Categories Dropdown Menu */}
                {isCategoriesOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl p-2.5 shadow-2xl border border-slate-200/80 ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Categories
                    </div>
                    <div className="space-y-1 mt-1">
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">No categories found</div>
                      ) : (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/library?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E90FF] flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 group-hover/item:bg-[#1E90FF] group-hover/item:text-white transition-all">
                              <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 group-hover/item:text-[#1E90FF] transition-colors">
                                {cat.name}
                              </p>
                              {cat._count?.books !== undefined && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">
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
                        className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#1E90FF] hover:bg-blue-50/80 rounded-xl transition-colors"
                      >
                        <span>Explore All Categories</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* About */}
              <Link
                to="/about"
                className={`px-3.5 py-2 rounded-full text-base font-medium transition-all duration-200 ${
                  isActive('/about')
                    ? 'text-[#1E90FF] bg-[#1E90FF]/10 font-semibold'
                    : 'text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/70'
                }`}
              >
                About
              </Link>

              {/* Contact */}
              <Link
                to="/contact"
                className={`px-3.5 py-2 rounded-full text-base font-medium transition-all duration-200 ${
                  isActive('/contact')
                    ? 'text-[#1E90FF] bg-[#1E90FF]/10 font-semibold'
                    : 'text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/70'
                }`}
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Center Section: Large Rounded Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-2 xl:mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, categories..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50/90 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 focus:border-[#1E90FF] rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1E90FF]/15 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label="Clear search"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Right Section: Cart + Premium Google Auth Button */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Cart Icon with Notification Badge */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/80 border border-slate-200/70 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/30 cursor-pointer"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1E90FF] text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-md shadow-[#1E90FF]/30 animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Quick Launch Pill (when admin) */}
            {user && isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-sm"
              >
                <FiShield className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* Auth: User Menu or Sign In Button */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/30"
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
                  <span className="text-sm font-semibold text-slate-800 hidden sm:inline max-w-[100px] truncate">
                    {user.fullname?.split(' ')[0]}
                  </span>
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl border border-slate-200/80 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                        <span>My Profile & Library</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 rounded-xl transition-colors font-semibold"
                        >
                          <FiShield className="w-4 h-4 text-amber-600" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                      <button
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
              /* Sign In Navigation Link */
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#1E90FF] hover:bg-[#1C86EE] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <FiUser className="w-4 h-4" />
                <span className="whitespace-nowrap">Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-[#1E90FF] hover:bg-slate-100/80 rounded-full md:hidden transition-colors border border-slate-200/70 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer — fixed below nav bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-white/98 backdrop-blur-2xl border-t border-slate-200/70 shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Search Bar in Mobile Menu */}
              <form onSubmit={handleSearch} className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors, categories..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-1 text-base font-medium text-slate-800">
                <Link
                  to="/library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors"
                >
                  Browse All Books
                </Link>

                <div className="px-3.5 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Categories
                </div>
                {categories.length === 0 ? (
                  <div className="px-3.5 py-2 text-xs text-slate-400">No categories found</div>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/library?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3.5 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-slate-600 hover:text-[#1E90FF] transition-colors text-base"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E90FF] flex items-center justify-center flex-shrink-0">
                        <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-4 h-4" />
                      </div>
                      <span>{cat.name}</span>
                    </Link>
                  ))
                )}

                <div className="border-t border-slate-100 pt-2 my-1" />
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-[#1E90FF] transition-colors"
                >
                  Contact
                </Link>
                {user && (
                  <>
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
                )}
              </div>

              {/* Mobile Auth Button */}
              {!user && (
                <div className="pt-2 border-t border-slate-100">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-[#1E90FF] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer">
                      <FiUser className="w-4 h-4" />
                      <span>Sign In to Account</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
