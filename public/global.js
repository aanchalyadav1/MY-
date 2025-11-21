// global.js - theme + toast + skeleton helpers
(function(){
  // theme
  const saved = localStorage.getItem('ay_theme') || 'dark';
  applyTheme(saved);

  function applyTheme(t){
    if(t === 'light'){
      document.documentElement.style.setProperty('--bg','#f7f9fc');
      document.documentElement.style.setProperty('--text','#071021');
      document.documentElement.style.setProperty('--muted','#6b7280');
      document.documentElement.style.setProperty('--accent','#7c3aed');
    } else {
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--text');
      document.documentElement.style.removeProperty('--muted');
    }
    localStorage.setItem('ay_theme', t);
  }

  window.toast = function(message, opts={type:'ok', duration:4200}){
    const container = document.getElementById('toasts');
    if(!container) return console.log('toast:', message);
    const el = document.createElement('div');
    el.className = 'toast' + (opts.type === 'error' ? ' error' : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(()=> el.remove(), opts.duration || 4200);
  };

  window.showSkeleton = function(selector, count=3){
    const el = document.querySelector(selector);
    if(!el) return;
    el.innerHTML = '';
    for(let i=0;i<count;i++){
      const d = document.createElement('div'); d.className='skeleton'; d.style.height='18px'; d.style.marginTop = i? '8px':'0';
      el.appendChild(d);
    }
  };

  // page fade-in
  document.documentElement.style.opacity = 0;
  window.addEventListener('load', ()=> {
    document.documentElement.style.transition = 'opacity .45s ease';
    document.documentElement.style.opacity = 1;
  });
})();
