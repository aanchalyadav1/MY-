// firebase.js — initialize Firebase (v8) and export db + auth + storage to window
// Replace config values only if needed.

var firebaseConfig = {
  apiKey: "AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzw",
  authDomain: "portfolio-d3ea2.firebaseapp.com",
  projectId: "portfolio-d3ea2",
  storageBucket: "portfolio-d3ea2.appspot.com",
  messagingSenderId: "785515133038",
  appId: "1:785515133038:web:7661d57e681edc08f18e7f",
  measurementId: "G-8WP1PB41LZ"
};


(function(){
  if(!window.firebase || !window.AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzwG){
    console.error('Firebase SDK not loaded or config missing');
    return;
  }
  try{
    const app = firebase.initializeApp(window.AIzaSyALsjcNqBMZwOF3Lfhm1uU_n9A57Bb9gzw);
    window.firebaseApp = app;
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    console.log('Firebase initialized (compat).');
  }catch(e){
    console.error('Firebase init error', e);
  }
})();
