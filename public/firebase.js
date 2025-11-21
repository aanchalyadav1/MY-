// firebase.js — FINAL CLEAN VERSION (Firebase v8 compat)
// Replace config only if you need to change project.

var firebaseConfig = {
  apiKey: "AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzw",
  authDomain: "portfolio-d3ea2.firebaseapp.com",
  projectId: "portfolio-d3ea2",
  storageBucket: "portfolio-d3ea2.appspot.com",
  messagingSenderId: "785515133038",
  appId: "1:785515133038:web:7661d57e681edc08f18e7f",
  measurementId: "G-8WP1PB41LZ"
};

(function () {
  // Ensure Firebase SDK scripts loaded BEFORE this file.
  if (!window.firebase) {
    console.error("❌ Firebase SDK not loaded. Add SDK scripts before firebase.js (see docs).");
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app();
    }

    // Expose v8-style globals used by other scripts
    window.firebaseApp = firebase.app();
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();

    console.log("✅ Firebase initialized (compat).");
  } catch (e) {
    console.error("❌ Firebase initialization error:", e);
  }
})();
