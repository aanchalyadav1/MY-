// avatar.js - floating hologram AY badge (resilient)
(function(){
  if(document.getElementById('ay-avatar-holo')) return;
  const el = document.createElement('div');
  el.id = 'ay-avatar-holo';
  el.style.position = 'fixed';
  el.style.right = '18px';
  el.style.bottom = '18px';
  el.style.zIndex = 60;
  el.style.width = '64px';
  el.style.height = '64px';
  el.style.borderRadius = '50%';
  el.style.display = 'grid';
  el.style.placeItems = 'center';
  el.style.backdropFilter = 'blur(6px)';
  el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';
  el.style.background = 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.14), rgba(0,0,0,0.08))';
  el.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="ayg" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#00d8ff"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="50" cy="50" r="28" fill="url(#ayg)" filter="url(#glow)"></circle>
      <text x="50" y="58" font-size="28" text-anchor="middle" fill="#021" font-weight="700" font-family="Inter, Poppins">AY</text>
    </svg>
  `;
  document.body.appendChild(el);
  let t = 0;
  function float(){ 
    t += 0.02; 
    // if element removed, stop
    if(!document.body.contains(el)) return;
    el.style.transform = `translateY(${Math.sin(t)*6}px) rotate(${Math.sin(t/2)*2}deg)`;
    requestAnimationFrame(float); 
  }
  requestAnimationFrame(float);
})();
