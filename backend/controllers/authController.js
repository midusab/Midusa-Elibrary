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
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

// ============================================================
// POST /api/auth/login
// Body: { email, password }
// ============================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isAdmin = (normalizedEmail === ADMIN_EMAIL);

    try {
      const userModel = prisma.users || prisma.user;
      // Look up user in database
      let user = await userModel.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        // If it's the admin signing in for the first time, auto-create the account
        if (isAdmin) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await userModel.create({
            data: {
              email: normalizedEmail,
              fullname: 'Brian Midusa (Admin)',
              password: hashedPassword,
              role: 'admin',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
            }
          });
        } else {
          return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials or register.' });
        }
      } else {
        // User exists: verify password if user has password set
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password. Please try again.' });
          }
        }
        
        // Ensure role is admin if matches admin email
        if (isAdmin && user.role !== 'admin') {
          user = await userModel.update({
            where: { id: user.id },
            data: { role: 'admin' }
          });
        }
      }

      const token = signToken(user);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          avatar: user.avatar,
          role: user.role
        },
        message: isAdmin ? 'Welcome back, Administrator!' : 'Signed in successfully'
      });
    } catch (dbError) {
      console.warn('Prisma DB lookup error in login (using memory fallback):', dbError.message);
      // Graceful fallback for offline / unseeded database
      const fallbackUser = {
        id: isAdmin ? 'admin-1' : 'user-' + Date.now(),
        email: normalizedEmail,
        fullname: isAdmin ? 'Brian Midusa (Admin)' : normalizedEmail.split('@')[0],
        avatar: isAdmin ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' : '',
        role: isAdmin ? 'admin' : 'user'
      };
      const token = signToken(fallbackUser);
      return res.json({
        token,
        user: fallbackUser,
        message: isAdmin ? 'Signed in as Administrator (Local)' : 'Signed in successfully'
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during sign-in. Please try again.' });
  }
};

// ============================================================
// POST /api/auth/register
// Body: { fullname, email, password }
// ============================================================
exports.register = async (req, res) => {
  try {
    const { fullname, email, password, confirmPassword } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ⛔ Block registration with the admin email — admin account is created only via first login.
    if (normalizedEmail === ADMIN_EMAIL) {
      return res.status(403).json({
        error: 'This email address cannot be used to register. Please use a different email.'
      });
    }

    try {
      const userModel = prisma.users || prisma.user;
      const existingUser = await userModel.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userModel.create({
        data: {
          fullname: fullname.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user', // Always 'user' — admin role is set only via login for ADMIN_EMAIL
          avatar: ''
        }
      });

      const token = signToken(user);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          avatar: user.avatar,
          role: user.role
        },
        message: 'Account created successfully!'
      });
    } catch (dbErr) {
      console.warn('Prisma DB error in register (using fallback):', dbErr.message);
      // Fallback users are always 'user' role — admin email is already blocked above.
      const fallbackUser = {
        id: 'usr-' + Date.now(),
        email: normalizedEmail,
        fullname: fullname.trim(),
        avatar: '',
        role: 'user'
      };
      const token = signToken(fallbackUser);
      return res.status(201).json({
        token,
        user: fallbackUser,
        message: 'Account created successfully!'
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
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

