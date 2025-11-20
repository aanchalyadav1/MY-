function scrollToSection(id){
  document.getElementById(id).scrollIntoView({behavior:'smooth'});
}

async function loadCertificates(){
  try{
    const doc = await db.collection("certificates").doc("list").get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Certificates</h2>';
    if(!items || items.length===0){
      html += '<p class="center">No certificates yet.</p>';
    } else {
      items.forEach(c => {
        html += `<div class="card"><h3>${c.title}</h3><p>${c.platform||''}</p></div>`;
      });
    }
    document.getElementById('certificatesInner').innerHTML = html;
  }catch(e){
    console.error(e);
  }
}

async function loadInternships(){
  try{
    const doc = await db.collection("internships").doc("list").get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Internships</h2>';
    if(!items || items.length===0){
      html += '<p class="center">No internships yet.</p>';
    } else {
      items.forEach(i => {
        html += `<div class="card"><h3>${i.company}</h3><p>${i.role||''}</p><small>${i.duration||''}</small></div>`;
      });
    }
    document.getElementById('internshipsInner').innerHTML = html;
  }catch(e){ console.error(e); }
}

async function loadProjects(){
  try{
    const doc = await db.collection("projects").doc("list").get();
    const items = doc.exists ? doc.data().items : [];
    let html = '<h2 class="center">Projects</h2>';
    if(!items || items.length===0){
      html += '<p class="center">No projects yet.</p>';
    } else {
      items.forEach(p => {
        html += `<div class="card project-card"><div class="meta"><h3>${p.name}</h3><p>${p.desc||''}</p></div><a href="${p.url||'#'}" target="_blank">View</a></div>`;
      });
    }
    document.getElementById('projectsInner').innerHTML = html;
  }catch(e){ console.error(e); }
}

// init
window.addEventListener('load', () => {
  loadCertificates();
  loadInternships();
  loadProjects();
});
