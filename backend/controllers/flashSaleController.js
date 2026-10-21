const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/database');
const { getCache, setCache, delCachePattern } = require('../config/redis');

const FALLBACK_FILE = path.join(__dirname, '../data/flashsale.json');

// Ensure fallback file exists
function readFallback() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading flashsale fallback file:', e.message);
  }
  return {
    id: 'default-flashsale',
    title: '',
    description: '',
    discountPercent: 20,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    bookIds: []
  };
}

function writeFallback(data) {
  try {
    const dir = path.dirname(FALLBACK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Error saving flashsale fallback file:', e.message);
  }
}

// Ensure DB table exists
let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.flash_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        discount_percent INT NOT NULL DEFAULT 20,
        start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
        end_time TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        book_ids JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    tableEnsured = true;
  } catch (err) {
    // DB offline or permission issue, fallback file will be used
  }
}

/**
 * Public: Get current active flash sale
 */
const getActiveFlashSale = async (req, res) => {
  try {
    const cacheKey = 'flashsale:active';
    const cached = await getCache(cacheKey);
    if (cached !== null && cached !== undefined) {
      return res.json(cached);
    }

    let sale = null;
    await ensureTable();

    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT * FROM public.flash_sales
        WHERE is_active = true AND end_time > now()
        ORDER BY created_at DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0) {
        const r = rows[0];
        sale = {
          id: r.id,
          title: r.title,
          description: r.description || '',
          discountPercent: Number(r.discount_percent) || 20,
          startTime: r.start_time,
          endTime: r.end_time,
          isActive: r.is_active,
          bookIds: Array.isArray(r.book_ids) ? r.book_ids : (typeof r.book_ids === 'string' ? JSON.parse(r.book_ids || '[]') : [])
        };
      }
    } catch {
      // DB query failed, use file
    }

    if (!sale) {
      const fileData = readFallback();
      if (fileData && fileData.isActive && new Date(fileData.endTime) > new Date()) {
        sale = fileData;
      }
    }

    if (!sale) {
      const response = { active: false, flashSale: null };
      await setCache(cacheKey, response, 30);
      return res.json(response);
    }

    const now = Date.now();
    const end = new Date(sale.endTime).getTime();
    const remainingMs = Math.max(0, end - now);

    const result = {
      active: remainingMs > 0,
      flashSale: {
        ...sale,
        remainingMs,
        remainingSeconds: Math.floor(remainingMs / 1000)
      }
    };

    await setCache(cacheKey, result, 15);
    res.json(result);
  } catch (error) {
    console.error('Error fetching active flash sale:', error);
    res.json({ active: false, flashSale: null });
  }
};

/**
 * Admin: Get flash sale configuration
 */
const getAdminFlashSale = async (req, res) => {
  try {
    await ensureTable();
    let currentSale = null;

    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT * FROM public.flash_sales
        ORDER BY created_at DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0) {
        const r = rows[0];
        currentSale = {
          id: r.id,
          title: r.title,
          description: r.description || '',
          discountPercent: Number(r.discount_percent) || 20,
          startTime: r.start_time,
          endTime: r.end_time,
          isActive: r.is_active,
          bookIds: Array.isArray(r.book_ids) ? r.book_ids : (typeof r.book_ids === 'string' ? JSON.parse(r.book_ids || '[]') : [])
        };
      }
    } catch (e) {
      // DB query fallback
    }

    if (!currentSale) {
      currentSale = readFallback();
    }

    const now = Date.now();
    const end = new Date(currentSale.endTime).getTime();
    const isExpired = end <= now;

    res.json({
      flashSale: currentSale,
      isExpired,
      isLive: currentSale.isActive && !isExpired
    });
  } catch (error) {
    console.error('Error fetching admin flash sale:', error);
    res.status(500).json({ error: 'Failed to fetch flash sale settings' });
  }
};

/**
 * Admin: Create or update flash sale
 */
const saveFlashSale = async (req, res) => {
  try {
    const {
      title,
      description = '',
      discountPercent = 20,
      startTime = new Date().toISOString(),
      endTime,
      isActive = true,
      bookIds = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Flash sale title is required' });
    }

    const discount = parseInt(discountPercent, 10);
    if (isNaN(discount) || discount < 1 || discount > 95) {
      return res.status(400).json({ error: 'Discount percent must be between 1 and 95' });
    }

    if (!endTime || new Date(endTime).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'End time must be in the future' });
    }

    await ensureTable();

    const saleRecord = {
      title: title.trim(),
      description: (description || '').trim(),
      discountPercent: discount,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isActive: Boolean(isActive),
      bookIds: Array.isArray(bookIds) ? bookIds : []
    };

    // Save to PostgreSQL if available
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE public.flash_sales SET is_active = false WHERE is_active = true;
      `);
      const inserted = await prisma.$queryRawUnsafe(`
        INSERT INTO public.flash_sales (title, description, discount_percent, start_time, end_time, is_active, book_ids)
        VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7::jsonb)
        RETURNING *;
      `,
        saleRecord.title,
        saleRecord.description,
        saleRecord.discountPercent,
        saleRecord.startTime,
        saleRecord.endTime,
        saleRecord.isActive,
        JSON.stringify(saleRecord.bookIds)
      );
      if (inserted && inserted.length > 0) {
        saleRecord.id = inserted[0].id;
      }
    } catch (dbErr) {
      console.warn('DB flash sale insert notice, using file storage:', dbErr.message);
      saleRecord.id = 'fs_' + Date.now();
    }

    // Always update fallback file
    writeFallback(saleRecord);

    // Clear caches
    await delCachePattern('flashsale:*');
    await delCachePattern('books:*');

    res.json({
      success: true,
      message: 'Flash sale saved and activated successfully',
      flashSale: saleRecord
    });
  } catch (error) {
    console.error('Error saving flash sale:', error);
    res.status(500).json({ error: error.message || 'Failed to save flash sale' });
  }
};

/**
 * Admin: Toggle flash sale on/off
 */
const toggleFlashSale = async (req, res) => {
  try {
    const { isActive } = req.body;
    await ensureTable();

    try {
      await prisma.$executeRawUnsafe(`
        UPDATE public.flash_sales 
        SET is_active = $1, updated_at = now()
        WHERE id = (SELECT id FROM public.flash_sales ORDER BY created_at DESC LIMIT 1)
      `, Boolean(isActive));
    } catch {}

    const fileData = readFallback();
    fileData.isActive = Boolean(isActive);
    writeFallback(fileData);

    await delCachePattern('flashsale:*');
    await delCachePattern('books:*');

    res.json({
      success: true,
      message: `Flash sale ${isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: Boolean(isActive)
    });
  } catch (error) {
    console.error('Error toggling flash sale:', error);
    res.status(500).json({ error: 'Failed to toggle flash sale' });
  }
};

/**
 * Admin: Delete or stop active flash sale
 */
const deleteFlashSale = async (req, res) => {
  try {
    await ensureTable();

    try {
      await prisma.$executeRawUnsafe(`
        UPDATE public.flash_sales SET is_active = false;
      `);
    } catch {}

    const fileData = readFallback();
    fileData.isActive = false;
    writeFallback(fileData);

    await delCachePattern('flashsale:*');
    await delCachePattern('books:*');

    res.json({ success: true, message: 'Flash sale ended successfully' });
  } catch (error) {
    console.error('Error ending flash sale:', error);
    res.status(500).json({ error: 'Failed to end flash sale' });
  }
};

module.exports = {
  getActiveFlashSale,
  getAdminFlashSale,
  saveFlashSale,
  toggleFlashSale,
  deleteFlashSale
};
