const { prisma, supabase } = require('../config/database');
const { pushAsyncTask, getCache, setCache, delCachePattern } = require('../config/redis');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

/**
 * Record a public site visit (pageview) - queued asynchronously via Redis
 */
const recordSiteVisit = async (req, res) => {
  try {
    const { visitorId, userId, pagePath, referrer } = req.body || {};
    
    await pushAsyncTask('record_site_visit', {
      visitorId: visitorId || null,
      userId: isUuid(userId) ? userId : null,
      pagePath: pagePath || '/',
      referrer: referrer || null,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Visit queued asynchronously' });
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
    const cacheKey = 'admin:analytics';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    // ─── 4b. Weekly Traffic Measurement & Monthly Website Traffic Report ────────
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthName = startOfCurrentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const previousMonthName = startOfPreviousMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Monthly visits: Total traffic for current month to date and previous full month
    const currentMonthVisits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= startOfCurrentMonth).length;
    const previousMonthVisits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= startOfPreviousMonth && new Date(v.created_at) <= endOfPreviousMonth).length;
    const monthlyVisitsGrowthRate = calcGrowth(currentMonthVisits, previousMonthVisits);

    // Weekly Cycles within the Month (Each week expires after 7 days, data recorded, resets for next week)
    const currentDayOfMonth = now.getDate();
    const monthlyWeeks = [
      {
        weekNumber: 1,
        label: 'Week 1',
        dateRange: `1st–7th ${startOfCurrentMonth.toLocaleDateString('en-US', { month: 'short' })}`,
        startDay: 1,
        endDay: 7,
      },
      {
        weekNumber: 2,
        label: 'Week 2',
        dateRange: `8th–14th ${startOfCurrentMonth.toLocaleDateString('en-US', { month: 'short' })}`,
        startDay: 8,
        endDay: 14,
      },
      {
        weekNumber: 3,
        label: 'Week 3',
        dateRange: `15th–21st ${startOfCurrentMonth.toLocaleDateString('en-US', { month: 'short' })}`,
        startDay: 15,
        endDay: 21,
      },
      {
        weekNumber: 4,
        label: 'Week 4+',
        dateRange: `22nd–${daysInCurrentMonth}th ${startOfCurrentMonth.toLocaleDateString('en-US', { month: 'short' })}`,
        startDay: 22,
        endDay: daysInCurrentMonth,
      }
    ].map(w => {
      const wStart = new Date(currentYear, currentMonth, w.startDay, 0, 0, 0, 0);
      const wEnd = new Date(currentYear, currentMonth, w.endDay, 23, 59, 59, 999);
      const visits = allVisits.filter(v => v.created_at && new Date(v.created_at) >= wStart && new Date(v.created_at) <= wEnd).length;

      let status = 'upcoming';
      if (currentDayOfMonth > w.endDay) {
        status = 'recorded'; // Expired after 7 days, archived & recorded
      } else if (currentDayOfMonth >= w.startDay && currentDayOfMonth <= w.endDay) {
        status = 'active'; // Currently accumulating visits for this weekly cycle
      }

      return {
        ...w,
        visits,
        status,
        statusLabel: status === 'recorded' ? 'Recorded & Archived' : status === 'active' ? 'Active Weekly Cycle' : 'Upcoming'
      };
    });

    // Determine current active cycle day count (1 to 7) and days until next weekly reset
    const activeWeekIndex = monthlyWeeks.findIndex(w => w.status === 'active');
    const activeWeekObj = activeWeekIndex !== -1 ? monthlyWeeks[activeWeekIndex] : monthlyWeeks[monthlyWeeks.length - 1];
    const daysRemainingInWeeklyCycle = activeWeekObj ? Math.max(0, activeWeekObj.endDay - currentDayOfMonth) : 0;

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

    const analyticsResponse = {
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
      // Weekly site visit tracking cycle (measured weekly, expires after a week, data recorded, resets for next week)
      weeklyTraffic: {
        currentWeekVisits: currentVisits,
        previousWeekVisits: prevVisits,
        growthRate: visitsGrowthRate,
        daysRemainingInCycle: daysRemainingInWeeklyCycle,
        cycleStatus: 'Active'
      },

      // Monthly website traffic report with weekly breakdown
      monthlyTrafficReport: {
        monthName,
        previousMonthName,
        currentMonthVisits,
        previousMonthVisits,
        growthRate: monthlyVisitsGrowthRate,
        weeks: monthlyWeeks
      },

      // Charts data
      dailyTrends,
      categoryStats
    };

    // Cache analytics for 30s
    await setCache(cacheKey, analyticsResponse, 30);

    res.json(analyticsResponse);
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

      // Invalidate book cache
      await delCachePattern('books:*');
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
    try {
      await prisma.payments.deleteMany({});
      await prisma.order_items.deleteMany({});
      await prisma.purchases.deleteMany({});
      await prisma.orders.deleteMany({});
    } catch (prismaErr) {
      console.warn('Prisma resetRevenue timed out, using Supabase REST fallback:', prismaErr.message);
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

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

/**
 * Reset all orders (Admin only) — clears pending/failed/stale orders
 * so real auto-confirmed orders can populate fresh.
 */
const resetOrders = async (req, res) => {
  try {
    try {
      // Delete in FK-safe order: payments → order_items → purchases → orders
      await prisma.payments.deleteMany({});
      await prisma.order_items.deleteMany({});
      await prisma.purchases.deleteMany({});
      await prisma.orders.deleteMany({});
    } catch (prismaErr) {
      console.warn('Prisma resetOrders timed out, using Supabase REST fallback:', prismaErr.message);
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    res.json({
      success: true,
      message: 'All orders, payments, and purchase records have been cleared. Order statuses will now be set automatically by M-Pesa payment confirmation.',
    });
  } catch (error) {
    console.error('Error resetting orders:', error);
    res.status(500).json({ error: 'Failed to reset orders', details: error.message });
  }
};

/**
 * Get all authors with biography and book counts (Admin only)
 */
const getAuthors = async (req, res) => {
  try {
    const authors = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id, 
        a.name, 
        COALESCE(a.bio, '') as bio, 
        COALESCE(a.avatar, '') as avatar, 
        a.created_at, 
        a.updated_at,
        COUNT(b.id)::int as "bookCount"
      FROM public.authors a
      LEFT JOIN public.books b ON LOWER(TRIM(b.author)) = LOWER(TRIM(a.name))
      GROUP BY a.id, a.name, a.bio, a.avatar, a.created_at, a.updated_at
      ORDER BY a.name ASC
    `);

    res.json({ success: true, authors });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: 'Failed to fetch authors', details: error.message });
  }
};

/**
 * Add or update Author Biography (Admin only)
 */
const updateAuthor = async (req, res) => {
  try {
    const { name, bio = '', avatar = '' } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Author name is required' });
    }

    const cleanName = String(name).trim();
    const cleanBio = String(bio || '').trim();
    const cleanAvatar = String(avatar || '').trim();

    const result = await prisma.$queryRawUnsafe(`
      INSERT INTO public.authors (name, bio, avatar, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (name) 
      DO UPDATE SET bio = EXCLUDED.bio, avatar = EXCLUDED.avatar, updated_at = NOW()
      RETURNING id, name, bio, avatar, created_at, updated_at
    `, cleanName, cleanBio, cleanAvatar);

    // Also sync author_bio column across existing books by this author
    await prisma.$executeRawUnsafe(`
      UPDATE public.books
      SET author_bio = $1
      WHERE LOWER(TRIM(author)) = LOWER(TRIM($2))
    `, cleanBio, cleanName);

    // Invalidate book caches so updated bio reflects across all endpoints immediately
    await delCachePattern('books:*');

    res.json({
      success: true,
      message: 'Author biography updated successfully',
      author: result[0]
    });
  } catch (error) {
    console.error('Error updating author bio:', error);
    res.status(500).json({ error: 'Failed to update author biography', details: error.message });
  }
};

module.exports = {
  recordSiteVisit,
  getUsers,
  getAnalytics,
  autoMarkBestsellers,
  resetRevenue,
  resetOrders,
  getAuthors,
  updateAuthor,
};

