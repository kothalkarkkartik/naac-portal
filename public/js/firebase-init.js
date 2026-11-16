// BIGCE NAAC Portal - Official Firebase Modular Integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// User's exact Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAkHo3QnwlA8K656SJE6AuoxJ6_7NMDpiM",
  authDomain: "naacc-d8759.firebaseapp.com",
  projectId: "naacc-d8759",
  storageBucket: "naacc-d8759.firebasestorage.app",
  messagingSenderId: "466146554687",
  appId: "1:466146554687:web:5cc01e79239a9cad74198a",
  measurementId: "G-DMFB2P3KZ9"
};

// Silence debug log chatter
try {
  setLogLevel('silent');
} catch (e) {}

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Silent Background Sync
export let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {}

// Expose internal sync utility without exposing external brand labels
window.BIGCE_CLOUD_SYNC = {
  app,
  db,
  syncSubmissionToCloud: async (submission) => {
    try {
      if (!submission || !submission.id) return;
      const subRef = doc(db, "naac_submissions", submission.id);
      await setDoc(subRef, {
        ...submission,
        lastSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {}
  },
  logCloudEvent: async (eventName, eventData) => {
    try {
      const logRef = doc(db, "activity_logs", "log-" + Date.now());
      await setDoc(logRef, {
        event: eventName,
        data: eventData,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}
  }
};
