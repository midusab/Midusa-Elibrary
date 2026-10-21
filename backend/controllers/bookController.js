const { prisma, supabase } = require('../config/database');
const { getCache, setCache, delCachePattern, pushAsyncTask } = require('../config/redis');

/**
 * Map a raw DB book row to the shape the frontend expects.
 * DB uses snake_case & category_id FK; frontend expects camelCase & category name string.
 */
function formatBook(book) {
  const currentPrice = book.price || 0;
  const discountPercent = Number(book.discount) || 0;
  const originalPrice = discountPercent > 0
    ? Math.round(currentPrice / (1 - discountPercent / 100))
    : currentPrice;

  return {
    id:          book.id,
    title:       book.title,
    author:      book.author,
    authorBio:   book.author_bio || '',
    description: book.description || '',
    category:    book.categories?.name || '',
    coverImage:  book.cover_url || '',
    pdfUrl:      book.pdf_url || '',
    price:       currentPrice,
    originalPrice,
    discountPercent,
    discount:    discountPercent,
    rating:      book.rating ? parseFloat(book.rating) : 0,
    featured:    book.featured || false,
    bestseller:  book.bestseller || false,
    clicks:      book.clicks_count || 0,
    createdAt:   book.created_at,
    updatedAt:   book.updated_at,
  };
}

/** Include category relation in every query so formatBook can access the name. */
const bookInclude = { categories: true };

// ─── Get all books with filtering and pagination ───────────────────────────────
const getBooks = async (req, res) => {
  try {
    const {
      page      = 1,
      limit     = 10,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy    = 'created_at',
      sortOrder = 'desc',
      featured,
      bestseller,
    } = req.query;

    const cacheKey = `books:list:${JSON.stringify(req.query)}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      return res.json(cachedData);
    }
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Category filter — look up by name
    if (category) {
      const cat = await prisma.categories.findUnique({ where: { name: category } });
      if (cat) where.category_id = cat.id;
      else      where.category_id = null; // category doesn't exist → return empty
    }

    // Search filter
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { author:      { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range filter (DB stores price as Int/KSh)
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    if (featured   === 'true') where.featured   = true;
    if (bestseller === 'true') where.bestseller = true;

    const [total, books] = await Promise.all([
      prisma.books.count({ where }),
      prisma.books.findMany({
        where,
        include:  bookInclude,
        skip,
        take:    parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    let formattedBooks = books.map(formatBook);

    const result = {
      books: formattedBooks,
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total:      total,
        totalPages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    };

    // Cache the result for 3 minutes (180s)
    await setCache(cacheKey, result, 180);

    res.json(result);
  } catch (error) {
    console.error('Error fetching books from database:', error.message || error);
    res.status(500).json({
      books: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
      error: 'Failed to fetch books from database',
    });
  }
};

// ─── Get single book by ID ─────────────────────────────────────────────────────
const getBookById = async (req, res) => {
  try {
    const rawId = req.params.id;
    const cacheKey = `books:detail:${rawId}`;
    const cachedBook = await getCache(cacheKey);
    if (cachedBook) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      return res.json(cachedBook);
    }
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

    let book = null;
    if (isUuid) {
      book = await prisma.books.findUnique({
        where:   { id: rawId },
        include: bookInclude,
      });
    } else {
      book = await prisma.books.findFirst({
        where: {
          OR: [
            { title: { equals: rawId, mode: 'insensitive' } },
            { title: { contains: rawId.replace(/-/g, ' '), mode: 'insensitive' } },
          ]
        },
        include: bookInclude,
      });
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const formatted = formatBook(book);

    // If authorBio not on book, check authors table
    if (!formatted.authorBio && formatted.author) {
      try {
        const rows = await prisma.$queryRawUnsafe(`
          SELECT bio FROM public.authors WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1
        `, formatted.author.trim());
        if (rows.length > 0 && rows[0].bio) {
          formatted.authorBio = rows[0].bio;
        }
      } catch (e) {}
    }

    // Cache book details for 10 minutes (600s)
    await setCache(cacheKey, formatted, 600);

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// ─── Get author details and books by author name ─────────────────────────────
const getAuthorByName = async (req, res) => {
  try {
    const authorName = decodeURIComponent(req.params.name || '').trim();
    if (!authorName) {
      return res.status(400).json({ error: 'Author name is required' });
    }

    const rows = await prisma.$queryRawUnsafe(`
      SELECT id, name, COALESCE(bio, '') as bio, COALESCE(avatar, '') as avatar
      FROM public.authors
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      LIMIT 1
    `, authorName);

    // Get all books written by this author
    const authorBooks = await prisma.books.findMany({
      where: {
        author: { equals: authorName, mode: 'insensitive' }
      },
      include: bookInclude,
      orderBy: { created_at: 'desc' }
    });

    const bio = rows.length > 0 && rows[0].bio
      ? rows[0].bio
      : `${authorName} is an accomplished specialist and writer known for delivering research-driven insights and timeless guidance.`;

    res.json({
      success: true,
      author: {
        id: rows[0]?.id || null,
        name: authorName,
        bio,
        avatar: rows[0]?.avatar || '',
        books: authorBooks.map(formatBook)
      }
    });
  } catch (err) {
    console.error('Error fetching author details:', err);
    res.status(500).json({ error: 'Failed to fetch author profile' });
  }
};

// ─── Create new book (Admin only) ─────────────────────────────────────────────
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      authorBio   = '',
      description = '',
      category,
      coverImage  = '',
      pdfUrl      = '',
      price,
      discount    = 0,
      rating      = 0,
      featured    = false,
      bestseller  = false,
    } = req.body;

    if (!title || !author || price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Title, author, and price are required.' });
    }

    const cleanTitle = title.trim();

    // Prevent duplicate books by title
    const existingBook = await prisma.books.findFirst({
      where: {
        title: { equals: cleanTitle, mode: 'insensitive' }
      }
    });
    if (existingBook) {
      return res.status(409).json({
        error: `A book titled "${cleanTitle}" already exists in the library. Duplicate books are not allowed.`
      });
    }

    // Resolve category name → UUID (upsert so new categories are created on the fly)
    let categoryId = null;
    if (category && category.trim()) {
      const cat = await prisma.categories.upsert({
        where:  { name: category.trim() },
        update: {},
        create: { name: category.trim() },
      });
      categoryId = cat.id;
    }

    const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';
    const finalCover = (coverImage && coverImage.trim()) ? coverImage.trim() : defaultCover;
    const finalPdf = (pdfUrl && pdfUrl.trim()) ? pdfUrl.trim() : '';
    const cleanAuthor = author.trim();
    const cleanAuthorBio = (authorBio || '').trim();

    const book = await prisma.books.create({
      data: {
        title:       title.trim(),
        author:      cleanAuthor,
        author_bio:  cleanAuthorBio,
        description: (description || '').trim(),
        category_id: categoryId,
        cover_url:   finalCover,
        pdf_url:     finalPdf,
        price:       Math.max(0, parseInt(price) || 0),
        discount:    Math.min(100, Math.max(0, parseInt(discount) || 0)),
        rating:      Math.min(5, Math.max(0, parseFloat(rating) || 5)),
        featured:    Boolean(featured),
        bestseller:  Boolean(bestseller),
      },
      include: bookInclude,
    });

    // Also upsert author biography into authors table if provided
    if (cleanAuthor) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO public.authors (name, bio)
          VALUES ($1, $2)
          ON CONFLICT (name) 
          DO UPDATE SET bio = CASE WHEN $2 <> '' THEN $2 ELSE public.authors.bio END, updated_at = NOW()
        `, cleanAuthor, cleanAuthorBio);
      } catch (authorErr) {
        console.warn('Author sync notice:', authorErr.message);
      }
    }

    // Invalidate book caches
    await delCachePattern('books:*');

    res.status(201).json(formatBook(book));
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: error.message || 'Failed to create book' });
  }
};

// ─── Update book (Admin only) ──────────────────────────────────────────────────
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      authorBio,
      description,
      category,
      coverImage,
      pdfUrl,
      price,
      discount,
      rating,
      featured,
      bestseller,
    } = req.body;

    const data = {};
    if (title !== undefined) {
      const cleanTitle = title.trim();
      const existingBook = await prisma.books.findFirst({
        where: {
          title: { equals: cleanTitle, mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (existingBook) {
        return res.status(409).json({
          error: `Another book titled "${cleanTitle}" already exists in the library.`
        });
      }
      data.title = cleanTitle;
    }
    if (author      !== undefined) data.author      = author.trim();
    if (authorBio   !== undefined) data.author_bio  = String(authorBio).trim();
    if (description !== undefined) data.description = description.trim();
    if (coverImage  !== undefined) {
      data.cover_url = coverImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';
    }
    if (pdfUrl      !== undefined) data.pdf_url     = pdfUrl.trim();
    if (price       !== undefined) data.price       = Math.max(0, parseInt(price) || 0);
    if (discount    !== undefined) data.discount    = Math.min(100, Math.max(0, parseInt(discount) || 0));
    if (rating      !== undefined) data.rating      = Math.min(5, Math.max(0, parseFloat(rating) || 5));
    if (featured    !== undefined) data.featured    = Boolean(featured);
    if (bestseller  !== undefined) data.bestseller  = Boolean(bestseller);

    // Resolve updated category name → UUID
    if (category !== undefined) {
      if (category && category.trim()) {
        const cat = await prisma.categories.upsert({
          where:  { name: category.trim() },
          update: {},
          create: { name: category.trim() },
        });
        data.category_id = cat.id;
      } else {
        data.category_id = null;
      }
    }

    const book = await prisma.books.update({
      where:   { id },
      data,
      include: bookInclude,
    });

    // Also update authors table if author or authorBio changed
    const targetAuthor = (author !== undefined ? author : book.author || '').trim();
    const targetBio = (authorBio !== undefined ? authorBio : book.author_bio || '').trim();
    if (targetAuthor) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO public.authors (name, bio)
          VALUES ($1, $2)
          ON CONFLICT (name) 
          DO UPDATE SET bio = CASE WHEN $2 <> '' THEN $2 ELSE public.authors.bio END, updated_at = NOW()
        `, targetAuthor, targetBio);
      } catch (authorErr) {
        console.warn('Author sync notice:', authorErr.message);
      }
    }

    // Invalidate book caches
    await delCachePattern('books:*');

    res.json(formatBook(book));
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: error.message || 'Failed to update book' });
  }
};

// ─── Delete book (Admin only) ──────────────────────────────────────────────────
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.books.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    await prisma.books.delete({ where: { id } });

    // Invalidate book caches
    await delCachePattern('books:*');

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// ─── Get featured books ────────────────────────────────────────────────────────
const getFeaturedBooks = async (req, res) => {
  try {
    const cacheKey = 'books:featured';
    const cached = await getCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      return res.json(cached);
    }
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

    const books = await prisma.books.findMany({
      where:   { featured: true },
      include: bookInclude,
      take:    6,
      orderBy: { created_at: 'desc' },
    });

    let result = books.map(formatBook);
    if (result.length === 0) {
      // If no books are explicitly marked featured, show the latest real library books
      const recent = await prisma.books.findMany({
        include: bookInclude,
        take: 6,
        orderBy: { created_at: 'desc' },
      });
      result = recent.map(formatBook);
    }

    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('Error fetching featured books from DB:', error.message || error);
    res.json([]);
  }
};

// ─── Get bestseller books ──────────────────────────────────────────────────────
const getBestsellerBooks = async (req, res) => {
  try {
    const cacheKey = 'books:bestsellers';
    const cached = await getCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      return res.json(cached);
    }
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

    const books = await prisma.books.findMany({
      where:   { bestseller: true },
      include: bookInclude,
      take:    8,
      orderBy: { created_at: 'desc' },
    });

    let result = books.map(formatBook);
    if (result.length === 0) {
      // If no books are explicitly marked bestseller, show the top books by clicks
      const topBooks = await prisma.books.findMany({
        include: bookInclude,
        take: 8,
        orderBy: { clicks_count: 'desc' },
      });
      result = topBooks.map(formatBook);
    }

    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('Error fetching bestseller books from DB:', error.message || error);
    res.json([]);
  }
};

// ─── Record book click / view ──────────────────────────────────────────────────
const recordBookClick = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorId, userId } = req.body || {};

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // Queue async task for Redis worker
    await pushAsyncTask('record_book_click', {
      bookId: id,
      visitorId: visitorId || null,
      userId: userId || null,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Click recorded asynchronously' });
  } catch (error) {
    console.error('Error recording book click:', error);
    res.status(500).json({ error: 'Failed to record click' });
  }
};

// ─── Verify user access to book (Backend Access Control) ──────────────────────
const verifyBookAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));
    if (!id || !isUuid(id)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midusabrian@gmail.com').trim().toLowerCase();
    const isAdmin = req.user?.role === 'admin' || (req.user?.email && req.user.email.trim().toLowerCase() === ADMIN_EMAIL);

    const book = await prisma.books.findUnique({
      where: { id },
      include: bookInclude
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (isAdmin) {
      return res.json({
        hasAccess: true,
        reason: 'admin',
        book: formatBook(book)
      });
    }

    // Resolve user's db id
    let dbUserId = null;
    if (isUuid(req.user?.id)) {
      dbUserId = req.user.id;
    } else if (req.user?.email) {
      const u = await prisma.users.findUnique({ where: { email: req.user.email.toLowerCase().trim() } });
      if (u) dbUserId = u.id;
    }

    if (!dbUserId) {
      return res.status(403).json({ hasAccess: false, error: 'User account not verified' });
    }

    const purchase = await prisma.purchases.findFirst({
      where: {
        user_id: dbUserId,
        book_id: id
      }
    });

    if (purchase) {
      return res.json({
        hasAccess: true,
        reason: 'purchased',
        purchasedAt: purchase.created_at,
        book: formatBook(book)
      });
    }

    return res.status(403).json({
      hasAccess: false,
      error: 'Access denied. Purchase required to unlock this book.'
    });
  } catch (error) {
    console.error('Error verifying book access:', error);
    res.status(500).json({ error: 'Failed to verify book access' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  getAuthorByName,
  verifyBookAccess,
  createBook,
  updateBook,
  deleteBook,
  getFeaturedBooks,
  getBestsellerBooks,
  recordBookClick,
};
