import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  TrendingUp,
  Award,
  Check,
  Heart
} from 'lucide-react';
import HeroCarousel from '../components/layout/HeroCarousel';
import FlashSaleBanner from '../components/layout/FlashSaleBanner';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import BookCard from '../components/books/BookCard';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';



/* ─────────────────── Netflix-style Horizontal Shelf ─────────────────── */
function BookShelf({ title, icon: Icon, accentColor = '#1E90FF', books, loading, viewAllLink, onAddToCart }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="py-5 px-4 sm:px-6 liquid-glass specular-sheen rounded-2xl border border-white/70 shadow-sm"
    >
      <div className="max-w-[1500px] mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-black flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" style={{ color: accentColor }} />}
            <span>{title}</span>
          </h2>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm text-[#1E90FF] hover:text-[#167CD9] font-bold flex items-center gap-1 hover:underline"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Netflix Scrollable Row with edge hover buttons */}
        <div className="relative group/shelf">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-9 h-16 bg-black/60 backdrop-blur-xl hover:bg-black/80 text-white rounded-xl flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-36 sm:w-44">
                    <LoadingSkeleton className="w-full aspect-[3/4] rounded-xl mb-2" />
                    <LoadingSkeleton className="h-3.5 w-3/4 rounded-md mb-1.5" />
                    <LoadingSkeleton className="h-3 w-1/2 rounded-md mb-2" />
                    <LoadingSkeleton className="h-7 w-full rounded-xl" />
                  </div>
                ))
              : books.map((book) => (
                  <div key={book.id} className="flex-shrink-0 w-36 sm:w-44">
                    <BookCard book={book} onAddToCart={onAddToCart} />
                  </div>
                ))}
          </div>

          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-9 h-16 bg-black/60 backdrop-blur-xl hover:bg-black/80 text-white rounded-xl flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────── Main Hero Page ─────────────────── */
export default function Hero() {
  const { addToCart } = useCart();

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [featRes, bestRes, recentRes, allRes] = await Promise.all([
          getBooks({ featured: true, limit: 12 }),
          getBooks({ bestseller: true, limit: 12 }),
          getBooks({ sortBy: 'created_at', sortOrder: 'desc', limit: 12 }),
          getBooks({ limit: 50 })
        ]);
        if (!mounted) return;
        setFeaturedBooks(Array.isArray(featRes?.books) ? featRes.books : []);
        setBestsellers(Array.isArray(bestRes?.books) ? bestRes.books : []);
        setRecentBooks(Array.isArray(recentRes?.books) ? recentRes.books : []);
        setAllBooks(Array.isArray(allRes?.books) ? allRes.books : []);
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Group books by category for per-category shelves (eliminating redundancy)
  const categoryMap = {};
  allBooks.forEach((b) => {
    const cat = b.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(b);
  });
  const categoryShelfEntries = Object.entries(categoryMap).filter(([, books]) => books.length >= 2);

  return (
    <div className="min-h-screen text-black pb-16">
      {/* ════════════════════════════════════════════════════════
          NETFLIX HERO CAROUSEL — High-Impact Cinematic Banner
      ════════════════════════════════════════════════════════ */}
      <HeroCarousel
        books={recentBooks}
        loading={loading}
        onAddToCart={addToCart}
      />

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT — Clean Netflix Rows (No UI Redundancy)
      ════════════════════════════════════════════════════════ */}
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* ── Active Flash Sale Promotional Banner ── */}
        <FlashSaleBanner books={allBooks} />

        {/* ── Shelf 1: Trending Bestsellers ── */}
        {(loading || bestsellers.length > 0) && (
          <BookShelf
            title="Trending Bestsellers"
            icon={TrendingUp}
            accentColor="#F40009"
            books={bestsellers}
            loading={loading}
            viewAllLink="/library?bestseller=true"
            onAddToCart={addToCart}
          />
        )}

        {/* ── Shelf 2: Editor's Picks ── */}
        {(loading || featuredBooks.length > 0) && (
          <BookShelf
            title="Editor's Picks"
            icon={Award}
            accentColor="#00A651"
            books={featuredBooks}
            loading={loading}
            viewAllLink="/library?sortBy=featured"
            onAddToCart={addToCart}
          />
        )}

        {/* ── Shelf 3: New Releases & Fresh In ── */}
        {(loading || recentBooks.length > 0) && (
          <BookShelf
            title="New Releases &amp; Fresh In"
            icon={Zap}
            accentColor="#1E90FF"
            books={recentBooks}
            loading={loading}
            viewAllLink="/library?sortBy=created_at"
            onAddToCart={addToCart}
          />
        )}


        {/* ── Genre Shelves ── */}
        {!loading &&
          categoryShelfEntries.map(([catName, catBooks]) => (
            <BookShelf
              key={catName}
              title={catName}
              icon={BookOpen}
              accentColor="#1E90FF"
              books={catBooks}
              loading={false}
              viewAllLink={`/library?category=${encodeURIComponent(catName)}`}
              onAddToCart={addToCart}
            />
          ))}
      </div>
    </div>
  );
}