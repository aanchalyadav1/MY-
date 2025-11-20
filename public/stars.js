// stars.js — canvas starfield with twinkle + sparkles
(() => {
  const canvas = document.getElementById('starsCanvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = w * DPR; canvas.height = h * DPR; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  const STAR_COUNT = Math.floor((w*h)/7000); // scales by screen
  const stars = [];
  const sparks = [];

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function init(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);

    stars.length = 0; sparks.length = 0;
    const sc = Math.max(60, STAR_COUNT);
    for(let i=0;i<sc;i++){
      stars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*1.2 + 0.2,
        alpha: Math.random()*0.8 + 0.2,
        twinkle: Math.random()*0.02 + 0.005,
        phase: Math.random()*Math.PI*2,
        hue: rand(180,220)
      });
    }
    for(let i=0;i<Math.max(6, Math.floor(sc/40)); i++){
      sparks.push({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: rand(-0.2,0.2),
        vy: rand(-0.05,0.05),
        r: rand(0.6,1.8),
        hue: rand(200,260),
        alpha: rand(0.12,0.4)
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // faint nebula gradient
    const g = ctx.createRadialGradient(w*0.2, h*0.15, 0, w*0.4, h*0.4, Math.max(w,h));
    g.addColorStop(0, "rgba(125,62,255,0.02)");
    g.addColorStop(0.4, "rgba(7,10,24,0.01)");
    g.addColorStop(1, "rgba(7,10,24,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // sparks (soft glow moving)
    for(let s of sparks){
      s.x += s.vx; s.y += s.vy;
      if(s.x < -50) s.x = w+50; if(s.x > w+50) s.x = -50;
      if(s.y < -50) s.y = h+50; if(s.y > h+50) s.y = -50;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},80%,60%,${s.alpha})`;
      ctx.arc(s.x, s.y, s.r*3, 0, Math.PI*2);
      ctx.fill();
      // soft halo
      const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r*20);
      hg.addColorStop(0, `hsla(${s.hue},90%,65%,${s.alpha*0.25})`);
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg; ctx.fillRect(s.x-s.r*20, s.y-s.r*20, s.r*40, s.r*40);
    }

    // stars
    const t = performance.now() * 0.001;
    for(let st of stars){
      st.phase += st.twinkle;
      const a = st.alpha * (0.7 + 0.3*Math.sin(st.phase + t));
      ctx.beginPath();
      // neon-ish tiny star
      ctx.fillStyle = `hsla(${st.hue},80%,80%,${a})`;
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();
      // tiny halo
      ctx.beginPath();
      const grad = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r*8);
      grad.addColorStop(0, `hsla(${st.hue},80%,70%,${a*0.18})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(st.x-st.r*8, st.y-st.r*8, st.r*16, st.r*16);
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { init(); });
  init();
  requestAnimationFrame(draw);
})();
