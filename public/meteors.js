// meteors.js - lightweight meteor spawner
(() => {
  const container = document.getElementById('meteors-container');
  if(!container) return;

  function spawn(){
    const m = document.createElement('div');
    m.style.position = 'fixed';
    const size = Math.random()*140 + 40;
    m.style.width = size + 'px';
    m.style.height = '2px';
    m.style.left = Math.random()*100 + '%';
    m.style.top = Math.random()*40 + '%';
    m.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))';
    m.style.transform = 'rotate(-25deg)';
    m.style.opacity = String(0.9 - Math.random()*0.6);
    m.style.pointerEvents = 'none';
    m.style.zIndex = 1;
    m.style.transition = 'transform 1200ms linear, opacity 1200ms linear';
    container.appendChild(m);
    requestAnimationFrame(()=> {
      m.style.transform = `translateX(${Math.random()*600 + 400}px) translateY(${Math.random()*300 + 200}px) rotate(-25deg)`;
      m.style.opacity = '0';
    });
    setTimeout(()=> m.remove(), 1600 + Math.random()*800);
  }

  setInterval(()=> { if(Math.random() < 0.26) spawn(); }, 700);
})();
