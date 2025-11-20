// stars.js — Galaxy-style rotating starfield with radial cinematic meteors
(() => {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // DPR & sizing
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = Math.max(300, innerWidth);
  let H = Math.max(240, innerHeight);
  function sizeCanvas() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.max(300, innerWidth);
    H = Math.max(240, innerHeight);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  sizeCanvas();

  // center
  let centerX = W / 2, centerY = H / 2;

  // config
  const CONFIG = {
    baseStarScale: 1 / 14000,
    layers: [
      { depth: 0.34, factor: 0.55, size: 0.5, twinkle: 0.004, hueRange: [200, 230], orbitMult: 0.018 },
      { depth: 0.43, factor: 0.85, size: 0.95, twinkle: 0.006, hueRange: [220, 260], orbitMult: 0.045 },
      { depth: 0.23, factor: 0.45, size: 1.6, twinkle: 0.01, hueRange: [260, 300], orbitMult: 0.12 }
    ],
    meteor: {
      maxActive: 28,
      spawnIntervalMs: 700,
      lengthMin: 160,
      lengthMax: 420,
      speedMin: 9,
      speedMax: 24,
      thicknessMin: 1.2,
      thicknessMax: 3.2,
      curveStrength: 0.0038,
      gravity: 0.00095,
      trailMax: 48
    },
    parallax: { strength: 40, verticalStrength: 28, lerpSpeed: 0.08 },
    performance: { maxCanvasAreaForHighDetail: 1600 * 900 }
  };

  let stars = [], meteors = [];
  let targetParallaxX = 0, targetParallaxY = 0, parallaxX = 0, parallaxY = 0;
  let lastTick = performance.now(), lastMeteorSpawn = performance.now(), lastMouseTime = 0;

  const rand = (a,b) => Math.random()*(b-a)+a;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

  function buildStars() {
    stars.length = 0;
    const area = W * H;
    const baseCount = Math.max(90, Math.floor(area * CONFIG.baseStarScale));
    const arms = 3;
    const armSeparation = (Math.PI * 2) / arms;
    const maxRadius = Math.min(W, H) * 0.56;
    for (let li=0; li<CONFIG.layers.length; li++){
      const layer = CONFIG.layers[li];
      let count = Math.round(baseCount * layer.factor);
      if (W*H < CONFIG.performance.maxCanvasAreaForHighDetail) count = Math.round(count * 0.66);
      for (let i=0;i<count;i++){
        const arm = i % arms;
        const radius = Math.pow(Math.random(),0.9)*maxRadius*layer.depth*(0.72 + Math.random()*0.6);
        const baseAngle = arm*armSeparation + radius*0.005;
        const angle = baseAngle + rand(-0.6,0.6);
        const hue = rand(layer.hueRange[0], layer.hueRange[1]);
        stars.push({
          layer: li,
          rbase: layer.size*(0.6 + Math.random()*1.2),
          hue: Math.floor(hue),
          alpha: rand(0.12, 0.95),
          twinkleSpd: layer.twinkle*(0.6 + Math.random()*1.4),
          radius, angle,
          orbitSpeed: (0.0007 + Math.random()*0.0018)*(1 + layer.orbitMult),
          offsetX: rand(-10,10)*layer.depth,
          offsetY: rand(-8,8)*layer.depth
        });
      }
    }
  }

  function spawnMeteorRadial() {
    const cfg = CONFIG.meteor;
    if (meteors.length >= cfg.maxActive) return;
    const sx = centerX + rand(-W*0.06, W*0.06);
    const sy = centerY + rand(-H*0.06, H*0.06);
    const angle = rand(0, Math.PI*2);
    const speed = rand(cfg.speedMin, cfg.speedMax);
    const length = rand(cfg.lengthMin, cfg.lengthMax);
    const thickness = rand(cfg.thicknessMin, cfg.thicknessMax);
    const hue = Math.random() < 0.74 ? rand(200,235) : rand(36,58);
    const sat = hue > 100 ? 85 : 96;
    const light = hue > 100 ? 70 : 62;
    meteors.push({
      x: sx, y: sy,
      vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
      vxVar: rand(-1.8,1.8), vyVar: rand(-1.0,1.0),
      length, life:0, maxLife: rand(80,170),
      thickness, hue: Math.floor(hue), sat, light, trail: []
    });
    if (meteors.length > cfg.maxActive) meteors.shift();
  }

  function softRadial(x,y,r,h,s,l,a){
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, `hsla(${h},${s}%,${l}%,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }

  function onPointerMove(clientX, clientY){
    lastMouseTime = performance.now();
    const rx = (clientX / W) - 0.5;
    const ry = (clientY / H) - 0.5;
    targetParallaxX = rx * CONFIG.parallax.strength;
    targetParallaxY = ry * CONFIG.parallax.verticalStrength;
  }
  window.addEventListener('mousemove', e => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => { if (e.touches && e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive:true });

  function render(now){
    const dt = Math.min(40, now - lastTick);
    lastTick = now;
    parallaxX += (targetParallaxX - parallaxX) * CONFIG.parallax.lerpSpeed;
    parallaxY += (targetParallaxY - parallaxY) * CONFIG.parallax.lerpSpeed;
    ctx.clearRect(0,0,W,H);

    // nebula
    const neb = ctx.createRadialGradient(centerX + parallaxX*0.1, centerY + parallaxY*0.08, 0, centerX, centerY, Math.max(W,H)*0.9);
    neb.addColorStop(0,'rgba(110,36,220,0.02)');
    neb.addColorStop(0.45,'rgba(6,10,20,0.02)');
    neb.addColorStop(1,'rgba(6,10,20,0)');
    ctx.fillStyle = neb; ctx.fillRect(0,0,W,H);

    const time = now*0.001;
    // stars
    for (let s of stars){
      s.angle += s.orbitSpeed * dt;
      const wobble = Math.sin(time*(1 + s.orbitSpeed * 120) + s.radius*0.03) * (0.6 + s.layer*0.3);
      const layerMoveFactor = (s.layer*0.4 + 0.18);
      const x = (centerX + parallaxX*layerMoveFactor) + (s.radius + wobble)*Math.cos(s.angle) + s.offsetX;
      const y = (centerY + parallaxY*layerMoveFactor) + (s.radius + wobble)*Math.sin(s.angle) + s.offsetY;
      s.alpha = clamp(s.alpha + Math.sin(time*2.4 + s.radius) * s.twinkleSpd * (dt/16), 0.03, 1);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},85%,85%,${s.alpha})`; ctx.arc(x,y,s.rbase,0,Math.PI*2); ctx.fill();
      const hr = s.rbase * 6;
      const halo = ctx.createRadialGradient(x,y,0,x,y,hr); halo.addColorStop(0, `hsla(${s.hue},85%,70%,${s.alpha*0.12})`); halo.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.fillRect(x-hr,y-hr,hr*2,hr*2);
    }

    // meteors
    for (let mi = meteors.length - 1; mi >= 0; mi--){
      const m = meteors[mi];
      m.life += dt * 0.06;
      m.vx += (Math.sin(time + m.life*0.03) * m.vxVar) * CONFIG.meteor.curveStrength * dt;
      m.vy += (Math.cos(time*1.6 + m.life*0.02) * m.vyVar) * (CONFIG.meteor.curveStrength * 0.92) * dt;
      m.vy += CONFIG.meteor.gravity * dt;
      const parInfluence = 0.0006;
      m.vx += parallaxX * parInfluence * (1 + m.length * 0.0006);
      m.vy += parallaxY * parInfluence * (1 + m.length * 0.0003);
      m.x += m.vx * (dt * 0.06); m.y += m.vy * (dt * 0.06);
      m.trail.unshift({x:m.x,y:m.y});
      if (m.trail.length > CONFIG.meteor.trailMax) m.trail.length = CONFIG.meteor.trailMax;

      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const trailLen = m.trail.length;
      for (let t=0; t<trailLen; t++){
        const p = m.trail[t]; const tRatio = t/trailLen;
        const alpha = clamp((1 - tRatio) * 0.6,0,0.9) * (1 - (m.life / m.maxLife));
        const rad = Math.max(1, (1 - tRatio) * m.thickness * 6);
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad*1.8);
        g.addColorStop(0, `hsla(${m.hue},${m.sat}%,${m.light}%,${alpha})`);
        g.addColorStop(0.4, `hsla(${m.hue},${m.sat}%,${m.light-8}%,${alpha*0.45})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x,p.y,rad,0,Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.fillStyle = `hsla(${m.hue},${m.sat}%,${m.light}%,1)`; ctx.arc(m.x,m.y, Math.max(1.2,m.thickness*1.6),0,Math.PI*2); ctx.fill();
      ctx.restore();

      if (m.life > m.maxLife || m.x < -W*0.5 || m.x > W*1.5 || m.y < -H*0.5 || m.y > H*1.5) meteors.splice(mi,1);
    }

    if (performance.now() - lastMeteorSpawn > CONFIG.meteor.spawnIntervalMs * (0.6 + Math.random()*1.8)) {
      spawnMeteorRadial(); if (Math.random() < 0.16) spawnMeteorRadial(); lastMeteorSpawn = performance.now();
    }

    requestAnimationFrame(render);
  }

  function initAll() {
    sizeCanvas(); centerX = W/2; centerY = H/2; buildStars(); meteors.length = 0; lastTick = performance.now(); lastMeteorSpawn = performance.now() - CONFIG.meteor.spawnIntervalMs*0.5; requestAnimationFrame(render);
  }

  let rT=null; window.addEventListener('resize', ()=>{ clearTimeout(rT); rT = setTimeout(()=> initAll(), 120); });
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ lastTick = performance.now(); lastMeteorSpawn = performance.now(); requestAnimationFrame(render); } });

  setInterval(()=>{ const now = performance.now(); if(now - lastMouseTime > 2500){ targetParallaxX *= 0.92; targetParallaxY *= 0.92; } }, 800);

  initAll();
})();    ctx.lineWidth = 2.2 * m.depth;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, m.y);
    ctx.lineTo(cx - m.len, m.y - m.len * 0.5);
    ctx.stroke();

    // glow bloom
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(cx, m.y, 2.2 * m.depth, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

/* -------------------------------
   ANIMATE LOOP
--------------------------------*/
function animate() {
  ctx.clearRect(0, 0, w, h);

  drawStars();
  drawMeteors();

  requestAnimationFrame(animate);
}

animate();      life: 0,
      maxLife: rand(80, 160),
      thickness,
      hue,
      sat,
      light,
      trail: []
    });

    // keep list manageable
    if (meteors.length > MAX_METEORS) meteors.shift();
  }

  // draw helper: soft radial fill
  function softRad(x, y, r, hue, sat, light, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // render loop
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(40, now - last);
    last = now;

    // clear
    ctx.clearRect(0, 0, W, H);

    // faint nebula / glow centered
    const { x: cx, y: cy } = center();
    const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
    neb.addColorStop(0, 'rgba(120,40,200,0.02)');
    neb.addColorStop(0.4, 'rgba(6,10,20,0.02)');
    neb.addColorStop(1, 'rgba(6,10,20,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);

    // update and draw stars (orbit around center)
    const time = now * 0.001;
    for (let s of stars) {
      // orbital angle update
      s.angle += s.orbitSpeed * dt;
      // radial wobble for 3D feel
      const wobble = Math.sin(time * (0.8 + s.orbitSpeed * 120) + s.radius * 0.02) * (0.6 + s.layer * 0.3);
      const x = s.cx + (s.radius + wobble) * Math.cos(s.angle) + s.offsetX;
      const y = s.cy + (s.radius + wobble) * Math.sin(s.angle) + s.offsetY;

      // twinkle
      s.alpha = Math.max(0.06, Math.min(1, s.alpha + Math.sin(time * 3 + s.radius) * s.twinkleSpd));

      // draw core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${Math.floor(s.hue)},85%,85%,${s.alpha})`;
      ctx.arc(x, y, s.rbase, 0, Math.PI * 2);
      ctx.fill();

      // small halo
      const hr = s.rbase * 6;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, hr);
      halo.addColorStop(0, `hsla(${Math.floor(s.hue)},85%,70%,${s.alpha * 0.12})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2);
    }

    // update and draw meteors: radial outward with curved trails (3D feel)
    for (let mi = meteors.length - 1; mi >= 0; mi--) {
      const m = meteors[mi];
      m.life += dt * 0.06;

      // apply slight drift / curvature to vx/vy using vxVar/vyVar and external noise
      m.vx += (Math.sin(time + m.life * 0.02) * m.vxVar) * 0.002 * dt;
      m.vy += (Math.cos(time * 1.2 + m.life * 0.015) * m.vyVar) * 0.0018 * dt;

      // move
      m.x += m.vx * (dt * 0.06);
      m.y += m.vy * (dt * 0.06);

      // push to trail (keep limited)
      m.trail.unshift({ x: m.x, y: m.y, age: 0 });
      if (m.trail.length > 40) m.trail.length = 40;

      // draw trail (tapered, fading)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const trailLen = m.trail.length;
      for (let t = 0; t < trailLen; t++) {
        const p = m.trail[t];
        const tRatio = t / trailLen;
        const alpha = Math.max(0, (1 - tRatio) * 0.55);
        const rad = Math.max(1, (1 - tRatio) * m.thickness * 6);
        // color fade: head bright, tail softer
        const hue = m.hue;
        const sat = m.sat;
        const light = m.light;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 1.8);
        g.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${alpha})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // head: small bright core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${m.hue},${m.sat}%,${m.light}%,1)`;
      ctx.arc(m.x, m.y, Math.max(1.2, m.thickness * 1.6), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      // cull meteor if life/time off-screen
      if (m.life > m.maxLife || m.x < -W * 0.5 || m.x > W * 1.5 || m.y < -H * 0.5 || m.y > H * 1.5) {
        meteors.splice(mi, 1);
      }
    }

    // spawn new meteors at a medium pace, but with some randomness
    if (now - lastMeteorSpawn > METEOR_SPAWN_BASE_MS * (0.6 + Math.random() * 1.6)) {
      spawnMeteorRadial();
      // sometimes spawn second to keep variety
      if (Math.random() < 0.18) spawnMeteorRadial();
      lastMeteorSpawn = now;
    }

    requestAnimationFrame(tick);
  }

  // init and resize handling
  function init() {
    sizeCanvas();
    makeGalaxy();
    meteors.length = 0;
    last = performance.now();
    lastMeteorSpawn = performance.now();
    requestAnimationFrame(tick);
  }

  // reduce complexity on small screens for perf
  function adaptForSmall() {
    if (W < 600 || H < 600) {
      // lower star counts and meteor frequency
      LAYERS.forEach((l) => { l.count = Math.max(20, Math.round(l.count * 0.6)); l.speedMult *= 0.8; l.twinkle *= 1.1; });
    }
  }

  // resize debounce
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { init(); adaptForSmall(); }, 140); });

  // pause when tab not visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      last = performance.now();
      lastMeteorSpawn = performance.now();
      requestAnimationFrame(tick);
    }
  });

  // initial run
  init();
})();
