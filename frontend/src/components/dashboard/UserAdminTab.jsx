import { Link } from 'react-router-dom';
import { FiShield, FiPlus } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/currency';

export default function UserAdminTab({
  handleCreateBook,
  newBook,
  setNewBook,
  effectiveCategory,
  categories = [],
  pdfFile,
  setPdfFile,
  isUploadingPdf,
  uploadProgress,
  isSubmitting,
  safeBooks = [],
  isLoadingBooks
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
        <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
          <FiShield className="text-amber-600" /> Administrator Database Panel
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          Add and manage books directly in your database. All prices are in Kenyan Shillings (KSh).
        </p>
      </div>

      {/* Form to add book directly */}
      <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
          <FiPlus className="text-[#1E90FF]" /> Add New Book to Website
        </h3>

        <form onSubmit={handleCreateBook} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title</label>
              <input
                type="text"
                placeholder="e.g. Master Your Focus"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
              <input
                type="text"
                placeholder="e.g. Dr. John Maxwell"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={effectiveCategory}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF] bg-white cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (KSh)</label>
              <input
                type="number"
                step="1"
                placeholder="1500"
                value={newBook.price}
                onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={newBook.coverImage}
              onChange={(e) => setNewBook({ ...newBook, coverImage: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              eBook PDF File
              {newBook.pdfUrl && !pdfFile && (
                <span className="ml-2 text-green-600 font-normal">✓ URL set</span>
              )}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files[0] || null;
                setPdfFile(file);
                if (file) setNewBook((prev) => ({ ...prev, pdfUrl: '' }));
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#1E90FF]/10 file:text-[#1E90FF] file:font-semibold cursor-pointer"
            />
            {pdfFile && (
              <p className="mt-1 text-[11px] text-slate-500">
                Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {isUploadingPdf && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#1E90FF]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
                    Uploading PDF…
                  </span>
                  <span className="font-semibold tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E90FF] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary and synopsis..."
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="px-6 py-2 text-xs font-semibold bg-[#1E90FF] hover:bg-[#1C86EE] text-white cursor-pointer"
          >
            {isSubmitting ? 'Saving to Database...' : 'Publish Book in KSh'}
          </Button>
        </form>
      </Card>

      {/* Current Catalog Inventory */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Live Catalog ({safeBooks.length} Books)
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs min-w-[480px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingBooks ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                    Loading catalog inventory...
                  </td>
                </tr>
              ) : safeBooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No books found in database.
                  </td>
                </tr>
              ) : (
                safeBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-900 max-w-[180px] truncate">{b.title}</td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{b.category}</td>
                    <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{formatPrice(b.price)}</td>
                    <td className="p-3 text-right">
                      <Link to={`/book/${b.id}`} className="text-[#1E90FF] hover:underline font-medium">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
