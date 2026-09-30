const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', bookController.getBooks);
router.get('/featured', bookController.getFeaturedBooks);
router.get('/bestsellers', bookController.getBestsellerBooks);
router.get('/:id', bookController.getBookById);

// Admin only routes
router.post('/', adminAuth, bookController.createBook);
router.put('/:id', adminAuth, bookController.updateBook);
router.delete('/:id', adminAuth, bookController.deleteBook);

module.exports = router;
