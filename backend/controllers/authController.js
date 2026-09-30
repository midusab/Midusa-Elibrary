const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

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
      console.error('Firebase Admin error:', adminErr.message);
      if (adminErr.message.includes('credentials missing')) {
        return res.status(503).json({
          error: 'Server auth configuration incomplete. See backend/.env setup instructions.'
        });
      }
      if (adminErr.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Session expired. Please sign in again.' });
      }
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    const { uid, email, name, picture } = decoded;

    // Upsert user — create if first login, update avatar if they exist
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: uid },
          { email: email }
        ]
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: uid,
          avatar: picture || user.avatar,
          fullname: user.fullname || name || 'Google User',
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          googleId: uid,
          email: email,
          fullname: name || 'Google User',
          avatar: picture || '',
          role: 'user',
          password: null,
        }
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:       user.id,
        email:    user.email,
        fullname: user.fullname,
        avatar:   user.avatar,
        role:     user.role,
      }
    });

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
      select: { id: true, email: true, fullname: true, avatar: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Legacy stubs
exports.register       = (req, res) => res.status(410).json({ error: 'Use Google sign-in instead.' });
exports.login          = (req, res) => res.status(410).json({ error: 'Use Google sign-in instead.' });
exports.updateProfile  = (req, res) => res.status(501).json({ error: 'Not implemented' });
exports.changePassword = (req, res) => res.status(410).json({ error: 'Password not used with Google auth.' });
