// script.js — UI animations: reveal-on-scroll, holo tilt, avatar interactions, container parallax

// reveal on scroll
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  const windowHeight = window.innerHeight;
  reveals.forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    if (rect.top <= windowHeight - 80) {
      setTimeout(()=> el.classList.add('show'), idx * 80);
    }
  });
}
document.addEventListener('scroll', revealOnScroll);
document.addEventListener('DOMContentLoaded', ()=> {
  revealOnScroll();
  // stagger hero title/sub
  const title = document.querySelector('.hero-title');
  const sub = document.querySelector('.hero-sub');
  if (title) { title.style.opacity = 0; setTimeout(()=> title.style.opacity = 1, 220); }
  if (sub) { sub.style.opacity = 0; setTimeout(()=> sub.style.opacity = 1, 420); }
});

// holo-card tilt
(function(){
  const card = document.getElementById('holoCard');
  const wrap = document.getElementById('holoWrap');
  if(!card || !wrap) return;
  let rect = wrap.getBoundingClientRect();
  function updateRect(){ rect = wrap.getBoundingClientRect(); }
  window.addEventListener('resize', updateRect);
  wrap.addEventListener('mousemove', (e)=>{
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(y * -6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
  });
  wrap.addEventListener('mouseleave', ()=>{ card.style.transform = ''; });
})();

// avatar micro-interaction
(function(){
  const avatar = document.getElementById('avatarImg');
  if(!avatar) return;
  avatar.addEventListener('mouseenter', ()=> avatar.style.transform = 'scale(1.06) rotate(1.2deg)');
  avatar.addEventListener('mouseleave', ()=> avatar.style.transform = '');
})();

// gentle container parallax
(function(){
  let lastX=0,lastY=0;
  window.addEventListener('mousemove', (e)=>{
    lastX = (e.clientX / window.innerWidth - 0.5) * 8;
    lastY = (e.clientY / window.innerHeight - 0.5) * 6;
    document.querySelectorAll('.container').forEach((c,i)=>{
      c.style.transform = `translate3d(${lastX * (i===0?0.2:0.06)}px, ${lastY * 0.06}px, 0)`;
    });
  });
})();
