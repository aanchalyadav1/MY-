// meteors.js - reliable meteor shower
(() => {
  const id = 'meteors-container';
  let container = document.getElementById(id);
  if(!container){
    container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
  }
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = 0;

  function spawnMeteor(){
    const m = document.createElement('div');
    m.className = 'meteor';
    const startLeft = Math.random()*100;
    const startTop = Math.random()*12; // spawn from top strip
    const len = 60 + Math.random()*160;
    const dur = 900 + Math.random()*900;
    m.style.left = startLeft + 'vw';
    m.style.top = startTop + 'vh';
    m.style.width = len + 'px';
    m.style.height = '2px';
    m.style.opacity = String(0.7 - Math.random()*0.5);
    m.style.transform = 'rotate(-25deg)';
    m.style.position = 'fixed';
    m.style.pointerEvents = 'none';
    m.style.zIndex = 5;
    m.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0))';
    m.style.transition = `transform ${dur}ms linear, opacity ${dur}ms linear`;
    document.body.appendChild(m);

    const tx = 300 + Math.random()*700;
    const ty = 120 + Math.random()*400;
    requestAnimationFrame(()=> {
      m.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(-25deg)`;
      m.style.opacity = '0';
    });
    setTimeout(()=> m.remove(), dur + 80);
  }

  // loop with natural randomness (4-8s average)
  (function loop(){
    if(Math.random() < 0.35) spawnMeteor();
    setTimeout(loop, 600 + Math.random()*1200);
  })();

  // expose control
  window._meteors = {
    stop: ()=> { /* not used */ },
    start: ()=> { /* not used */ }
  };
})();
