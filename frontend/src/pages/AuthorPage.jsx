import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiCheck, FiArrowLeft, FiShare2, FiSearch } from 'react-icons/fi';
import Breadcrumb from '../components/common/Breadcrumb';
import BookCard from '../components/books/BookCard';
import { BookCardSkeleton } from '../components/ui/LoadingSkeleton';
import { getAuthorByName } from '../services/api';

export default function AuthorPage() {
  const { name } = useParams();
  const authorName = decodeURIComponent(name || '').trim();

  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAuthorData() {
      if (!authorName) return;
      setLoading(true);
      setError(null);
      try {
        const booksRes = await getAuthorByName(authorName);
        if (isMounted) {
          if (booksRes?.author) {
            setAuthor(booksRes.author);
          } else {
            setError('Author profile not found');
          }
        }
      } catch (err) {
        console.error('Error fetching author profile:', err);
        if (isMounted) setError(err.message || 'Failed to load author profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAuthorData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => { isMounted = false; };
  }, [authorName]);

  const books = Array.isArray(author?.books) ? author.books : [];

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${authorName} — Author at MidusaElibrary`,
          text: `Explore digital eBooks by ${authorName} on MidusaElibrary.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Library', to: '/library' },
            { label: 'Authors', to: '/library' },
            { label: authorName }
          ]}
          className="mb-4"
        />

        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-black transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Library Catalogue</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <FiShare2 className="w-3.5 h-3.5" />
            <span>{shareFeedback ? 'Copied Link!' : 'Share Author'}</span>
          </button>
        </div>

        {/* Author Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8 relative overflow-hidden"
        >
          {/* Subtle Ambient Brand Tint */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1E90FF]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Author Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-blue-50 text-[#1E90FF] text-[11px] font-bold border border-[#1E90FF]/20">
                  <FiCheck className="w-3 h-3 stroke-[3]" />
                  Verified Author
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {books.length} {books.length === 1 ? 'eBook' : 'eBooks'} in Catalogue
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black tracking-tight">
                {authorName}
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {author?.bio ||
                  `${authorName} is an accomplished author featured in MidusaElibrary. Explore their collection of published works below.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Author's Books Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-black flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-[#1E90FF]" />
              <span>Published Titles by {authorName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant digital access delivered via M-PESA
            </p>
          </div>

          <Link
            to={`/library?search=${encodeURIComponent(authorName)}`}
            className="text-xs sm:text-sm font-semibold text-[#1E90FF] hover:underline hidden sm:inline"
          >
            Search in Catalog &rarr;
          </Link>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : error || books.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl p-8 bg-white shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mx-auto mb-3">
              <FiSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">No titles found for this author</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any published titles currently attributed to {authorName}.
            </p>
            <Link
              to="/library"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <span>Explore All Books</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: (index % 12) * 0.035 }}
                className="h-full"
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
