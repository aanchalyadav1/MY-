// admin.js — requires ../scripts/firebase.js that sets window.db and window.auth (firebase v8 style)
// NOTE: security rules should only allow writes from authenticated admin emails; this script assumes admin/list doc contains `emails: [ 'you@x.com' ]`

const auth = window.auth || firebase.auth();
const db = window.db || firebase.firestore();
const storage = firebase.storage();

const signOutBtn = document.getElementById('signOutBtn');

// UI refs
const certList = document.getElementById('certList');
const internList = document.getElementById('internList');
const projectList = document.getElementById('projectList');

const certTitle = document.getElementById('certTitle');
const certIssuer = document.getElementById('certIssuer');
const certImage = document.getElementById('certImage');
const certPreview = document.getElementById('certPreview');
const certLink = document.getElementById('certLink');
const addCert = document.getElementById('addCert');

const internCompany = document.getElementById('internCompany');
const internRole = document.getElementById('internRole');
const internDuration = document.getElementById('internDuration');
const addIntern = document.getElementById('addIntern');

const projName = document.getElementById('projName');
const projDesc = document.getElementById('projDesc');
const projUrl = document.getElementById('projUrl');
const projImage = document.getElementById('projImage');
const projPreview = document.getElementById('projPreview');
const addProj = document.getElementById('addProj');

let currentAdminEmail = null;

function showPreviewFromFile(file, container){
  if(!file) { container.innerHTML = 'Preview'; return; }
  const reader = new FileReader();
  reader.onload = (e)=> {
    container.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

certImage && certImage.addEventListener('change', (e)=> showPreviewFromFile(e.target.files[0], certPreview));
projImage && projImage.addEventListener('change', (e)=> showPreviewFromFile(e.target.files[0], projPreview));

// upload helper
async function uploadFile(file, pathPrefix='assets'){
  if(!file) return null;
  const name = Date.now() + '_' + file.name.replace(/\s+/g,'_');
  const ref = storage.ref().child(`${pathPrefix}/${name}`);
  await ref.put(file);
  const url = await ref.getDownloadURL();
  return url;
}

// check admin list
async function isAdminEmail(email){
  try{
    const doc = await db.collection('admin').doc('list').get();
    const emails = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
    return emails.includes(email);
  }catch(e){ console.error(e); return false; }
}

// signed out -> redirect login
signOutBtn && signOutBtn.addEventListener('click', ()=> auth.signOut().then(()=> location.href='login.html'));

// auth state
auth.onAuthStateChanged(async user=>{
  if(!user){ location.href='login.html'; return; }
  currentAdminEmail = user.email;
  const ok = await isAdminEmail(user.email);
  if(!ok){ alert('Not authorized'); await auth.signOut(); location.href='login.html'; return; }
  // load everything
  loadAll();
});

// load functions
async function loadAll(){
  await Promise.all([renderCertificates(), renderInternships(), renderProjects()]);
}

async function renderCertificates(){
  try{
    const doc = await db.collection('certificates').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    certList.innerHTML = items.length ? '' : '<p style="opacity:.8">No certificates</p>';
    items.forEach((c, idx)=>{
      const row = document.createElement('div'); row.className='list-row';
      const left = document.createElement('div');
      left.innerHTML = `${c.image ? `<img src="${c.image}" class="preview-img">` : ''}<strong style="margin-left:8px">${escapeHtml(c.title)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(c.issuer||'')}</div>`;
      const right = document.createElement('div');
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      del.addEventListener('click', ()=> deleteCertificate(idx));
      right.appendChild(del);
      row.appendChild(left); row.appendChild(right);
      certList.appendChild(row);
    });
  }catch(e){ console.error(e); certList.innerHTML = '<p>Error</p>'; }
}

async function renderInternships(){
  try{
    const doc = await db.collection('internships').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    internList.innerHTML = items.length ? '' : '<p style="opacity:.8">No internships</p>';
    items.forEach((it, idx)=>{
      const row = document.createElement('div'); row.className='list-row';
      row.innerHTML = `<div><strong>${escapeHtml(it.company)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(it.role||'')} • ${escapeHtml(it.duration||'')}</div></div>`;
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      del.addEventListener('click', ()=> deleteIntern(idx));
      row.appendChild(del);
      internList.appendChild(row);
    });
  }catch(e){ console.error(e); internList.innerHTML = '<p>Error</p>'; }
}

async function renderProjects(){
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items : [];
    projectList.innerHTML = items.length ? '' : '<p style="opacity:.8">No projects</p>';
    items.forEach((p, idx)=>{
      const row = document.createElement('div'); row.className='list-row';
      row.innerHTML = `<div>${p.image ? `<img src="${p.image}" class="preview-img">` : ''}<strong style="margin-left:8px">${escapeHtml(p.name)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(p.desc||'')}</div></div>`;
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      del.addEventListener('click', ()=> deleteProject(idx));
      row.appendChild(del);
      projectList.appendChild(row);
    });
  }catch(e){ console.error(e); projectList.innerHTML = '<p>Error</p>'; }
}

// add handlers
addCert && addCert.addEventListener('click', async ()=>{
  const title = certTitle.value.trim(); if(!title){ alert('Title required'); return; }
  const issuer = certIssuer.value.trim();
  const file = certImage.files[0];
  addCert.disabled = true;
  try{
    const url = file ? await uploadFile(file,'certificates') : null;
    // fetch current list and update atomically using transaction
    const ref = db.collection('certificates').doc('list');
    await db.runTransaction(async tx=>{
      const doc = await tx.get(ref);
      const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
      items.push({ title, issuer, image: url || null, link: certLink.value.trim() || null, addedAt: Date.now() });
      tx.set(ref, { items }, { merge: true });
    });
    certTitle.value=''; certIssuer.value=''; certImage.value=''; certPreview.innerHTML='Preview'; certLink.value='';
    await renderCertificates();
  }catch(e){ console.error(e); alert('Error adding certificate'); }
  addCert.disabled = false;
});

addIntern && addIntern.addEventListener('click', async ()=>{
  const company = internCompany.value.trim(); if(!company){ alert('Company required'); return; }
  addIntern.disabled = true;
  try{
    const ref = db.collection('internships').doc('list');
    await db.runTransaction(async tx=>{
      const doc = await tx.get(ref);
      const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
      items.push({ company, role: internRole.value.trim(), duration: internDuration.value.trim(), addedAt: Date.now() });
      tx.set(ref, { items }, { merge:true });
    });
    internCompany.value=''; internRole.value=''; internDuration.value='';
    await renderInternships();
  }catch(e){ console.error(e); alert('Error adding internship'); }
  addIntern.disabled = false;
});

addProj && addProj.addEventListener('click', async ()=>{
  const name = projName.value.trim(); if(!name){ alert('Name required'); return; }
  addProj.disabled = true;
  try{
    const file = projImage.files[0];
    const url = file ? await uploadFile(file,'projects') : null;
    const ref = db.collection('projects').doc('list');
    await db.runTransaction(async tx=>{
      const doc = await tx.get(ref);
      const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
      items.push({ name, desc: projDesc.value.trim(), url: projUrl.value.trim() || null, image: url || null, addedAt: Date.now() });
      tx.set(ref, { items }, { merge:true });
    });
    projName.value=''; projDesc.value=''; projUrl.value=''; projImage.value=''; projPreview.innerHTML='Preview';
    await renderProjects();
  }catch(e){ console.error(e); alert('Error adding project'); }
  addProj.disabled = false;
});

// delete operations (index-based)
async function deleteCertificate(index){
  if(!confirm('Delete certificate?')) return;
  const ref = db.collection('certificates').doc('list');
  await db.runTransaction(async tx=>{
    const doc = await tx.get(ref);
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
    if(index >= 0 && index < items.length) { items.splice(index,1); tx.set(ref,{items}); }
  });
  await renderCertificates();
}

async function deleteIntern(index){
  if(!confirm('Delete internship?')) return;
  const ref = db.collection('internships').doc('list');
  await db.runTransaction(async tx=>{
    const doc = await tx.get(ref);
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
    if(index >= 0 && index < items.length) { items.splice(index,1); tx.set(ref,{items}); }
  });
  await renderInternships();
}

async function deleteProject(index){
  if(!confirm('Delete project?')) return;
  const ref = db.collection('projects').doc('list');
  await db.runTransaction(async tx=>{
    const doc = await tx.get(ref);
    const items = doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
    if(index >= 0 && index < items.length) { items.splice(index,1); tx.set(ref,{items}); }
  });
  await renderProjects();
}

// small escape helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }  }catch(e){ console.error(e); internList.innerHTML = '<p>Error</p>'; }
}

