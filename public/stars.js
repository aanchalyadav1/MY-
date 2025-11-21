// stars.js - lightweight starfield with gentle parallax
(function(){
  const containerId = 'star-field';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // small set of stars
  const STAR_COUNT = 100;
  function makeStar(){
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = (Math.random()*100).toFixed(2) + 'vw';
    s.style.top = (Math.random()*100).toFixed(2) + 'vh';
    s.style.opacity = (0.2 + Math.random()*0.8).toFixed(2);
    s.style.animationDuration = (2 + Math.random()*4) + 's';
    // small size variation
    const size = (Math.random()*2)+1;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    container.appendChild(s);
  }
  // create
  for(let i=0;i<STAR_COUNT;i++) makeStar();

  // optional parallax on pointer move (very subtle)
  window.addEventListener('mousemove', (e)=>{
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    container.style.transform = `translate(${dx*6}px, ${dy*6}px)`;
  });
})();
