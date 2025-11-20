// Ensure firebase libs and firebase.js are loaded first
if(!window.firebase || !window.db) {
  console.error('Firebase not detected. Make sure firebase.js is loaded.');
}

// ----------------- Smooth scroll -----------------
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('.float-btn').forEach(btn=>{
  btn.addEventListener('click',()=> {
    const target = btn.getAttribute('data-target');
    if(target==='home') scrollToSection('home');
    else scrollToSection(target);
  });
});

// ----------------- Firestore Data Loaders -----------------
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];}); }
function safeUrl(u){ try{ return encodeURI(u||'#'); } catch(e){ return '#'; } }

async function loadCertificates(){ 
  const el = document.getElementById('certCards');
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No certificates yet.</div>'; return; }
    el.innerHTML = items.map(c=>`<div class="card"><h4>${escapeHtml(c.title)}</h4><p>${escapeHtml(c.issuer||'')}</p></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading certificates.</div>'; }
}

async function loadInternships(){ 
  const el = document.getElementById('internCards');
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No internships yet.</div>'; return; }
    el.innerHTML = items.map(i=>`<div class="card"><h4>${escapeHtml(i.company)}</h4><p>${escapeHtml(i.role||'')}</p><small>${escapeHtml(i.duration||'')}</small></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading internships.</div>'; }
}

async function loadProjects(){ 
  const el = document.getElementById('projectsCards');
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No projects yet.</div>'; return; }
    el.innerHTML = items.map(p=>`<div class="card"><h4>${escapeHtml(p.name)}</h4><p>${escapeHtml(p.desc||'')}</p><p style="margin-top:8px"><a href="${safeUrl(p.url)}" target="_blank">View</a></p></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading projects.</div>'; }
}

// init loaders on load
window.addEventListener('load', ()=>{
  loadCertificates();
  loadInternships();
  loadProjects();
});

// ----------------- Galaxy Animation -----------------
const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = innerWidth, H = canvas.height = innerHeight;
window.addEventListener('resize', ()=>{ W = canvas.width = innerWidth; H = canvas.height = innerHeight; initStars(); });

let stars = [];
function initStars(){
  stars = [];
  const count = Math.round((W*H)/90000);
  for(let i=0;i<count;i++){
    stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.6, vy: 0.1 + Math.random()*0.6, h: 180+Math.random()*120, a: 0.4+Math.random()*0.6 });
  }
}
initStars();

function draw(){
  ctx.clearRect(0,0,W,H);
  const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#071023'); g.addColorStop(1,'#07121a');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.fillStyle = `hsla(${s.h},85%,85%,${s.a})`;
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fill();
    s.y += s.vy;
    if(s.y > H+10){ s.y = -10; s.x = Math.random()*W; }
  });
  requestAnimationFrame(draw);
}
draw();

// Hologram tilt
const holo = document.getElementById('holoCard');
window.addEventListener('mousemove', (e)=>{
  if(!holo) return;
  const rect = holo.getBoundingClientRect();
  const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
  const dx = (e.clientX - cx)/20; const dy = (e.clientY - cy)/20;
  holo.style.transform = `translateZ(0) rotateX(${dy}deg) rotateY(${dx}deg)`;
});
window.addEventListener('mouseleave', ()=>{ if(holo) holo.style.transform = ''; });
