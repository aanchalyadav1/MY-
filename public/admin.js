// admin.js (v8) - expects firebase.js loaded first
const auth = window.auth || firebase.auth();
const db = window.db || firebase.firestore();
const storage = window.storage || firebase.storage();

// UI
const signOutBtn = document.getElementById('signOut');
signOutBtn && signOutBtn.addEventListener('click', () => auth.signOut().then(()=>window.location='login.html'));

const certList = document.getElementById('certList');
const internList = document.getElementById('internList');
const projectList = document.getElementById('projectList');

// inputs
const certTitle = document.getElementById('certTitle');
const certIssuer = document.getElementById('certIssuer');
const certFile = document.getElementById('certFile'); // optional file input
const addCert = document.getElementById('addCert');

const internCompany = document.getElementById('internCompany');
const internRole = document.getElementById('internRole');
const internDuration = document.getElementById('internDuration');
const addIntern = document.getElementById('addIntern');

const projName = document.getElementById('projName');
const projDesc = document.getElementById('projDesc');
const projUrl = document.getElementById('projUrl');
const projFile = document.getElementById('projFile'); // optional file input for project preview
const addProj = document.getElementById('addProj');

// helper
function escapeHtml(str){ return str ? str.replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : ''; }

async function isAdminEmail(email){
  try{
    const doc = await db.collection('admin').doc('list').get();
    const emails = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
    return emails.includes(email);
  } catch(e){ console.error(e); return false; }
}

auth.onAuthStateChanged(async user=>{
  if(!user){ window.location='login.html'; return; }
  const ok = await isAdminEmail(user.email);
  if(!ok){ alert('Not authorized'); auth.signOut(); return; }
  loadAll();
});

// Load all
async function loadAll(){ await Promise.all([renderCertificates(), renderInternships(), renderProjects()]); }

/* ---------- Certificates ---------- */
async function renderCertificates(){
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    certList.innerHTML = items.length ? '' : '<p style="opacity:.8">No certificates</p>';
    items.forEach((c, idx)=>{
      const row = document.createElement('div');
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-top:8px";
      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(c.title)}</strong><div style="opacity:.9">${escapeHtml(c.issuer||'')}</div>`;
      if(c.fileUrl){
        const a = document.createElement('a');
        a.href = c.fileUrl; a.target = '_blank'; a.style.display='block';
        a.textContent = 'View';
        left.appendChild(a);
      }
      const del = document.createElement('button');
      del.className='btn-ghost'; del.textContent='Delete';
      del.onclick = ()=>deleteCert(idx);
      row.appendChild(left); row.appendChild(del);
      certList.appendChild(row);
    });
  }catch(e){ console.error(e); certList.innerHTML='<p>Error</p>'; }
}

// Add certificate (with optional file upload)
addCert && addCert.addEventListener('click', async ()=>{
  const title = certTitle.value.trim();
  const issuer = certIssuer.value.trim();
  if(!title) return alert('Enter certificate title');
  // optional file handling
  let fileUrl = '';
  if(certFile && certFile.files && certFile.files[0]){
    const f = certFile.files[0];
    const path = `certificates/${Date.now()}_${f.name}`;
    const ref = storage.ref().child(path);
    await ref.put(f);
    fileUrl = await ref.getDownloadURL();
  }
  const docRef = db.collection('certificates').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.push({ title, issuer, fileUrl });
  await docRef.set({ items });
  certTitle.value=''; certIssuer.value=''; if(certFile) certFile.value=null;
  renderCertificates();
});

async function deleteCert(idx){
  const docRef = db.collection('certificates').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  // optionally delete storage file? (skip here)
  items.splice(idx,1);
  await docRef.set({ items });
  renderCertificates();
}

/* ---------- Internships ---------- */
async function renderInternships(){
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    internList.innerHTML = items.length ? '' : '<p style="opacity:.8">No internships</p>';
    items.forEach((i, idx)=>{
      const row = document.createElement('div');
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-top:8px";
      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(i.company)}</strong><div style="opacity:.9">${escapeHtml(i.role||'')} • ${escapeHtml(i.duration||'')}</div>`;
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      del.onclick = ()=>deleteIntern(idx);
      row.appendChild(left); row.appendChild(del);
      internList.appendChild(row);
    });
  }catch(e){ console.error(e); internList.innerHTML='<p>Error</p>'; }
}

addIntern && addIntern.addEventListener('click', async ()=>{
  const company = internCompany.value.trim(); const role = internRole.value.trim(); const duration = internDuration.value.trim();
  if(!company) return alert('Enter company');
  const docRef = db.collection('internships').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.push({ company, role, duration });
  await docRef.set({ items });
  internCompany.value=''; internRole.value=''; internDuration.value='';
  renderInternships();
});

async function deleteIntern(idx){
  const docRef = db.collection('internships').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.splice(idx,1);
  await docRef.set({ items });
  renderInternships();
}

/* ---------- Projects ---------- */
async function renderProjects(){
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    projectList.innerHTML = items.length ? '' : '<p style="opacity:.8">No projects</p>';
    items.forEach((p, idx)=>{
      const row = document.createElement('div');
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-top:8px";
      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(p.name)}</strong><div style="opacity:.9">${escapeHtml(p.desc||'')}</div>`;
      if(p.url) {
        const a = document.createElement('a'); a.href = p.url; a.target='_blank'; a.textContent='Open Link';
        left.appendChild(a);
      }
      if(p.fileUrl){
        const a2 = document.createElement('a'); a2.href=p.fileUrl; a2.target='_blank'; a2.style.display='block'; a2.textContent='Preview';
        left.appendChild(a2);
      }
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      del.onclick = ()=>deleteProj(idx);
      row.appendChild(left); row.appendChild(del);
      projectList.appendChild(row);
    });
  }catch(e){ console.error(e); projectList.innerHTML='<p>Error</p>'; }
}

addProj && addProj.addEventListener('click', async ()=>{
  const name = projName.value.trim(); const desc = projDesc.value.trim(); const url = projUrl.value.trim();
  if(!name) return alert('Enter project name');

  let fileUrl = '';
  if(projFile && projFile.files && projFile.files[0]){
    const f = projFile.files[0];
    const path = `projects/${Date.now()}_${f.name}`;
    const ref = storage.ref().child(path);
    await ref.put(f);
    fileUrl = await ref.getDownloadURL();
  }

  const docRef = db.collection('projects').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.push({ name, desc, url, fileUrl });
  await docRef.set({ items });
  projName.value=''; projDesc.value=''; projUrl.value=''; if(projFile) projFile.value=null;
  renderProjects();
});

async function deleteProj(idx){
  const docRef = db.collection('projects').doc('list');
  const doc = await docRef.get();
  const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
  items.splice(idx,1);
  await docRef.set({ items });
  renderProjects();
                                            }
