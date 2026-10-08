import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiBook,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiLayers,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiMousePointer,
  FiBarChart2,
  FiArrowUpRight,
  FiPercent,
  FiCalendar,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiAward,
  FiEye
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllOrders,
  updateOrderStatus,
  getAdminUsers,
  getAdminAnalytics,
  syncBestsellers,
  uploadPdf
} from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const token = user?.token;
  const { success, error: toastError } = useToast();

  // Active Tab: 'overview' | 'books' | 'categories' | 'orders' | 'users'
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Refreshing States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Data States (strictly real API data, no dummy data)
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Filters & Search
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [trendViewMetric, setTrendViewMetric] = useState('visits'); // 'visits' | 'sales' | 'newUsers' | 'clicks'

  // Modals
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
  const [pdfFile, setPdfFile] = useState(null);       // raw File from picker
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);  // 0-100

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
  // Data Fetching
  // -------------------------------------------------------------
  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [booksRes, catsRes, ordersRes, usersRes, analyticsRes] = await Promise.all([
        getBooks({ limit: 100 }),
        getCategories(),
        getAllOrders(token),
        getAdminUsers(token),
        getAdminAnalytics(token)
      ]);

      setBooks(Array.isArray(booksRes?.books) ? booksRes.books : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setOrders(Array.isArray(ordersRes?.orders) ? ordersRes.orders : []);
      setUsersList(Array.isArray(usersRes) ? usersRes : []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      toastError('Could not refresh dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    async function init() {
      await loadDashboardData();
    }
    init();
  }, [token]);

  // -------------------------------------------------------------
  // Derived Analytics (Live calculated from real records)
  // -------------------------------------------------------------
  const derivedStats = useMemo(() => {
    const totalRev = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalSalesCount = orders.filter((o) => o.status === 'completed').length;
    const totalTitles = books.length;
    const totalMembers = usersList.length;

    // Calculate most purchased book from real order items
    const purchaseCounts = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const id = item.bookId || item.book?.id;
        if (id) {
          purchaseCounts[id] = (purchaseCounts[id] || 0) + (item.quantity || 1);
        }
      });
    });

    let topPurchasedBook = null;
    let maxPurchases = 0;
    Object.entries(purchaseCounts).forEach(([bId, count]) => {
      if (count > maxPurchases) {
        maxPurchases = count;
        const bObj = books.find((b) => b.id === bId);
        if (bObj) topPurchasedBook = { ...bObj, salesCount: count };
      }
    });

    // Most clicked book (real clicks from backend analytics or books array)
    let topClicked = analytics?.mostClickedBook || null;
    if (topClicked && (topClicked.clicks || 0) === 0) {
      topClicked = null;
    }
    if (!topClicked && books.some((b) => (b.clicks || 0) > 0)) {
      topClicked = books.reduce((top, b) => ((b.clicks || 0) > (top?.clicks || 0) ? b : top), null);
    }

    const topClickedBooks = (analytics?.topClickedBooks && analytics.topClickedBooks.length > 0)
      ? analytics.topClickedBooks
      : [...books].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10).map((b) => ({
          ...b,
          salesCount: purchaseCounts[b.id] || 0,
          conversionRate: (b.clicks || 0) > 0 ? Math.min(100, Math.round(((purchaseCounts[b.id] || 0) / b.clicks) * 100)) : 0
        }));

    // Compute once inside useMemo so it's stable and never called during render
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      revenue: analytics?.totalRevenue ?? totalRev,
      sales: analytics?.totalSales ?? totalSalesCount,
      totalBooks: analytics?.totalBooks ?? totalTitles,
      totalUsers: analytics?.totalUsers ?? totalMembers,
      totalVisits: analytics?.totalVisits ?? 0,
      totalClicks: analytics?.totalClicks ?? books.reduce((sum, b) => sum + (b.clicks || 0), 0),
      overallConversionRate: analytics?.overallConversionRate ?? (analytics?.totalVisits > 0 ? Number(((totalSalesCount / analytics.totalVisits) * 100).toFixed(1)) : 0),
      trends: analytics?.trends || null,
      mostPurchased: analytics?.mostPurchasedBook || topPurchasedBook,
      mostClicked: topClicked,
      topClickedBooks,
      dailyTrends: analytics?.dailyTrends || [],
      categoryStats: analytics?.categoryStats || [],
      sevenDaysAgo
    };
  }, [orders, books, usersList, analytics]);

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

      // Upload PDF first if a new file was selected
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
    setIsRefreshing(true);
    try {
      const res = await syncBestsellers(token);
      success(`Bestsellers synchronized! Updated ${res.count || 0} title(s) based on real sales.`);
      loadDashboardData(true);
    } catch (err) {
      toastError(err.message || 'Could not synchronize bestsellers.');
      setIsRefreshing(false);
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
      // Update the rating on the book
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1E90FF] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & TRENDS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Metrics Grid (5 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {formatPrice(derivedStats.revenue)}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <FiArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    {derivedStats.trends?.salesGrowthRate ? `${derivedStats.trends.salesGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.salesGrowthRate}%` : 'Live'}
                  </span>
                  <span className="text-slate-400">settled sales</span>
                </div>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Sales
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center">
                    <FiShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {derivedStats.sales}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">Completed orders</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Platform Visits
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FiActivity className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {derivedStats.totalVisits.toLocaleString()}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="text-indigo-600 font-semibold flex items-center">
                    <FiTrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {derivedStats.trends?.visitsGrowthRate ? `${derivedStats.trends.visitsGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.visitsGrowthRate}%` : 'Active'}
                  </span>
                  <span className="text-slate-400">traffic</span>
                </div>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Registered Readers
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FiUsers className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {derivedStats.totalUsers}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="text-amber-600 font-semibold">
                    +{derivedStats.trends?.comparison?.currentPeriod?.newUsers ?? 0} new
                  </span>
                  <span className="text-slate-400">this week</span>
                </div>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Catalogue Titles
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FiBook className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {derivedStats.totalBooks}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">Across {categories.length} categories</p>
              </Card>
            </div>

            {/* ======================================================= */}
            {/* DYNAMIC TREND STATUS & DEPENDENT METRICS (Sales, Visits, Users) */}
            {/* ======================================================= */}
            <Card className="p-6 sm:p-7 bg-white border border-slate-200/80 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/50 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Trend Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <FiBarChart2 className="w-4 h-4 text-[#1E90FF]" />
                      Market & Growth Intelligence
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Customer Growth & Activity Trends
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                      {derivedStats.trends?.summary ||
                        'Platform activity evaluated live across reader acquisition, sales velocity, and site traffic.'}
                    </p>
                  </div>

                  {/* Trend Indicator Pill */}
                  <div className="flex items-center gap-3">
                    {derivedStats.trends?.status === 'growth' && (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <FiTrendingUp className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Trend: Growth</p>
                          <p className="text-[11px] text-emerald-600 font-medium">Customer base & traffic expanding</p>
                        </div>
                      </div>
                    )}
                    {derivedStats.trends?.status === 'declining' && (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <FiTrendingDown className="w-5 h-5 text-rose-600" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Trend: Declining</p>
                          <p className="text-[11px] text-rose-600 font-medium">Slowdown in recent orders / visits</p>
                        </div>
                      </div>
                    )}
                    {(!derivedStats.trends || derivedStats.trends?.status === 'neutral') && (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <FiActivity className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Trend: Neutral</p>
                          <p className="text-[11px] text-amber-700 font-medium">Stable reader & visit volume</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Dependent Factors Breakdown (Sales, Visits, Readers) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Driver 1: Sales Impact */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FiShoppingBag className="w-4 h-4 text-[#1E90FF]" />
                        Sales Momentum
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          (derivedStats.trends?.salesGrowthRate ?? 0) >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {(derivedStats.trends?.salesGrowthRate ?? 0) >= 0 ? '+' : ''}
                        {derivedStats.trends?.salesGrowthRate ?? 0}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Current 7 Days:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {derivedStats.trends?.comparison?.currentPeriod?.sales ?? 0} orders (
                          {formatPrice(derivedStats.trends?.comparison?.currentPeriod?.revenue ?? 0)})
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Prior 7 Days:</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {derivedStats.trends?.comparison?.previousPeriod?.sales ?? 0} orders (
                          {formatPrice(derivedStats.trends?.comparison?.previousPeriod?.revenue ?? 0)})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        Primary driver of customer financial retention and loyalty.
                      </p>
                    </div>
                  </div>

                  {/* Driver 2: Platform Visits */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FiActivity className="w-4 h-4 text-indigo-500" />
                        Platform Visits
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          (derivedStats.trends?.visitsGrowthRate ?? 0) >= 0
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {(derivedStats.trends?.visitsGrowthRate ?? 0) >= 0 ? '+' : ''}
                        {derivedStats.trends?.visitsGrowthRate ?? 0}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Current 7 Days:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {derivedStats.trends?.comparison?.currentPeriod?.visits ?? 0} visits
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Prior 7 Days:</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {derivedStats.trends?.comparison?.previousPeriod?.visits ?? 0} visits
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        Digital foot traffic discovering book previews & catalogue items.
                      </p>
                    </div>
                  </div>

                  {/* Driver 3: Reader Acquisition */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-amber-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FiUsers className="w-4 h-4 text-amber-500" />
                        Reader Acquisition
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          (derivedStats.trends?.userGrowthRate ?? 0) >= 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {(derivedStats.trends?.userGrowthRate ?? 0) >= 0 ? '+' : ''}
                        {derivedStats.trends?.userGrowthRate ?? 0}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Current 7 Days:</span>
                        <span className="text-sm font-bold text-slate-900">
                          +{derivedStats.trends?.comparison?.currentPeriod?.newUsers ?? 0} signups
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Prior 7 Days:</span>
                        <span className="text-xs font-semibold text-slate-600">
                          +{derivedStats.trends?.comparison?.previousPeriod?.newUsers ?? 0} signups
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        Net growth in registered accounts creating reader profiles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversion Efficiency Bar */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/40 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FiPercent className="w-4 h-4 text-[#1E90FF]" />
                    <span className="font-semibold text-slate-700">Platform Conversion Efficiency:</span>
                    <span className="text-slate-500">
                      Ratio of site visits converted into settled eBook purchases.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">
                      {derivedStats.overallConversionRate}%
                    </span>
                    <div className="w-28 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#1E90FF] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, derivedStats.overallConversionRate * 5))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ======================================================= */}
            {/* 7-DAY VISUAL TREND TIMELINE / BAR CHART */}
            {/* ======================================================= */}
            {derivedStats.dailyTrends.length > 0 && (
              <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-[#1E90FF]" />
                      7-Day Activity Progression
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daily breakdown tracking visits, sales transactions, signups, and reader clicks.
                    </p>
                  </div>

                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                    {[
                      { id: 'visits', label: 'Visits' },
                      { id: 'sales', label: 'Sales' },
                      { id: 'newUsers', label: 'Signups' },
                      { id: 'clicks', label: 'Book Clicks' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTrendViewMetric(m.id)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          trendViewMetric === m.id
                            ? 'bg-white text-slate-900 shadow-sm font-bold'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Bar Chart */}
                <div className="space-y-4">
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...derivedStats.dailyTrends.map((d) => d[trendViewMetric] || 0)
                    );
                    const colors = {
                      visits: 'bg-indigo-500 hover:bg-indigo-600',
                      sales: 'bg-emerald-500 hover:bg-emerald-600',
                      newUsers: 'bg-amber-500 hover:bg-amber-600',
                      clicks: 'bg-blue-500 hover:bg-blue-600'
                    };

                    return (
                      <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 items-end min-h-[160px]">
                        {derivedStats.dailyTrends.map((day, idx) => {
                          const val = day[trendViewMetric] || 0;
                          const heightPct = Math.max(12, Math.round((val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 group">
                              <span className="text-[11px] font-bold text-slate-700 opacity-90 group-hover:text-[#1E90FF] transition-colors">
                                {val}
                              </span>
                              <div className="w-full max-w-[42px] h-28 bg-slate-100 rounded-xl overflow-hidden flex items-end p-1">
                                <div
                                  className={`w-full ${colors[trendViewMetric]} rounded-lg transition-all duration-500`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                              <div className="text-center">
                                <span className="block text-[11px] font-bold text-slate-800">
                                  {day.label.split(',')[0]}
                                </span>
                                <span className="block text-[9px] text-slate-400">
                                  {day.date.slice(5)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </Card>
            )}

            {/* ======================================================= */}
            {/* HERO HIGHLIGHTS: WHICH BOOK IS CLICKED MOST & TOP SELLER */}
            {/* ======================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Highlight 1: WHICH BOOK IS CLICKED MOST */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Most Clicked eBook
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-100">
                      <FiMousePointer className="w-3.5 h-3.5 text-[#1E90FF]" /> #1 Most Viewed
                    </span>
                  </div>

                  {derivedStats.mostClicked ? (
                    <div className="flex gap-4 items-center mt-3">
                      <div className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-md border border-slate-200 relative group">
                        {derivedStats.mostClicked.coverImage ? (
                          <img
                            src={derivedStats.mostClicked.coverImage}
                            alt={derivedStats.mostClicked.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FiBook className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-[#1E90FF] uppercase tracking-wider block mb-0.5">
                          {derivedStats.mostClicked.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 truncate">
                          {derivedStats.mostClicked.title}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2 truncate">
                          by {derivedStats.mostClicked.author}
                        </p>
                        
                        {/* Click Metrics Badge Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            <FiMousePointer className="w-3.5 h-3.5 text-[#1E90FF]" />
                            {derivedStats.mostClicked.clicks ?? 0} Total Clicks
                          </span>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {formatPrice(derivedStats.mostClicked.price)}
                          </span>
                          {derivedStats.mostClicked.salesCount !== undefined && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              {derivedStats.mostClicked.salesCount} sold
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No clicks recorded yet. As readers browse the library, click traffic will register here.
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Tracked live across catalogue visits</span>
                  <span className="font-semibold text-[#1E90FF]">Top Reader Curiosity</span>
                </div>
              </Card>

              {/* Highlight 2: MOST PURCHASED BOOK */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Most Purchased eBook
                    </h3>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-100">
                      <FiAward className="w-3.5 h-3.5 text-amber-600" /> Top Seller
                    </span>
                  </div>

                  {derivedStats.mostPurchased ? (
                    <div className="flex gap-4 items-center mt-3">
                      <div className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-md border border-slate-200">
                        {derivedStats.mostPurchased.coverImage ? (
                          <img
                            src={derivedStats.mostPurchased.coverImage}
                            alt={derivedStats.mostPurchased.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FiBook className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">
                          {derivedStats.mostPurchased.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 truncate">
                          {derivedStats.mostPurchased.title}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2 truncate">
                          by {derivedStats.mostPurchased.author}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">
                            {formatPrice(derivedStats.mostPurchased.price)}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            {derivedStats.mostPurchased.salesCount ?? 0} units settled
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No purchases recorded yet. As orders are completed, the top-performing book will appear here.
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Auto-updated from live transactions</span>
                  <span className="font-semibold text-emerald-600">Top Revenue Driver</span>
                </div>
              </Card>
            </div>

            {/* ======================================================= */}
            {/* TOP CLICKED EBOOKS RANKING TABLE */}
            {/* ======================================================= */}
            <Card className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FiMousePointer className="w-4 h-4 text-[#1E90FF]" />
                    eBook Click & Reader Interest Rankings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Which books receive the highest reader views, clicks, and conversion to purchases.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60">
                  Top {derivedStats.topClickedBooks.length} titles ranked
                </span>
              </div>

              {derivedStats.topClickedBooks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                        <th className="py-3.5 px-4">eBook Title</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price</th>
                        <th className="py-3.5 px-4 text-center">Total Clicks</th>
                        <th className="py-3.5 px-4 text-center">Units Sold</th>
                        <th className="py-3.5 px-4 text-right">Click-to-Sale Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {derivedStats.topClickedBooks.map((b, idx) => {
                        const isTop = idx === 0;
                        const clicks = b.clicks || 0;
                        const sales = b.salesCount || 0;
                        const conv = b.conversionRate || (clicks > 0 ? Math.round((sales / clicks) * 100) : 0);

                        return (
                          <tr key={b.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : idx === 2
                                    ? 'bg-amber-50 text-amber-900'
                                    : 'text-slate-400'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                  {b.coverImage ? (
                                    <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <FiBook className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-slate-900 truncate">{b.title}</p>
                                  <p className="text-[11px] text-slate-500 truncate">by {b.author}</p>
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
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold border border-blue-100">
                                <FiMousePointer className="w-3 h-3" />
                                {clicks} clicks
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                              {sales}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{conv}%</span>
                                <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(8, conv * 2))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No book click data available yet.
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BOOKS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'books' && (
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
                              <FiMousePointer className="w-3 h-3" />
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
        )}

        {/* ========================================================= */}
        {/* TAB 3: CATALOGUE & CATEGORIES */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manage Categories</h3>
                <p className="text-xs text-slate-500">Organize books into browseable topics</p>
              </div>
              <button
                onClick={handleOpenAddCategory}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Catalogue</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const bookCount = books.filter((b) => b.category === cat.name).length;
                return (
                  <Card
                    key={cat.id || cat.name}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm">
                          {cat.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#1E90FF] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-1">{cat.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {cat.description || 'No description provided for this category.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{bookCount} eBook(s)</span>
                      <Link
                        to={`/library?category=${encodeURIComponent(cat.name)}`}
                        className="text-[#1E90FF] hover:underline font-semibold"
                      >
                        Browse →
                      </Link>
                    </div>
                  </Card>
                );
              })}

              {categories.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  No categories in the catalogue yet. Click "Add Catalogue" to create your first one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS & PAYMENTS */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
              {['all', 'completed', 'pending', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'all' ? `All Orders (${orders.length})` : st}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Items / eBooks</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Payment Status</th>
                        <th className="py-3.5 px-4 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                            #{ord.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900">
                                {ord.user?.fullname || 'Customer'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {ord.user?.email || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-xs">
                              {(ord.items || []).map((it, idx) => (
                                <p key={idx} className="text-xs text-slate-700 truncate">
                                  • {it.book?.title || 'eBook Item'} (×{it.quantity || 1})
                                </p>
                              ))}
                              {(!ord.items || ord.items.length === 0) && (
                                <span className="text-slate-400 text-xs">Direct Digital Order</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatPrice(ord.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ord.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1E90FF] bg-white cursor-pointer"
                            >
                              <option value="completed">Completed (Paid)</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <FiDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No orders recorded</p>
                  <p className="mt-0.5">Customer payments and checkout orders will be displayed here in real time.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REGISTERED CUSTOMERS (USERS) */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Customer KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Total Registered Members
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">{usersList.length}</h3>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center">
                    <FiUsers className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Active platform accounts</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Active Buyers
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {usersList.filter((u) => (u.orders || []).some((o) => o.status === 'completed')).length}
                  </h3>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FiShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Placed at least 1 completed purchase</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  New Signups (7 Days)
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {
                      usersList.filter((u) => {
                        if (!u.createdAt) return false;
                        return new Date(u.createdAt) >= derivedStats.sevenDaysAgo;
                      }).length
                    }
                  </h3>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FiTrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Recent member acquisition</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Total Member Spend
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {formatPrice(
                      usersList.reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
                    )}
                  </h3>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Cumulative revenue from readers</p>
              </Card>
            </div>

            {/* Search and Role Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative w-full sm:w-80">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search registered members by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {[
                    { id: 'all', label: `All (${usersList.length})` },
                    { id: 'user', label: `Readers (${usersList.filter((u) => u.role !== 'admin').length})` },
                    { id: 'admin', label: `Admins (${usersList.filter((u) => u.role === 'admin').length})` }
                  ].map((rf) => (
                    <button
                      key={rf.id}
                      onClick={() => setUserRoleFilter(rf.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        userRoleFilter === rf.id
                          ? 'bg-white text-slate-900 shadow-sm font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  Showing {filteredUsers.length} of {usersList.length}
                </span>
              </div>
            </div>

            {/* Registered Customers Table */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Customer / Reader</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Date Joined</th>
                        <th className="py-3.5 px-4 text-center">Orders Placed</th>
                        <th className="py-3.5 px-4">Lifetime Spend</th>
                        <th className="py-3.5 px-4">Purchased eBooks</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const userOrders = u.orders || [];
                        const completedOrders = userOrders.filter((o) => o.status === 'completed');
                        
                        // Calculate total spend
                        const userSpend = u.totalSpent !== undefined
                          ? u.totalSpent
                          : completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

                        // Collect unique titles of purchased books
                        const purchasedTitles = u.purchasedTitles || [];
                        if (purchasedTitles.length === 0) {
                          userOrders.forEach((o) => {
                            (o.items || []).forEach((it) => {
                              if (it.book?.title && !purchasedTitles.includes(it.book.title)) {
                                purchasedTitles.push(it.book.title);
                              }
                            });
                          });
                        }

                        const hasPurchases = completedOrders.length > 0;
                        const isNew = u.createdAt && new Date(u.createdAt) >= derivedStats.sevenDaysAgo;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.fullname}
                                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-xs ring-1 ring-blue-100">
                                    {u.fullname?.[0] || 'U'}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{u.fullname || 'Reader Member'}</p>
                                  <p className="text-[11px] text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  u.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role === 'admin' ? 'Administrator' : 'Reader'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'Recent'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-bold text-slate-900">
                                {completedOrders.length}
                              </span>
                              {userOrders.length > completedOrders.length && (
                                <span className="text-[10px] text-slate-400 block">
                                  ({userOrders.length} total)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {formatPrice(userSpend)}
                            </td>
                            <td className="py-3.5 px-4">
                              {purchasedTitles.length > 0 ? (
                                <div className="space-y-1 max-w-xs">
                                  {purchasedTitles.slice(0, 2).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block text-[11px] bg-blue-50 text-[#1E90FF] font-medium px-2 py-0.5 rounded-md mr-1.5 mb-0.5 truncate max-w-[200px]"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {purchasedTitles.length > 2 && (
                                    <span className="text-[10px] text-slate-400 block">
                                      +{purchasedTitles.length - 2} more titles
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Browsing / No orders yet</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {u.role === 'admin' ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold">
                                  Admin
                                </span>
                              ) : hasPurchases ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                                  Active Buyer
                                </span>
                              ) : isNew ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200/60">
                                  New Reader
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                                  Registered
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <FiUsers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No customers found</p>
                  <p className="mt-0.5">No registered members matched your search or filter.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: POST / EDIT BOOK */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isBookModalOpen && (
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
                    onClick={() => setIsBookModalOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] bg-white"
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
                        if (file) setBookForm(prev => ({ ...prev, pdfUrl: '' }));
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
                      onClick={() => setIsBookModalOpen(false)}
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

        {/* ========================================================= */}
        {/* MODAL: ADD / EDIT CATEGORY */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCategory ? 'Edit Catalogue Category' : 'Add New Category'}
                  </h3>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-4 text-xs sm:text-sm">
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
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                    />
                  </div>

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
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white font-semibold disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : editingCategory ? 'Save' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* MODAL: ADMIN RATING & REVIEW */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isReviewModalOpen && reviewBookTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Book Rating & Review</h3>
                    <p className="text-xs text-slate-500">
                      Set official rating for "{reviewBookTarget.title}"
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveRatingReview} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Rating Score (1.0 to 5.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      required
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-base font-bold text-amber-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-60"
                    >
                      {isSaving ? 'Updating...' : 'Save Rating & Review'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
