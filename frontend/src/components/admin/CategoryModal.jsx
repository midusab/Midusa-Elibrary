import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud, FiImage } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  categoryForm,
  setCategoryForm,
  isSaving,
  handleSaveCategory
}) {
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(
    editingCategory?.image_url || categoryForm?.image_url || ''
  );
  const fileInputRef = useRef(null);

  /** Upload image to /api/upload/image and store URL in form */
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);

      const token = JSON.parse(localStorage.getItem('user') || '{}')?.token;
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      setCategoryForm((prev) => ({ ...prev, image_url: data.url }));
    } catch (err) {
      console.error('[CategoryModal] Image upload error:', err);
    } finally {
      setImageUploading(false);
    }
  }

  function handleClose() {
    setImagePreview('');
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full border border-slate-200"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Catalogue Category' : 'Add New Category'}
              </h3>
              <button
                onClick={handleClose}
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

              {/* Category Image */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Image
                </label>

                {/* Preview */}
                {(imagePreview || categoryForm.image_url) && (
                  <div className="relative mb-2 w-full h-36 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={imagePreview || categoryForm.image_url}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setCategoryForm((prev) => ({ ...prev, image_url: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                      title="Remove image"
                    >
                      <FiX className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                  </div>
                )}

                {/* Upload area */}
                {!imagePreview && !categoryForm.image_url && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-slate-300 rounded-md py-6 flex flex-col items-center gap-2 text-slate-500 hover:border-[#1E90FF] hover:text-[#1E90FF] transition-colors cursor-pointer bg-slate-50"
                  >
                    <FiImage className="w-6 h-6" />
                    <span className="text-xs font-medium">Click to upload category image</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP · max 10 MB</span>
                  </button>
                )}

                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[#1E90FF] font-medium mt-1 hover:underline cursor-pointer"
                  >
                    <FiUploadCloud className="w-3.5 h-3.5" />
                    {imageUploading ? 'Uploading...' : 'Change image'}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || imageUploading}
                  className="px-5 py-2 rounded-md bg-[#1E90FF] hover:bg-[#1873cc] text-white font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Save' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