if(addIntern) addIntern.addEventListener('click', async ()=>{
  const company = internCompany.value.trim(); const role = internRole.value.trim(); const duration = internDuration.value.trim();
  if(!company) return alert('Company required');
  const docRef = db.collection('internships').doc('list');
  const doc = await docRef.get();
  const items = doc.exists ? doc.data().items || [] : [];
  items.push({ company, role, duration });
  await docRef.set({ items });
  internCompany.value=''; internRole.value=''; internDuration.value='';
  renderInternships();
});

async function deleteIntern(idx){
  const docRef = db.collection('internships').doc('list');
  const doc = await docRef.get();
  const items = doc.exists ? doc.data().items || [] : [];
  items.splice(idx,1);
  await docRef.set({ items });
  renderInternships();
}

/* Projects */
async function renderProjects(){
  if(!projectList) return;
  try{
    const doc = await db.collection('projects').doc('list').get();
    const items = doc.exists ? doc.data().items || [] : [];
    projectList.innerHTML = items.length ? '' : '<p style="opacity:.8">No projects</p>';
    items.forEach((p, idx)=>{
      const row = document.createElement('div'); row.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-top:8px';
      row.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong><div style="opacity:.9">${escapeHtml(p.desc||'')}</div><a href="${escapeHtml(p.url||'')}" target="_blank" style="display:block;margin-top:6px">${escapeHtml(p.url||'')}</a></div>`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      del.addEventListener('click', ()=>deleteProj(idx));
      row.appendChild(del); projectList.appendChild(row);
    });
  }catch(e){ console.error(e); projectList.innerHTML = '<p>Error</p>'; }
}

if(addProj) addProj.addEventListener('click', async ()=>{
  const name = projName.value.trim(); const desc = projDesc.value.trim(); const url = projUrl.value.trim();
  if(!name) return alert('Project name required');
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
  const items = doc.exists ? doc.data().items || [] : [];
  items.push({ name, desc, url, fileUrl });
  await docRef.set({ items });
  projName.value=''; projDesc.value=''; projUrl.value=''; if(projFile) projFile.value=null;
  renderProjects();
});

async function deleteProj(idx){
  const docRef = db.collection('projects').doc('list');
  const doc = await docRef.get();
  const items = doc.exists ? doc.data().items || [] : [];
  items.splice(idx,1);
  await docRef.set({ items });
  renderProjects();
                                                       }}

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
