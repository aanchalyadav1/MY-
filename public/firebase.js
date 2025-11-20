// scripts/firebase.js (v8)
var firebaseConfig = {
  apiKey: "AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzw",
  authDomain: "portfolio-d3ea2.firebaseapp.com",
  projectId: "portfolio-d3ea2",
  storageBucket: "portfolio-d3ea2.appspot.com",
  messagingSenderId: "785515133038",
  appId: "1:785515133038:web:7661d57e681edc08f18e7f",
  measurementId: "G-8WP1PB41LZ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();
