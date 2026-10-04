const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/database');
const { adminAuth } = require('../middleware/auth');

// Local storage directories
const PDF_DIR = path.join(__dirname, '../uploads/pdfs');
const IMG_DIR = path.join(__dirname, '../uploads/covers');

for (const dir of [PDF_DIR, IMG_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer memory storage configuration for PDF
const uploadPdfMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Multer memory storage configuration for images
const uploadImgMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Save file locally as a robust fallback
 */
function saveLocally(buffer, fileName, subDir, req) {
  const targetDir = path.join(__dirname, '../uploads', subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const localFilePath = path.join(targetDir, fileName);
  fs.writeFileSync(localFilePath, buffer);

  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/${subDir}/${fileName}`;
}

/**
 * POST /api/upload/pdf
 * Admin-only. Accepts a multipart/form-data body with field "pdf".
 * Attempts to upload to the Supabase "books" storage bucket first.
 * If Supabase is restricted by RLS or connection errors, seamlessly falls back to local storage.
 */
router.post('/pdf', adminAuth, (req, res, next) => {
  uploadPdfMulter.single('pdf')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds limit (maximum 50 MB)' });
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
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Sanitized, collision-safe filename
    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `pdfs/${uniqueFileName}`;

    let uploadedUrl = null;
    let storageType = 'supabase';

    // 1. Try uploading to Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(storagePath, buffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.warn(`[PDF Upload] Supabase Storage upload failed (${uploadError.message}). Using local storage fallback.`);
      } else {
        const { data } = supabase.storage.from('books').getPublicUrl(storagePath);
        uploadedUrl = data?.publicUrl;
      }
    } catch (sbErr) {
      console.warn(`[PDF Upload] Supabase request error (${sbErr.message}). Using local storage fallback.`);
    }

    // 2. Fall back to local server storage if Supabase upload failed
    if (!uploadedUrl) {
      try {
        uploadedUrl = saveLocally(buffer, uniqueFileName, 'pdfs', req);
        storageType = 'local';
        console.log(`[PDF Upload] Successfully saved locally: ${uploadedUrl}`);
      } catch (localErr) {
        console.error('[PDF Upload] Local storage error:', localErr);
        return res.status(500).json({ error: `Upload failed: ${localErr.message}` });
      }
    }

    return res.status(201).json({
      url: uploadedUrl,
      path: storagePath,
      storage: storageType,
      message: 'PDF uploaded successfully',
    });
  } catch (err) {
    console.error('PDF upload unexpected error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * POST /api/upload/image
 * Admin-only. Accepts a multipart/form-data body with field "image".
 * Uploads cover images with local fallback support.
 */
router.post('/image', adminAuth, (req, res, next) => {
  uploadImgMulter.single('image')(req, res, (err) => {
    if (err) {
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
    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const storagePath = `covers/${uniqueFileName}`;

    let uploadedUrl = null;
    let storageType = 'supabase';

    try {
      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(storagePath, buffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from('books').getPublicUrl(storagePath);
        uploadedUrl = data?.publicUrl;
      }
    } catch (_) {}

    if (!uploadedUrl) {
      uploadedUrl = saveLocally(buffer, uniqueFileName, 'covers', req);
      storageType = 'local';
    }

    return res.status(201).json({
      url: uploadedUrl,
      path: storagePath,
      storage: storageType,
      message: 'Image uploaded successfully',
    });
  } catch (err) {
    console.error('Image upload unexpected error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

module.exports = router;
