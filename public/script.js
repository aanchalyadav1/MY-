// Smooth nav for top-right menu and bottom nav
document.addEventListener('click', (e)=>{
  if(e.target.tagName==='A' && e.target.hash){
    const id = e.target.hash.replace('#','');
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
  }
});

// floating nav click handling
document.querySelectorAll('.float-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const href = btn.getAttribute('data-href') || btn.getAttribute('data-target');
    if(!href) return;
    if(href.endsWith('.html')) location.href = href;
    else {
      // map legacy data-target names
      if(href==='certs' || href==='certificates') location.href='certificates.html';
      else if(href==='intern') location.href='internships.html';
      else if(href==='projects') location.href='projects.html';
      else location.href = href;
    }
  });
});

// hologram tilt
const holo = document.getElementById('holoCard');
if(holo){
  window.addEventListener('mousemove',(e)=>{
    const rect = holo.getBoundingClientRect();
    const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx)/20; const dy = (e.clientY - cy)/20;
    holo.style.transform = `translateZ(0) rotateX(${dy}deg) rotateY(${dx}deg)`;
  });
  window.addEventListener('mouseleave', ()=>{ holo.style.transform=''; });
}

// Firestore loaders (if firebase present)
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c])); }

async function loadCertificates(){
  if(!window.firebase) return;
  const el = document.getElementById('certCards');
  if(!el) return;
  try{
    const doc = await firebase.firestore().collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No certificates yet.</div>'; return; }
    el.innerHTML = items.map(c=>`<div class="card"><h4>${escapeHtml(c.title)}</h4><p>${escapeHtml(c.issuer||'')}</p></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading</div>'; }
}

async function loadInternships(){
  if(!window.firebase) return;
  const el = document.getElementById('internCards');
  if(!el) return;
  try{
    const doc = await firebase.firestore().collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No internships yet.</div>'; return; }
    el.innerHTML = items.map(i=>`<div class="card"><h4>${escapeHtml(i.company)}</h4><p>${escapeHtml(i.role||'')}</p><small>${escapeHtml(i.duration||'')}</small></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading</div>'; }
}

async function loadProjects(){
  if(!window.firebase) return;
  const el = document.getElementById('projectsCards');
  if(!el) return;
  try{
    const doc = await firebase.firestore().collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ el.innerHTML = '<div class="card">No projects yet.</div>'; return; }
    el.innerHTML = items.map(p=>`<div class="card"><h4>${escapeHtml(p.name)}</h4><p>${escapeHtml(p.desc||'')}</p><p style="margin-top:8px"><a href="${encodeURI(p.url||'#')}" target="_blank">View</a></p></div>`).join('');
  }catch(e){ console.error(e); el.innerHTML = '<div class="card">Error loading</div>'; }
}

// init loads for content pages
window.addEventListener('load', ()=>{
  // run loads with delay if firebase hasn't initialized yet
  setTimeout(()=>{ loadCertificates(); loadInternships(); loadProjects(); }, 250);
});
