const { prisma } = require('../config/database');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

/**
 * Record a public site visit (pageview)
 */
const recordSiteVisit = async (req, res) => {
  try {
    const { visitorId, userId, pagePath, referrer } = req.body || {};
    
    await prisma.site_visits.create({
      data: {
        visitor_id: visitorId || null,
        user_id: isUuid(userId) ? userId : null,
        page_path: pagePath || '/',
        referrer: referrer || null
      }
    });

    res.json({ success: true, message: 'Visit recorded' });
  } catch (error) {
    console.error('Error recording site visit:', error);
    // Return success anyway so frontend is not blocked
    res.json({ success: false, error: error.message });
  }
};

/**
 * Get all registered customers / users for admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        avatar: true,
        created_at: true,
        orders: {
          select: {
            id: true,
            amount: true,
            status: true,
            created_at: true,
            items: {
              include: {
                books: {
                  select: {
                    id: true,
                    title: true,
                    author: true,
                    price: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Format users for frontend consumption
    const formatted = users.map(u => {
      const orders = (u.orders || []).map(o => ({
        id: o.id,
        amount: Number(o.amount) || 0,
        status: o.status,
        createdAt: o.created_at,
        items: (o.items || []).map(it => ({
          book: it.books ? {
            id: it.books.id,
            title: it.books.title,
            author: it.books.author,
            price: it.books.price
          } : null,
          quantity: it.quantity || 1,
          price: Number(it.price) || 0
        }))
      }));

      const completedOrders = orders.filter(o => o.status === 'completed');
      const totalSpent = completedOrders.reduce((sum, o) => sum + o.amount, 0);

      // Collect unique purchased titles
      const purchasedTitles = [];
      orders.forEach(o => {
        (o.items || []).forEach(it => {
          if (it.book?.title && !purchasedTitles.includes(it.book.title)) {
            purchasedTitles.push(it.book.title);
          }
        });
      });

      return {
        id: u.id,
        fullname: u.fullname || 'Reader Member',
        email: u.email,
        role: u.role || 'user',
        avatar: u.avatar || '',
        createdAt: u.created_at,
        orders,
        orderCount: orders.length,
        completedOrderCount: completedOrders.length,
        totalSpent,
        purchasedTitles
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch registered users' });
  }
};

/**
 * Get comprehensive analytics including:
 * - Customer growth trends (Growth / Declines / Neutral) dependent on sales, visits, and new users
 * - Most clicked book ("which book is clicked most") with click rankings
 * - Sales and revenue metrics
 * - Daily trend breakdown for charts
 */
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [allBooks, allCategories, allUsers, allOrders, allVisits, allClicks] = await Promise.all([
      prisma.books.findMany({
        include: { categories: true },
        orderBy: { clicks_count: 'desc' }
      }),
      prisma.categories.findMany(),
      prisma.users.findMany({
        orderBy: { created_at: 'desc' }
      }),
      prisma.orders.findMany({
        include: {
          items: {
            include: { books: true }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.site_visits.findMany({
        orderBy: { created_at: 'desc' }
      }),
      prisma.book_clicks.findMany({
        orderBy: { created_at: 'desc' }
      })
    ]);

    // ─── 1. Basic totals ───────────────────────────────────────────────────────
    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalSales = completedOrders.length;
    const totalOrders = allOrders.length;
    const totalBooks = allBooks.length;
    const totalUsers = allUsers.length;
    const totalVisits = allVisits.length;
    const totalClicks = allBooks.reduce((sum, b) => sum + (b.clicks_count || 0), 0);

    // ─── 2. Calculate purchase counts per book ─────────────────────────────────
    const bookPurchaseCounts = {};
    allOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const bId = item.book_id || item.books?.id;
        if (bId) {
          bookPurchaseCounts[bId] = (bookPurchaseCounts[bId] || 0) + (item.quantity || 1);
        }
      });
    });

    // ─── 3. Identify Which Book Is Clicked Most ─────────────────────────────────
    const booksWithEngagement = allBooks.map(b => {
      const clicks = b.clicks_count || 0;
      const salesCount = bookPurchaseCounts[b.id] || 0;
      const conversionRate = clicks > 0 ? Math.min(100, Math.round((salesCount / clicks) * 100)) : (salesCount > 0 ? 100 : 0);

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.categories?.name || 'General',
        price: b.price,
        rating: b.rating ? parseFloat(b.rating) : 0,
        featured: b.featured,
        bestseller: b.bestseller,
        coverImage: b.cover_url || '',
        clicks,
        salesCount,
        conversionRate
      };
    });

    // Sort by clicks descending
    const sortedByClicks = [...booksWithEngagement].sort((a, b) => b.clicks - a.clicks);
    const mostClickedBook = sortedByClicks.length > 0 && sortedByClicks[0].clicks > 0
      ? sortedByClicks[0]
      : null;

    // Top 10 most clicked books
    const topClickedBooks = sortedByClicks.slice(0, 10);

    // Most purchased book
    let mostPurchasedBook = null;
    let maxPurchases = 0;
    booksWithEngagement.forEach(b => {
      if (b.salesCount > maxPurchases) {
        maxPurchases = b.salesCount;
        mostPurchasedBook = b;
      }
    });

    // ─── 4. Customer Growth & Decline Trends ──────────────────────────────────
    // Compare Current Period (last 7 days) vs Previous Period (14 to 7 days ago)
    const currentVisits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= sevenDaysAgo).length;
    const prevVisits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= fourteenDaysAgo && new Date(v.created_at) < sevenDaysAgo).length;

    const currentOrders = completedOrders.filter(o => o.created_at && new Date(o.created_at) >= sevenDaysAgo);
    const prevOrders = completedOrders.filter(o => o.created_at && new Date(o.created_at) >= fourteenDaysAgo && new Date(o.created_at) < sevenDaysAgo);

    const currentSales = currentOrders.length;
    const prevSales = prevOrders.length;

    const currentRevenue = currentOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const currentNewUsers = allUsers.filter(u => u.created_at && new Date(u.created_at) >= sevenDaysAgo).length;
    const prevNewUsers = allUsers.filter(u => u.created_at && new Date(u.created_at) >= fourteenDaysAgo && new Date(u.created_at) < sevenDaysAgo).length;

    // Helper for percentage change calculation
    const calcGrowth = (curr, prev) => {
      if (prev === 0) {
        return curr > 0 ? 100 : 0;
      }
      return Math.round(((curr - prev) / prev) * 100);
    };

    const salesGrowthRate = calcGrowth(currentSales, prevSales);
    const revenueGrowthRate = calcGrowth(currentRevenue, prevRevenue);
    const visitsGrowthRate = calcGrowth(currentVisits, prevVisits);
    const userGrowthRate = calcGrowth(currentNewUsers, prevNewUsers);

    // Dependent trend composite score (Sales 45%, Visits 30%, Customers 25%)
    const compositeScore = Math.round(
      (salesGrowthRate * 0.45) + (visitsGrowthRate * 0.30) + (userGrowthRate * 0.25)
    );

    let trendStatus = 'neutral';
    let trendLabel = 'Neutral / Steady';
    let trendSummary = 'Customer engagement and visit activity remain consistent and steady across the library.';

    if (compositeScore >= 10 || (currentSales > prevSales && currentVisits >= prevVisits)) {
      trendStatus = 'growth';
      trendLabel = 'Expanding / Growth';
      trendSummary = `Strong positive momentum! Sales increased by ${salesGrowthRate >= 0 ? '+' : ''}${salesGrowthRate}% and web traffic shifted ${visitsGrowthRate >= 0 ? '+' : ''}${visitsGrowthRate}% with ${currentNewUsers} new reader registrations.`;
    } else if (compositeScore <= -10 || (currentSales < prevSales && currentVisits < prevVisits)) {
      trendStatus = 'declining';
      trendLabel = 'Declining / Downturn';
      trendSummary = `Activity cooled down with sales moving ${salesGrowthRate}% and visits changing ${visitsGrowthRate}%. Consider promoting featured titles or discounted bundles to reignite engagement.`;
    } else {
      trendStatus = 'neutral';
      trendLabel = 'Neutral / Balanced';
      trendSummary = `Performance is balanced with ${totalSales} lifetime purchases and ${totalVisits} platform visits. Traffic and customer acquisition have remained stable.`;
    }

    // ─── 5. Daily Trend Timeline (Last 7 Days) for charts ─────────────────────
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - i);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      const dateStr = dStart.toISOString().split('T')[0];
      const dayLabel = dStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayVisits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= dStart && new Date(v.created_at) <= dEnd).length;
      const dayOrders = completedOrders.filter(o => o.created_at && new Date(o.created_at) >= dStart && new Date(o.created_at) <= dEnd);
      const daySales = dayOrders.length;
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const dayUsers = allUsers.filter(u => u.created_at && new Date(u.created_at) >= dStart && new Date(u.created_at) <= dEnd).length;
      const dayClicks = allClicks.filter(c => c.created_at && new Date(c.created_at) >= dStart && new Date(c.created_at) <= dEnd).length;

      dailyTrends.push({
        date: dateStr,
        label: dayLabel,
        visits: dayVisits,
        sales: daySales,
        revenue: dayRevenue,
        newUsers: dayUsers,
        clicks: dayClicks
      });
    }

    // ─── 6. Category performance stats ─────────────────────────────────────────
    const categoryStats = allCategories.map(cat => {
      const catBooks = booksWithEngagement.filter(b => b.category === cat.name);
      let catSales = 0;
      let catRevenue = 0;
      let catClicks = 0;

      catBooks.forEach(b => {
        catSales += b.salesCount;
        catClicks += b.clicks;
      });

      allOrders.forEach(order => {
        (order.items || []).forEach(it => {
          if (it.books?.category_id === cat.id || it.books?.categories?.name === cat.name) {
            if (order.status === 'completed') {
              catRevenue += (Number(it.price) || 0) * (it.quantity || 1);
            }
          }
        });
      });

      return {
        name: cat.name,
        bookCount: catBooks.length,
        totalSales: catSales,
        revenue: catRevenue,
        clicks: catClicks
      };
    });

    res.json({
      totalRevenue,
      totalSales,
      totalOrders,
      totalBooks,
      totalUsers,
      totalVisits,
      totalClicks,
      overallConversionRate: totalVisits > 0 ? Number(((totalSales / totalVisits) * 100).toFixed(1)) : 0,
      
      // Trend analytics
      trends: {
        status: trendStatus,
        label: trendLabel,
        summary: trendSummary,
        compositeScore,
        salesGrowthRate,
        revenueGrowthRate,
        visitsGrowthRate,
        userGrowthRate,
        comparison: {
          currentPeriod: {
            visits: currentVisits,
            sales: currentSales,
            revenue: currentRevenue,
            newUsers: currentNewUsers
          },
          previousPeriod: {
            visits: prevVisits,
            sales: prevSales,
            revenue: prevRevenue,
            newUsers: prevNewUsers
          }
        }
      },

      // Engagement & clicks
      mostClickedBook,
      topClickedBooks,
      mostPurchasedBook,

      // Charts data
      dailyTrends,
      categoryStats
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
};

/**
 * Auto-mark books as bestsellers based on order sales
 */
const autoMarkBestsellers = async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: { items: true }
    });

    const bookSalesMap = {};
    orders.forEach(order => {
      (order.items || []).forEach(it => {
        const bId = it.book_id;
        if (bId) {
          bookSalesMap[bId] = (bookSalesMap[bId] || 0) + (it.quantity || 1);
        }
      });
    });

    const bestsellerBookIds = Object.keys(bookSalesMap).filter(id => bookSalesMap[id] > 0);

    if (bestsellerBookIds.length > 0) {
      await prisma.books.updateMany({
        where: { id: { in: bestsellerBookIds } },
        data: { bestseller: true }
      });
    }

    res.json({
      message: 'Bestsellers synchronized successfully',
      count: bestsellerBookIds.length,
      bestsellerBookIds
    });
  } catch (error) {
    console.error('Error auto-marking bestsellers:', error);
    res.status(500).json({ error: 'Failed to auto-mark bestsellers' });
  }
};

/**
 * Reset revenue and transaction records (Admin only)
 */
const resetRevenue = async (req, res) => {
  try {
    // 1. Delete payments (foreign key to orders)
    await prisma.payments.deleteMany({});
    // 2. Delete order_items
    await prisma.order_items.deleteMany({});
    // 3. Delete orders
    await prisma.orders.deleteMany({});
    // 4. Delete purchases
    await prisma.purchases.deleteMany({});

    res.json({
      success: true,
      message: 'Platform revenue and transaction history reset to KSh 0.',
      revenue: 0,
      sales: 0,
    });
  } catch (error) {
    console.error('Error resetting revenue:', error);
    res.status(500).json({ error: 'Failed to reset revenue', details: error.message });
  }
};

module.exports = {
  recordSiteVisit,
  getUsers,
  getAnalytics,
  autoMarkBestsellers,
  resetRevenue,
};
