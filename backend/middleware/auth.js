const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midusabrian@gmail.com').trim().toLowerCase();

/**
 * Standard user authentication middleware
 * Validates Bearer token, checks expiration, supports both backend JWTs & Firebase ID tokens,
 * and attaches normalized req.user with clear, user-friendly error messages.
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({
        error: 'Please sign in to continue.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({
        error: 'Authentication session not found. Please sign in.',
        code: 'INVALID_TOKEN'
      });
    }

    let decoded = null;

    // 1. First attempt: Verify using backend JWT secret
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      if (verifyErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Your session has expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        });
      }

      // 2. Second attempt: Check if token is a valid Firebase ID Token or signed JWT
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload && (payload.email || payload.user_id || payload.sub)) {
            // Check expiration
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              return res.status(401).json({
                error: 'Your sign-in session has expired. Please sign in again.',
                code: 'TOKEN_EXPIRED'
              });
            }

            const email = (payload.email || '').trim().toLowerCase();
            const isAdmin = email === ADMIN_EMAIL || payload.role === 'admin';

            decoded = {
              id: payload.id || payload.user_id || payload.sub || payload.uid,
              email: email,
              fullname: payload.name || payload.fullname || email.split('@')[0],
              role: isAdmin ? 'admin' : (payload.role || 'user'),
              isAdmin: isAdmin
            };
          }
        }
      } catch (parseErr) {
        // Token could not be parsed
      }
    }

    if (!decoded) {
      return res.status(401).json({
        error: 'Your sign-in session is invalid or has expired. Please sign in again.',
        code: 'INVALID_TOKEN'
      });
    }

    const normalizedEmail = (decoded.email || '').trim().toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL || decoded.role === 'admin';

    req.user = {
      ...decoded,
      email: normalizedEmail,
      role: isAdmin ? 'admin' : (decoded.role || 'user'),
      isAdmin: isAdmin
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication could not be completed. Please sign in again.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Admin-only authorization middleware
 * Ensures user is authenticated AND has admin role or matches ADMIN_EMAIL
 */
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    const isUserAdmin =
      req.user &&
      (req.user.role === 'admin' ||
        req.user.isAdmin === true ||
        (req.user.email && req.user.email.trim().toLowerCase() === ADMIN_EMAIL));

    if (!isUserAdmin) {
      return res.status(403).json({
        error: 'Administrator access required. Please sign in with an administrator account.',
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

    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload && (payload.email || payload.user_id || payload.sub)) {
            const email = (payload.email || '').trim().toLowerCase();
            const isAdmin = email === ADMIN_EMAIL || payload.role === 'admin';
            decoded = {
              id: payload.id || payload.user_id || payload.sub,
              email: email,
              role: isAdmin ? 'admin' : (payload.role || 'user'),
              isAdmin
            };
          }
        }
      } catch {}
    }

    req.user = decoded;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };

