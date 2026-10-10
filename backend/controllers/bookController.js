const { prisma } = require('../config/database');

/**
 * Map a raw DB book row to the shape the frontend expects.
 * DB uses snake_case & category_id FK; frontend expects camelCase & category name string.
 */
function formatBook(book) {
  return {
    id:          book.id,
    title:       book.title,
    author:      book.author,
    description: book.description || '',
    category:    book.categories?.name || '',
    coverImage:  book.cover_url || '',
    pdfUrl:      book.pdf_url || '',
    price:       book.price,
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
      limit     = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy    = 'created_at',
      sortOrder = 'desc',
      featured,
      bestseller,
    } = req.query;

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

    res.json({
      books: books.map(formatBook),
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

// ─── Get single book by ID ─────────────────────────────────────────────────────
const getBookById = async (req, res) => {
  try {
    const book = await prisma.books.findUnique({
      where:   { id: req.params.id },
      include: bookInclude,
    });

    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(formatBook(book));
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// ─── Create new book (Admin only) ─────────────────────────────────────────────
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description = '',
      category,
      coverImage  = '',
      pdfUrl      = '',
      price,
      rating      = 0,
      featured    = false,
      bestseller  = false,
    } = req.body;

    if (!title || !author || price === undefined) {
      return res.status(400).json({ error: 'Title, author, and price are required.' });
    }

    // Resolve category name → UUID (upsert so new categories are created on the fly)
    let categoryId = null;
    if (category) {
      const cat = await prisma.categories.upsert({
        where:  { name: category },
        update: {},
        create: { name: category },
      });
      categoryId = cat.id;
    }

    const book = await prisma.books.create({
      data: {
        title,
        author,
        description,
        category_id: categoryId,
        cover_url:   coverImage,
        pdf_url:     pdfUrl,
        price:       parseInt(price),
        rating:      parseFloat(rating),
        featured:    Boolean(featured),
        bestseller:  Boolean(bestseller),
      },
      include: bookInclude,
    });

    res.status(201).json(formatBook(book));
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

// ─── Update book (Admin only) ──────────────────────────────────────────────────
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      description,
      category,
      coverImage,
      pdfUrl,
      price,
      rating,
      featured,
      bestseller,
    } = req.body;

    const data = {};
    if (title       !== undefined) data.title       = title;
    if (author      !== undefined) data.author      = author;
    if (description !== undefined) data.description = description;
    if (coverImage  !== undefined) data.cover_url   = coverImage;
    if (pdfUrl      !== undefined) data.pdf_url     = pdfUrl;
    if (price       !== undefined) data.price       = parseInt(price);
    if (rating      !== undefined) data.rating      = parseFloat(rating);
    if (featured    !== undefined) data.featured    = Boolean(featured);
    if (bestseller  !== undefined) data.bestseller  = Boolean(bestseller);

    // Resolve updated category name → UUID
    if (category !== undefined) {
      if (category) {
        const cat = await prisma.categories.upsert({
          where:  { name: category },
          update: {},
          create: { name: category },
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

    res.json(formatBook(book));
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

// ─── Delete book (Admin only) ──────────────────────────────────────────────────
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.books.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    await prisma.books.delete({ where: { id } });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// ─── Get featured books ────────────────────────────────────────────────────────
const getFeaturedBooks = async (req, res) => {
  try {
    const books = await prisma.books.findMany({
      where:   { featured: true },
      include: bookInclude,
      take:    6,
      orderBy: { created_at: 'desc' },
    });

    res.json(books.map(formatBook));
  } catch (error) {
    console.error('Error fetching featured books:', error);
    res.status(500).json({ error: 'Failed to fetch featured books' });
  }
};

// ─── Get bestseller books ──────────────────────────────────────────────────────
const getBestsellerBooks = async (req, res) => {
  try {
    const books = await prisma.books.findMany({
      where:   { bestseller: true },
      include: bookInclude,
      take:    8,
      orderBy: { created_at: 'desc' },
    });

    res.json(books.map(formatBook));
  } catch (error) {
    console.error('Error fetching bestseller books:', error);
    res.status(500).json({ error: 'Failed to fetch bestseller books' });
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

    // Check if book exists
    const book = await prisma.books.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Increment clicks_count
    const updated = await prisma.books.update({
      where: { id },
      data: { clicks_count: { increment: 1 } },
      select: { id: true, clicks_count: true, title: true }
    });

    // Record click log
    try {
      const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));
      await prisma.book_clicks.create({
        data: {
          book_id: id,
          visitor_id: visitorId || null,
          user_id: isUuid(userId) ? userId : null
        }
      });
    } catch (logErr) {
      // Non-fatal if detail log fails
      console.warn('Click log warning:', logErr.message);
    }

    res.json({ success: true, clicks: updated.clicks_count });
  } catch (error) {
    console.error('Error recording book click:', error);
    res.status(500).json({ error: 'Failed to record click' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getFeaturedBooks,
  getBestsellerBooks,
  recordBookClick,
};
