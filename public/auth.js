// Lightweight helper: ensures firebase auth/db exist for other pages
window.authReady = new Promise((resolve)=>{
  if(window.auth) return resolve(auth);
  let attempts = 0;
  const int = setInterval(()=>{
    attempts++;
    if(window.auth){ clearInterval(int); resolve(auth); }
    if(attempts>30){ clearInterval(int); resolve(null); }
  },100);
});
