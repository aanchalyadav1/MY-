// stars.js — heavy stars + meteors (gold + bluish purple)
(() => {
  const canvas = document.getElementById('starsCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = w * DPR; canvas.height = h * DPR; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  const STAR_BASE = Math.floor((w*h)/6000);
  const stars = [];
  const meteors = [];

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function makeStars(count){
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*1.4 + 0.2,
        alpha: Math.random()*0.9 + 0.1,
        twinkleSpeed: Math.random()*0.02 + 0.002,
        phase: Math.random()*Math.PI*2,
        hue: Math.random() < 0.8 ? rand(200,220) : rand(260,300) // bluish / purple mix
      });
    }
  }

  function spawnMeteor(){
    // spawn from top-left to bottom-right with random angle
    const fromLeft = Math.random() < 0.6;
    const startX = fromLeft ? rand(-w*0.2, w*0.2) : rand(w*0.6, w+ w*0.2);
    const startY = rand(-h*0.15, h*0.15);
    const speed = rand(8,18); // px per frame-ish scaled to dt
    const length = rand(120, 380);
    const hue = Math.random() < 0.6 ? 210 : 45; // bluish (210) or golden (45)
    const sat = hue === 45 ? 90 : 85;
    meteors.push({
      x: startX,
      y: startY,
      vx: speed * (fromLeft ? 1 : -1),
      vy: speed * 0.35,
      length,
      life: 0,
      hue,
      sat
    });
    // keep meteors count reasonable
    if(meteors.length > 12) meteors.shift();
  }

  function init(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    stars.length = 0; meteors.length = 0;
    makeStars(Math.max(150, STAR_BASE));
    // spawn initial meteors
    for(let i=0;i<6;i++) {
      setTimeout(spawnMeteor, i*300 + Math.random()*800);
    }
  }

  let last = performance.now();
  function draw(now){
    const dt = Math.min(40, now - last) / 16.666;
    last = now;
    ctx.clearRect(0,0,w,h);

    // faint nebula gradient
    const g = ctx.createRadialGradient(w*0.2, h*0.1, 0, w*0.5, h*0.5, Math.max(w,h));
    g.addColorStop(0, "rgba(122,62,255,0.02)");
    g.addColorStop(0.5, "rgba(3,7,20,0.02)");
    g.addColorStop(1, "rgba(3,7,20,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // draw stars
    const t = now * 0.001;
    for(let s of stars){
      s.phase += s.twinkleSpeed * dt;
      const a = s.alpha * (0.5 + 0.5 * Math.sin(s.phase + t));
      // core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},80%,85%,${a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      // glow
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r*8);
      grad.addColorStop(0, `hsla(${s.hue},85%,70%,${a*0.12})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(s.x - s.r*8, s.y - s.r*8, s.r*16, s.r*16);
    }

    // update and draw meteors
    for(let m of meteors){
      m.life += dt;
      // position
      m.x += m.vx * dt * 0.6;
      m.y += m.vy * dt * 0.6;
      // trail drawing (long gradient)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const angle = Math.atan2(m.vy, m.vx);
      ctx.translate(m.x, m.y);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0,0, -m.length,0);
      // head bright
      grad.addColorStop(0, `hsla(${m.hue},${m.sat}%,70%,1)`);
      grad.addColorStop(0.25, `hsla(${m.hue},${m.sat}%,65%,0.6)`);
      grad.addColorStop(0.7, `hsla(${m.hue},${m.sat}%,50%,0.12)`);
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -1.5);
      ctx.lineTo(-m.length, -6);
      ctx.lineTo(-m.length, 6);
      ctx.lineTo(0, 1.5);
      ctx.closePath();
      ctx.fill();

      // bright head as a small circle
      ctx.beginPath();
      ctx.fillStyle = `hsla(${m.hue},${m.sat}%,85%,1)`;
      ctx.arc(2,0, Math.max(2, Math.min(6, m.length*0.02)), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // occasionally spawn new meteors (heavy)
    if(Math.random() < 0.12) spawnMeteor();

    // cull meteors that went away
    for(let i = meteors.length-1; i>=0; i--){
      const m = meteors[i];
      if(m.x < -w*0.5 || m.x > w*1.5 || m.y > h*1.5) meteors.splice(i,1);
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', init);
  init();
  requestAnimationFrame(draw);
})();
