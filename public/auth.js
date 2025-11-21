// auth.js - simple login & signup redirect logic (v8 style)
(function(){
  const auth = window.auth || (window.firebase && firebase.auth && firebase.auth());

  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const pass = loginForm.querySelector('input[name="password"]').value;
      try{
        await auth.signInWithEmailAndPassword(email, pass);
        // redirect to admin: admin.js will check admin role and allow access
        window.location.href = 'admin.html';
      }catch(err){
        window.toast && window.toast(err.message || 'Login failed', {type:'error'});
        console.error('login error', err);
      }
    });
  }

  // Optional: signout helper
  window.logout = async function(){
    try{
      await auth.signOut();
      window.location.href = 'login.html';
    }catch(e){ console.error(e); }
  };
})();
