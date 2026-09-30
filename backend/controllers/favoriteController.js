const { prisma } = require('../config/database');

// Get user favorites
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        book: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Add to favorites
const addToFavorites = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Book already in favorites' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        bookId
      },
      include: {
        book: true
      }
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    await prisma.favorite.deleteMany({
      where: {
        userId,
        bookId
      }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites
};
