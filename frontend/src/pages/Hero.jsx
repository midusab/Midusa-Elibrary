import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiDownloadCloud,
  FiStar,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CategoryIcon from '../components/ui/CategoryIcon';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCategories } from '../context/CategoryContext';
import FAQSection from '../components/layout/FAQSection';
import HeroImg from '../assets/hero13.jpg';
export default function Hero() {
  const { categories } = useCategories();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [featuredRes, bestsellersRes, recentRes] = await Promise.all([
          getBooks({ featured: true, limit: 3 }),
          getBooks({ bestseller: true, limit: 4 }),
          getBooks({ limit: 4 })
        ]);
        if (isMounted) {
          setFeaturedBooks(Array.isArray(featuredRes?.books) ? featuredRes.books.slice(0, 3) : []);
          setBestsellers(Array.isArray(bestsellersRes?.books) ? bestsellersRes.books.slice(0, 4) : []);
          setRecentBooks(Array.isArray(recentRes?.books) ? recentRes.books.slice(0, 4) : []);
        }
      } catch (err) {
        console.error('Error loading hero books:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reliable fallback books for instant showcase
  const fallbackRecentBooks = [
    {
      id: 'recent-1',
      title: 'Atomic Habits',
      author: 'James Clear',
      price: 450,
      originalPrice: 650,
      discountPercent: 31,
      rating: 4.9,
      category: 'Self Development',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      description: 'An easy & proven way to build good habits and break bad ones.'
    },
    {
      id: 'recent-2',
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      price: 500,
      originalPrice: 750,
      discountPercent: 33,
      rating: 4.8,
      category: 'Finance & Business',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80',
      description: 'Timeless lessons on wealth, greed, and happiness.'
    }
  ];

  const bookOne = recentBooks[0] || fallbackRecentBooks[0];
  const bookTwo = recentBooks[1] || fallbackRecentBooks[1];

  return (
    <div className="bg-white min-h-screen text-slate-900 relative">
      <style>{`
        @keyframes heroFloatBack {
          0%, 100% {
            transform: translateY(0px) rotate(-3deg);
          }
          50% {
            transform: translateY(-10px) rotate(-2deg);
          }
        }
        @keyframes heroFloatFront {
          0%, 100% {
            transform: translateY(0px) rotate(2deg);
          }
          50% {
            transform: translateY(12px) rotate(3deg);
          }
        }
        .hero-floating-card-1 {
          animation: heroFloatBack 6.5s ease-in-out infinite;
        }
        .hero-floating-card-2 {
          animation: heroFloatFront 7s ease-in-out infinite 0.9s;
        }
        .hero-floating-card-1:hover,
        .hero-floating-card-2:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Left: Headline & Buttons, Right: 2 Overlapping Cards)    */}
      {/* ========================================================================= */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24
       bg-[url('./assets/hero15.png')] bg-cover bg-center bg-fixed
      border-b border-slate-800/40 overflow-hidden"
      >
        {/* Dark Overlay for rich contrast & readability */}
        <div className="absolute inset-0 bg-slate-950/65 pointer-events-none z-0" />

        {/* Ambient Subtle Glow Behind Cards */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* ── Left Column: Headline, Subtitle, CTAs & Value Props ───────── */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] mb-6 max-w-2xl"
              >
                Purchase, Read {' '}
                <span className="text-primary block sm:inline mt-1 sm:mt-0">
                  ... Learn,  Apply & Grow
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-200 mb-8 max-w-xl leading-relaxed"
              >
                Focused exclusively on topics that makes you a better version of yourself
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10"
              >
                <Link to="/library" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-7 py-3 text-base font-semibold bg-primary hover:bg-primary-600 text-white rounded-md flex items-center justify-center gap-2"
                  >
                    <span>Explore Full Library</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/categories" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-7 py-3 text-base font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-md rounded-md"
                  >
                    Browse Categories
                  </Button>
                </Link>
              </motion.div>

              {/* Quick Trust Highlights directly under buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="pt-6 border-t border-white/15 w-full grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/10 text-sky-400 border border-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <FiDownloadCloud className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">Instant Access</p>
                    <p className="text-[11px] text-slate-300">Read on any device</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/10 text-emerald-400 border border-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">M-PESA Ready</p>
                    <p className="text-[11px] text-slate-300">Automated delivery</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <div className="w-8 h-8 rounded-md bg-white/10 text-amber-400 border border-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <FiBookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">Strict Niches</p>
                    <p className="text-[11px] text-slate-300">Curated value</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Right Column: Two Overlapping Floating Cards of Recent Books ── */}
            <div className="lg:col-span-5 relative flex items-center justify-center py-6 sm:py-8 lg:py-0">
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] h-[460px] sm:h-[500px]">
                
                {/* Back / Upper Card (Card 1) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="absolute top-0 right-1 sm:right-4 w-[250px] sm:w-[280px] z-10 hero-floating-card-1"
                >
                  <Link
                    to={`/book/${bookOne.id}`}
                    className="block p-3.5 bg-white border border-slate-200/90 rounded-lg hover:border-primary/80 transition-all duration-200 group"
                  >
                    {/* Header badge */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary-50 px-2 py-0.5 rounded">
                        Recent Release
                      </span>
                      <div className="flex items-center text-amber-500 text-xs font-semibold">
                        <FiStar className="w-3 h-3 fill-current mr-1" />
                        <span>{bookOne.rating || 4.9}</span>
                      </div>
                    </div>

                    {/* Book Cover Image */}
                    <div className="relative aspect-[3/4] max-h-56 overflow-hidden rounded bg-slate-100 mb-3 border border-slate-100">
                      <img
                        src={bookOne.coverImage}
                        alt={bookOne.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        {bookOne.category}
                      </span>
                    </div>

                    {/* Book Details */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {bookOne.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mb-2">
                        {bookOne.author}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatPrice(bookOne.price)}
                          </span>
                          {bookOne.discountPercent > 0 && bookOne.originalPrice > bookOne.price && (
                            <>
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatPrice(bookOne.originalPrice)}
                              </span>
                              <span className="text-[10px] font-bold text-[#F40009] bg-red-50 px-1 py-0.2 rounded border border-red-200">
                                {bookOne.discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-1">
                          View details <FiArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                {/* Front / Lower Card (Card 2) - Overlapping Card 1 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="absolute top-28 sm:top-32 left-0 sm:left-2 w-[260px] sm:w-[290px] z-20 hero-floating-card-2"
                >
                  <Link
                    to={`/book/${bookTwo.id}`}
                    className="block p-4 bg-white/95 backdrop-blur-md border border-slate-300 rounded-lg hover:border-primary transition-all duration-200 group"
                  >
                    {/* Header badge */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Latest Addition
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Ready to Read
                      </span>
                    </div>

                    {/* Book Cover Image */}
                    <div className="relative aspect-[3/4] max-h-56 overflow-hidden rounded bg-slate-100 mb-3 border border-slate-100">
                      <img
                        src={bookTwo.coverImage}
                        alt={bookTwo.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        {bookTwo.category}
                      </span>
                    </div>

                    {/* Book Details */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {bookTwo.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mb-2">
                        {bookTwo.author}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            {formatPrice(bookTwo.price)}
                          </span>
                          {bookTwo.discountPercent > 0 && bookTwo.originalPrice > bookTwo.price && (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(bookTwo.originalPrice)}
                              </span>
                              <span className="text-[10px] font-bold text-[#F40009] bg-red-50 px-1 py-0.2 rounded border border-red-200">
                                {bookTwo.discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>

                        <div className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold flex items-center gap-1 group-hover:bg-primary-600 transition-colors">
                          <span>Get Book</span>
                          <FiArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURED PICKS SECTION                                                 */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-3">
            <div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Handpicked</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                Featured Books
              </h2>
            </div>
            <Link
              to="/library?sortBy=featured"
              className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
            >
              See all in library <FiArrowRight className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-lg border border-slate-100 p-5 bg-white animate-pulse">
                  <div className="aspect-[16/10] bg-slate-100 rounded mb-4" />
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-slate-50 rounded mb-4" />
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <div className="h-5 bg-slate-100 rounded w-20" />
                    <div className="h-8 bg-slate-100 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg bg-white">
              <p className="text-sm font-semibold text-slate-700">No featured books currently listed</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or explore our full catalog</p>
              <Link to="/library" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Browse Library <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-lg transition-all">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200/60">
                        {book.category}
                      </span>
                      {book.discountPercent > 0 && (
                        <span className="absolute top-2.5 right-2.5 bg-[#F40009] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                          {book.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-2 truncate">{book.author}</p>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-slate-900">{formatPrice(book.price)}</span>
                            {book.discountPercent > 0 && book.originalPrice > book.price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(book.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-amber-500 text-sm mt-0.5 font-semibold">
                            <FiStar className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{book.rating || 4.8}</span>
                          </div>
                        </div>

                        <Link to={`/book/${book.id}`}>
                          <Button size="sm" variant="outline" className="text-sm font-semibold px-4 py-2 rounded-md">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BEST SELLERS SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-3">
            <div>
              <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Top Rated</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                Popular & Best Sellers
              </h2>
            </div>
            <Link
              to="/library?sortBy=popular"
              className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
            >
              View catalog <FiArrowRight className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-lg border border-slate-100 p-4 bg-white animate-pulse">
                  <div className="aspect-[3/4] bg-slate-100 rounded mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : bestsellers.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg bg-white">
              <p className="text-sm font-semibold text-slate-700">No bestseller books currently listed</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or explore our complete catalog</p>
              <Link to="/library" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Browse Library <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col justify-between overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-lg transition-all">
                    <div>
                      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                          Bestseller
                        </span>
                      </div>

                      <div className="p-4">
                        <span className="text-xs font-semibold text-primary block mb-1 truncate">
                          {book.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-3 truncate">{book.author}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-slate-900">{formatPrice(book.price)}</span>
                            {book.discountPercent > 0 && book.originalPrice > book.price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(book.originalPrice)}
                              </span>
                            )}
                          </div>
                          {book.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-[#F40009] bg-red-50 px-1 py-0.2 rounded border border-red-200">
                              {book.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link to={`/book/${book.id}`}>
                        <Button size="sm" variant="outline" className="w-full text-sm font-semibold py-2 rounded-md">
                          View Book
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CATEGORIES SECTION (Strictly vector icons, zero emojis)                */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Explore By Topic</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Categories
            </h2>
            <p className="text-base text-slate-600 mt-2">
              Choose your focus area and find deep, actionable knowledge.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg bg-white max-w-md mx-auto">
              <p className="text-sm font-semibold text-slate-700">No categories added yet</p>
              <p className="text-xs text-slate-400 mt-1">Categories created in the admin dashboard will appear here in real time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/library?category=${encodeURIComponent(cat.name)}`}
                  className="group p-5 rounded-lg bg-white border border-slate-200/80 hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-md bg-primary-50 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1.5 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      {cat.description || (cat._count?.books !== undefined ? `${cat._count.books} ${cat._count.books === 1 ? 'title available' : 'titles available'}` : 'Explore curated knowledge')}
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-semibold text-primary">
                    <span>Browse books</span>
                    <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section: Homepage Only */}
      <FAQSection />
    </div>
  );
}