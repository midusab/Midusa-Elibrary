import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import CategoryIcon from '../components/ui/CategoryIcon';
import Breadcrumb from '../components/common/Breadcrumb';
import { getBooks, recordBookClick } from '../services/api';
import { formatPrice } from '../utils/currency';
import { PRICE_RANGES, SORT_OPTIONS } from '../constants/categories';
import { useCategories } from '../context/CategoryContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { BookCardSkeleton } from '../components/ui/LoadingSkeleton';
import BookCard from '../components/books/BookCard';

// Number of books displayed per page (12 guarantees even rows in 2, 3, 4, and 6 column layouts)
const ITEMS_PER_PAGE = 12;

export default function Library() {
  const [allBooks, setAllBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { categories } = useCategories();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();

  // Category horizontal scroll ref and state
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Derive filters and page directly from URL searchParams
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedAuthor = searchParams.get('author') || '';
  const sortBy = searchParams.get('sortBy') || 'featured';
  const urlSearch = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  // Sync searchQuery when URL search param changes
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchQuery(urlSearch);
  }

  // Load books from API
  useEffect(() => {
    let isMounted = true;
    async function loadBooks() {
      setIsLoading(true);
      try {
        const res = await getBooks({ limit: 200 });
        if (isMounted) {
          setAllBooks(Array.isArray(res?.books) ? res.books : []);
        }
      } catch (err) {
        console.error('Error loading library books:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check category track scrollability for navigation arrows
  const checkScrollability = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [categories, allBooks]);

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;
    const distance = 260;
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
    setTimeout(checkScrollability, 300);
  };

  // Filter & sort list
  const filteredBooks = useMemo(() => {
    let list = Array.isArray(allBooks) ? [...allBooks] : [];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q)
      );
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
      if (range) {
        list = list.filter((b) => b.price >= range.min && b.price <= range.max);
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(
        (b) => b.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Author filter
    if (selectedAuthor.trim()) {
      const a = selectedAuthor.toLowerCase().trim();
      list = list.filter((b) => b.author?.toLowerCase().trim() === a);
    }

    // Bestseller filter
    if (searchParams.get('bestseller') === 'true') {
      list = list.filter((b) => Boolean(b.bestseller));
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
        break;
      default:
        // 'featured'
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }, [allBooks, searchQuery, selectedCategory, selectedAuthor, selectedPriceRange, sortBy, searchParams]);

  // Pagination calculation
  const totalItems = filteredBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedBooks = useMemo(() => {
    return filteredBooks.slice(startIndex, endIndex);
  }, [filteredBooks, startIndex, endIndex]);

  // Page change handler with smooth scrolling to catalog top
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === validCurrentPage) return;
    const next = new URLSearchParams(searchParams);
    if (newPage === 1) {
      next.delete('page');
    } else {
      next.set('page', newPage);
    }
    setSearchParams(next);

    const catalogEl = document.getElementById('catalog-top');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers with ellipsis (e.g. 1 2 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, validCurrentPage - 1);
      let end = Math.min(totalPages - 1, validCurrentPage + 1);

      if (validCurrentPage <= 3) {
        start = 2;
        end = 4;
      } else if (validCurrentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Filter change handlers (all reset page to 1)
  const handleCategoryChange = (catName) => {
    const next = new URLSearchParams(searchParams);
    if (catName === 'all') {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handleSortChange = (newSort) => {
    const next = new URLSearchParams(searchParams);
    if (newSort === 'featured') {
      next.delete('sortBy');
    } else {
      next.set('sortBy', newSort);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handlePriceRangeChange = (newRange) => {
    setSelectedPriceRange(newRange);
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPriceRange('all');
    setSearchParams({});
  };

  const [addedIds, setAddedIds] = useState({});

  const handleAddToCart = (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
    setAddedIds((prev) => ({ ...prev, [book.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [book.id]: false }));
    }, 1800);
  };

  return (
    <div className="min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Anchor for smooth scroll on page change */}
        <div id="catalog-top" className="scroll-mt-6" />

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb
            items={[
              { label: 'Library', to: selectedCategory !== 'all' ? '/library' : undefined },
              ...(selectedCategory !== 'all' ? [{ label: selectedCategory }] : []),
            ]}
            className="mb-1.5"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Library Catalog
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {totalItems} titles available in Kenyan Shillings (KES) • Instant PDF download
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar — Liquid Glass */}
        <div className="liquid-glass specular-sheen p-3 sm:p-4 rounded-2xl shadow-sm mb-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const next = new URLSearchParams(searchParams);
                if (e.target.value.trim()) {
                  next.set('search', e.target.value);
                } else {
                  next.delete('search');
                }
                next.delete('page');
                setSearchParams(next);
              }}
              placeholder="Search by book title, author, or keyword..."
              className="w-full pl-10 pr-9 py-2 bg-white/70 hover:bg-white/90 focus:bg-white border border-white/70 rounded-xl text-sm text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  const next = new URLSearchParams(searchParams);
                  next.delete('search');
                  next.delete('page');
                  setSearchParams(next);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black cursor-pointer"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Price Range & Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Price filter dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Price:</span>
              <select
                value={selectedPriceRange}
                onChange={(e) => handlePriceRangeChange(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-2 bg-white/70 hover:bg-white/90 border border-white/70 rounded-xl text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] cursor-pointer font-medium backdrop-blur-md"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-2 bg-white/70 hover:bg-white/90 border border-white/70 rounded-xl text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] cursor-pointer font-medium backdrop-blur-md"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── HORIZONTAL SCROLL OF THE CATALOGUES (CATEGORIES) ── */}
        <div className="relative mb-6">
          {/* Desktop Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollCategories('left')}
              className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-black hover:bg-slate-50 transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Left/Right subtle edge gradient fade on mobile */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-50/80 to-transparent z-[1] sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-50/80 to-transparent z-[1] sm:hidden" />

          {/* Horizontal scroll track */}
          <div
            ref={categoryScrollRef}
            onScroll={checkScrollability}
            className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 scrollbar-none scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* All Books Pill */}
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-black text-white shadow-sm'
                  : 'liquid-glass-pill hover:bg-white text-slate-700 border border-white/80'
              }`}
            >
              <span>All Titles</span>
            </button>

            {/* Dynamic Category Pills */}
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#1E90FF] text-white shadow-md shadow-[#1E90FF]/25 font-bold border border-[#1E90FF]'
                      : 'liquid-glass-pill hover:bg-white text-slate-700 border border-white/80'
                  }`}
                >
                  <CategoryIcon
                    slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-[#1E90FF]'}`}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scrollCategories('right')}
              className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl liquid-glass-pill border border-white/80 shadow-md items-center justify-center text-slate-700 hover:text-black hover:bg-white transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── BOOKS GRID (RESPONSIVE GRID MATCHING DISPLAYED CARDS) ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl p-8 bg-white shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mx-auto mb-3">
              <FiSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">No books found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No titles match your current search or filter combination.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div>
            {/* Responsive Grid matching Homepage Shelves: 2 cols on mobile, 3 on tablet, 4 on md, 5 on lg, 6 on xl */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {paginatedBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: (index % 12) * 0.025 }}
                  className="h-full"
                >
                  <BookCard book={book} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </div>

            {/* ── NUMBERED PAGINATION BAR ── */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page indicator info */}
                <p className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-bold text-black">{startIndex + 1}</span>–
                  <span className="font-bold text-black">{endIndex}</span> of{' '}
                  <span className="font-bold text-black">{totalItems}</span> books
                </p>

                {/* Numbered page controls */}
                <nav
                  className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2"
                  aria-label="Library pagination"
                >
                  {/* Prev button */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage - 1)}
                    disabled={validCurrentPage <= 1}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Page numbers */}
                  {getPageNumbers().map((pageItem, idx) => {
                    if (pageItem === '...') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1.5 text-slate-400 font-bold select-none text-xs sm:text-sm"
                        >
                          …
                        </span>
                      );
                    }

                    const isCurrent = pageItem === validCurrentPage;
                    return (
                      <button
                        key={`page-${pageItem}`}
                        onClick={() => handlePageChange(pageItem)}
                        className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? 'bg-black text-white shadow-sm border border-black'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        {pageItem}
                      </button>
                    );
                  })}

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage + 1)}
                    disabled={validCurrentPage >= totalPages}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
