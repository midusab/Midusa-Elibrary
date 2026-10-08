import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiStar, FiShoppingCart, FiX } from 'react-icons/fi';
import Card from '../components/ui/Card';
import CategoryIcon from '../components/ui/CategoryIcon';
import { getBooks, recordBookClick } from '../services/api';
import { formatPrice } from '../utils/currency';
import { PRICE_RANGES, SORT_OPTIONS } from '../constants/categories';
import { useCategories } from '../context/CategoryContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Library() {
  const [allBooks, setAllBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { categories } = useCategories();
  const { addToCart } = useCart();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filters directly from URL searchParams (no cascading useEffect renders)
  const selectedCategory = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sortBy') || 'featured';
  const urlSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  // Sync searchQuery when URL search param changes without effect
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchQuery(urlSearch);
  }

  // Load books from API / Seed
  useEffect(() => {
    let isMounted = true;
    async function loadBooks() {
      setIsLoading(true);
      try {
        const res = await getBooks();
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

  // Filter & sort
  const filteredBooks = useMemo(() => {
    let list = Array.isArray(allBooks) ? [...allBooks] : [];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
      if (range) {
        list = list.filter(b => b.price >= range.min && b.price <= range.max);
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
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
        list.sort((a, b) => b.rating - a.rating);
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
  }, [allBooks, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const handleCategoryChange = (catName) => {
    const next = new URLSearchParams(searchParams);
    if (catName === 'all') {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    setSearchParams(next);
  };

  const handleSortChange = (newSort) => {
    const next = new URLSearchParams(searchParams);
    if (newSort === 'featured') {
      next.delete('sortBy');
    } else {
      next.set('sortBy', newSort);
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPriceRange('all');
    setSearchParams({});
  };

  const handleAddToCart = (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
    success(`"${book.title}" added to cart`);
  };

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Library Catalog
          </h1>
         {/* <p className="text-sm text-slate-500 mt-1">
            Displaying {filteredBooks.length} titles in Kenyan Shillings (KSh) across the 4 core categories
          </p>*/}
        </div>

        {/* Liquid Glass Search & Controls Bar */}
        <div className="liquid-glass p-3.5 sm:p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or keyword..."
              className="w-full pl-10 pr-9 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Price Filter & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {/* Price filter dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-600 hidden sm:inline">Price:</span>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="px-3 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-sm font-medium"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-600 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-sm font-medium"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'liquid-glass-pill text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Books ({allBooks.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'liquid-glass-pill text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading library catalog...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl p-8 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-3">
              <FiSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No books found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, price range, or category filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  to={`/book/${book.id}`}
                  onClick={() => recordBookClick(book.id)}
                  className="group block h-full"
                >
                  <Card className="h-full flex flex-col justify-between overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow transition-all duration-200">
                    <div>
                      {/* Book Cover */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {book.bestseller && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow">
                            Top
                          </span>
                        )}
                        <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded">
                          {book.category}
                        </span>
                      </div>

                      {/* Content: 18px Title, 14px Author, 16px Price */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-3 truncate">{book.author}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-slate-900">
                            {formatPrice(book.price)}
                          </span>
                          <div className="flex items-center text-amber-500 text-sm font-semibold">
                            <FiStar className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{book.rating || 4.8}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar: 14px Button */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={(e) => handleAddToCart(e, book)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary-50 text-slate-700 hover:text-primary text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
