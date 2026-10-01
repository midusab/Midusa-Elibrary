const { prisma } = require('../config/database');

/**
 * Get all users for admin with order history and joined date
 */
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            items: {
              include: {
                book: {
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
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get overall business analytics (revenue, sales, popular books, category performance)
 */
const getAnalytics = async (req, res) => {
  try {
    const [totalBooks, totalUsers, allOrders, categories, allBooks] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.order.findMany({
        include: {
          items: {
            include: {
              book: true
            }
          }
        }
      }),
      prisma.category.findMany(),
      prisma.book.findMany({
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          price: true,
          rating: true,
          featured: true,
          bestseller: true,
          coverImage: true
        }
      })
    ]);

    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalSales = completedOrders.length;

    // Calculate purchase counts per book
    const bookPurchaseCounts = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const bId = item.bookId;
        bookPurchaseCounts[bId] = (bookPurchaseCounts[bId] || 0) + (item.quantity || 1);
      });
    });

    // Find most purchased book
    let mostPurchasedBook = null;
    let maxPurchases = 0;
    Object.entries(bookPurchaseCounts).forEach(([bId, count]) => {
      if (count > maxPurchases) {
        maxPurchases = count;
        const bk = allBooks.find(b => b.id === bId);
        if (bk) mostPurchasedBook = { ...bk, salesCount: count };
      }
    });

    // Category performance breakdown
    const categoryStats = categories.map(cat => {
      const catBooks = allBooks.filter(b => b.category === cat.name);
      let catSales = 0;
      let catRevenue = 0;

      allOrders.forEach(order => {
        order.items.forEach(it => {
          if (it.book?.category === cat.name) {
            catSales += (it.quantity || 1);
            if (order.status === 'completed') {
              catRevenue += (it.price || 0) * (it.quantity || 1);
            }
          }
        });
      });

      return {
        name: cat.name,
        bookCount: catBooks.length,
        totalSales: catSales,
        revenue: catRevenue
      };
    });

    res.json({
      totalRevenue,
      totalSales,
      totalOrders: allOrders.length,
      totalBooks,
      totalUsers,
      mostPurchasedBook,
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
    const orders = await prisma.order.findMany({
      include: { items: true }
    });

    const bookSalesMap = {};
    orders.forEach(order => {
      order.items.forEach(it => {
        bookSalesMap[it.bookId] = (bookSalesMap[it.bookId] || 0) + (it.quantity || 1);
      });
    });

    // Books with 1 or more sales are marked as bestsellers
    const bestsellerBookIds = Object.keys(bookSalesMap).filter(id => bookSalesMap[id] > 0);

    if (bestsellerBookIds.length > 0) {
      await prisma.book.updateMany({
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

module.exports = {
  getUsers,
  getAnalytics,
  autoMarkBestsellers
};
