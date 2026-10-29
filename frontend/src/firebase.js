import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAgqt3Pp2auYbN85P3fzhUKE9s_SnUfBJg',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'midusaelibrary.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'midusaelibrary',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'midusaelibrary.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '981538710632',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:981538710632:web:01a174777714fb86f307dd',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional profile scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');
