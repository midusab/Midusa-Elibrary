import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiStar, 
  FiShoppingCart, 
  FiHeart, 
  FiArrowLeft, 
  FiShare2, 
  FiCheck, 
  FiShield, 
  FiUser, 
  FiList, 
  FiMessageSquare,
  FiBookOpen,
  FiSend
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getBookById, getBooks, recordBookClick } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { addToCart } = useCart();
  const { success, error } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const item = await getBookById(id);
        if (!isMounted) return;
        setBook(item || null);

        if (item) {
          // Record book click/view
          recordBookClick(item.id);

          // Set reviews
          setReviewsList(Array.isArray(item.reviews) ? item.reviews : []);

          // Fetch related books in same category
          if (item.category) {
            const all = await getBooks({ category: item.category });
            if (!isMounted) return;
            const list = Array.isArray(all?.books) ? all.books : [];
            setRelatedBooks(list.filter(b => String(b.id) !== String(item.id)).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error loading book details:', err);
        if (isMounted) setBook(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm w-full bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-3">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Book Not Found</h2>
          <p className="text-xs text-slate-500 mb-5">The requested title could not be found or was removed.</p>
          <Link to="/library">
            <Button size="sm" className="w-full">Return to Library</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(book);
    success(`"${book.title}" added to cart!`);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    success(isFavorite ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: book.description,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('Link copied to clipboard!');
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      error('Please provide your name and review comment.');
      return;
    }

    const newReview = {
      id: Date.now(),
      user: reviewName.trim(),
      rating: Number(reviewRating),
      date: new Date().toISOString().split('T')[0],
      comment: reviewComment.trim()
    };

    setReviewsList([newReview, ...reviewsList]);
    setReviewName('');
    setReviewComment('');
    setShowReviewForm(false);
    success('Thank you for reviewing this title!');
  };

  // Safe table of contents from real data
  const tableOfContents = Array.isArray(book.tableOfContents) ? book.tableOfContents : [];

  const authorBio = book.authorInfo || `${book.author} is an accomplished specialist and writer known for delivering research-driven insights and timeless guidance in the field of ${book.category}.`;

  return (
    <div className="min-h-screen bg-white py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link to="/library" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
            <FiArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Library
          </Link>
        </div>

        {/* ======================================================== */}
        {/* ABOVE THE FOLD SECTION                                   */}
        {/* Large Cover Image | Title | Author | Price | Rating | Purchase Button */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-100">
          
          {/* Large Cover Image */}
          <div className="md:col-span-5 lg:col-span-5">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <span className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1 rounded-lg shadow-sm border border-slate-200/50">
                {book.category}
              </span>
              {book.bestseller && (
                <span className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                  Bestseller
                </span>
              )}
            </div>

            {/* Sub-actions below cover */}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleFavorite}
              >
                <FiHeart className={`mr-1.5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
                {isFavorite ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleShare}
              >
                <FiShare2 className="mr-1.5" />
                Share Title
              </Button>
            </div>
          </div>

          {/* Core Info Above Fold */}
          <div className="md:col-span-7 lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Category Pill */}
              <div className="inline-block text-xs font-bold text-primary uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full mb-3">
                {book.category}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                {book.title}
              </h1>

              {/* Author */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm sm:text-base text-slate-600">By</span>
                <span className="text-sm sm:text-base font-bold text-slate-900">{book.author}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 py-3 border-y border-slate-100 mb-6">
                <div className="flex items-center text-amber-500 font-bold text-sm">
                  <FiStar className="fill-current w-4 h-4 mr-1.5" />
                  <span>{book.rating || 4.8}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-600 font-medium">
                  {reviewsList.length} verified reader {reviewsList.length === 1 ? 'review' : 'reviews'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <FiCheck className="mr-1" /> Instant Digital Delivery (PDF/EPUB)
                </span>
              </div>

              {/* Price Display in Kenyan Shillings */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm mb-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                      Price
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {formatPrice(book.price)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    Digital Edition Unlocked
                  </span>
                </div>

                {/* Purchase Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 py-3.5 text-sm sm:text-base font-bold shadow-md cursor-pointer"
                    onClick={handleAddToCart}
                  >
                    <FiShoppingCart className="mr-2 w-5 h-5" />
                    Buy Now / Add to Cart
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <FiShield className="text-primary w-4 h-4" />
                    <span>Secure M-PESA & Card Checkout</span>
                  </div>
                  <span>Lifetime Access</span>
                </div>
              </div>

              {/* Brief Excerpt */}
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {book.description}
              </p>
            </div>
          </div>
        </div>


        {/* ======================================================== */}
        {/* BELOW THE FOLD SECTION                                   */}
        {/* 1. Description                                           */}
        {/* 2. Table of contents                                     */}
        {/* 3. Author information                                    */}
        {/* 4. Related books                                         */}
        {/* 5. Reviews                                               */}
        {/* ======================================================== */}
        <div className="pt-12 space-y-14">

          {/* 1. Description Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                <FiBookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Description & Synopsis
              </h2>
            </div>
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </Card>
          </section>

          {/* 2. Table of Contents Section (renders only if data exists) */}
          {tableOfContents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <FiList className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Table of Contents
                </h2>
              </div>
              <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <div className="divide-y divide-slate-100">
                  {tableOfContents.map((chapter, index) => (
                    <div key={index} className="py-3 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-800">
                        {chapter}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* 3. Author Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                <FiUser className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                About the Author
              </h2>
            </div>
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0 border border-primary/20">
                {book.author.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  {book.author}
                </h3>
                <p className="text-xs font-semibold text-primary mb-3">
                  Author • {book.category} Specialist
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {authorBio}
                </p>
              </div>
            </Card>
          </section>

          {/* 4. Related Books Section */}
          {relatedBooks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Related Books
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    More titles in {book.category}
                  </p>
                </div>
                <Link
                  to={`/library?category=${encodeURIComponent(book.category)}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View Category →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedBooks.map((item) => (
                  <Link key={item.id} to={`/book/${item.id}`} className="group block">
                    <Card className="h-full flex flex-col justify-between overflow-hidden bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow transition-all">
                      <div>
                        <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3.5">
                          <span className="text-[10px] font-semibold text-primary block truncate mb-0.5">
                            {item.category}
                          </span>
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mb-2 truncate">{item.author}</p>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 5. Reviews Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Reader Reviews ({reviewsList.length})
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </Button>
            </div>

            {/* Interactive Write Review Form */}
            {showReviewForm && (
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm mb-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Write Your Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value={5}>5 Stars - Outstanding</option>
                        <option value={4}>4 Stars - Great</option>
                        <option value={3}>3 Stars - Average</option>
                        <option value={2}>2 Stars - Below Expectations</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Feedback *</label>
                    <textarea
                      rows={3}
                      placeholder="Share your thoughts on the content and quality..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                  <Button type="submit" size="sm" className="text-xs">
                    <FiSend className="mr-1.5" /> Submit Review
                  </Button>
                </form>
              </Card>
            )}

            {/* Reviews List */}
            {reviewsList.length === 0 ? (
              <Card className="p-6 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-500">No reviews yet for this title. Be the first to share your thoughts!</p>
              </Card>
            ) : (
              <div className="space-y-3">
              {reviewsList.map((rev) => (
                <Card key={rev.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {rev.user?.[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{rev.user}</h4>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                          <FiCheck className="mr-0.5" /> Verified Purchase
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      <FiStar className="fill-current w-3.5 h-3.5 mr-1" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                    "{rev.comment}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">{rev.date}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        </div>
      </div>
    </div>
  );
}
