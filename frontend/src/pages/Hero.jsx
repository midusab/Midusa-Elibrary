import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

/* ─────────────────── Star Rating (Dodgerblue) ─────────────────── */
function StarRating({ rating = 0, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      <span className="flex text-[#1E90FF] text-xs">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        <span className="text-slate-200">{'★'.repeat(empty)}</span>
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-slate-500 hover:text-[#1E90FF] cursor-pointer">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

/* ─────────────────── Netflix-style Book Card ─────────────────── */
function BookCard({ book, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col bg-white border border-slate-200 hover:border-[#1E90FF] rounded-xl transition-all duration-300 overflow-hidden h-full hover:scale-[1.03] relative"
    >
      {/* Cover Image Container */}
      <div
        className="relative bg-slate-100 flex items-center justify-center overflow-hidden aspect-[3/4]"
      >
        <img
          src={
            book.coverImage ||
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'
          }
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(book);
          }}
          aria-label={isInWishlist(book.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 p-1.5 rounded-xl backdrop-blur-md transition-all cursor-pointer z-10 ${
            isInWishlist(book.id)
              ? 'bg-white text-[#F40009] shadow-sm'
              : 'bg-black/35 text-white hover:bg-white hover:text-[#F40009]'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isInWishlist(book.id) ? 'fill-[#F40009]' : ''
            }`}
          />
        </button>

        {/* Badges: Coca-Cola Red or Green only */}
        {book.bestseller && (
          <span className="absolute top-2 left-2 bg-[#F40009] text-white text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider z-10 shadow-xs">
            #1 Best
          </span>
        )}
        {book.featured && !book.bestseller && (
          <span className="absolute top-2 left-2 bg-[#00A651] text-white text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider z-10 shadow-xs">
            Featured
          </span>
        )}
        {book.discountPercent > 0 && (
          <span
            className={`absolute ${
              book.bestseller || book.featured ? 'top-8' : 'top-2'
            } left-2 bg-[#F40009] text-white text-[9px] font-black px-1.5 py-0.5 rounded-xl z-10 shadow-xs`}
          >
            -{book.discountPercent}%
          </span>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {/* Category */}
        <p className="text-[10px] font-extrabold text-[#1E90FF] uppercase tracking-wider truncate">
          {book.category}
        </p>

        {/* Title with consistent min-height */}
        <h3 className="text-xs sm:text-sm font-bold text-black line-clamp-2 leading-snug group-hover:text-[#1E90FF] transition-colors min-h-[2.2rem] sm:min-h-[2.5rem]">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-[11px] text-slate-500 font-medium truncate">by {book.author}</p>

        {/* Stars */}
        <div className="pt-0.5">
          <StarRating rating={book.rating || 5} count={book.clicks ? `${book.clicks} reads` : undefined} />
        </div>

        {/* Price block */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-black">
              {formatPrice(book.price)}
            </span>
            {book.discountPercent > 0 && book.originalPrice > book.price && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatPrice(book.originalPrice)}
              </span>
            )}
          </div>
          {book.discountPercent > 0 && book.originalPrice > book.price && (
            <p className="text-[10px] text-[#F40009] font-bold">
              Save {formatPrice(book.originalPrice - book.price)}
            </p>
          )}
        </div>

        {/* Add to Cart: Coca-Cola Red -> Green on Added */}
        <button
          type="button"
          onClick={handleAdd}
          className={`mt-2 w-full py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
            added
              ? 'bg-[#00A651] text-white border border-[#00A651]'
              : 'bg-[#F40009] hover:bg-[#CC0007] text-white border border-[#F40009]'
          }`}
        >
          {added ? (
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
    </Link>
  );
}

/* ─────────────────── Netflix-style Horizontal Shelf ─────────────────── */
function BookShelf({ title, icon: Icon, accentColor = '#1E90FF', books, loading, viewAllLink, onAddToCart }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="py-4 px-4 sm:px-6 bg-white rounded-xl border border-slate-200">
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-9 h-16 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20"
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
                  <div key={i} className="flex-shrink-0 w-36 sm:w-44 animate-pulse">
                    <div className="bg-slate-200 rounded-xl" style={{ aspectRatio: '3/4', height: 190 }} />
                    <div className="mt-2 h-3 bg-slate-200 rounded-xl w-3/4" />
                    <div className="mt-1 h-3 bg-slate-200 rounded-xl w-1/2" />
                    <div className="mt-2 h-7 bg-slate-200 rounded-xl" />
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
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-9 h-16 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer border border-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
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
    <div className="bg-white min-h-screen text-black pb-16">
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