const { prisma } = require('../config/database');
const { getCache, setCache, delCachePattern } = require('../config/redis');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const cacheKey = 'categories:all';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const categories = await prisma.categories.findMany({
      include: {
        _count: {
          select: {
            books: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Cache categories for 30 minutes (1800s)
    await setCache(cacheKey, categories, 1800);

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories'
    });
  }
};

// Get single category
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `categories:id:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            books: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    await setCache(cacheKey, category, 1800);

    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Failed to fetch category'
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Category name is required'
      });
    }

    const existingCategory = await prisma.categories.findUnique({
      where: {
        name: name.trim()
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category already exists'
      });
    }

    const category = await prisma.categories.create({
      data: {
        name: name.trim(),
        ...(image_url ? { image_url } : {})
      }
    });

    await delCachePattern('categories:*');
    await delCachePattern('books:*');

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: 'Failed to create category'
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Category name is required'
      });
    }

    const existingCategory = await prisma.categories.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id
        }
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category name already exists'
      });
    }

    const category = await prisma.categories.update({
      where: { id },
      data: {
        name: name.trim(),
        image_url: image_url ?? undefined
      }
    });

    await delCachePattern('categories:*');
    await delCachePattern('books:*');

    res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.status(500).json({
      error: 'Failed to update category'
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const bookCount = await prisma.books.count({
      where: {
        category_id: id
      }
    });

    if (bookCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category because it contains books'
      });
    }

    await prisma.categories.delete({
      where: { id }
    });

    await delCachePattern('categories:*');
    await delCachePattern('books:*');

    res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.status(500).json({
      error: 'Failed to delete category'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
