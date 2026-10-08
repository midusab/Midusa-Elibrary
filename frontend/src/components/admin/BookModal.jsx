import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function BookModal({
  isOpen,
  onClose,
  editingBook,
  bookForm,
  setBookForm,
  categories,
  pdfFile,
  setPdfFile,
  isUploadingPdf,
  uploadProgress,
  isSaving,
  handleSaveBook
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBook ? 'Edit Book Details' : 'Publish New eBook'}
                </h3>
                <p className="text-xs text-slate-500">
                  Add titles to the library catalog with digital download URLs.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Your Mindset"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Robert Greene"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price (KSH) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="19.99"
                    value={bookForm.price}
                    onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rating (1 - 5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={bookForm.rating}
                    onChange={(e) => setBookForm({ ...bookForm, rating: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Brief overview of the book contents..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bookForm.coverImage}
                  onChange={(e) => setBookForm({ ...bookForm, coverImage: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  eBook PDF File
                  {bookForm.pdfUrl && !pdfFile && (
                    <a
                      href={bookForm.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-[#1E90FF] font-normal hover:underline"
                    >
                      ✓ View current PDF
                    </a>
                  )}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    setPdfFile(file);
                    if (file) setBookForm((prev) => ({ ...prev, pdfUrl: '' }));
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-[#1E90FF]/10 file:text-[#1E90FF] file:font-semibold cursor-pointer"
                />
                {pdfFile && (
                  <p className="mt-1 text-xs text-slate-500">
                    Selected: <span className="font-medium">{pdfFile.name}</span> ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {isUploadingPdf && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#1E90FF]">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 border border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
                        Uploading PDF…
                      </span>
                      <span className="font-semibold tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E90FF] rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Badges Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookForm.featured}
                    onChange={(e) => setBookForm({ ...bookForm, featured: e.target.checked })}
                    className="rounded border-slate-300 text-[#1E90FF] focus:ring-[#1E90FF]"
                  />
                  <span className="font-semibold text-slate-700">Mark as Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookForm.bestseller}
                    onChange={(e) => setBookForm({ ...bookForm, bestseller: e.target.checked })}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Mark as Best Seller</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingBook ? 'Save Changes' : 'Publish Book'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
