const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma, supabase } = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { scanBufferForMalware } = require('../utils/malwareScanner');

// Multer memory storage configuration for PDF (up to 150 MB)
const uploadPdfMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdfExt = ext === '.pdf';
    const isPdfMime = !file.mimetype ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/x-pdf' ||
      file.mimetype === 'application/octet-stream';

    if (!isPdfExt && !isPdfMime) {
      return cb(new Error('Only PDF documents (.pdf) are allowed.'));
    }
    cb(null, true);
  },
});

// Multer memory storage configuration for images (up to 25 MB)
const uploadImgMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
    const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
    const isImageExt = validImageExts.includes(ext);

    if (!isImageMime && !isImageExt) {
      return cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'));
    }
    cb(null, true);
  },
});

/**
 * Ensure the book_files table exists in PostgreSQL database.
 */
let isTableReady = false;
async function ensureBookFilesTable() {
  if (isTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.book_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size BIGINT NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    isTableReady = true;
  } catch (err) {
    console.warn('Notice ensuring book_files table:', err.message);
  }
}
ensureBookFilesTable();

/**
 * GET /api/upload/file/:id
 * Public endpoint to stream files stored directly in PostgreSQL database table `book_files`.
 * Supports HTTP Range requests for instant page-seeking in PDF viewers.
 */
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid document identifier format.' });
    }

    await ensureBookFilesTable();
    const rows = await prisma.$queryRawUnsafe(
      `SELECT filename, mimetype, size, data FROM public.book_files WHERE id = $1::uuid LIMIT 1;`,
      id
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Requested document was not found.' });
    }

    const file = rows[0];
    const dataBuffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const totalSize = dataBuffer.length;
    const contentType = file.mimetype || 'application/pdf';

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename || 'document.pdf')}"`);

    // Handle HTTP Range header for streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.status(416).setHeader('Content-Range', `bytes */${totalSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', contentType);
      return res.end(dataBuffer.slice(start, end + 1));
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', totalSize);
    return res.end(dataBuffer);
  } catch (err) {
    console.error('Error retrieving file from database:', err);
    res.status(500).json({ error: 'Unable to stream file. Please try again later.' });
  }
});

/**
 * POST /api/upload/pdf
 * Admin-only. Accepts a multipart/form-data body with field "pdf".
 * Stores file in the database (PostgreSQL book_files table) and syncs to Supabase.
 */
router.post('/pdf', adminAuth, (req, res, next) => {
  uploadPdfMulter.single('pdf')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'The selected PDF file is too large. Maximum file size allowed is 150 MB.' });
        }
        return res.status(400).json({ error: 'File upload error. Please select a valid PDF under 150 MB.' });
      }
      return res.status(400).json({ error: err.message || 'Please select a valid PDF document.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file selected. Please choose a file to upload.' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Scan file for real security vulnerabilities
    const scanResult = scanBufferForMalware(buffer, mimetype, originalname);
    if (!scanResult.isSafe) {
      console.warn(`[SECURITY AUDIT] PDF rejected (${req.user?.email || 'admin'}): ${scanResult.reason}`);
      return res.status(422).json({
        error: 'The uploaded file could not be verified as a valid PDF. Please select a standard, undamaged PDF file.'
      });
    }

    await ensureBookFilesTable();

    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `pdfs/${uniqueFileName}`;

    let fileId = null;
    let finalUrl = null;
    let storageType = 'none';

    // 1. Save directly to local filesystem uploads/pdfs
    try {
      const pdfsDir = path.join(__dirname, '../uploads/pdfs');
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }
      const localFilePath = path.join(pdfsDir, uniqueFileName);
      fs.writeFileSync(localFilePath, buffer);

      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      finalUrl = `${protocol}://${host}/uploads/pdfs/${uniqueFileName}`;
      storageType = 'local_disk';
    } catch (diskErr) {
      console.warn('[PDF Upload] Local disk storage notice:', diskErr.message);
    }

    // 2. Try storing in PostgreSQL database table `book_files`
    try {
      const insertResult = await prisma.$queryRawUnsafe(
        `INSERT INTO public.book_files (filename, mimetype, size, data)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        safeName,
        'application/pdf',
        buffer.length,
        buffer
      );
      fileId = insertResult[0]?.id;
      if (fileId && !finalUrl) {
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        finalUrl = `${protocol}://${host}/api/upload/file/${fileId}`;
        storageType = 'database';
      } else if (fileId) {
        storageType = 'local_disk_and_database';
      }
    } catch (dbErr) {
      console.warn('[PDF Upload] DB storage notice:', dbErr.message);
    }

    // 3. Synchronize to Supabase storage bucket `books` if available
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('books')
          .upload(storagePath, buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('books').getPublicUrl(storagePath);
          if (data?.publicUrl) {
            finalUrl = data.publicUrl;
            storageType = `${storageType}_and_supabase`;
          }
        }
      } catch (sbErr) {
        console.warn(`[PDF Upload] Supabase storage notice:`, sbErr.message);
      }
    }

    if (!finalUrl) {
      return res.status(500).json({
        error: 'Unable to save the PDF file to storage. Please verify your connection and try again.'
      });
    }

    console.log(`[PDF Upload] Success: url=${finalUrl}, storage=${storageType}`);

    return res.status(201).json({
      url: finalUrl,
      fileId,
      path: storagePath,
      storage: storageType,
      message: 'PDF eBook uploaded successfully.',
    });
  } catch (err) {
    console.error('PDF upload unexpected error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during PDF upload. Please try again.' });
  }
});

