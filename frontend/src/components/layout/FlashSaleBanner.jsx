import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  ArrowRight,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useFlashSale } from '../../context/FlashSaleContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/currency';

export default function FlashSaleBanner({ books = [] }) {
  const { isLive, flashSale, countdown, isBookInFlashSale, getDiscountedPrice } = useFlashSale();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState({});
  const rowRef = useRef(null);

  if (!isLive || !flashSale) return null;

  // Filter books that participate in this flash sale
  const saleBooks = books.filter((b) => isBookInFlashSale(b.id));

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const handleAddToCart = (e, book) => {
    e.preventDefault();
    e.stopPropagation();

    // Store the canonical DB price — flash-sale discount is applied at
    // render time everywhere and re-computed server-side at checkout.
    addToCart({
      ...book,
      price: book.price,         // real DB price
      originalPrice: book.price,
      discountPercent: 0,
      isFlashSale: false,
    });
    setAddedIds((prev) => ({ ...prev, [book.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [book.id]: false }));
    }, 1800);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden border border-red-500/40"
    >
      {/* Background ambient glow circles */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-black/20 rounded-full blur-2xl pointer-events-none" />

      {/* ── Header: Title + Countdown Timer ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/20 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-red-600 text-[11px] font-black uppercase tracking-wider shadow-sm animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-red-600" />
              Limited Time Only
            </span>
            <span className="text-xs font-bold text-white/90 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {flashSale.discountPercent}% OFF
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{flashSale.title || 'Flash Sale Event'}</span>
          </h2>

          {flashSale.description && (
            <p className="text-xs sm:text-sm text-white/85 max-w-xl">
              {flashSale.description}
            </p>
          )}
        </div>

        {/* ── Countdown Clock Blocks ── */}
        <div className="flex items-center gap-2 bg-black/35 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mr-1">
            <Clock className="w-4 h-4 animate-spin-slow" />
            <span className="hidden sm:inline">Ends In:</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-center">
            {/* Hours */}
            <div className="flex flex-col">
              <span className="w-9 h-8 bg-white text-black font-black text-sm sm:text-base rounded-md flex items-center justify-center shadow-inner">
                {countdown.hours}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/70 mt-0.5">Hrs</span>
            </div>

            <span className="font-bold text-white/80 pb-3">:</span>

            {/* Minutes */}
            <div className="flex flex-col">
              <span className="w-9 h-8 bg-white text-black font-black text-sm sm:text-base rounded-md flex items-center justify-center shadow-inner">
                {countdown.minutes}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/70 mt-0.5">Min</span>
            </div>

            <span className="font-bold text-white/80 pb-3">:</span>

            {/* Seconds */}
            <div className="flex flex-col">
              <span className="w-9 h-8 bg-white text-red-600 font-black text-sm sm:text-base rounded-md flex items-center justify-center shadow-inner">
                {countdown.seconds}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/70 mt-0.5">Sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Books Row or Teaser ── */}
      {saleBooks.length > 0 ? (
        <div className="relative group/shelf mt-5">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-8 h-14 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={rowRef}
            className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {saleBooks.map((book) => {
              const pricing = getDiscountedPrice(book) || {
                salePrice: book.price,
                originalPrice: book.originalPrice || book.price,
                discountPercent: flashSale.discountPercent
              };
              const isAdded = Boolean(addedIds[book.id]);

              return (
                <div
                  key={book.id}
                  className="flex-shrink-0 w-36 sm:w-44 bg-white text-black rounded-xl overflow-hidden border border-white/30 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <Link to={`/book/${book.id}`} className="group block">
                    <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                      <img
                        src={
                          book.coverImage ||
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
                        }
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 bg-[#F40009] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10 shadow-sm flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        -{flashSale.discountPercent}%
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3">
                      <h4 className="text-xs sm:text-sm font-bold text-black line-clamp-2 min-h-[2.2rem] sm:min-h-[2.5rem] leading-snug group-hover:text-red-600 transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">by {book.author}</p>

                      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-red-600">
                          {formatPrice(pricing.salePrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPrice(pricing.originalPrice)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-2.5 pt-0">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, book)}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                        isAdded
                          ? 'bg-[#00A651] text-white'
                          : 'bg-black hover:bg-zinc-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-8 h-14 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-3 flex items-center justify-between text-xs text-white/90">
          <p>
            Flash Sale is active! Instant {flashSale.discountPercent}% discount applies automatically on participating titles at checkout.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black font-bold hover:bg-white/90 transition-colors text-xs flex-shrink-0"
          >
            <span>Browse Library</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </motion.section>
  );
}
