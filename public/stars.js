const canvas = document.getElementById("galaxyCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const stars = [];
for (let i = 0; i < 260; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.6,
    d: 0.2 + Math.random() * 0.9,
    hue: 180 + Math.random() * 120
  });
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  stars.forEach(s => {
    ctx.beginPath();
    ctx.fillStyle = `hsla(${s.hue},80%,80%,${0.6})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  update();
}
function update(){
  stars.forEach(s => {
    s.y += s.d;
    if (s.y > canvas.height + 10) {
      s.y = -10;
      s.x = Math.random() * canvas.width;
    }
  });
}
setInterval(draw, 45);
