import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLink } from 'react-icons/fi';

export default function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  categoryForm,
  setCategoryForm,
  isSaving,
  handleSaveCategory
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-none"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Catalogue Category' : 'Add New Category'}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs sm:text-sm">
              {/* Category Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Economics & Finance"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of books in this category..."
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none"
                />
              </div>

              {/* Category Image URL (Link-based, not local storage upload) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Image Link (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiLink className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or image web link"
                    value={categoryForm.image_url || ''}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, image_url: e.target.value })
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste any public image link (WebP, JPG, PNG) to display on category cards.
                </p>

                {/* Live Image Preview */}
                {categoryForm.image_url && (
                  <div className="relative mt-2.5 w-full h-32 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={categoryForm.image_url}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, image_url: '' })}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white text-slate-700 transition-colors shadow-none cursor-pointer"
                      title="Clear image URL"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-md bg-[#1E90FF] hover:bg-[#1873cc] text-white font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
