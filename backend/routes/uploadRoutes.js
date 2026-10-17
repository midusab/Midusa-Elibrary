const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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
 * GET /api/upload/file/:id
 * Public endpoint to stream files stored directly in PostgreSQL database table `book_files`.
 * Supports HTTP Range requests for instant page-seeking in PDF viewers.
 */
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT filename, mimetype, size, data FROM public.book_files WHERE id = $1 LIMIT 1;`,
      id
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'File not found in database' });
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
    res.status(500).json({ error: 'Failed to stream file from database' });
  }
});

/**
 * POST /api/upload/pdf
 * Admin-only. Accepts a multipart/form-data body with field "pdf".
 * Stores file in the database (PostgreSQL book_files table) and syncs to Supabase.
 * NEVER stores locally on disk.
 */
router.post('/pdf', adminAuth, (req, res, next) => {
  uploadPdfMulter.single('pdf')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds limit (maximum 150 MB)' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Invalid file uploaded' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided. Please select a file to upload.' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Scan file for real security vulnerabilities (executable binaries, launch exploits)
    const scanResult = scanBufferForMalware(buffer, mimetype, originalname);
    if (!scanResult.isSafe) {
      console.warn(`[SECURITY AUDIT] PDF rejected (${req.user?.email || 'admin'}): ${scanResult.reason}`);
      return res.status(422).json({
        error: 'Security Scan Failed',
        message: scanResult.reason,
        details: scanResult.signature || scanResult.pattern || 'Malicious content rejected.'
      });
    }

    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `pdfs/${uniqueFileName}`;

    // 1. Store directly in PostgreSQL database table `book_files`
    const insertResult = await prisma.$queryRawUnsafe(
      `INSERT INTO public.book_files (filename, mimetype, size, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id;`,
      safeName,
      'application/pdf',
      buffer.length,
      buffer
    );

    const fileId = insertResult[0]?.id;
    const host = req.get('host');
    const protocol = req.protocol;
    const dbUrl = `${protocol}://${host}/api/upload/file/${fileId}`;
    let finalUrl = dbUrl;
    let storageType = 'database';

    // 2. Synchronize to Supabase storage bucket `books`
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
          storageType = 'supabase_and_database';
        }
      } else {
        console.warn(`[PDF Upload] Supabase Storage upload skipped (${uploadError.message}). File successfully stored in PostgreSQL database.`);
      }
    } catch (sbErr) {
      console.warn(`[PDF Upload] Supabase request notice (${sbErr.message}). File safely stored in PostgreSQL database.`);
    }

    console.log(`[PDF Upload] Success: fileId=${fileId}, url=${finalUrl}, storage=${storageType}`);

    return res.status(201).json({
      url: finalUrl,
      fileId,
      path: storagePath,
      storage: storageType,
      message: 'PDF uploaded and saved to database successfully',
    });
  } catch (err) {
    console.error('PDF upload unexpected error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * POST /api/upload/image
 * Admin-only. Accepts a multipart/form-data body with field "image".
 * Stores cover image in database (PostgreSQL book_files table) and syncs to Supabase.
 * NEVER stores locally on disk.
 */
router.post('/image', adminAuth, (req, res, next) => {
  uploadImgMulter.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image size exceeds limit (maximum 25 MB)' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Invalid image file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Scan file
    const scanResult = scanBufferForMalware(buffer, mimetype, originalname);
    if (!scanResult.isSafe) {
      console.warn(`[SECURITY AUDIT] Malicious image upload rejected (${req.user?.email || 'admin'}): ${scanResult.reason}`);
      return res.status(422).json({
        error: 'Security Scan Failed',
        message: scanResult.reason,
        details: scanResult.signature || scanResult.pattern || 'Malicious image content rejected.'
      });
    }

    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `covers/${uniqueFileName}`;

    // 1. Store directly in PostgreSQL database table `book_files`
    const insertResult = await prisma.$queryRawUnsafe(
      `INSERT INTO public.book_files (filename, mimetype, size, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id;`,
      safeName,
      mimetype || 'image/jpeg',
      buffer.length,
      buffer
    );

    const fileId = insertResult[0]?.id;
    const host = req.get('host');
    const protocol = req.protocol;
    const dbUrl = `${protocol}://${host}/api/upload/file/${fileId}`;
    let finalUrl = dbUrl;
    let storageType = 'database';

    // 2. Synchronize to Supabase storage bucket `books`
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
          storageType = 'supabase_and_database';
        }
      }
    } catch (_) {}

    return res.status(201).json({
      url: finalUrl,
      fileId,
      path: storagePath,
      storage: storageType,
      message: 'Cover image uploaded and saved to database successfully',
    });
  } catch (err) {
    console.error('Image upload unexpected error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

module.exports = router;
