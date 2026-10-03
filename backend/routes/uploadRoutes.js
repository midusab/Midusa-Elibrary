const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { supabase } = require('../config/database');
const { adminAuth } = require('../middleware/auth');

// Use memory storage — we stream bytes directly to Supabase, no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

/**
 * POST /api/upload/pdf
 * Admin-only. Accepts a multipart/form-data body with field "pdf".
 * Uploads the file to the Supabase "books" storage bucket and
 * returns the public URL which the caller stores in the DB.
 */
router.post('/pdf', adminAuth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Build a unique, sanitised filename: timestamp_originalname
    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `pdfs/${Date.now()}_${safeName}`;

    // Upload to the Supabase "books" bucket
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });
    }

    // Get the public URL
    const { data } = supabase.storage.from('books').getPublicUrl(storagePath);

    return res.status(201).json({
      url: data.publicUrl,
      path: storagePath,
      message: 'PDF uploaded successfully',
    });
  } catch (err) {
    console.error('PDF upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
