const { prisma } = require('../config/database');

// Get all books with filtering and pagination
const getBooks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      bestseller
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Category filter
    if (category) {
      where.category = category;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Featured/Bestseller filter
    if (featured === 'true') where.featured = true;
    if (bestseller === 'true') where.bestseller = true;

    // Count total books
    const total = await prisma.book.count({ where });

    // Get books with pagination and sorting
    const books = await prisma.book.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

// Get single book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// Create new book (Admin only)
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      category,
      coverImage,
      pdfUrl,
      price,
      rating = 0,
      featured = false,
      bestseller = false
    } = req.body;

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        category,
        coverImage,
        pdfUrl,
        price: parseFloat(price),
        rating: parseFloat(rating),
        featured,
        bestseller
      }
    });

    // Update category book count
    await prisma.category.upsert({
      where: { name: category },
      update: { bookCount: { increment: 1 } },
      create: { name: category, description: '', bookCount: 1 }
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

// Update book (Admin only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle price conversion
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.rating) {
      updateData.rating = parseFloat(updateData.rating);
    }

    const book = await prisma.book.update({
      where: { id },
      data: updateData
    });

    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

// Delete book (Admin only)
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Get book category before deletion
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book.delete({ where: { id } });

    // Update category book count
    await prisma.category.updateMany({
      where: { name: book.category },
      data: { bookCount: { decrement: 1 } }
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// Get featured books
const getFeaturedBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { createdAt: 'desc' }
    });

    res.json(books);
  } catch (error) {
    console.error('Error fetching featured books:', error);
    res.status(500).json({ error: 'Failed to fetch featured books' });
  }
};

// Get bestseller books
const getBestsellerBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { bestseller: true },
      take: 8,
      orderBy: { createdAt: 'desc' }
    });

    res.json(books);
  } catch (error) {
    console.error('Error fetching bestseller books:', error);
    res.status(500).json({ error: 'Failed to fetch bestseller books' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getFeaturedBooks,
  getBestsellerBooks
};
