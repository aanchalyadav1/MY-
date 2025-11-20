// stars.js
// Galaxy-style rotating starfield with radial shooting meteors
(() => {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // DPR and sizing
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = window.innerWidth;
  let H = window.innerHeight;

  function sizeCanvas() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.max(300, window.innerWidth);
    H = Math.max(200, window.innerHeight);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  sizeCanvas();

  // center coordinates for galaxy
  function center() { return { x: W / 2, y: H / 2 }; }

  // parameters (tweakable)
  const BASE = Math.max(100, Math.floor((W * H) / 14000)); // base star count scale
  const LAYERS = [
    { depth: 0.35, count: Math.round(BASE * 0.6), size: 0.5, twinkle: 0.004, hueRange: [200, 230], speedMult: 0.02 },
    { depth: 0.45, count: Math.round(BASE * 0.9), size: 0.9, twinkle: 0.006, hueRange: [220, 260], speedMult: 0.05 },
    { depth: 0.2,  count: Math.round(BASE * 0.5), size: 1.6, twinkle: 0.01, hueRange: [260, 300], speedMult: 0.12 }
  ];

  // performance clamps
  const MAX_METEORS = 10;
  const METEOR_SPAWN_BASE_MS = 700; // base interval (randomized)
  let lastMeteorSpawn = 0;

  // particle arrays
  const stars = [];
  const meteors = [];

  // utility
  const rand = (a, b) => Math.random() * (b - a) + a;
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // create galaxy stars arranged on spiral arms for orbital motion
  function makeGalaxy() {
    stars.length = 0;
    const { x: cx, y: cy } = center();
    const arms = 3;                // number of spiral arms
    const armSeparation = (Math.PI * 2) / arms;
    const maxRadius = Math.min(W, H) * 0.55;
    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      for (let i = 0; i < layer.count; i++) {
        // place star along spiral arm with some noise
        const arm = i % arms;
        const radius = Math.pow(Math.random(), 0.9) * maxRadius * layer.depth * (0.7 + Math.random() * 0.6);
        const baseAngle = arm * armSeparation + radius * 0.005 + rand(-0.6, 0.6); // spiral curvature
        const angle = baseAngle + rand(-0.4, 0.4);
        const hue = rand(layer.hueRange[0], layer.hueRange[1]);
        stars.push({
          layer: li,
          rbase: layer.size * (0.6 + Math.random() * 1.2),
          hue,
          alpha: rand(0.12, 0.95),
          twinkleSpd: layer.twinkle * (0.6 + Math.random() * 1.2),
          radius,
          angle,
          orbitSpeed: (0.0008 + Math.random() * 0.0016) * (1 + layer.speedMult),
          cx,
          cy,
          offsetX: rand(-8, 8) * layer.depth,
          offsetY: rand(-6, 6) * layer.depth
        });
      }
    }
  }

  // meteor spawn: radial from near-center with random angle and outward velocity
  function spawnMeteorRadial() {
    if (meteors.length > MAX_METEORS) return;
    const { x: cx, y: cy } = center();
    // spawn near center with jitter
    const sx = cx + rand(-W * 0.06, W * 0.06);
    const sy = cy + rand(-H * 0.06, H * 0.06);

    // choose radial direction (aim mostly outward)
    const angle = rand(0, Math.PI * 2);
    // speed and length tuned to 3D look
    const speed = rand(10, 26); // px per tick-ish
    const length = rand(160, 420);
    const thickness = rand(1.2, 3.4);
    // color: mostly bluish/purple, sometimes golden
    const hue = Math.random() < 0.72 ? rand(200, 240) : rand(35, 55);
    const sat = hue > 100 ? 85 : 96;
    const light = hue > 100 ? 72 : 62;

    meteors.push({
      x: sx,
      y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vxVar: rand(-1.2, 1.2), // slight drift
      vyVar: rand(-0.6, 0.6),
      length,
      life: 0,
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