/**
 * POST /api/upload/image
 * Admin-only. Accepts a multipart/form-data body with field "image".
 * Stores cover image in database (PostgreSQL book_files table) and syncs to Supabase.
 */
router.post('/image', adminAuth, (req, res, next) => {
  uploadImgMulter.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'The cover image is too large. Maximum file size allowed is 25 MB.' });
        }
        return res.status(400).json({ error: 'Image upload error. Please select a valid picture under 25 MB.' });
      }
      return res.status(400).json({ error: err.message || 'Please select a valid image file.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file selected. Please choose a picture to upload.' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Scan file
    const scanResult = scanBufferForMalware(buffer, mimetype, originalname);
    if (!scanResult.isSafe) {
      console.warn(`[SECURITY AUDIT] Malicious image upload rejected (${req.user?.email || 'admin'}): ${scanResult.reason}`);
      return res.status(422).json({
        error: 'The image file could not be verified. Please select a standard image (JPEG, PNG, WebP).'
      });
    }

    await ensureBookFilesTable();

    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `covers/${uniqueFileName}`;

    let fileId = null;
    let finalUrl = null;
    let storageType = 'none';

    // 1. Save directly to local filesystem uploads/covers
    try {
      const coversDir = path.join(__dirname, '../uploads/covers');
      if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
      }
      const localFilePath = path.join(coversDir, uniqueFileName);
      fs.writeFileSync(localFilePath, buffer);
      
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      finalUrl = `${protocol}://${host}/uploads/covers/${uniqueFileName}`;
      storageType = 'local_disk';
    } catch (diskErr) {
      console.warn('[Image Upload] Local disk storage notice:', diskErr.message);
    }

    // 2. Try storing in PostgreSQL database table `book_files`
    try {
      const insertResult = await prisma.$queryRawUnsafe(
        `INSERT INTO public.book_files (filename, mimetype, size, data)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        safeName,
        mimetype || 'image/jpeg',
        buffer.length,
        buffer
      );
      fileId = insertResult[0]?.id;
      if (fileId && !finalUrl) {
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        finalUrl = `${protocol}://${host}/api/upload/file/${fileId}`;
        storageType = 'database';
      } else if (fileId) {
        storageType = 'local_disk_and_database';
      }
    } catch (dbErr) {
      console.warn('[Image Upload] DB storage notice:', dbErr.message);
    }

    // 3. Synchronize to Supabase storage bucket `books` if configured
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('books')
          .upload(storagePath, buffer, {
            contentType: mimetype || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('books').getPublicUrl(storagePath);
          if (data?.publicUrl) {
            finalUrl = data.publicUrl;
            storageType = `${storageType}_and_supabase`;
          }
        }
      } catch (sbErr) {
        console.warn(`[Image Upload] Supabase storage notice:`, sbErr.message);
      }
    }

    if (!finalUrl) {
      return res.status(500).json({
        error: 'Unable to save the cover image. Please check your connection and try again.'
      });
    }

    console.log(`[Image Upload] Success: url=${finalUrl}, storage=${storageType}`);

    return res.status(201).json({
      url: finalUrl,
      fileId,
      path: storagePath,
      storage: storageType,
      message: 'Cover image uploaded successfully.',
    });
  } catch (err) {
    console.error('Image upload unexpected error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during image upload. Please try again.' });
  }
});

module.exports = router;
