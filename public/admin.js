const auth = firebase.auth();
const db = firebase.firestore();

const signOutBtn = document.getElementById('signOut');
signOutBtn.addEventListener('click', ()=>auth.signOut().then(()=>window.location='login.html'));

// UI refs
const certList = document.getElementById('certList');
const internList = document.getElementById('internList');
const projectList = document.getElementById('projectList');

const certTitle = document.getElementById('certTitle');
const certIssuer = document.getElementById('certIssuer');
const addCert = document.getElementById('addCert');

const internCompany = document.getElementById('internCompany');
const internRole = document.getElementById('internRole');
const internDuration = document.getElementById('internDuration');
const addIntern = document.getElementById('addIntern');

const projName = document.getElementById('projName');
const projDesc = document.getElementById('projDesc');
const projUrl = document.getElementById('projUrl');
const addProj = document.getElementById('addProj');

async function isAdminEmail(email){
  try{
    const doc = await db.collection('admin').doc('list').get();
    const emails = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
    return emails.includes(email);
  }catch(e){ console.error(e); return false; }
}

auth.onAuthStateChanged(async user=>{
  if(!user){ window.location = 'login.html'; return; }
  const ok = await isAdminEmail(user.email);
  if(!ok){ alert('Not authorized'); auth.signOut(); return; }
  loadAll();
});

async function loadAll(){ await Promise.all([renderCertificates(), renderInternships(), renderProjects()]); }

async function renderCertificates(){
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    certList.innerHTML = items.length ? '' : '<p style="opacity:.8">No certificates</p>';
    items.forEach((c, idx)=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(c.title)}</strong><div style="opacity:.9">${escapeHtml(c.issuer||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      del.addEventListener('click', ()=>deleteCert(idx));
      row.appendChild(del);
      certList.appendChild(row);
    });
  }catch(e){ console.error(e); certList.innerHTML = '<p>Error</p>'; }
}

async function renderInternships(){ 
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    internList.innerHTML = items.length ? '' : '<p style="opacity:.8">No internships</p>';
    items.forEach((i, idx)=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(i.company)}</strong><div style="opacity:.9">${escapeHtml(i.role||'')} • ${escapeHtml(i.duration||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost'; del.addEventListener('click', ()=>deleteIntern(idx));
      row.appendChild(del); internList.appendChild(row);
    });
  }catch(e){ console.error(e); internList.innerHTML = '<p>Error</p>'; }
}

async function renderProjects(){
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    projectList.innerHTML = items.length ? '' : '<p style="opacity:.8">No projects</p>';
    items.forEach((p, idx)=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong><div style="opacity:.9">${escapeHtml(p.desc||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost'; del.addEventListener('click', ()=>deleteProject(idx));
      row.appendChild(del); projectList.appendChild(row);
    });
  }catch(e){ console.error(e); projectList.innerHTML = '<p>Error</p>'; }
}

addCert.addEventListener('click', async ()=>{
  const t = certTitle.value.trim(); const issuer = certIssuer.value.trim(); if(!t) return alert('Title required');
  try{ const doc = await db.collection('certificates').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.push({title:t,issuer}); await db.collection('certificates').doc('list').set({items}); certTitle.value='';certIssuer.value=''; renderCertificates(); }catch(e){console.error(e);alert('Error');}
});
addIntern.addEventListener('click', async ()=>{
  const c = internCompany.value.trim(); const r = internRole.value.trim(); const d = internDuration.value.trim(); if(!c) return alert('Company required');
  try{ const doc = await db.collection('internships').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.push({company:c,role:r,duration:d}); await db.collection('internships').doc('list').set({items}); internCompany.value='';internRole.value='';internDuration.value=''; renderInternships(); }catch(e){console.error(e);alert('Error');}
});
addProj.addEventListener('click', async ()=>{
  const n = projName.value.trim(); const d = projDesc.value.trim(); const u = projUrl.value.trim(); if(!n) return alert('Name required');
  try{ const doc = await db.collection('projects').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.push({name:n,desc:d,url:u}); await db.collection('projects').doc('list').set({items}); projName.value='';projDesc.value='';projUrl.value=''; renderProjects(); }catch(e){console.error(e);alert('Error');}
});

async function deleteCert(index){ if(!confirm('Delete?')) return; const doc = await db.collection('certificates').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.splice(index,1); await db.collection('certificates').doc('list').set({items}); renderCertificates(); }
async function deleteIntern(index){ if(!confirm('Delete?')) return; const doc = await db.collection('internships').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.splice(index,1); await db.collection('internships').doc('list').set({items}); renderInternships(); }
async function deleteProject(index){ if(!confirm('Delete?')) return; const doc = await db.collection('projects').doc('list').get(); const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : []; items.splice(index,1); await db.collection('projects').doc('list').set({items}); renderProjects(); }

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];}); }
  
