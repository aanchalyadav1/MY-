// stars.js - lightweight starfield with gentle parallax
(() => {
  const containerId = 'star-field';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // small set of stars
  const STAR_COUNT = 60;
  function makeStar(){
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random()*100 + 'vw';
    s.style.top = Math.random()*100 + 'vh';
    s.style.opacity = (0.35 + Math.random()*0.65).toFixed(2);
    s.style.animationDuration = (2 + Math.random()*3) + 's';
    container.appendChild(s);
  }
  // create
  for(let i=0;i<STAR_COUNT;i++) makeStar();

  // on resize ensure container full-screen - CSS handles position; no canvas used for simplicity
})();
