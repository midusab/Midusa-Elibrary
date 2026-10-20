const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midusabrian@gmail.com').trim().toLowerCase();

/**
 * Standard user authentication middleware
 * Validates Bearer token, checks expiration, and attaches req.user
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authentication token provided. Access denied.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({
        error: 'Malformed authentication token.',
        code: 'INVALID_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    return res.status(401).json({
      error: 'Invalid or forged authentication token.',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Admin-only authorization middleware
 * Ensures user is authenticated AND has admin role or matches admin email
 */
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    const isUserAdmin =
      req.user &&
      (req.user.role === 'admin' ||
        (req.user.email && req.user.email.trim().toLowerCase() === ADMIN_EMAIL));

    if (!isUserAdmin) {
      return res.status(403).json({
        error: 'Access denied. Administrator privileges required.',
        code: 'FORBIDDEN_NOT_ADMIN'
      });
    }
    next();
  });
};

/**
 * Optional authentication middleware
 * Attaches req.user if a valid token is present, but allows guest access if not
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      req.user = null;
      return next();
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };

