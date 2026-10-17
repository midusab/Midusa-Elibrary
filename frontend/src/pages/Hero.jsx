import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiStar, FiArrowRight, FiShoppingCart, FiChevronLeft,
  FiChevronRight, FiZap, FiBookOpen, FiTrendingUp, FiAward
} from 'react-icons/fi';
import CategoryIcon from '../components/ui/CategoryIcon';
import { getBooks } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCategories } from '../context/CategoryContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import FAQSection from '../components/layout/FAQSection';

/* ─────────────────── Star Rating ─────────────────── */
function StarRating({ rating = 0, count }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      <span className="flex text-amber-400">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        <span className="text-slate-300">{'★'.repeat(empty)}</span>
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-[#007185] hover:text-[#c7511f] cursor-pointer">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

/* ─────────────────── Amazon-style Product Card ─────────────────── */
function BookCard({ book, onAddToCart }) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const reviewCount = Math.floor((book.clicks || 0) * 4.2 + 38);

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col bg-white border border-slate-200 rounded hover:shadow-md transition-shadow duration-200 overflow-hidden h-full"
    >
      {/* Cover Image */}
      <div className="relative bg-slate-50 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '3/4', minHeight: 200 }}>
        <img
          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        {/* Badges */}
        {book.bestseller && (
          <span className="absolute top-2 left-2 bg-[#c7511f] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide">
            #1 BESTSELLER
          </span>
        )}
        {book.featured && !book.bestseller && (
          <span className="absolute top-2 left-2 bg-[#007600] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide">
            EDITOR'S PICK
          </span>
        )}
        {book.discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-[#CC0C39] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
            -{book.discountPercent}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {/* Category */}
        <p className="text-[11px] text-[#565959] truncate">{book.category}</p>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[#0F1111] line-clamp-2 leading-snug group-hover:text-[#C7511F] transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-[12px] text-[#565959] truncate">by {book.author}</p>

        {/* Stars */}
        <StarRating rating={book.rating || 4.5} count={reviewCount} />

        {/* Price block */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-[#0F1111]">
              {formatPrice(book.price)}
            </span>
            {book.discountPercent > 0 && book.originalPrice > book.price && (
              <span className="text-[11px] text-[#565959] line-through">
                {formatPrice(book.originalPrice)}
              </span>
            )}
          </div>
          {book.discountPercent > 0 && book.originalPrice > book.price && (
            <p className="text-[11px] text-[#CC0C39] font-semibold">
              You save {formatPrice(book.originalPrice - book.price)}
            </p>
          )}
          <p className="text-[11px] text-[#007600] font-semibold mt-0.5">
            Instant digital access
          </p>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          className={`mt-2 w-full py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer
            ${added
              ? 'bg-red border-[#F40009] text-[#111]'
              : 'bg-[#F40009] hover:bg-[#CC0007] border-[#F40009] text-[#fff]'
            }`}
        >
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}

/* ─────────────────── Horizontal Shelf (scrollable row) ─────────────────── */
function BookShelf({ title, icon: Icon, accentColor = '#131921', books, loading, viewAllLink }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="py-6 border-b border-slate-200 bg-white">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0F1111] flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" style={{ color: accentColor }} />}
            {title}
          </h2>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline font-semibold flex items-center gap-1"
            >
              See all <FiArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Scrollable row */}
        <div className="relative group/shelf">
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-16 bg-white/95 border border-slate-200 rounded shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-44 animate-pulse">
                    <div className="bg-slate-100 rounded" style={{ aspectRatio: '3/4', height: 220 }} />
                    <div className="mt-2 h-3 bg-slate-100 rounded w-3/4" />
                    <div className="mt-1 h-3 bg-slate-100 rounded w-1/2" />
                    <div className="mt-2 h-7 bg-slate-100 rounded-full" />
                  </div>
                ))
              : books.map((book) => (
                  <div key={book.id} className="flex-shrink-0 w-44 sm:w-48">
                    <BookCard book={book} onAddToCart={(b) => window._heroAddToCart?.(b)} />
                  </div>
                ))
            }
          </div>

          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-16 bg-white/95 border border-slate-200 rounded shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Main Hero Page ─────────────────── */
export default function Hero() {
  const { categories } = useCategories();
  const { addToCart } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [bestsellers,   setBestsellers]   = useState([]);
  const [recentBooks,   setRecentBooks]   = useState([]);
  const [allBooks,      setAllBooks]      = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Expose addToCart globally for BookCard
  window._heroAddToCart = (book) => {
    addToCart(book);
    success(`"${book.title}" added to cart!`);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [featRes, bestRes, recentRes, allRes] = await Promise.all([
          getBooks({ featured: true,   limit: 12 }),
          getBooks({ bestseller: true, limit: 12 }),
          getBooks({ sortBy: 'created_at', sortOrder: 'desc', limit: 12 }),
          getBooks({ limit: 50 }),
        ]);
        if (!mounted) return;
        setFeaturedBooks(Array.isArray(featRes?.books)   ? featRes.books   : []);
        setBestsellers(  Array.isArray(bestRes?.books)   ? bestRes.books   : []);
        setRecentBooks(  Array.isArray(recentRes?.books) ? recentRes.books : []);
        setAllBooks(     Array.isArray(allRes?.books)    ? allRes.books    : []);
      } catch {
        // silent — loading states handle UI
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Group books by category for per-category shelves
  const categoryMap = {};
  allBooks.forEach(b => {
    const cat = b.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(b);
  });
  const categoryShelfEntries = Object.entries(categoryMap).filter(([, books]) => books.length >= 2);

  return (
    <div className="bg-[#EAEDED] min-h-screen text-[#0F1111]">

      {/* ════════════════════════════════════════════════════════
          TOP BANNER HERO — Amazon-style dark nav strip
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative bg-[url('./assets/hero14.jpg')] bg-cover bg-center bg-fixed"
        style={{ minHeight: 340 }}
      >
        <div className="absolute inset-0 bg-[#131921]/80" />
        <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center text-center">
          {/**<span className="inline-block mb-3 text-[11px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded">
            Kenya's #1 Digital Bookstore
          </span> */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight max-w-3xl">
           Purchase, Learn, <span className="text-[#1E90FF]">Apply &amp; Grow</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl">
            Pay via M-PESA · Instant digital access · Focusly selected
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1E90FF] hover:bg-[#1E90FF]-500 text-[#111] font-bold 
              rounded-xl text-sm shadow-md transition-colors"
            >
              <FiBookOpen className="w-4 h-4" />
              Shop All Books
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold 
              rounded-xl text-sm border border-white/30 transition-colors"
            >
              Browse Categories
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CATEGORY BROWSE STRIP — pill chips (Amazon Departments)
      ════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <div className="bg-[#232F3E] border-b border-[#3A4553]">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6">
            <div
              className="flex items-center gap-1 overflow-x-auto py-2"
              style={{ scrollbarWidth: 'none' }}
            >
              <Link
                to="/library"
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white hover:text-[#FFD814] transition-colors whitespace-nowrap"
              >
                All Books
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/library?category=${encodeURIComponent(cat.name)}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-[#FFD814] transition-colors whitespace-nowrap border-l border-[#3A4553]"
                >
                  <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-3.5 h-3.5 opacity-70" />
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT — white card panels like Amazon homepage
      ════════════════════════════════════════════════════════ */}
      <div className="max-w-[1500px] mx-auto px-2 sm:px-4 py-4 space-y-4">

        {/* ── Today's Deals Banner ─────────────────────────── */}
        {!loading && (bestsellers.length > 0 || featuredBooks.length > 0) && (() => {
          const dealBook = bestsellers[0] || featuredBooks[0];
          if (!dealBook) return null;
          return (
            <div
              onClick={() => navigate(`/book/${dealBook.id}`)}
              className="relative bg-gradient-to-r from-[#131921] to-[#232F3E] rounded overflow-hidden cursor-pointer group border border-[#3A4553]"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
                <img
                  src={dealBook.coverImage}
                  alt={dealBook.title}
                  className="w-28 sm:w-36 rounded shadow-xl group-hover:scale-105 transition-transform duration-300 object-cover flex-shrink-0"
                  style={{ aspectRatio: '3/4' }}
                />
                <div className="text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 mb-2 text-[11px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                    <FiZap className="w-3 h-3" /> Deal of the Day
                  </span>
                  <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-1 leading-tight">
                    {dealBook.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">by {dealBook.author}</p>
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start mb-4">
                    <span className="text-2xl font-extrabold text-[#FFD814]">
                      {formatPrice(dealBook.price)}
                    </span>
                    {dealBook.originalPrice > dealBook.price && (
                      <>
                        <span className="text-slate-400 line-through text-sm">
                          {formatPrice(dealBook.originalPrice)}
                        </span>
                        <span className="bg-[#CC0C39] text-white text-xs font-bold px-2 py-0.5 rounded">
                          Save {dealBook.discountPercent}%
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); window._heroAddToCart?.(dealBook); }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#111] font-bold rounded-full text-sm transition-colors cursor-pointer"
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Featured Books shelf ──────────────────────────── */}
        {(loading || featuredBooks.length > 0) && (
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <BookShelf
              title="Editor's Picks"
              icon={FiAward}
              accentColor="#007600"
              books={featuredBooks}
              loading={loading}
              viewAllLink="/library?sortBy=featured"
            />
          </div>
        )}

        {/* ── Bestsellers shelf ─────────────────────────────── */}
        {(loading || bestsellers.length > 0) && (
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <BookShelf
              title="Bestsellers"
              icon={FiTrendingUp}
              accentColor="#c7511f"
              books={bestsellers}
              loading={loading}
              viewAllLink="/library?bestseller=true"
            />
          </div>
        )}

        {/* ── New Arrivals shelf ────────────────────────────── */}
        {(loading || recentBooks.length > 0) && (
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <BookShelf
              title="New Arrivals"
              icon={FiZap}
              accentColor="#007185"
              books={recentBooks}
              loading={loading}
              viewAllLink="/library?sortBy=created_at"
            />
          </div>
        )}

        {/* ── Per-Category shelves (like Amazon department rows) ── */}
        {!loading && categoryShelfEntries.map(([catName, catBooks]) => (
          <div key={catName} className="bg-white rounded border border-slate-200 overflow-hidden">
            <BookShelf
              title={catName}
              icon={FiBookOpen}
              accentColor="#131921"
              books={catBooks}
              loading={false}
              viewAllLink={`/library?category=${encodeURIComponent(catName)}`}
            />
          </div>
        ))}

        {/* ── Category Grid ──────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="bg-white rounded border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-[#0F1111] mb-5 flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-[#007185]" />
              Shop by Department
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/library?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center text-center p-4 rounded border border-slate-200 hover:border-[#007185] hover:shadow-sm transition-all bg-white"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EAEDED] text-[#0F1111] flex items-center justify-center mb-3 group-hover:bg-[#007185] group-hover:text-white transition-all">
                    <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#0F1111] group-hover:text-[#007185] line-clamp-2 transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-[#007185] mt-1 group-hover:underline">
                    See more
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* FAQ */}
      <div className="mt-4">
        <FAQSection />
      </div>
    </div>
  );
}