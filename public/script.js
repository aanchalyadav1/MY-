// script.js — reveal, holo tilt, float nav, and small helpers

// reveal on scroll using IntersectionObserver
(function(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('show');
    });
  }, {threshold: 0.18});
  document.querySelectorAll('.reveal, .fade-in').forEach(el => io.observe(el));
})();

// holo-card tilt
(function(){
  const wrap = document.querySelector('.holo-wrap');
  const card = document.querySelector('.holo-card');
  if(!wrap || !card) return;
  let rect = wrap.getBoundingClientRect();
  function update(){ rect = wrap.getBoundingClientRect(); }
  window.addEventListener('resize', update);
  wrap.addEventListener('mousemove', (e)=>{
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(y * -6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
  });
  wrap.addEventListener('mouseleave', ()=> card.style.transform = '');
})();

// float nav behavior
document.querySelectorAll('.float-btn').forEach(b=> b.addEventListener('click', ()=> {
  const h = b.getAttribute('data-href'); if(h) location.href = h;
}));

// small helper to ensure firebase collections exist (used by preview pages)
async function ensureDoc(path){
  try{
    const ref = db.collection(path).doc('list');
    const doc = await ref.get();
    if(!doc.exists) await ref.set({ items: [] });
  }catch(e){ console.warn('ensureDoc error',e); }
}
