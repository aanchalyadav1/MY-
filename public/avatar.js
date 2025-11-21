// avatar.js — small micro-interactions for ay-avatar across pages
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.ay-avatar').forEach(el=>{
    el.addEventListener('mouseenter', ()=> el.style.transform = 'scale(1.06) translateY(-6px) rotate(2deg)');
    el.addEventListener('mouseleave', ()=> el.style.transform = '');
    el.addEventListener('click', ()=>{
      el.animate([
        { transform: 'scale(1) rotate(0deg)'},
        { transform: 'scale(1.12) rotate(6deg)'},
        { transform: 'scale(1) rotate(0deg)'}
      ], { duration:420, easing:'ease-out' });
    });
  });
});
