// global.js - theme toggle, toast, skeleton, page transitions
(function(){
  // apply theme from localStorage
  const saved = localStorage.getItem('ay_theme') || 'dark';
  applyTheme(saved);

  function applyTheme(name){
    if(name === 'light'){
      document.documentElement.style.setProperty('--bg', '#f7f9fc');
      document.documentElement.style.setProperty('--text', '#071021');
      document.documentElement.style.setProperty('--muted', '#6b7280');
    } else {
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--text');
      document.documentElement.style.removeProperty('--muted');
    }
    localStorage.setItem('ay_theme', name);
  }

  window.toggleTheme = function(){
    const cur = localStorage.getItem('ay_theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
    // let scripts pick up change; quick reload applies CSS variables uniformly
    try{ document.documentElement.style.transition = 'background .25s ease'; }catch{}
  };

  window.toast = function(message, opts={type:'ok', duration:4200}){
    const container = document.getElementById('toasts');
    if(!container) {
      console.log('toast:', message);
      return;
    }
    const el = document.createElement('div');
    el.className = 'toast' + (opts.type === 'error' ? ' error' : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(()=> el.remove(), opts.duration || 4200);
  };

  window.showSkeleton = function(selector, lines=3){
    const el = document.querySelector(selector);
    if(!el) return;
    el.innerHTML = '';
    for(let i=0;i<lines;i++){
      const d = document.createElement('div'); d.className='skeleton'; d.style.height='18px'; d.style.marginTop = i? '8px':'0';
      el.appendChild(d);
    }
  };

  // fade-in
  document.documentElement.style.opacity = 0;
  window.addEventListener('load', ()=> {
    document.documentElement.style.transition = 'opacity .45s ease';
    document.documentElement.style.opacity = 1;
  });
})();
