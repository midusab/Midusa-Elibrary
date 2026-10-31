import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShoppingCart,
  Star,
  Check,
  Flame
} from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { resolveCoverUrl, DEFAULT_BOOK_COVER } from '../../utils/imageUrl';
import { HeroCarouselSkeleton } from '../ui/LoadingSkeleton';

export default function HeroCarousel({ books = [], loading = false, onAddToCart }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedIds, setAddedIds] = useState({});

  // Take the first 5 recent books for the Netflix carousel
  const carouselBooks = books.slice(0, 5);

  const nextSlide = useCallback(() => {
    if (carouselBooks.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % carouselBooks.length);
  }, [carouselBooks.length]);

  const prevSlide = useCallback(() => {
    if (carouselBooks.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + carouselBooks.length) % carouselBooks.length);
  }, [carouselBooks.length]);

  // Auto-advance to the next book every 5 seconds
  useEffect(() => {
    if (carouselBooks.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselBooks.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, carouselBooks.length]);

  const handleQuickAdd = (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(book);
    setAddedIds((prev) => ({ ...prev, [book.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [book.id]: false }));
    }, 1800);
  };

  if (loading) {
    return <HeroCarouselSkeleton />;
  }

  if (carouselBooks.length === 0) {
    return null;
  }

  const currentBook = carouselBooks[currentIndex] || carouselBooks[0];

  return (
    <div className="relative bg-black text-white overflow-hidden border-b border-black select-none">
      {/* Full-Bleed Animated Book Cover Background with Smooth Cross-Fade */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {carouselBooks.map((b, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={b.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Full-bleed book cover image — first slide is LCP, load eagerly */}
              <img
                src={resolveCoverUrl(b.coverImage)}
                alt=""
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`w-full h-full object-cover object-center md:object-right transition-transform duration-7000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Directional gradient overlay: Rich black on the left for text contrast, fading across to reveal the book cover */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 md:via-black/70 to-black/25" />
              {/* Top and bottom subtle vignettes for clean section separation */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
            </div>
          );
        })}
      </div>

      {/* Ambient Brand Accent Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1E90FF]/20 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="absolute -bottom-32 right-10 w-96 h-96 bg-[#F40009]/15 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* Main Slide Presentation Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 min-h-[400px] sm:min-h-[480px] flex items-center relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Auto-Animated Typography & Calls to Action */}
          <div className="md:col-span-7 flex flex-col items-start text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBook.id}
                initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 w-full"
              >
                {/* Top Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F40009] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>NEW ARRIVAL</span>
                  </span>
                  <span className="text-[11px] font-bold text-white/70">
                    Book {currentIndex + 1} of {carouselBooks.length}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white line-clamp-2 leading-tight drop-shadow-md">
                  {currentBook.title}
                </h1>

                {/* Author */}
                <p className="text-xs sm:text-sm text-slate-300 font-semibold">
                  Authored by <span className="text-white font-bold">{currentBook.author}</span>
                </p>

                {/* Synopsis */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 max-w-xl leading-relaxed">
                  {currentBook.description ||
                    'Experience this groundbreaking edition. Curated for readers pursuing rapid growth, deep mental models, and actionable personal breakthroughs.'}
                </p>

                {/* Price & Rating */}
                <div className="flex items-center gap-4 flex-wrap pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {formatPrice(currentBook.price)}
                    </span>
                    {currentBook.originalPrice > currentBook.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(currentBook.originalPrice)}
                      </span>
                    )}
                  </div>

                  {currentBook.discountPercent > 0 && (
                    <span className="px-2.5 py-0.5 rounded-xl bg-[#F40009] text-white text-[11px] font-black">
                      -{currentBook.discountPercent}% OFF
                    </span>
                  )}

                  {/* Star Rating */}
                  <div className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white">{currentBook.rating || 4.9}</span>
                    <span className="text-slate-400">/ 5.0</span>
                  </div>
                </div>

                {/* Action Buttons: Unified rounded-xl and only allowed colors */}
                <div
                  className="flex flex-wrap items-center gap-3 pt-2"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, currentBook)}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95 ${
                      addedIds[currentBook.id]
                        ? 'bg-[#E05252] hover:bg-[#D44242] text-white border border-[#E05252]'
                        : 'bg-[#F40009] hover:bg-[#CC0007] text-white border border-[#F40009]'
                    }`}
                  >
                    {addedIds[currentBook.id] ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart ({formatPrice(currentBook.price)})</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/book/${currentBook.id}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-black text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <BookOpen className="w-4 h-4 text-black" />
                    <span>Explore Book</span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Auto-Animated 3D Cover Artwork Fading Into Atmosphere */}
          <div className="md:col-span-5 hidden sm:flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBook.id}
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <Link
                  to={`/book/${currentBook.id}`}
                  className="relative group block cursor-pointer transition-transform duration-500 hover:scale-105"
                >
                  {/* Soft Ambient Radial Behind-Image Blend */}
                  <div
                    className="absolute -inset-8 rounded-full blur-3xl opacity-60 group-hover:opacity-85 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(30,144,255,0.45) 0%, rgba(244,0,9,0.2) 50%, transparent 75%)'
                    }}
                  />

                  {/* Book artwork seamlessly fading at edges into the background (No card frame/border) */}
                  <div className="relative flex items-center justify-center">
                    <img
                      src={resolveCoverUrl(currentBook.coverImage)}
                      alt={currentBook.title}
                      loading="lazy"
                      decoding="async"
                      className="w-56 sm:w-64 md:w-72 aspect-[3/4] object-cover rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]"
                    />

                    {/* Soft ambient bottom & edge fade blending with the full carousel atmosphere */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Netflix Edge Arrows */}
      {carouselBooks.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-14 sm:h-20 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer hover:border-[#1E90FF]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-14 sm:h-20 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer hover:border-[#1E90FF]"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Netflix-style Segmented Animated Progress Indicator Bars */}
      {carouselBooks.length > 1 && (
        <div className="absolute bottom-5 right-6 sm:right-12 z-30 flex items-center gap-2">
          {carouselBooks.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="h-1 rounded-xl cursor-pointer overflow-hidden bg-white/25 transition-all duration-300"
              style={{ width: idx === currentIndex ? 44 : 14 }}
            >
              {idx === currentIndex ? (
                <motion.div
                  key={`progress-${currentIndex}-${isPaused}`}
                  initial={{ width: '0%' }}
                  animate={{ width: isPaused ? '0%' : '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-[#1E90FF]"
                />
              ) : (
                <div
                  className={`h-full bg-[#1E90FF] ${
                    idx < currentIndex ? 'w-full opacity-60' : 'w-0'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
