/* =========================================================
   3D STARFIELD + GOLD + PURPLE METEOR SHOWER
   A + B Hybrid (Medium + Heavy Glow)
========================================================= */

const canvas = document.getElementById("starsCanvas");
const ctx = canvas.getContext("2d");

let w, h, stars = [], meteors = [];
const STAR_COUNT = 180;   // balanced amount
const METEOR_COUNT = 24;  // A + B hybrid: medium + glow
let mouseX = 0, mouseY = 0;

/* -------------------------------
   Resize Handling
--------------------------------*/
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* -------------------------------
   Parallax Mouse
--------------------------------*/
document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / w - 0.5) * 2;
  mouseY = (e.clientY / h - 0.5) * 2;
});

/* -------------------------------
   STAR OBJECT
--------------------------------*/
function createStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 1 + 0.2,
      size: Math.random() * 1.2,
      flicker: Math.random() * 0.03
    });
  }
}

createStars();

/* -------------------------------
   METEOR OBJECT
--------------------------------*/
function spawnMeteor() {
  meteors.push({
    x: Math.random() * w,
    y: -40,
    len: Math.random() * 280 + 140,
    speed: Math.random() * 6 + 4,
    curve: Math.random() * 0.6 + 0.3,    // curve force
    depth: Math.random() * 0.6 + 0.4,    // scale for 3D depth
    alpha: 1,
    goldShift: Math.random() * 1
  });
}

/* initial meteors */
for (let i = 0; i < METEOR_COUNT; i++) {
  setTimeout(spawnMeteor, i * 200);
}

/* -------------------------------
   DRAW STARS
--------------------------------*/
function drawStars() {
  for (let s of stars) {
    const px = s.x + mouseX * 20 * (1 - s.z);
    const py = s.y + mouseY * 20 * (1 - s.z);

    ctx.fillStyle = `rgba(255,255,255,${0.2 + s.flicker})`;
    ctx.fillRect(px, py, s.size, s.size);
  }
}

/* -------------------------------
   DRAW METEORS
--------------------------------*/
function drawMeteors() {
  meteors.forEach((m, i) => {
    m.x += m.speed * m.depth;
    m.y += (m.speed * 0.8) * m.depth;

    const cx = m.x + Math.sin(m.y * 0.002) * m.curve * 40; // curve

    m.alpha -= 0.003;

    // remove if invisible or off screen
    if (m.y > h + 200 || m.alpha <= 0) {
      meteors.splice(i, 1);
      spawnMeteor();
      return;
    }

    // gradient tail (gold → purple)
    const grad = ctx.createLinearGradient(cx, m.y, cx - m.len, m.y - m.len * 0.5);
    grad.addColorStop(0, `rgba(246,200,95,${m.alpha})`); // gold
    grad.addColorStop(0.5, `rgba(167,139,250,${m.alpha * 0.8})`); // purple
    grad.addColorStop(1, `rgba(125,211,252,${m.alpha * 0.4})`); // blue

    ctx.lineWidth = 2.2 * m.depth;
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
