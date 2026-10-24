import { useState, useMemo } from 'react';
import {
  FiBook,
  FiPlus,
  FiDollarSign,
  FiUsers,
  FiLayers,
  FiTrendingUp,
  FiRefreshCw,
  FiFeather
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAdminData } from '../hooks/useAdminData';
import {
  createBook,
  updateBook,
  deleteBook,
  createCategory,
  updateCategory,
  deleteCategory,
  syncBestsellers,
  resetOrders,
  uploadPdf,
  uploadImage
} from '../services/api';

// Modular Admin Sub-Components
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminBooksTab from '../components/admin/AdminBooksTab';
import AdminCategoriesTab from '../components/admin/AdminCategoriesTab';
import AdminAuthorsTab from '../components/admin/AdminAuthorsTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminFlashSaleTab from '../components/admin/AdminFlashSaleTab';
import BookModal from '../components/admin/BookModal';
import CategoryModal from '../components/admin/CategoryModal';
import ReviewModal from '../components/admin/ReviewModal';
import { Flame } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const token = user?.token;
  const { success, error: toastError } = useToast();

  // Active Tab: 'overview' | 'books' | 'categories' | 'orders' | 'users'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data & Derived Metrics (Decoupled Hook)
  const {
    isLoading,
    isRefreshing,
    books,
    setBooks,
    categories,
    orders,
    usersList,
    derivedStats,
    loadDashboardData
  } = useAdminData(token);

  // Filters & Search State
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [trendViewMetric, setTrendViewMetric] = useState('visits'); // 'visits' | 'sales' | 'newUsers' | 'clicks'

  // Modals & Action States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    authorBio: '',
    description: '',
    category: '',
    coverImage: '',
    pdfUrl: '',
    price: '',
    rating: 5,
    featured: false,
    bestseller: false
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [coverFile, setCoverFile] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBookTarget, setReviewBookTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewerName: '',
    comment: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [bookModalError, setBookModalError] = useState(null);

  // -------------------------------------------------------------
  // Book Actions
  // -------------------------------------------------------------
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookModalError(null);
    setBookForm({
      title: '',
      author: '',
      authorBio: '',
      description: '',
      category: categories[0]?.name || 'General',
      coverImage: '',
      pdfUrl: '',
      price: '',
      discount: 0,
      rating: 5,
      featured: false,
      bestseller: false
    });
    setPdfFile(null);
    setCoverFile(null);
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book) => {
    setEditingBook(book);
    setBookModalError(null);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      authorBio: book.authorBio || book.author_bio || '',
      description: book.description || '',
      category: book.category || (categories[0]?.name || 'General'),
      coverImage: book.coverImage || '',
      pdfUrl: book.pdfUrl || '',
      price: book.price ?? '',
      discount: book.discount ?? book.discountPercent ?? 0,
      rating: book.rating ?? 5,
      featured: Boolean(book.featured),
      bestseller: Boolean(book.bestseller)
    });
    setPdfFile(null);
    setCoverFile(null);
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setBookModalError(null);

    if (!bookForm.title || !bookForm.author || !bookForm.category || !bookForm.price) {
      toastError('Please fill in all required book details.');
      return;
    }

    // Client-side instant duplicate check (prevents wasting time/bandwidth on PDF upload)
    const cleanTitle = (bookForm.title || '').trim().toLowerCase();
    const existingDuplicate = books.find(
      (b) =>
        b.title?.trim().toLowerCase() === cleanTitle &&
        (!editingBook || b.id !== editingBook.id)
    );
    if (existingDuplicate) {
      const duplicateMsg = `A book titled "${bookForm.title.trim()}" already exists in the library catalog. Duplicate books are not allowed.`;
      setBookModalError({
        type: 'duplicate',
        field: 'title',
        message: duplicateMsg,
        existingBookTitle: existingDuplicate.title
      });
      toastError(duplicateMsg);
      return;
    }

    setIsSaving(true);
    try {
      let coverImage = bookForm.coverImage;
      if (coverFile) {
        setIsUploadingCover(true);
        setCoverUploadProgress(0);
        try {
          coverImage = await uploadImage(coverFile, token, (pct) => setCoverUploadProgress(pct));
        } finally {
          setIsUploadingCover(false);
          setCoverUploadProgress(0);
        }
      }

      let pdfUrl = bookForm.pdfUrl;
      if (pdfFile) {
        setIsUploadingPdf(true);
        setUploadProgress(0);
        try {
          pdfUrl = await uploadPdf(pdfFile, token, (pct) => setUploadProgress(pct));
        } finally {
          setIsUploadingPdf(false);
          setUploadProgress(0);
        }
      }

      if (!editingBook && !pdfUrl && !pdfFile) {
        const pdfErrorMsg = 'Please select or upload a PDF file for this new eBook.';
        setBookModalError({
          type: 'validation',
          field: 'pdf',
          message: pdfErrorMsg
        });
        toastError(pdfErrorMsg);
        setIsSaving(false);
        return;
      }

      const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';
      const payload = {
        ...bookForm,
        coverImage: coverImage?.trim() || defaultCover,
        pdfUrl,
        price: parseFloat(bookForm.price),
        discount: parseInt(bookForm.discount) || 0,
        rating: parseFloat(bookForm.rating || 5)
      };

      if (editingBook) {
        await updateBook(editingBook.id, payload, token);
        success('Book updated successfully.');
      } else {
        await createBook(payload, token);
        success('New book published to library.');
      }
      setPdfFile(null);
      setCoverFile(null);
      setBookModalError(null);
      setIsBookModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      const rawMsg = err.message || '';
      const lower = rawMsg.toLowerCase();
      let errMsg = rawMsg || 'Failed to save book.';

      const isDuplicate =
        err.status === 409 ||
        err.code === 'DUPLICATE_BOOK' ||
        lower.includes('already exists') ||
        lower.includes('duplicate');

      if (isDuplicate) {
        errMsg = `A book titled "${bookForm.title.trim()}" already exists in the library. Duplicate titles are not allowed.`;
        setBookModalError({
          type: 'duplicate',
          field: 'title',
          message: errMsg
        });
      } else if (lower.includes('jwt') || lower.includes('token') || lower.includes('401') || lower.includes('session')) {
        errMsg = 'Your administrator sign-in session has expired. Please sign in again.';
        setBookModalError({ type: 'error', message: errMsg });
      } else if (lower.includes('forbidden') || lower.includes('403') || lower.includes('administrator')) {
        errMsg = 'Administrator access required to publish books.';
        setBookModalError({ type: 'error', message: errMsg });
      } else if (lower.includes('size') || lower.includes('150 mb') || lower.includes('limit_file_size')) {
        errMsg = 'The selected file is too large. PDFs must be under 150 MB and images under 25 MB.';
        setBookModalError({ type: 'error', message: errMsg });
      } else {
        setBookModalError({
          type: 'error',
          message: errMsg
        });
      }
      toastError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }
    setDeletingId(bookId);
    try {
      await deleteBook(bookId, token);
      success('Book removed from library.');
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to delete book.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFeatured = async (book) => {
    try {
      const updated = !book.featured;
      await updateBook(book.id, { featured: updated }, token);
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, featured: updated } : b))
      );
      success(updated ? `Marked "${book.title}" as Featured.` : `Removed "${book.title}" from Featured.`);
    } catch (err) {
      toastError(err.message || 'Failed to update featured status.');
    }
  };

  const handleToggleBestseller = async (book) => {
    try {
      const updated = !book.bestseller;
      await updateBook(book.id, { bestseller: updated }, token);
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, bestseller: updated } : b))
      );
      success(updated ? `Marked "${book.title}" as Best Seller.` : `Removed Best Seller mark.`);
    } catch (err) {
      toastError(err.message || 'Failed to update bestseller flag.');
    }
  };

  const handleSyncBestsellers = async () => {
    try {
      const res = await syncBestsellers(token);
      success(`Bestsellers synchronized! Updated ${res.count || 0} title(s) based on real sales.`);
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Could not synchronize bestsellers.');
    }
  };

  // -------------------------------------------------------------
  // Review & Rating Modal Actions
  // -------------------------------------------------------------
  const handleOpenReviewModal = (book) => {
    setReviewBookTarget(book);
    setReviewForm({
      rating: book.rating || 5,
      reviewerName: '',
      comment: ''
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveRatingReview = async (e) => {
    e.preventDefault();
    if (!reviewBookTarget) return;

    setIsSaving(true);
    try {
      await updateBook(
        reviewBookTarget.id,
        { rating: parseFloat(reviewForm.rating) },
        token
      );
      success(`Updated rating for "${reviewBookTarget.title}" to ${reviewForm.rating} ★`);
      setIsReviewModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to update rating.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Category Actions
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name || '', description: cat.description || '' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toastError('Please enter a category name.');
      return;
    }
    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm, token);
        success('Category updated successfully.');
      } else {
        await createCategory(categoryForm, token);
        success('New category added to catalogue.');
      }
      setIsCategoryModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category? Books in this category may become unassigned.')) {
      return;
    }
    try {
      await deleteCategory(catId, token);
      success('Category removed from catalogue.');
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to delete category.');
    }
  };

  // Order statuses are auto-managed by M-Pesa payment callbacks.
  // No manual override handler needed.

  const handleResetOrders = async () => {
    if (!window.confirm(
      'Reset ALL orders, payments, and purchase records?\n\nThis clears stale/test data so M-Pesa auto-confirmation runs on a clean slate.\n\nThis cannot be undone.'
    )) return;
    try {
      await resetOrders(token);
      success('All orders cleared. New orders will be auto-confirmed by M-Pesa.');
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to reset orders.');
    }
  };

  // -------------------------------------------------------------
  // Filtered Sets
  // -------------------------------------------------------------
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !bookSearch ||
        b.title?.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.author?.toLowerCase().includes(bookSearch.toLowerCase());
      const matchCat =
        bookCategoryFilter === 'all' || b.category === bookCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [books, bookSearch, bookCategoryFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === 'all') return true;
      return o.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return (
        u.fullname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [usersList, userSearch, userRoleFilter]);

  if (isLoading) {
    return (
      <div className="min-h-[75vh] bg-slate-50/50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#1E90FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Connecting to Admin Portal...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving catalogue, orders, and platform metrics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ========================================================= */}
        {/* Header Section */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 text-[#1E90FF] text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1E90FF] animate-pulse" />
              Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Platform Administration
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage eBook catalogue, orders, reader accounts, and live platform analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
            >
              <FiRefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleOpenAddBook}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs sm:text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              <span>Post New Book</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Navigation Tabs */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Trends', icon: FiTrendingUp },
            { id: 'flashsale', label: 'Flash Sale', icon: Flame },
            { id: 'users', label: `Registered Customers (${usersList.length})`, icon: FiUsers },
            { id: 'books', label: `Books (${books.length})`, icon: FiBook },
            { id: 'authors', label: 'Authors & Bios', icon: FiFeather },
            { id: 'categories', label: `Catalogue (${categories.length})`, icon: FiLayers },
            { id: 'orders', label: `Orders (${orders.length})`, icon: FiDollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1E90FF] text-white font-bold'
                    : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* MODULAR TAB OUTLETS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            derivedStats={derivedStats}
            categories={categories}
            books={books}
            trendViewMetric={trendViewMetric}
            setTrendViewMetric={setTrendViewMetric}
          />
        )}

        {activeTab === 'books' && (
          <AdminBooksTab
            books={books}
            filteredBooks={filteredBooks}
            categories={categories}
            bookSearch={bookSearch}
            setBookSearch={setBookSearch}
            bookCategoryFilter={bookCategoryFilter}
            setBookCategoryFilter={setBookCategoryFilter}
            handleSyncBestsellers={handleSyncBestsellers}
            handleOpenAddBook={handleOpenAddBook}
            handleOpenEditBook={handleOpenEditBook}
            handleDeleteBook={handleDeleteBook}
            deletingId={deletingId}
            handleOpenReviewModal={handleOpenReviewModal}
            handleToggleFeatured={handleToggleFeatured}
            handleToggleBestseller={handleToggleBestseller}
          />
        )}

        {activeTab === 'authors' && (
          <AdminAuthorsTab
            token={token}
            books={books}
            onRefresh={() => loadDashboardData(true)}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesTab
            categories={categories}
            books={books}
            handleOpenAddCategory={handleOpenAddCategory}
            handleOpenEditCategory={handleOpenEditCategory}
            handleDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            filteredOrders={filteredOrders}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            handleResetOrders={handleResetOrders}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersTab
            usersList={usersList}
            filteredUsers={filteredUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            derivedStats={derivedStats}
          />
        )}

        {activeTab === 'flashsale' && (
          <AdminFlashSaleTab
            token={token}
            books={books}
          />
        )}

        {/* ========================================================= */}
        {/* MODULAR MODALS */}
        {/* ========================================================= */}
        <BookModal
          isOpen={isBookModalOpen}
          onClose={() => {
            setIsBookModalOpen(false);
            setBookModalError(null);
          }}
          editingBook={editingBook}
          bookForm={bookForm}
          setBookForm={setBookForm}
          categories={categories}
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          isUploadingPdf={isUploadingPdf}
          uploadProgress={uploadProgress}
          coverFile={coverFile}
          setCoverFile={setCoverFile}
          isUploadingCover={isUploadingCover}
          coverUploadProgress={coverUploadProgress}
          isSaving={isSaving}
          handleSaveBook={handleSaveBook}
          modalError={bookModalError}
          setModalError={setBookModalError}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          editingCategory={editingCategory}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          isSaving={isSaving}
          handleSaveCategory={handleSaveCategory}
        />

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          reviewBookTarget={reviewBookTarget}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          isSaving={isSaving}
          handleSaveRatingReview={handleSaveRatingReview}
        />
      </div>
    </div>
  );
}
