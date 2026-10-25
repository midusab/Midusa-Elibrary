/**
 * Flash Sale Controller
 *
 * Architecture:
 *  - flash_sales  : stores sale metadata (title, discount_percent, start/end times, is_active)
 *  - sale_books   : junction table linking sales → books (UNIQUE on sale_id + book_id)
 *  - books.price  : NEVER modified — original price is always preserved
 *  - Discounts are calculated by the backend at checkout time
 */
const { prisma } = require('../config/database');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

/**
 * Check whether a flash sale is currently active (within its time window).
 */
function isSaleLive(sale) {
  if (!sale || !sale.is_active) return false;
  const now = new Date();
  return now >= new Date(sale.start_time) && now <= new Date(sale.end_time);
}

/**
 * Format a flash_sales row + its sale_books into the shape the frontend expects.
 */
function formatSale(sale) {
  const bookIds = (sale.sale_books || []).map((sb) => sb.book_id);
  return {
    id: sale.id,
    title: sale.title,
    description: sale.description || '',
    discountPercent: sale.discount_percent,
    startTime: sale.start_time,
    endTime: sale.end_time,
    isActive: sale.is_active,
    status: sale.status,
    bookIds,           // array of UUIDs — frontend uses this to check eligibility
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
  };
}

// ─────────────────────────────────────────────
// PUBLIC: Get active flash sale
// GET /api/flashsale
// ─────────────────────────────────────────────
const getActiveFlashSale = async (req, res) => {
  try {
    // Prevent browsers and CDNs from caching this response —
    // sale status can change at any moment.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');

    const now = new Date();

    const sale = await prisma.flash_sales.findFirst({
      where: {
        is_active: true,
        start_time: { lte: now },
        end_time: { gte: now },
      },
      include: {
        sale_books: {
          select: { book_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!sale) {
      return res.json({ active: false, flashSale: null });
    }

    return res.json({ active: true, flashSale: formatSale(sale) });
  } catch (error) {
    console.error('getActiveFlashSale error:', error);
    return res.status(500).json({ error: 'Failed to fetch flash sale' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Get all flash sales
// GET /api/flashsale/admin
// ─────────────────────────────────────────────
const getAllFlashSales = async (req, res) => {
  try {
    const sales = await prisma.flash_sales.findMany({
      include: {
        sale_books: {
          select: { book_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(sales.map(formatSale));
  } catch (error) {
    console.error('getAllFlashSales error:', error);
    return res.status(500).json({ error: 'Failed to fetch flash sales' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Create or update a flash sale
// POST /api/flashsale/admin
// ─────────────────────────────────────────────
const saveFlashSale = async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      discountPercent,
      discount_percent,
      startTime,
      start_time,
      endTime,
      end_time,
      isActive,
      is_active,
      status,
      bookIds,
    } = req.body;

    // Normalize field names (accept camelCase from frontend or snake_case)
    const normalizedDiscount = parseInt(discountPercent ?? discount_percent ?? 20, 10);
    const normalizedStart = new Date(startTime ?? start_time);
    const normalizedEnd = new Date(endTime ?? end_time);
    const normalizedActive = isActive ?? is_active ?? true;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Sale title is required' });
    }
    if (isNaN(normalizedStart) || isNaN(normalizedEnd)) {
      return res.status(400).json({ error: 'Valid start_time and end_time are required' });
    }
    if (normalizedEnd <= normalizedStart) {
      return res.status(400).json({ error: 'end_time must be after start_time' });
    }
    if (normalizedDiscount < 1 || normalizedDiscount > 100) {
      return res.status(400).json({ error: 'discount_percent must be between 1 and 100' });
    }

    // Validate bookIds array
    const rawBookIds = Array.isArray(bookIds) ? bookIds : [];
    const validBookIds = rawBookIds.filter(isUuid);

    let sale;

    if (id && isUuid(id)) {
      // ── UPDATE existing sale ──
      sale = await prisma.flash_sales.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description?.trim() || '',
          discount_percent: normalizedDiscount,
          start_time: normalizedStart,
          end_time: normalizedEnd,
          is_active: Boolean(normalizedActive),
          status: status || 'scheduled',
          updated_at: new Date(),
        },
      });

      // Replace all sale_books for this sale
      await prisma.sale_books.deleteMany({ where: { sale_id: id } });
    } else {
      // ── CREATE new sale ──
      // If setting as active, deactivate all others first
      if (Boolean(normalizedActive)) {
        await prisma.flash_sales.updateMany({
          where: { is_active: true },
          data: { is_active: false, status: 'ended' },
        });
      }

      sale = await prisma.flash_sales.create({
        data: {
          title: title.trim(),
          description: description?.trim() || '',
          discount_percent: normalizedDiscount,
          start_time: normalizedStart,
          end_time: normalizedEnd,
          is_active: Boolean(normalizedActive),
          status: status || 'scheduled',
        },
      });
    }

    // Insert sale_books with skipDuplicates for safety (unique constraint: sale_id + book_id)
    if (validBookIds.length > 0) {
      await prisma.sale_books.createMany({
        data: validBookIds.map((bookId) => ({
          sale_id: sale.id,
          book_id: bookId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch the final sale with its books
    const result = await prisma.flash_sales.findUnique({
      where: { id: sale.id },
      include: { sale_books: { select: { book_id: true } } },
    });

    return res.status(id ? 200 : 201).json({
      success: true,
      flashSale: formatSale(result),
    });
  } catch (error) {
    console.error('saveFlashSale error:', error);
    return res.status(500).json({ error: 'Failed to save flash sale' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Delete a flash sale
// DELETE /api/flashsale/admin/:id
// ─────────────────────────────────────────────
const deleteFlashSale = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isUuid(id)) {
      return res.status(400).json({ error: 'Valid sale ID is required' });
    }

    // sale_books rows are deleted automatically via onDelete: Cascade
    await prisma.flash_sales.delete({ where: { id } });

    return res.json({ success: true, message: 'Flash sale deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Flash sale not found' });
    }
    console.error('deleteFlashSale error:', error);
    return res.status(500).json({ error: 'Failed to delete flash sale' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Toggle active status of a sale
// PATCH /api/flashsale/admin/:id/toggle
// ─────────────────────────────────────────────
const toggleFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) {
      return res.status(400).json({ error: 'Valid sale ID is required' });
    }

    const sale = await prisma.flash_sales.findUnique({ where: { id } });
    if (!sale) {
      return res.status(404).json({ error: 'Flash sale not found' });
    }

    // If activating, deactivate all others
    if (!sale.is_active) {
      await prisma.flash_sales.updateMany({
        where: { is_active: true },
        data: { is_active: false, status: 'ended' },
      });
    }

    const updated = await prisma.flash_sales.update({
      where: { id },
      data: {
        is_active: !sale.is_active,
        status: !sale.is_active ? 'active' : 'ended',
        updated_at: new Date(),
      },
      include: { sale_books: { select: { book_id: true } } },
    });

    return res.json({ success: true, flashSale: formatSale(updated) });
  } catch (error) {
    console.error('toggleFlashSale error:', error);
    return res.status(500).json({ error: 'Failed to toggle flash sale' });
  }
};

// ─────────────────────────────────────────────
// BACKEND PRICE VERIFIER (used by orderController)
// Returns { inSale: bool, discountPercent: number, saleId: string }
// ─────────────────────────────────────────────
const getDiscountedPriceForBook = async (bookId) => {
  try {
    if (!bookId) return { inSale: false };

    const now = new Date();

    const activeSale = await prisma.flash_sales.findFirst({
      where: {
        is_active: true,
        start_time: { lte: now },
        end_time: { gte: now },
      },
      include: {
        sale_books: {
          select: { book_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!activeSale) return { inSale: false };

    const discountPercent = Number(activeSale.discount_percent) || 0;
    if (discountPercent <= 0) return { inSale: false };

    const saleBooks = activeSale.sale_books || [];
    // If sale_books is empty -> ALL books in the catalog qualify for the flash sale.
    // If sale_books has entries -> ONLY the specifically assigned books qualify.
    if (saleBooks.length > 0) {
      const isEligible = saleBooks.some((sb) => String(sb.book_id) === String(bookId));
      if (!isEligible) {
        return { inSale: false };
      }
    }

    return {
      inSale: true,
      discountPercent,
      saleId: activeSale.id,
    };
  } catch (err) {
    console.error('getDiscountedPriceForBook error:', err?.message || err);
    return { inSale: false };
  }
};

module.exports = {
  getActiveFlashSale,
  getAllFlashSales,
  saveFlashSale,
  deleteFlashSale,
  toggleFlashSale,
  getDiscountedPriceForBook,   // exported for orderController
};
