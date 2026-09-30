const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
// (avoids needing a service account JSON file in the repo)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Newlines must be replaced when stored as a single-line env var
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = admin;
