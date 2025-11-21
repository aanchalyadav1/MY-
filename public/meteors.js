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
  container.style.zIndex = 1;

  function spawnMeteor(){
    const m = document.createElement('div');
    m.className = 'meteor';
    const startLeft = Math.random()*100;
    const startTop = Math.random()*10; // spawn near top
    const length = 120 + Math.random()*220;
    const dur = 900 + Math.random()*1200;
    m.style.left = startLeft + 'vw';
    m.style.top = startTop + 'vh';
    m.style.width = length + 'px';
    m.style.height = '2px';
    m.style.opacity = String(0.6 - Math.random()*0.4);
    m.style.transform = 'rotate(-25deg)';
    m.style.position = 'fixed';
    m.style.pointerEvents = 'none';
    m.style.zIndex = 1;
    m.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0))';
    m.style.filter = 'drop-shadow(0 6px 12px rgba(124,58,237,0.06))';
    document.body.appendChild(m);

    // animate with WAAPI for smoothness
    const tx = 300 + Math.random()*900;
    const ty = 200 + window.innerHeight * 0.6 + Math.random()*400;
    m.animate([
      { transform: `translate(0,0) rotate(-25deg)`, opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) rotate(-25deg)`, opacity: 0 }
    ], {
      duration: dur,
      easing: "cubic-bezier(.2,.8,.2,1)",
      iterations: 1,
      fill: "forwards"
    });

    setTimeout(()=> {
      try{ m.remove(); }catch(e){}
    }, dur + 60);
  }

  (function loop(){
    // randomize spawn interval (average ~1.2s)
    if(Math.random() < 0.45) spawnMeteor();
    setTimeout(loop, 600 + Math.random()*1200);
  })();

})();
