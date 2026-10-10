import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function UserFavoritesTab({
  isLoadingBooks,
  favoriteBooks = []
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Your Wishlist</h2>
      {isLoadingBooks ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading wishlist...</p>
        </div>
      ) : favoriteBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
          <p className="text-xs text-slate-500">No titles saved in wishlist yet.</p>
          <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-[#1E90FF]">
            Explore Library →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favoriteBooks.map((book) => (
            <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-[#1E90FF] block truncate">{book.category}</span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                <p className="text-[11px] text-slate-500 truncate mb-2">{formatPrice(book.price)}</p>
                <Link to={`/book/${book.id}`}>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                    View Details
                  </button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
