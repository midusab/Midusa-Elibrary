import { useState, useMemo } from 'react';
import {
  FiBook,
  FiPlus,
  FiDollarSign,
  FiUsers,
  FiLayers,
  FiTrendingUp,
  FiRefreshCw
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
  updateOrderStatus,
  syncBestsellers,
  uploadPdf
} from '../services/api';

// Modular Admin Sub-Components
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminBooksTab from '../components/admin/AdminBooksTab';
import AdminCategoriesTab from '../components/admin/AdminCategoriesTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import BookModal from '../components/admin/BookModal';
import CategoryModal from '../components/admin/CategoryModal';
import ReviewModal from '../components/admin/ReviewModal';

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
    setOrders,
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

  // -------------------------------------------------------------
  // Book Actions
  // -------------------------------------------------------------
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      description: '',
      category: categories[0]?.name || 'General',
      coverImage: '',
      pdfUrl: '',
      price: '',
      rating: 5,
      featured: false,
      bestseller: false
    });
    setPdfFile(null);
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      category: book.category || (categories[0]?.name || 'General'),
      coverImage: book.coverImage || '',
      pdfUrl: book.pdfUrl || '',
      price: book.price ?? '',
      rating: book.rating ?? 5,
      featured: Boolean(book.featured),
      bestseller: Boolean(book.bestseller)
    });
    setPdfFile(null);
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.category || !bookForm.price) {
      toastError('Please fill in all required book details.');
      return;
    }

    setIsSaving(true);
    try {
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

      const payload = {
        ...bookForm,
        pdfUrl,
        price: parseFloat(bookForm.price),
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
      setIsBookModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Failed to save book.');
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

  // -------------------------------------------------------------
  // Order Actions
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      success(`Order status updated to ${newStatus}.`);
    } catch (err) {
      toastError(err.message || 'Failed to update order status.');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1E90FF] animate-pulse" />
              Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <FiRefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleOpenAddBook}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer"
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
            { id: 'users', label: `Registered Customers (${usersList.length})`, icon: FiUsers },
            { id: 'books', label: `Books (${books.length})`, icon: FiBook },
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
                    ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            handleUpdateOrderStatus={handleUpdateOrderStatus}
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

        {/* ========================================================= */}
        {/* MODULAR MODALS */}
        {/* ========================================================= */}
        <BookModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          editingBook={editingBook}
          bookForm={bookForm}
          setBookForm={setBookForm}
          categories={categories}
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          isUploadingPdf={isUploadingPdf}
          uploadProgress={uploadProgress}
          isSaving={isSaving}
          handleSaveBook={handleSaveBook}
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
