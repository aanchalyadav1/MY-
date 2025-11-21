// stars.js - multi-layer stars with gentle parallax
(() => {
  const canvas = document.getElementById('starsCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;

  const layers = [
    { density: 0.0008, size: [0.3,0.8], speed: 0.02, alphaMax:0.9 },
    { density: 0.00045, size: [0.6,1.6], speed: 0.01, alphaMax:1.0 },
    { density: 0.00025, size: [1.4,2.6], speed: 0.004, alphaMax:1.0 }
  ];
  let stars = [];

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function init(){
    w = canvas.width = innerWidth; h = canvas.height = innerHeight;
    stars = [];
    layers.forEach((ly, li) => {
      const count = Math.round(w*h*ly.density);
      for(let i=0;i<count;i++){
        stars.push({
          x: rand(0,w), y: rand(0,h),
          r: rand(ly.size[0], ly.size[1]),
          a: rand(0.1, ly.alphaMax),
          da: rand(0.001, 0.01),
          layer: li,
          speed: ly.speed
        });
      }
    });
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(2,6,23,0.35)';
    ctx.fillRect(0,0,w,h);
    stars.forEach(s => {
      s.a += s.da;
      if(s.a > 1) s.a = 0.2;
      ctx.beginPath();
      ctx.globalAlpha = s.a;
      ctx.fillStyle = 'white';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
  }

  // drift
  let mx=0, my=0;
  window.addEventListener('mousemove', (e)=> { mx = (e.clientX - w/2)/w; my = (e.clientY - h/2)/h; });
  function tick(){
    stars.forEach(s=>{
      s.x += s.speed * (1 + mx*0.4);
      s.y += s.speed * (my*0.4);
      if(s.x > w + 50) s.x = -50;
      if(s.x < -50) s.x = w + 50;
      if(s.y > h + 50) s.y = -50;
      if(s.y < -50) s.y = h + 50;
    });
    requestAnimationFrame(tick);
  }

  addEventListener('resize', init);
  init(); draw(); tick();
})();
