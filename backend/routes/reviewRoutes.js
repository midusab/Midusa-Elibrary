const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, optionalAuth } = require('../middleware/auth');

// Get all reviews for a book
router.get('/book/:bookId', reviewController.getReviewsForBook);

// Submit a new review for a book (logged in or guest with name)
router.post('/', optionalAuth, reviewController.addReview);

// Delete review (author or admin)
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
