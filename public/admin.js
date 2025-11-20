// requires firebase.js to be loaded (which sets firebase, db and auth globals)
const auth = firebase.auth();
const db = firebase.firestore();

const signOutBtn = document.getElementById('signOut');
signOutBtn.addEventListener('click', ()=>auth.signOut().then(()=>window.location='login.html'));

// helper UI areas
const certList = document.getElementById('certList');
const internList = document.getElementById('internList');
const projectList = document.getElementById('projectList');

// form elements
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

// basic admin check: we also require that the signed in user's email is in admin/list.emails
async function isAdminEmail(email){
  try{
    const doc = await db.collection('admin').doc('list').get();
    const emails = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
    return emails.includes(email);
  }catch(e){ console.error(e); return false; }
}

// signed in flows
auth.onAuthStateChanged(async user=>{
  if(!user) { window.location = 'login.html'; return; }
  // check admin
  const ok = await isAdminEmail(user.email);
  if(!ok){ alert('Not authorized as admin.'); auth.signOut(); return; }
  // if admin, load data
  loadAll();
});

// ---------- READ & RENDER ----------

async function loadAll(){
  await Promise.all([renderCertificates(), renderInternships(), renderProjects()]);
}

async function renderCertificates(){
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ certList.innerHTML = '<p style="opacity:.8">No certificates</p>'; return; }
    certList.innerHTML = '';
    items.forEach((c, idx)=>{
      const row = document.createElement('div');
      row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(c.title)}</strong><div style="opacity:.9">${escapeHtml(c.issuer||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      del.addEventListener('click', ()=>deleteCert(idx));
      row.appendChild(del);
      certList.appendChild(row);
    });
  }catch(e){ console.error(e); certList.innerHTML = '<p>Error loading</p>'; }
}

async function renderInternships(){
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ internList.innerHTML = '<p style="opacity:.8">No internships</p>'; return; }
    internList.innerHTML = '';
    items.forEach((i, idx)=>{
      const row = document.createElement('div');
      row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(i.company)}</strong><div style="opacity:.9">${escapeHtml(i.role||'')} • ${escapeHtml(i.duration||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      del.addEventListener('click', ()=>deleteIntern(idx));
      row.appendChild(del);
      internList.appendChild(row);
    });
  }catch(e){ console.error(e); internList.innerHTML = '<p>Error loading</p>'; }
}

async function renderProjects(){
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    if(items.length===0){ projectList.innerHTML = '<p style="opacity:.8">No projects</p>'; return; }
    projectList.innerHTML = '';
    items.forEach((p, idx)=>{
      const row = document.createElement('div');
      row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
      row.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong><div style="opacity:.9">${escapeHtml(p.desc||'')}</div></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      del.addEventListener('click', ()=>deleteProject(idx));
      row.appendChild(del);
      projectList.appendChild(row);
    });
  }catch(e){ console.error(e); projectList.innerHTML = '<p>Error loading</p>'; }
}

// ---------- ADD / DELETE handlers ----------

addCert.addEventListener('click', async ()=>{
  const t = certTitle.value.trim(); const issuer = certIssuer.value.trim();
  if(!t) return alert('Title required');
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    items.push({ title: t, issuer });
    await db.collection('certificates').doc('list').set({ items });
    certTitle.value = ''; certIssuer.value = '';
    renderCertificates();
  }catch(e){ console.error(e); alert('Error saving'); }
});

addIntern.addEventListener('click', async ()=>{
  const c = internCompany.value.trim(); const r = internRole.value.trim(); const d = internDuration.value.trim();
  if(!c) return alert('Company required');
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    items.push({ company: c, role: r, duration: d });
    await db.collection('internships').doc('list').set({ items });
    internCompany.value=''; internRole.value=''; internDuration.value='';
    renderInternships();
  }catch(e){ console.error(e); alert('Error saving'); }
});

addProj.addEventListener('click', async ()=>{
  const n = projName.value.trim(); const d = projDesc.value.trim(); const u = projUrl.value.trim();
  if(!n) return alert('Name required');
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    items.push({ name: n, desc: d, url: u });
    await db.collection('projects').doc('list').set({ items });
    projName.value=''; projDesc.value=''; projUrl.value='';
    renderProjects();
  }catch(e){ console.error(e); alert('Error saving'); }
});

// delete by index helpers
async function deleteCert(index){
  if(!confirm('Delete this certificate?')) return;
  const doc = await db.collection('certificates').doc('list').get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.splice(index,1);
  await db.collection('certificates').doc('list').set({ items });
  renderCertificates();
}
async function deleteIntern(index){
  if(!confirm('Delete this internship?')) return;
  const doc = await db.collection('internships').doc('list').get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.splice(index,1);
  await db.collection('internships').doc('list').set({ items });
  renderInternships();
}
async function deleteProject(index){
  if(!confirm('Delete this project?')) return;
  const doc = await db.collection('projects').doc('list').get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.splice(index,1);
  await db.collection('projects').doc('list').set({ items });
  renderProjects();
}

// small helper
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];}); }
