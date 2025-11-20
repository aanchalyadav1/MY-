function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// load certificates
async function loadCertificates(){
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Certificates</h2>';
    if(!items || items.length===0){ html += '<p class="center">No certificates yet.</p>'; }
    else {
      items.forEach(c => {
        html += `<div class="card"><h3>${c.title}</h3><p>${c.platform||''}</p></div>`;
      });
    }
    document.getElementById('certificatesInner').innerHTML = html;
  }catch(e){ console.error(e); }
}

// load internships
async function loadInternships(){
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Internships</h2>';
    if(!items || items.length===0){ html += '<p class="center">No internships yet.</p>'; }
    else {
      items.forEach(i => {
        html += `<div class="card"><h3>${i.company}</h3><p>${i.role||''}</p><small>${i.duration||''}</small></div>`;
      });
    }
    document.getElementById('internshipsInner').innerHTML = html;
  }catch(e){ console.error(e); }
}

// load projects
async function loadProjects(){
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Projects</h2>';
    if(!items || items.length===0){ html += '<p class="center">No projects yet.</p>'; }
    else {
      items.forEach(p => {
        html += `<div class="card project-card"><div class="meta"><h3>${p.name}</h3><p>${p.desc||''}</p></div><a href="${p.url||'#'}" target="_blank">View</a></div>`;
      });
    }
    document.getElementById('projectsInner').innerHTML = html;
  }catch(e){ console.error(e); }
}

// profile parallax micro-interaction
window.addEventListener('mousemove', (e)=>{
  const profile = document.getElementById('profilePic');
  if(!profile) return;
  const rect = profile.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  const dx = (e.clientX - cx)/30;
  const dy = (e.clientY - cy)/30;
  profile.style.transform = `translate(${dx}px, ${dy}px) rotateX(${dy}deg) rotateY(${dx}deg)`;
});
window.addEventListener('mouseleave', ()=>{ const p = document.getElementById('profilePic'); if(p) p.style.transform=''; });

// init loaders
window.addEventListener('load', ()=>{
  loadCertificates();
  loadInternships();
  loadProjects();
});
