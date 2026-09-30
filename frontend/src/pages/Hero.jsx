import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiDownloadCloud, FiStar, FiArrowRight, FiShield } from 'react-icons/fi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CategoryIcon from '../components/ui/CategoryIcon';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import { CATEGORIES } from '../constants/categories';
import Heroimg from '../assets/hero4.jpg'
export default function Hero() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [featuredRes, bestsellersRes] = await Promise.all([
          getBooks({ featured: true, limit: 3 }),
          getBooks({ bestseller: true, limit: 4 })
        ]);
        if (isMounted) {
          setFeaturedBooks(Array.isArray(featuredRes?.books) ? featuredRes.books.slice(0, 3) : []);
          setBestsellers(Array.isArray(bestsellersRes?.books) ? bestsellersRes.books.slice(0, 4) : []);
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

  return (
    <div className="bg-white min-h-screen text-slate-900 relative">
      {/* Subtle Ambient Liquid Light Glow Behind Header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-transparent pointer-events-none -z-10 rounded-full blur-3xl opacity-70" />

      {/* Hero Header Section */}
      <section
        className="relative min-h-[92vh] sm:min-h-screen flex items-center justify-center pt-20 pb-14 sm:py-24 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url(${Heroimg})`,
        }}
      >
        {/* Dark Vignette / Gradient Overlay for High-Contrast Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/65 to-slate-950/85 pointer-events-none" />

        {/* Ambient Subtle Blue Glow Behind Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-80  pointer-events-none rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Frosted Category Pills Header
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex flex-wrap items-center justify-center gap-2 mb-6"
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/library?category=${encodeURIComponent(cat.name)}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/20 backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5"
              >
                <CategoryIcon slug={cat.slug} className="w-3.5 h-3.5 text-sky-400" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </motion.div> */}

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-5 sm:mb-6 max-w-4xl mx-auto drop-shadow-md"
          >
            Curated eBooks to <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Elevate Your Mind</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-sm"
          >
            Focused exclusively on Self Development, Psychology, Finance & Business, and Christianity. Instant digital delivery with Mpesa checkout.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto"
          >
            <Link to="/library" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-7 py-3 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50">
                Explore Full Library
              </Button>
            </Link>
            <Link to="/categories" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-7 py-3 text-base font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-md">
                Browse Categories
              </Button>
            </Link>
          </motion.div>

          {/* Value Highlights in Dark Frosted Glass Cards */}
          <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <FiDownloadCloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instant PDF Download</p>
                <p className="text-[11px] text-slate-300">Read on any device</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FiBookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Core Niches</p>
                <p className="text-[11px] text-slate-300">Strictly curated</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <FiStar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Trusted Platform</p>
                <p className="text-[11px] text-slate-300">M-PESA ready</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <FiShield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Google - Fast Auth</p>
                <p className="text-[11px] text-slate-300">Fast & verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Picks Section */}
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
                <div key={n} className="rounded-2xl border border-slate-100 p-5 bg-white animate-pulse">
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl mb-4" />
                  <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-3" />
                  <div className="h-8 bg-slate-50 rounded-lg mb-4" />
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <div className="h-5 bg-slate-100 rounded w-20" />
                    <div className="h-8 bg-slate-100 rounded-xl w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
              <p className="text-sm font-semibold text-slate-700">No featured books currently listed</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or explore our full catalog</p>
              <Link to="/library" className="mt-3 inline-block text-xs font-semibold text-primary">
                Browse Library →
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
                  <Card className="h-full flex flex-col overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow transition-all">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md shadow-sm">
                        {book.category}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* 18px Title */}
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">
                          {book.title}
                        </h3>
                        {/* 14px Author */}
                        <p className="text-sm text-slate-500 mb-2 truncate">{book.author}</p>
                        {/* 14px Description */}
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          {/* 16px Price */}
                          <span className="text-base font-bold text-slate-900">{formatPrice(book.price)}</span>
                          <div className="flex items-center text-amber-500 text-sm mt-0.5 font-semibold">
                            <FiStar className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{book.rating || 4.8}</span>
                          </div>
                        </div>

                        <Link to={`/book/${book.id}`}>
                          {/* 14px Button */}
                          <Button size="sm" variant="outline" className="text-sm font-semibold px-4 py-2">
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

      {/* Best Sellers Section */}
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
                <div key={n} className="rounded-2xl border border-slate-100 p-4 bg-white animate-pulse">
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-slate-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : bestsellers.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
              <p className="text-sm font-semibold text-slate-700">No bestseller books currently listed</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or explore our complete catalog</p>
              <Link to="/library" className="mt-3 inline-block text-xs font-semibold text-primary">
                Browse Library →
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
                  <Card className="h-full flex flex-col justify-between overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow transition-all">
                    <div>
                      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow">
                          Bestseller
                        </span>
                      </div>

                      <div className="p-4">
                        <span className="text-xs font-semibold text-primary block mb-1 truncate">
                          {book.category}
                        </span>
                        {/* 18px Title */}
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">
                          {book.title}
                        </h3>
                        {/* 14px Author */}
                        <p className="text-sm text-slate-500 mb-3 truncate">{book.author}</p>

                        <div className="flex items-center justify-between">
                          {/* 16px Price */}
                          <span className="text-base font-bold text-slate-900">{formatPrice(book.price)}</span>
                          <div className="flex items-center text-amber-500 text-sm font-semibold">
                            <FiStar className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{book.rating || 4.8}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link to={`/book/${book.id}`}>
                        {/* 14px Button */}
                        <Button size="sm" variant="outline" className="w-full text-sm font-semibold py-2">
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

      {/* 4 Pillars Category Grid (No emojis, vector CategoryIcon) */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/library?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <CategoryIcon slug={cat.slug} className="w-6 h-6" />
                  </div>
                  {/* 18px Category Name */}
                  <h3 className="font-bold text-slate-900 text-lg mb-1.5 group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {/* 14px Category Description */}
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
                {/* 14px Link */}
                <div className="flex items-center text-sm font-semibold text-primary">
                  <span>Browse books</span>
                  <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}