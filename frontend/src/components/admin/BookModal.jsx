import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  UploadCloud,
  Loader2,
  HelpCircle
} from 'lucide-react';

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
  coverFile,
  setCoverFile,
  isUploadingCover,
  coverUploadProgress,
  isSaving,
  uploadStage = 'idle',
  handleSaveBook,
  modalError,
  setModalError
}) {
  const isBusy = isSaving || isUploadingCover || isUploadingPdf;

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setCoverFile(null);
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      if (setModalError) {
        setModalError({
          type: 'upload_cover',
          field: 'cover',
          message: 'Unsupported format. Please select an image file (JPG, PNG, or WebP).'
        });
      }
      e.target.value = '';
      return;
    }

    const maxCoverBytes = 25 * 1024 * 1024;
    if (file.size > maxCoverBytes) {
      if (setModalError) {
        setModalError({
          type: 'upload_cover',
          field: 'cover',
          message: `Cover image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 25 MB.`
        });
      }
      e.target.value = '';
      return;
    }

    if (setModalError && modalError?.field === 'cover') {
      setModalError(null);
    }
    setCoverFile(file);
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPdfFile(null);
      return;
    }

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (setModalError) {
        setModalError({
          type: 'upload_pdf',
          field: 'pdf',
          message: 'Unsupported format. Please select a valid PDF file (.pdf).'
        });
      }
      e.target.value = '';
      return;
    }

    const maxPdfBytes = 150 * 1024 * 1024;
    if (file.size > maxPdfBytes) {
      if (setModalError) {
        setModalError({
          type: 'upload_pdf',
          field: 'pdf',
          message: `eBook PDF is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 150 MB.`
        });
      }
      e.target.value = '';
      return;
    }

    if (setModalError && modalError?.field === 'pdf') {
      setModalError(null);
    }
    setPdfFile(file);
    setBookForm((prev) => ({ ...prev, pdfUrl: '' }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200/90 shadow-2xl my-8 relative max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {editingBook ? 'Edit Book Details' : 'Publish New eBook'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add verified titles to the library catalog with automated digital download links.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Container with Scroll */}
            <div className="overflow-y-auto pr-1 -mr-1 py-4 flex-1 space-y-4">
              {/* Contextual Error / Warning Banner */}
              {modalError && (
                <div
                  role="alert"
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
                    modalError.type === 'duplicate' || modalError.type === 'upload_pdf' || modalError.type === 'upload_cover'
                      ? 'bg-red-50/90 border-[#F40009]/30 text-red-950 shadow-xs'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                      modalError.type === 'duplicate' || modalError.type === 'upload_pdf' || modalError.type === 'upload_cover'
                        ? 'bg-[#F40009] text-white shadow-xs'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>
                          {modalError.type === 'duplicate'
                            ? 'Book Already Exists'
                            : modalError.type === 'upload_pdf'
                            ? 'PDF Upload Failed'
                            : modalError.type === 'upload_cover'
                            ? 'Cover Upload Failed'
                            : modalError.type === 'validation'
                            ? 'Missing Information'
                            : 'Unable to Publish Book'}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md ${
                            modalError.type === 'duplicate' || modalError.type === 'upload_pdf' || modalError.type === 'upload_cover'
                              ? 'bg-[#F40009] text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {modalError.type === 'duplicate'
                            ? 'Duplicate Title'
                            : modalError.type === 'upload_pdf'
                            ? 'Upload Error'
                            : modalError.type === 'upload_cover'
                            ? 'Image Error'
                            : 'Notice'}
                        </span>
                      </h4>
                      {setModalError && (
                        <button
                          type="button"
                          onClick={() => setModalError(null)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded-md hover:bg-slate-200/50 transition-colors"
                          aria-label="Dismiss error banner"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                      {modalError.message}
                    </p>

                    {modalError.type === 'duplicate' && (
                      <div className="mt-2.5 pt-2 border-t border-red-200/60 text-[11px] text-[#F40009] font-semibold">
                        Tip: Choose a unique title, or search for the existing book in the catalogue table to edit its details.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form id="bookModalForm" onSubmit={handleSaveBook} className="space-y-4 text-xs sm:text-sm">
                {/* 1. Title */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Book Title *</span>
                    {modalError?.field === 'title' && (
                      <span className="text-[11px] text-[#F40009] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Required & Must be unique
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isBusy}
                    placeholder="e.g. Master Your Mindset"
                    value={bookForm.title}
                    onChange={(e) => {
                      setBookForm({ ...bookForm, title: e.target.value });
                      if (modalError?.field === 'title' && setModalError) setModalError(null);
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all focus:outline-none disabled:bg-slate-100 disabled:opacity-70 ${
                      modalError?.field === 'title'
                        ? 'border-[#F40009] bg-red-50/20 ring-2 ring-[#F40009]/20 focus:border-[#F40009]'
                        : 'border-slate-200 focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]'
                    }`}
                  />
                </div>

                {/* 2. Author & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Author *</span>
                      {modalError?.field === 'author' && (
                        <span className="text-[11px] text-[#F40009] font-bold">Required</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isBusy}
                      placeholder="e.g. Dr. Robert Greene"
                      value={bookForm.author}
                      onChange={(e) => {
                        setBookForm({ ...bookForm, author: e.target.value });
                        if (modalError?.field === 'author' && setModalError) setModalError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none disabled:bg-slate-100 ${
                        modalError?.field === 'author'
                          ? 'border-[#F40009] bg-red-50/20 ring-2 ring-[#F40009]/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Category *</span>
                      {modalError?.field === 'category' && (
                        <span className="text-[11px] text-[#F40009] font-bold">Required</span>
                      )}
                    </label>
                    <select
                      disabled={isBusy}
                      value={bookForm.category}
                      onChange={(e) => {
                        setBookForm({ ...bookForm, category: e.target.value });
                        if (modalError?.field === 'category' && setModalError) setModalError(null);
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] bg-white cursor-pointer disabled:bg-slate-100"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Author Biography */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Author Biography
                  </label>
                  <textarea
                    rows={2}
                    disabled={isBusy}
                    placeholder="Author background, credentials, and published authority..."
                    value={bookForm.authorBio || ''}
                    onChange={(e) => setBookForm({ ...bookForm, authorBio: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none text-xs sm:text-sm disabled:bg-slate-100"
                  />
                </div>

                {/* 4. Pricing, Discount, Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Price (KSH) *</span>
                      {modalError?.field === 'price' && (
                        <span className="text-[11px] text-[#F40009] font-bold">Invalid</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      disabled={isBusy}
                      placeholder="150"
                      value={bookForm.price}
                      onChange={(e) => {
                        setBookForm({ ...bookForm, price: e.target.value });
                        if (modalError?.field === 'price' && setModalError) setModalError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none disabled:bg-slate-100 ${
                        modalError?.field === 'price'
                          ? 'border-[#F40009] bg-red-50/20 ring-2 ring-[#F40009]/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Discount Offer (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      disabled={isBusy}
                      placeholder="0"
                      value={bookForm.discount ?? 0}
                      onChange={(e) => setBookForm({ ...bookForm, discount: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] disabled:bg-slate-100"
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
                      disabled={isBusy}
                      value={bookForm.rating}
                      onChange={(e) => setBookForm({ ...bookForm, rating: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* 5. Description */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Book Synopsis & Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    disabled={isBusy}
                    placeholder="Brief overview of the book contents, lessons, and value..."
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none disabled:bg-slate-100"
                  />
                </div>

                {/* 6. Cover Image Upload */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    modalError?.field === 'cover'
                      ? 'border-[#F40009] bg-red-50/20 ring-2 ring-[#F40009]/20'
                      : 'border-slate-200/90 bg-slate-50/50'
                  }`}
                >
                  <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#1E90FF]" />
                      <span>Book Cover Image (File or URL)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Max 25 MB</span>
                  </label>

                  <div className="space-y-2 mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isBusy}
                      onChange={handleCoverSelect}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#1E90FF]/10 file:text-[#1E90FF] file:font-semibold cursor-pointer text-xs disabled:opacity-50"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Or Web URL</span>
                      <input
                        type="url"
                        disabled={isBusy}
                        placeholder="https://images.unsplash.com/photo-..."
                        value={bookForm.coverImage}
                        onChange={(e) => {
                          setBookForm({ ...bookForm, coverImage: e.target.value });
                          if (e.target.value) setCoverFile(null);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] text-xs disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {coverFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">{coverFile.name}</span>
                      <span className="text-slate-400 flex-shrink-0">
                        ({(coverFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  )}

                  {/* Cover Upload Progress */}
                  {isUploadingCover && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#1E90FF] font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Cover to Storage…</span>
                        </span>
                        <span className="tabular-nums font-mono">{coverUploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E90FF] rounded-full transition-all duration-200"
                          style={{ width: `${coverUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. eBook PDF Upload */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    modalError?.field === 'pdf'
                      ? 'border-[#F40009] bg-red-50/20 ring-2 ring-[#F40009]/20'
                      : 'border-slate-200/90 bg-slate-50/50'
                  }`}
                >
                  <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#1E90FF]" />
                      <span>eBook PDF Document *</span>
                      {bookForm.pdfUrl && !pdfFile && (
                        <a
                          href={bookForm.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-[#00A651] font-semibold hover:underline inline-flex items-center gap-0.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Current File Attached</span>
                        </a>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Max 150 MB</span>
                  </label>

                  <div className="space-y-2 mt-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      disabled={isBusy}
                      onChange={handlePdfSelect}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#1E90FF]/10 file:text-[#1E90FF] file:font-semibold cursor-pointer text-xs disabled:opacity-50"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Or Cloud URL</span>
                      <input
                        type="url"
                        disabled={isBusy}
                        placeholder="https://.../my-book.pdf"
                        value={bookForm.pdfUrl}
                        onChange={(e) => {
                          setBookForm({ ...bookForm, pdfUrl: e.target.value });
                          if (e.target.value) setPdfFile(null);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] text-xs disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {pdfFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <FileText className="w-4 h-4 text-[#1E90FF] flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">{pdfFile.name}</span>
                      <span className="text-slate-400 flex-shrink-0">
                        ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}

                  {/* PDF Upload Progress */}
                  {isUploadingPdf && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#1E90FF] font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading eBook PDF to Secure Storage…</span>
                        </span>
                        <span className="tabular-nums font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E90FF] rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Promotional Badges */}
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={isBusy}
                      checked={bookForm.featured}
                      onChange={(e) => setBookForm({ ...bookForm, featured: e.target.checked })}
                      className="rounded border-slate-300 text-[#1E90FF] focus:ring-[#1E90FF]"
                    />
                    <span className="font-semibold text-slate-700 text-xs sm:text-sm">Mark as Featured</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={isBusy}
                      checked={bookForm.bestseller}
                      onChange={(e) => setBookForm({ ...bookForm, bestseller: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-700 text-xs sm:text-sm">Mark as Best Seller</span>
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer / Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-shrink-0 mt-2">
              <div className="text-xs text-slate-500 hidden sm:block">
                {isBusy && (
                  <span className="inline-flex items-center gap-1.5 text-[#1E90FF] font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {uploadStage === 'cover'
                        ? 'Uploading cover image…'
                        : uploadStage === 'pdf'
                        ? 'Uploading PDF document…'
                        : 'Publishing catalog record…'}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isBusy}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="bookModalForm"
                  disabled={isBusy}
                  className="px-5 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {uploadStage === 'cover'
                      ? `Uploading Cover (${coverUploadProgress}%)...`
                      : uploadStage === 'pdf'
                      ? `Uploading PDF (${uploadProgress}%)...`
                      : uploadStage === 'saving' || isSaving
                      ? 'Publishing Book…'
                      : editingBook
                      ? 'Save Changes'
                      : 'Publish Book'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
