const canvas = document.getElementById('starsCanvas');
if(canvas){
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth, H = canvas.height = innerHeight;
  window.addEventListener('resize', ()=>{ W = canvas.width = innerWidth; H = canvas.height = innerHeight; initStars(); });

  let stars = [];
  function initStars(){
    stars = [];
    const count = Math.round((W*H)/110000);
    for(let i=0;i<count;i++){
      stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.2 + 0.2, vy: 0.05 + Math.random()*0.35, alpha: 0.3 + Math.random()*0.7 });
    }
  }
  initStars();

  function draw(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#071023'); g.addColorStop(1,'#07121a');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    stars.forEach(s=>{
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
      s.y += s.vy;
      if(s.y > H + 10){ s.y = -10; s.x = Math.random()*W; }
    });

    requestAnimationFrame(draw);
  }
  draw();
}
