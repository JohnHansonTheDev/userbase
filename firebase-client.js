import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZi_ydHt0EmeD7h_tD3fid-agv1IGGCWg",
  authDomain: "userbase-86993.firebaseapp.com",
  projectId: "userbase-86993",
  storageBucket: "userbase-86993.firebasestorage.app",
  messagingSenderId: "900145259288",
  appId: "1:900145259288:web:3f0f6c7eaf8a7610cb346d",
  measurementId: "G-P3NRCTXBJX",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

let analytics = null;
analyticsSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, auth, provider, db, analytics };
