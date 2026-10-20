import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

export default function HeroCarousel({ books = [], loading = false, onAddToCart }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedIds, setAddedIds] = useState({});
  const timerRef = useRef(null);

  // Take the first 5 recent books for the Netflix carousel
  const carouselBooks = books.slice(0, 5);

  const nextSlide = () => {
    if (carouselBooks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % carouselBooks.length);
  };

  const prevSlide = () => {
    if (carouselBooks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + carouselBooks.length) % carouselBooks.length);
  };

  useEffect(() => {
    if (isPaused || carouselBooks.length <= 1) return;
    timerRef.current = setInterval(nextSlide, 5500);
    return () => clearInterval(timerRef.current);
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

  if (loading || carouselBooks.length === 0) {
    return (
      <div className="relative bg-black min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 border-3 border-[#1E90FF] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-white text-xs font-bold uppercase tracking-wider">Loading new arrivals…</p>
        </div>
      </div>
    );
  }

  const currentBook = carouselBooks[currentIndex] || carouselBooks[0];

  return (
    <div
      className="relative bg-black text-white overflow-hidden border-b border-black select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Netflix Cinematic Backdrop with dark vignette & soft Dodgerblue / Red accents */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#1E90FF]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[450px] h-[450px] bg-[#F40009]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Slide Presentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 min-h-[400px] sm:min-h-[460px] flex items-center relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Netflix-style Typography & Calls to Action */}
          <div className="md:col-span-7 flex flex-col items-start text-left space-y-4">
            
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F40009] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>NEW ARRIVAL</span>
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-[#1E90FF] text-[11px] font-extrabold uppercase tracking-wide">
                {currentBook.category || 'eBook Release'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white line-clamp-2 leading-tight">
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

              {/* Dodgerblue Star Rating */}
              <div className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 px-2.5 py-1 rounded-xl">
                <Star className="w-3.5 h-3.5 fill-[#1E90FF] text-[#1E90FF]" />
                <span className="font-bold text-white">{currentBook.rating || 4.9}</span>
                <span className="text-slate-400">/ 5.0</span>
              </div>
            </div>

            {/* Action Buttons: Unified rounded-xl and only allowed colors */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleQuickAdd(e, currentBook)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md active:scale-95 ${
                  addedIds[currentBook.id]
                    ? 'bg-[#00A651] text-white border border-[#00A651]'
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-black text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-black" />
                <span>Explore Book</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Floating Book Showcase with Glass Reflection */}
          <div className="md:col-span-5 flex items-center justify-center relative">
            <Link
              to={`/book/${currentBook.id}`}
              className="relative group block cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              {/* Blue Glow Halo */}
              <div className="absolute inset-0 bg-[#1E90FF]/30 rounded-xl blur-2xl transform group-hover:scale-110 transition-transform duration-500" />

              {/* Glass Frame */}
              <div className="relative p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <img
                  src={
                    currentBook.coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={currentBook.title}
                  className="w-48 sm:w-56 md:w-64 aspect-[3/4] object-cover rounded-xl shadow-2xl"
                />

                {/* Floating Bottom Card */}
                <div className="absolute bottom-5 left-5 right-5 p-3 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{currentBook.title}</p>
                    <p className="text-[10px] text-[#1E90FF] font-semibold">{currentBook.author}</p>
                  </div>
                  <span className="font-black text-white whitespace-nowrap">{formatPrice(currentBook.price)}</span>
                </div>
              </div>
            </Link>
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
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-14 sm:h-20 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer hover:border-[#1E90FF]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-14 sm:h-20 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer hover:border-[#1E90FF]"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Netflix-style Segmented Progress Indicator Bars (Bottom Right) */}
      {carouselBooks.length > 1 && (
        <div className="absolute bottom-5 right-6 sm:right-12 z-30 flex items-center gap-2">
          {carouselBooks.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="h-1 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white/25"
              style={{ width: idx === currentIndex ? 38 : 14 }}
            >
              <div
                className={`h-full bg-[#1E90FF] transition-all duration-300 ${
                  idx === currentIndex ? 'w-full' : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
