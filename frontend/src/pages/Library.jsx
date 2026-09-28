import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { FiSearch, FiFilter, FiGrid, FiList, FiShoppingCart, FiStar } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BOOKS } from '../data/books';
import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '../constants/categories';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Set initial values from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) setSelectedCategory(categoryParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = [...BOOKS];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    // Price filter
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
      if (range) {
        filtered = filtered.filter(book => book.price >= range.min && book.price <= range.max);
      }
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
        break;
      default:
        // featured - keep original order
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const handleAddToCart = (book) => {
    addToCart(book);
    success(`${book.title} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Library
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {filteredBooks.length} books found
          </p>
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-8 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search books, authors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <FiFilter />
              Filters
            </button>

            {/* Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:flex flex-1 gap-4`}>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
                }`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
                }`}
              >
                <FiList />
              </button>
            </div>
          </div>
        </Card>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
              No books found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
              >
                {viewMode === 'grid' ? (
                  <Card className="overflow-hidden h-full">
                    <Link to={`/book/${book.id}`}>
                      <div className="relative">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-64 object-cover"
                        />
                        {book.bestseller && (
                          <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                            Bestseller
                          </div>
                        )}
                        {book.featured && (
                          <div className="absolute top-3 left-3 bg-secondary-1 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Featured
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-5">
                      <Link to={`/book/${book.id}`}>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{book.author}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-primary-10 dark:bg-primary-20 text-primary rounded-full">
                          {book.category}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          <FiStar className="w-4 h-4 fill-current" />
                          <span className="ml-1 text-sm">{book.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-lg">${book.price}</span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(book)}
                          className="flex items-center gap-2"
                        >
                          <FiShoppingCart />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 flex gap-4">
                    <Link to={`/book/${book.id}`} className="flex-shrink-0">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-24 h-36 object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/book/${book.id}`}>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1 hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{book.author}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-primary-10 dark:bg-primary-20 text-primary rounded-full">
                          {book.category}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          <FiStar className="w-4 h-4 fill-current" />
                          <span className="ml-1 text-sm">{book.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {book.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-lg">${book.price}</span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(book)}
                          className="flex items-center gap-2"
                        >
                          <FiShoppingCart />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
