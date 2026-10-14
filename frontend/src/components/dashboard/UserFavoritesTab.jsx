import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

export default function UserFavoritesTab({
  isLoadingBooks,
  favoriteBooks = []
}) {
  const { removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Your Wishlist</h2>
          <p className="text-xs text-slate-500">Titles you have saved for later reading</p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {favoriteBooks.length} {favoriteBooks.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {isLoadingBooks ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading wishlist...</p>
        </div>
      ) : favoriteBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
          <p className="text-xs text-slate-500">No titles saved in wishlist yet.</p>
          <Link to="/library" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1E90FF] hover:underline">
            <span>Explore Library</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favoriteBooks.map((book) => (
            <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex flex-col justify-between">
              <div className="flex gap-3.5 items-start">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-[#1E90FF] block truncate">{book.category}</span>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                  <p className="text-[11px] text-slate-500 truncate">By {book.author}</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{formatPrice(book.price)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link to={`/book/${book.id}`}>
                    <button className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                      Details
                    </button>
                  </Link>

                  {/* ONLY Add to Cart is Coca-Cola Red */}
                  <button
                    onClick={() => addToCart(book)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#F40009] hover:bg-[#CC0007] text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <FiShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>

                <button
                  onClick={() => removeFromWishlist(book.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Remove from wishlist"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
