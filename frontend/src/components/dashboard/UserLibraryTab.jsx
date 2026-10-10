import { Link } from 'react-router-dom';
import { FiDownload } from 'react-icons/fi';
import Card from '../ui/Card';

export default function UserLibraryTab({
  isLoadingOrders,
  purchasedBooks = [],
  onReadNow
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Ready to Read</h2>
      {isLoadingOrders ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading your library...</p>
        </div>
      ) : purchasedBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
          <p className="text-xs text-slate-500">No books purchased yet.</p>
          <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-[#1E90FF]">
            Browse Catalog →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {purchasedBooks.map((book) => (
            <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-[#1E90FF] block truncate">
                  {book.category}
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {book.title}
                </h3>
                <p className="text-[11px] text-slate-500 truncate mb-2">{book.author}</p>
                <button
                  onClick={() => onReadNow ? onReadNow(book) : null}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E90FF] text-white text-[11px] font-semibold hover:bg-[#1C86EE] transition-colors cursor-pointer"
                >
                  <FiDownload className="w-3 h-3" /> Read Now
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
