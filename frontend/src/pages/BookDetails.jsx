import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiHeart, FiDownload, FiBookOpen, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BOOKS, REVIEWS } from '../data/books';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function BookDetails() {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();
  const { success } = useToast();

  const book = BOOKS.find(b => b.id === parseInt(id));
  const relatedBooks = BOOKS.filter(b => b.category === book?.category && b.id !== book?.id).slice(0, 4);
  const bookReviews = REVIEWS.filter(r => r.bookId === parseInt(id));

  if (!book) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="p-8 sm:p-12 text-center max-w-md w-full border border-slate-100 dark:border-slate-800">
          <div className="text-5xl sm:text-6xl mb-4">📚</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Book not found
          </h2>
          <Link to="/library">
            <Button className="mt-4">Back to Library</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(book);
    success(`${book.title} added to cart!`);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: book.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/library">
          <Button variant="ghost" className="mb-4 sm:mb-6">
            <FiArrowLeft className="mr-2" />
            Back to Library
          </Button>
        </Link>

        {/* Book Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
        >
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-auto"
              />
              <div className="p-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleFavorite}
                >
                  <FiHeart className={isFavorite ? 'fill-current text-red-500' : ''} />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <FiShare2 />
                </Button>
              </div>
            </Card>
          </div>

          {/* Book Info */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              {book.bestseller && (
                <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-medium mr-2">
                  Bestseller
                </span>
              )}
              {book.featured && (
                <span className="inline-block bg-secondary-1 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              {book.title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-4">
              by {book.author}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(book.rating) ? 'fill-current' : ''}`}
                  />
                ))}
                <span className="ml-2 text-slate-900 dark:text-white font-medium text-sm sm:text-base">
                  {book.rating}
                </span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-xs sm:text-sm px-2.5 py-0.5 bg-primary/10 text-primary font-medium rounded-full">{book.category}</span>
            </div>

            <div className="mb-6">
              <span className="text-3xl sm:text-4xl font-bold text-primary">${book.price}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
              <Button size="lg" className="w-full sm:flex-1" onClick={handleAddToCart}>
                <FiShoppingCart className="mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:flex-1">
                <FiDownload className="mr-2" />
                Download Sample
              </Button>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Description
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {book.description}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                What You'll Learn
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-start">
                  <FiBookOpen className="mr-2 mt-1 text-primary flex-shrink-0" />
                  <span>Comprehensive coverage of {book.category} concepts</span>
                </li>
                <li className="flex items-start">
                  <FiBookOpen className="mr-2 mt-1 text-primary flex-shrink-0" />
                  <span>Practical examples and real-world applications</span>
                </li>
                <li className="flex items-start">
                  <FiBookOpen className="mr-2 mt-1 text-primary flex-shrink-0" />
                  <span>Expert insights from industry professionals</span>
                </li>
                <li className="flex items-start">
                  <FiBookOpen className="mr-2 mt-1 text-primary flex-shrink-0" />
                  <span>Actionable strategies for immediate implementation</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Reviews ({bookReviews.length})
          </h2>
          
          {bookReviews.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No reviews yet. Be the first to review this book!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookReviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {review.user}
                      </h4>
                      <p className="text-sm text-slate-500">{review.date}</p>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{review.comment}</p>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Related Books
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <motion.div
                  key={relatedBook.id}
                  whileHover={{ y: -8 }}
                >
                  <Link to={`/book/${relatedBook.id}`}>
                    <Card className="overflow-hidden h-full cursor-pointer">
                      <img
                        src={relatedBook.coverImage}
                        alt={relatedBook.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                          {relatedBook.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {relatedBook.author}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-yellow-500">
                            <FiStar className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm">{relatedBook.rating}</span>
                          </div>
                          <span className="text-primary font-bold">${relatedBook.price}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
