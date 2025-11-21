// firebase.js — FINAL CLEAN VERSION (Firebase v8)
// Do NOT modify anything except the config if needed.

var firebaseConfig = {
  apiKey: "AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzw",
  authDomain: "portfolio-d3ea2.firebaseapp.com",
  projectId: "portfolio-d3ea2",
  storageBucket: "portfolio-d3ea2.appspot.com",
  messagingSenderId: "785515133038",
  appId: "1:785515133038:web:7661d57e681edc08f18e7f",
  measurementId: "G-8WP1PB41LZ"
};

// ----------------------------
// Initialize Firebase
// ----------------------------
try {
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  // Export global references
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  console.log("🔥 Firebase initialized successfully");

} catch (err) {
  console.error("❌ Firebase initialization failed:", err);
}
