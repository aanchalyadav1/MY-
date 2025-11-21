// auth.js - simple auth helpers used by admin.html and login.html
(function(){
  const auth = window.auth || (window.firebase && firebase.auth && firebase.auth());

  // Login form handling (if present)
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const pass = loginForm.querySelector('input[name="password"]').value;
      try{
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = 'admin.html';
      }catch(err){
        window.toast && window.toast(err.message || 'Login failed', {type:'error'});
      }
    });
  }

  if(signupForm){
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signupForm.querySelector('input[name="email"]').value.trim();
      const pass = signupForm.querySelector('input[name="password"]').value;
      try{
        await auth.createUserWithEmailAndPassword(email, pass);
        window.location.href = 'admin.html';
      }catch(err){
        window.toast && window.toast(err.message || 'Signup failed', {type:'error'});
      }
    });
  }

  // Protect pages: if body has dataset.protect === 'true', redirect if not authed
  if(document.body && document.body.dataset.protect === 'true'){
    auth && auth.onAuthStateChanged(user => {
      if(!user) location.href = 'login.html';
    });
  }
})();
