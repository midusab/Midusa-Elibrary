const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const {
  getAuthorProfile,
  followAuthor,
  unfollowAuthor,
  getFollowedAuthors,
} = require('../controllers/authorController');

// Public: get author profile (+ follow status if authenticated)
router.get('/profile/:name', optionalAuth, getAuthorProfile);

// Protected: follow / unfollow
router.post('/follow/:name', auth, followAuthor);
router.delete('/unfollow/:name', auth, unfollowAuthor);

// Protected: list authors the current user follows
router.get('/following', auth, getFollowedAuthors);

module.exports = router;
