import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiAward,
  FiBook,
  FiStar,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiMousePointer,
  FiPlus
} from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminBooksTab({
  books,
  filteredBooks,
  categories,
  bookSearch,
  setBookSearch,
  bookCategoryFilter,
  setBookCategoryFilter,
  handleSyncBestsellers,
  handleOpenAddBook,
  handleOpenEditBook,
  handleDeleteBook,
  deletingId,
  handleOpenReviewModal,
  handleToggleFeatured,
  handleToggleBestseller
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={bookCategoryFilter}
            onChange={(e) => setBookCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] bg-white cursor-pointer"
          >
            <option value="all">All Categories ({books.length})</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSyncBestsellers}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Auto-detect sales volume and update bestseller tags"
          >
            <FiAward className="w-3.5 h-3.5 text-amber-600" />
            <span>Sync Bestsellers</span>
          </button>
        </div>
      </div>

      {/* Books Table */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {filteredBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Book</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Clicks</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Bestseller</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          {b.coverImage ? (
                            <img
                              src={b.coverImage}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <FiBook className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <h4 className="font-bold text-slate-900 truncate">{b.title}</h4>
                          <p className="text-xs text-slate-500 truncate">by {b.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatPrice(b.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold border border-blue-100">
                        <FiMousePointer className="w-3.5 h-3.5" />
                        {b.clicks || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenReviewModal(b)}
                        className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md cursor-pointer"
                        title="Click to update rating"
                      >
                        <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{b.rating ? Number(b.rating).toFixed(1) : '5.0'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(b)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          b.featured
                            ? 'bg-blue-50 text-[#1E90FF] hover:bg-blue-100'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {b.featured ? 'Featured' : 'Standard'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleBestseller(b)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          b.bestseller
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {b.bestseller ? '★ Best Seller' : 'Regular'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/book/${b.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View public page"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditBook(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E90FF] hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit book"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.id)}
                          disabled={deletingId === b.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete book"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mx-auto mb-3">
              <FiBook className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No books found</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
              {bookSearch || bookCategoryFilter !== 'all'
                ? 'No books match your current search and filter settings.'
                : 'Your library catalogue is currently empty. Click below to publish your first eBook.'}
            </p>
            <button
              onClick={handleOpenAddBook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E90FF] text-white text-xs font-semibold cursor-pointer shadow-sm hover:bg-[#1873cc]"
            >
              <FiPlus className="w-4 h-4" />
              <span>Publish First Book</span>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
