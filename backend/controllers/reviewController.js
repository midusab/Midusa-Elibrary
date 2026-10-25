const { prisma } = require('../config/database');
const { delCachePattern } = require('../config/redis');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midusabrian@gmail.com').trim().toLowerCase();

// Helper to resolve an authenticated user to a valid PostgreSQL UUID
async function resolveDbUserId(user) {
  if (!user) return null;
  const rawId = user.id;
  const email = user.email;

  if (isUuid(rawId)) {
    const existing = await prisma.users.findUnique({ where: { id: rawId } });
    if (existing) return existing.id;
  }

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    let dbUser = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (!dbUser) {
      dbUser = await prisma.users.create({
        data: {
          email: normalizedEmail,
          fullname: user.fullname || user.name || normalizedEmail.split('@')[0],
          avatar: user.avatar || '',
          role: user.role || 'user',
        },
      });
    }
    return dbUser.id;
  }

  return null;
}

function formatReview(r) {
  return {
    id: r.id,
    bookId: r.book_id,
    userId: r.user_id,
    user: r.reviewer_name,
    reviewerName: r.reviewer_name,
    rating: Number(r.rating) || 5,
    comment: r.comment,
    verifiedPurchase: Boolean(r.verified_purchase),
    date: r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Recalculate book aggregate rating from all reviews
 */
async function updateBookRating(bookId) {
  try {
    const all = await prisma.reviews.findMany({
      where: { book_id: bookId },
      select: { rating: true },
    });

    if (all.length === 0) {
      return 0;
    }

    const avg = all.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / all.length;
    const rounded = Math.round(avg * 10) / 10;

    await prisma.books.update({
      where: { id: bookId },
      data: { rating: rounded },
    });

    // Invalidate Redis caches
    await delCachePattern(`books:detail:${bookId}*`);
    await delCachePattern('books:list:*');

    return rounded;
  } catch (err) {
    console.error('Error recalculating book rating:', err.message);
    return null;
  }
}

// GET /api/reviews/book/:bookId or /api/books/:id/reviews
const getReviewsForBook = async (req, res) => {
  try {
    const bookId = req.params.bookId || req.params.id;
    if (!bookId || !isUuid(bookId)) {
      return res.status(400).json({ error: 'Valid book ID is required' });
    }

    const reviews = await prisma.reviews.findMany({
      where: { book_id: bookId },
      orderBy: { created_at: 'desc' },
    });

    const formatted = reviews.map(formatReview);
    const count = formatted.length;
    const avgRating =
      count > 0
        ? Math.round((formatted.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        : 0;

    // Breakdown counts
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    formatted.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return res.json({
      success: true,
      count,
      averageRating: avgRating,
      distribution,
      reviews: formatted,
    });
  } catch (error) {
    console.error('getReviewsForBook error:', error);
    return res.status(500).json({ error: 'Failed to retrieve book reviews' });
  }
};

// POST /api/reviews (or /api/books/:id/reviews)
const addReview = async (req, res) => {
  try {
    const bookId = req.body.bookId || req.params.id;
    const { reviewerName, rating, comment } = req.body;

    if (!bookId || !isUuid(bookId)) {
      return res.status(400).json({ error: 'Valid book ID is required' });
    }

    const cleanComment = String(comment || '').trim();
    if (!cleanComment) {
      return res.status(400).json({ error: 'Review comment cannot be empty' });
    }
    if (cleanComment.length < 3) {
      return res.status(400).json({ error: 'Review comment is too short (min 3 characters)' });
    }
    if (cleanComment.length > 2000) {
      return res.status(400).json({ error: 'Review comment is too long (max 2000 characters)' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Verify book exists
    const book = await prisma.books.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Resolve user if authenticated
    const dbUserId = await resolveDbUserId(req.user);

    let cleanName = String(reviewerName || '').trim();
    if (!cleanName && req.user) {
      cleanName = req.user.fullname || req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'Reader');
    }
    if (!cleanName) {
      cleanName = 'Anonymous Reader';
    }

    // Check if user has purchased this book for Verified Purchase badge
    let isVerified = false;
    if (dbUserId) {
      const purchase = await prisma.purchases.findFirst({
        where: {
          user_id: dbUserId,
          book_id: bookId,
        },
      });
      if (purchase) {
        isVerified = true;
      }
    }

    // Create review
    const newReview = await prisma.reviews.create({
      data: {
        book_id: bookId,
        user_id: dbUserId,
        reviewer_name: cleanName,
        rating: parsedRating,
        comment: cleanComment,
        verified_purchase: isVerified,
      },
    });

    // Update book aggregate rating
    const updatedRating = await updateBookRating(bookId);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: formatReview(newReview),
      bookRating: updatedRating,
    });
  } catch (error) {
    console.error('addReview error:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) {
      return res.status(400).json({ error: 'Valid review ID is required' });
    }

    const review = await prisma.reviews.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const dbUserId = await resolveDbUserId(req.user);
    const isAdmin =
      req.user?.role === 'admin' ||
      (req.user?.email && req.user.email.trim().toLowerCase() === ADMIN_EMAIL);

    if (!isAdmin && (!dbUserId || review.user_id !== dbUserId)) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await prisma.reviews.delete({ where: { id } });

    // Recalculate book rating
    const updatedRating = await updateBookRating(review.book_id);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      bookRating: updatedRating,
    });
  } catch (error) {
    console.error('deleteReview error:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = {
  getReviewsForBook,
  addReview,
  deleteReview,
  formatReview,
};
