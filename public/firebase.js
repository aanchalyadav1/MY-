// firebase.js — robust init (Firebase v8 compat)
// Replace firebaseConfig with your project details if needed.

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
  // Promise that resolves when firebase is initialized (or rejects on timeout)
  let resolveReady, rejectReady;
  window._firebaseReady = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });

  // Poll for firebase namespace (works if SDKs are loaded with defer)
  const WAIT_MS = 3000;
  const POLL_INTERVAL = 50;
  let waited = 0;

  const poll = setInterval(() => {
    if (window.firebase && firebase.apps !== undefined) {
      clearInterval(poll);
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        } else {
          firebase.app();
        }
        // Expose v8-style globals used elsewhere
        window.firebaseApp = firebase.app();
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        window.storage = firebase.storage();
        console.log("✅ Firebase initialized (compat).");
        resolveReady({ auth: window.auth, db: window.db, storage: window.storage });
      } catch (e) {
        console.error("❌ Firebase initialization error:", e);
        rejectReady(e);
      }
      return;
    }

    waited += POLL_INTERVAL;
    if (waited >= WAIT_MS) {
      clearInterval(poll);
      const err = new Error("Firebase SDK not found after waiting " + WAIT_MS + "ms.");
      console.error("❌", err);
      rejectReady(err);
    }
  }, POLL_INTERVAL);
})();
