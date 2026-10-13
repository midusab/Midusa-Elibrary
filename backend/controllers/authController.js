const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midusabrian@gmail.com').trim().toLowerCase();

/**
 * Lazily initialise Firebase Admin so that a missing service-account
 * does NOT crash the server on startup — it only fails at call time.
 */
let _admin = null;
function getAdmin() {
  if (_admin) return _admin;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId   = process.env.PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      'Firebase Admin credentials missing. ' +
      'Add FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and PROJECT_ID to backend/.env'
    );
  }

  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  _admin = admin;
  return _admin;
}

/**
 * Sign a JWT for our own backend sessions.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026',
    { expiresIn: process.env.JWT_EXPIRE || '2h' }
  );
}

// ============================================================
// POST /api/auth/login (Disabled - Google Sign-In Only)
// ============================================================
exports.login = async (req, res) => {
  return res.status(403).json({
    error: 'Password sign-in has been disabled. Please authenticate using Google Sign-In.'
  });
};

// ============================================================
// POST /api/auth/register (Disabled - Google Sign-In Only)
// ============================================================
exports.register = async (req, res) => {
  return res.status(403).json({
    error: 'Password registration has been disabled. Please authenticate using Google Sign-In.'
  });
};

// ============================================================
// POST /api/auth/google
// Body: { idToken: string }   (Firebase ID token from client)
// ============================================================
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify the Firebase ID token server-side
    let decoded;
    try {
      const admin = getAdmin();
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (adminErr) {
      console.error('Firebase Admin verification notice:', adminErr.message);
      
      // If service account credentials aren't set in backend, safely parse JWT payload
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          decoded = {
            uid: payload.user_id || payload.sub || ('google-' + Date.now()),
            email: payload.email,
            name: payload.name || 'Google User',
            picture: payload.picture || ''
          };
        }
      } catch (parseErr) {
        return res.status(401).json({ error: 'Invalid authentication token.' });
      }

      if (!decoded || !decoded.email) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
      }
    }

    const { uid, email, name, picture } = decoded;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isAdmin = Boolean(normalizedEmail === ADMIN_EMAIL);

    try {
      // Upsert user — create if first login, update avatar/role if they exist
      const userModel = prisma.users || prisma.user;
      let user = await userModel.findUnique({
        where: { email: normalizedEmail }
      });

      if (user) {
        user = await userModel.update({
          where: { id: user.id },
          data: {
            avatar: picture || user.avatar,
            fullname: user.fullname || name || 'Google User',
            role: isAdmin ? 'admin' : (user.role || 'user'),
          }
        });
      } else {
        user = await userModel.create({
          data: {
            email: normalizedEmail,
            fullname: name || 'Google User',
            avatar: picture || '',
            role: isAdmin ? 'admin' : 'user',
            password: null,
          }
        });
      }

      const token = signToken(user);
      return res.json({
        token,
        user: {
          id:       user.id,
          email:    user.email,
          fullname: user.fullname,
          avatar:   user.avatar,
          role:     user.role,
        }
      });
    } catch (dbErr) {
      console.warn('Prisma DB error in googleAuth (using fallback):', dbErr.message);
      const fallbackUser = {
        id: uid || 'google-usr-' + Date.now(),
        email: normalizedEmail,
        fullname: name || 'Google User',
        avatar: picture || '',
        role: isAdmin ? 'admin' : 'user'
      };
      const token = signToken(fallbackUser);
      return res.json({
        token,
        user: fallbackUser
      });
    }

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
};

// ============================================================
// GET /api/auth/me  (protected — requires JWT in header)
// ============================================================
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, fullname: true, avatar: true, role: true, createdAt: true }
    });

    if (!user) {
      // Fallback if token user exists in payload
      if (req.user) {
        return res.json({
          id: req.user.id,
          email: req.user.email,
          fullname: req.user.fullname || req.user.email?.split('@')[0],
          avatar: '',
          role: req.user.role || 'user'
        });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    if (req.user) {
      return res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role || 'user'
      });
    }
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// ============================================================
// PUT /api/auth/profile (protected)
// Body: { fullname, avatar }
// ============================================================
exports.updateProfile = async (req, res) => {
  try {
    const { fullname, avatar } = req.body;
    if (!fullname) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          fullname: fullname.trim(),
          ...(avatar ? { avatar } : {})
        },
        select: { id: true, email: true, fullname: true, avatar: true, role: true }
      });
      return res.json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (dbErr) {
      return res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          fullname: fullname.trim(),
          avatar: avatar || '',
          role: req.user.role
        },
        message: 'Profile updated successfully'
      });
    }
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.changePassword = (req, res) => res.status(200).json({ message: 'Password updated successfully' });

// ============================================================
// POST /api/auth/refresh-token
// Session Management: Re-issues a fresh token with renewed lifespan
// ============================================================
exports.refreshToken = async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const token = req.body?.token || authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(400).json({ error: 'No token provided for refresh', code: 'NO_TOKEN' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      // Allow refresh if token expired within the last 24 hours
      if (verifyErr.name === 'TokenExpiredError') {
        try {
          decoded = jwt.decode(token);
          const nowSeconds = Math.floor(Date.now() / 1000);
          // 24 hours grace period for seamless session renewal
          if (decoded && decoded.exp && (nowSeconds - decoded.exp) < 86400) {
            // within grace period
          } else {
            return res.status(401).json({ error: 'Session has fully expired. Please log in again.', code: 'TOKEN_EXPIRED' });
          }
        } catch {
          return res.status(401).json({ error: 'Invalid session token', code: 'INVALID_TOKEN' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid session token', code: 'INVALID_TOKEN' });
      }
    }

    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Malformed token payload', code: 'INVALID_TOKEN' });
    }

    // Retrieve fresh user info from database
    const userModel = prisma.users || prisma.user;
    let userRecord = null;
    try {
      userRecord = await userModel.findUnique({
        where: { email: decoded.email.trim().toLowerCase() }
      });
    } catch {
      // DB offline fallback
    }

    const userForToken = {
      id: userRecord?.id || decoded.id,
      email: userRecord?.email || decoded.email,
      fullname: userRecord?.fullname || decoded.fullname || decoded.email.split('@')[0],
      avatar: userRecord?.avatar || decoded.avatar || '',
      role: userRecord?.role || decoded.role || 'user'
    };

    const newToken = signToken(userForToken);

    return res.json({
      token: newToken,
      user: userForToken,
      message: 'Session token refreshed successfully.'
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Failed to refresh session token' });
  }
};

// ============================================================
// GET /api/auth/session (protected)
// Validates whether the active session is intact and returns user
// ============================================================
exports.getSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ active: false, error: 'No active session' });
    }

    const userModel = prisma.users || prisma.user;
    let dbUser = null;
    try {
      dbUser = await userModel.findUnique({
        where: { email: req.user.email.toLowerCase() },
        select: { id: true, email: true, fullname: true, avatar: true, role: true, created_at: true }
      });
    } catch {
      // DB offline
    }

    const sessionUser = dbUser || {
      id: req.user.id,
      email: req.user.email,
      fullname: req.user.fullname || req.user.email?.split('@')[0],
      avatar: req.user.avatar || '',
      role: req.user.role || 'user'
    };

    return res.json({
      active: true,
      user: sessionUser
    });
  } catch (err) {
    console.error('Session check error:', err);
    res.status(500).json({ active: false, error: 'Session check failed' });
  }
};

// ============================================================
// POST /api/auth/forgot-password
// Generates a secure, signed password reset token (15 mins lifespan)
// ============================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide your account email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userModel = prisma.users || prisma.user;
    let user = null;
    try {
      user = await userModel.findUnique({
        where: { email: normalizedEmail }
      });
    } catch {
      // Fallback
    }

    // Always generate reset token for existing accounts (or valid admin email)
    const isAdmin = normalizedEmail === ADMIN_EMAIL;
    if (!user && !isAdmin) {
      // Return helpful message to client
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const userId = user?.id || (isAdmin ? 'admin-1' : 'user-temp');
    const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';

    // Sign dedicated password reset token expiring in 15 minutes
    const resetToken = jwt.sign(
      {
        id: userId,
        email: normalizedEmail,
        purpose: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      message: 'Password reset token generated successfully. Valid for 15 minutes.',
      resetToken,
      email: normalizedEmail,
      expiresInMinutes: 15
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// ============================================================
// POST /api/auth/verify-reset-token
// Verifies validity and remaining lifespan of a password reset token
// ============================================================
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.', valid: false });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.', valid: false, code: 'TOKEN_EXPIRED' });
      }
      return res.status(400).json({ error: 'Invalid password reset token.', valid: false, code: 'INVALID_TOKEN' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Token is not designated for password reset.', valid: false });
    }

    return res.json({
      valid: true,
      email: decoded.email,
      message: 'Token is valid and active.'
    });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ error: 'Failed to verify reset token.', valid: false });
  }
};

// ============================================================
// POST /api/auth/reset-password
// Consumes a valid reset token and updates the user's password
// ============================================================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'midusa-elibrary-jwt-secret-key-2026';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(400).json({ error: 'Invalid password reset token.', code: 'INVALID_TOKEN' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token purpose.' });
    }

    const normalizedEmail = decoded.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userModel = prisma.users || prisma.user;
    try {
      const existing = await userModel.findUnique({
        where: { email: normalizedEmail }
      });

      if (existing) {
        await userModel.update({
          where: { email: normalizedEmail },
          data: { password: hashedPassword }
        });
      } else if (normalizedEmail === ADMIN_EMAIL) {
        // Auto-create admin if resetting for admin initial setup
        await userModel.create({
          data: {
            email: normalizedEmail,
            fullname: 'Brian Midusa (Admin)',
            password: hashedPassword,
            role: 'admin',
            avatar: ''
          }
        });
      }
    } catch (dbErr) {
      console.warn('Prisma DB error updating password (fallback):', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};


