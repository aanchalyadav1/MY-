// auth.js (light helper)
const auth = window.auth || firebase.auth();
auth.onAuthStateChanged(user=>{
  // if admin already logged in and is on login page, redirect to admin
  if(user && location.pathname.endsWith('login.html')){
    location.href = 'admin.html';
  }
});
