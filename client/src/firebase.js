// client/src/firebase.js
// Firebase Client Initialization & Google Sign-In Provider for ExamOpt AI

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoExamOptApiKeyGLAHackVision2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'examopt-ai-commit2win.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'examopt-ai-commit2win',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'examopt-ai-commit2win.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef1234567890'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Firebase Google Auth with popup.
 * If live Firebase project is offline or not configured in environment,
 * provides a seamless fallback token for demo accounts.
 */
export async function signInWithGoogle(intendedRole = 'admin') {
  try {
    // Attempt standard Firebase Google Popup
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      idToken,
      email: result.user.email,
      displayName: result.user.displayName,
      uid: result.user.uid,
      photoURL: result.user.photoURL
    };
  } catch (err) {
    // If popup closed or live credentials not configured, allow fallback token for testing
    console.warn('Firebase popup unavailable or canceled, using authorized demo credential:', err.message);
    const demoEmail = intendedRole === 'admin' 
      ? 'admin@university.edu' 
      : 'rahul.kumar@student.university.edu';
    
    return {
      idToken: `firebase_mock_token_${intendedRole}_${Date.now()}`,
      email: demoEmail,
      displayName: intendedRole === 'admin' ? 'Dr. Sarah Mitchell (Google)' : 'Rahul Kumar (Google)',
      uid: `google_uid_${intendedRole}_101`,
      isDemoFallback: true
    };
  }
}

export { auth, googleProvider };
