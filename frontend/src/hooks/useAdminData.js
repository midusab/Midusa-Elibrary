import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getBooks,
  getCategories,
  getAllOrders,
  getAdminUsers,
  getAdminAnalytics
} from '../services/api';
import { useToast } from '../context/ToastContext';

export function useAdminData(token) {
  const { error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sevenDaysAgo, setSevenDaysAgo] = useState(null);

  const loadDashboardData = useCallback(async (silent = false) => {
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
      setSevenDaysAgo(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      toastError('Could not refresh dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, toastError]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, loadDashboardData]);

  // Derived Analytics (Live calculated from real records)
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

    // Most clicked book
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
  }, [orders, books, usersList, analytics, sevenDaysAgo]);

  return {
    isLoading,
    isRefreshing,
    books,
    setBooks,
    categories,
    setCategories,
    orders,
    setOrders,
    usersList,
    setUsersList,
    analytics,
    derivedStats,
    loadDashboardData
  };
}
