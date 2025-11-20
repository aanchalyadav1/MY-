// stars.js — medium density 3D-feel meteor shower + layered twinkling stars
(() => {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // DPR handling
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = innerWidth, H = innerHeight;
  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = canvas.width = Math.round(innerWidth * DPR);
    H = canvas.height = Math.round(innerHeight * DPR);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();

  // Layers for parallax / depth
  const LAYERS = [
    { countFactor: 0.45, speed: 0.25, size: 0.7, alpha: 0.6, hueRange: [200, 220] }, // distant bluish
    { countFactor: 0.35, speed: 0.6, size: 1.0, alpha: 0.8, hueRange: [200, 240] },  // mid
    { countFactor: 0.2,  speed: 1.2, size: 1.6, alpha: 1.0, hueRange: [260, 300] }   // near purple/white
  ];

  const BASE_STARS = Math.max(110, Math.floor((innerWidth * innerHeight) / 12000));
  const stars = [];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // create layered stars
  function initStars() {
    stars.length = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      const count = Math.round(BASE_STARS * layer.countFactor);
      for (let i = 0; i < count; i++) {
        stars.push({
          layer: li,
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          baseR: rand(0.3, layer.size),
          r: 0,
          alpha: rand(0.15, layer.alpha * 0.9),
          twinkleSpeed: rand(0.002, 0.012),
          phase: Math.random() * Math.PI * 2,
          hue: rand(layer.hueRange[0], layer.hueRange[1]),
          driftX: rand(-0.03, 0.03) * layer.speed,
          driftY: rand(-0.02, 0.02) * layer.speed
        });
      }
    }
  }

  // Meteors structure
  const meteors = [];
  // medium spawn: between 0.06 and 0.12 per frame chance, but controlled by timer for smoothing
  let meteorTimer = 0;

  function spawnMeteor() {
    // spawn from a random edge above the top, with angled direction across screen
    const fromLeft = Math.random() < 0.65;
    const startX = fromLeft ? rand(-innerWidth * 0.2, innerWidth * 0.2) : rand(innerWidth * 0.6, innerWidth * 1.2);
    const startY = rand(-innerHeight * 0.15, innerHeight * 0.05);

    // length, speed, tilt — varied for 3D effect
    const length = rand(160, 420);            // pixel trail length
    const speed = rand(10, 20);               // base speed
    const angle = (fromLeft ? rand(18, 26) : rand(154, 166)) * (Math.PI / 180); // slight angle
    const huePick = Math.random();
    // bluish/purple favored; sometimes golden
    const color = huePick < 0.7
      ? { hue: rand(200, 230), sat: 85, light: 70 }   // bluish
      : { hue: rand(40, 55), sat: 95, light: 60 };    // gold

    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length,
      life: 0,
      maxLife: rand(60, 120),
      color,
      thickness: rand(1.4, 3.4),
      blur: rand(8, 26)
    });
    // keep list trimmed
    if (meteors.length > 12) meteors.shift();
  }

  // helper: soft radial brush
  function softCircle(x, y, r, h, s, l, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${h},${s}%,${l}%,${a})`);
    g.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // render loop
  let last = performance.now();
  function render(now) {
    const dt = Math.min(40, now - last);
    last = now;

    // clear
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // subtle nebula background (for depth)
    const neb = ctx.createRadialGradient(innerWidth * 0.2, innerHeight * 0.15, 0, innerWidth * 0.6, innerHeight * 0.6, Math.max(innerWidth, innerHeight));
    neb.addColorStop(0, 'rgba(90,36,200,0.02)');
    neb.addColorStop(0.4, 'rgba(8,12,24,0.02)');
    neb.addColorStop(1, 'rgba(8,12,24,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    // update & draw stars
    const t = now * 0.001;
    for (let s of stars) {
      // twinkle
      s.phase += s.twinkleSpeed * (dt * 0.07);
      const tw = 0.5 + 0.5 * Math.sin(s.phase + t * 1.2);
      const alpha = s.alpha * (0.6 + 0.4 * tw);

      // slight movement/drift for parallax illusion
      s.x += s.driftX * (dt * 0.03);
      s.y += s.driftY * (dt * 0.03);
      // wrap
      if (s.x < -10) s.x = innerWidth + 10;
      if (s.x > innerWidth + 10) s.x = -10;
      if (s.y < -10) s.y = innerHeight + 10;
      if (s.y > innerHeight + 10) s.y = -10;

      // core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},85%,85%,${alpha})`;
      ctx.arc(s.x, s.y, s.baseR, 0, Math.PI * 2);
      ctx.fill();

      // small halo
      const haloR = s.baseR * 6;
      const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
      halo.addColorStop(0, `hsla(${s.hue},85%,70%,${alpha * 0.12})`);
      halo.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(s.x - haloR, s.y - haloR, haloR * 2, haloR * 2);
    }

    // draw meteors (back-to-front)
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i];
      m.life += dt * 0.06;
      // move
      m.x += m.vx * (dt * 0.06);
      m.y += m.vy * (dt * 0.06);

      // 3D-feel tapered trail: use path + gradient
      const angle = Math.atan2(m.vy, m.vx);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(angle);
      // tail gradient (long and soft)
      const tailGrad = ctx.createLinearGradient(0, 0, -m.length, 0);
      // head
      tailGrad.addColorStop(0, `hsla(${m.color.hue},${m.color.sat}%,${m.color.light}%,1)`);
      tailGrad.addColorStop(0.15, `hsla(${m.color.hue},${m.color.sat}%,${m.color.light - 8}%,0.75)`);
      tailGrad.addColorStop(0.45, `hsla(${m.color.hue},${m.color.sat}%,${m.color.light - 18}%,0.28)`);
      tailGrad.addColorStop(1, 'rgba(0,0,0,0)');

      // soft blurred trail rectangle (wider near head, tapered)
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = tailGrad;

      // use a tapered polygon for a better 3D shape
      ctx.beginPath();
      const wHead = m.thickness * 4;
      const wTail = Math.max(1, m.thickness * 0.4);
      ctx.moveTo(0, -wHead);
      ctx.lineTo(-m.length, -wTail * 0.6);
      ctx.lineTo(-m.length, wTail * 0.6);
      ctx.lineTo(0, wHead);
      ctx.closePath();
      ctx.fill();

      // add subtle streak lines inside trail for motion
      const lines = 3;
      for (let li = 0; li < lines; li++) {
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, m.thickness * (0.4 - li * 0.08));
        ctx.strokeStyle = `hsla(${m.color.hue},${m.color.sat}%,${m.color.light}%,${0.18 - li * 0.04})`;
        ctx.moveTo(rand(-m.length * 0.05, -m.length * 0.1), rand(-1, 1));
        ctx.lineTo(-m.length * (0.4 + Math.random() * 0.45), rand(-1.5, 1.5));
        ctx.stroke();
      }

      // bright head glow
      softCircle(6, 0, m.thickness * 6, m.color.hue, m.color.sat, m.color.light + 5, 0.95);
      // sharp head
      ctx.beginPath();
      ctx.fillStyle = `hsla(${m.color.hue},${m.color.sat}%,${m.color.light}%,1)`;
      ctx.arc(6, 0, Math.max(1.2, m.thickness * 1.6), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }

    // spawn control: medium density — average spawn ~ every 700-1100ms with randomness
    meteorTimer += dt;
    if (meteorTimer > (500 + Math.random() * 700)) {
      // spawn 1 or sometimes 2 for visual variety
      spawnMeteor();
      if (Math.random() < 0.15) spawnMeteor();
      meteorTimer = 0;
    }

    // remove meteors that are off-screen or exceed life
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (m.x < -innerWidth * 0.5 || m.x > innerWidth * 1.5 || m.y > innerHeight * 1.5 || m.life > m.maxLife) {
        meteors.splice(i, 1);
      }
    }

    requestAnimationFrame(render);
  }

  // initialize
  function init() {
    resize();
    initStars();
    meteors.length = 0;
    last = performance.now();
    requestAnimationFrame(render);
  }

  // handle resize & visibility
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 120);
  });

  // pause when tab not visible (saves battery)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      last = performance.now();
    }
  });

  init();
})();      ctx.translate(m.x, m.y);
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
