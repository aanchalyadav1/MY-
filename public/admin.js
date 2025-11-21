// admin.js - Neon Admin: CRUD, edit, search, sort, pagination, modal, toasts
(async function(){
  // Wait for Firebase to be ready (if present). If firebase isn't installed, continue but with safe fallbacks.
  let firebaseReady = null;
  try {
    firebaseReady = await (window._firebaseReady || Promise.resolve(null));
  } catch (e) {
    console.warn('firebase not ready:', e);
  }

  const auth = window.auth || (firebaseReady && firebaseReady.auth) || null;
  const db = window.db || (firebaseReady && firebaseReady.db) || null;
  const storage = window.storage || (firebaseReady && firebaseReady.storage) || null;

  // helper to show a message and avoid further operations
  function fatal(msg){
    window.toast && window.toast(msg, {type:'error'});
    console.error(msg);
  }

  // dom refs (safe getter)
  const $ = id => document.getElementById(id);
  const signOutBtn = $('signOutBtn');
  const themeToggle = $('themeToggle');

  const certList = $('certList');
  const internList = $('internList');
  const projectList = $('projectList');

  const certFormWrap = $('certFormWrap');
  const certTitle = $('certTitle');
  const certIssuer = $('certIssuer');
  const certImage = $('certImage');
  const certPreview = $('certPreview');
  const certLink = $('certLink');
  const addCert = $('addCert');
  const updateCertBtn = $('updateCert');
  const cancelCert = $('cancelCert');
  const toggleCertForm = $('toggleCertForm');

  const internFormWrap = $('internFormWrap');
  const internCompany = $('internCompany');
  const internRole = $('internRole');
  const internDuration = $('internDuration');
  const addIntern = $('addIntern');
  const updateInternBtn = $('updateIntern');
  const cancelIntern = $('cancelIntern');
  const toggleInternForm = $('toggleInternForm');

  const projFormWrap = $('projFormWrap');
  const projName = $('projName');
  const projDesc = $('projDesc');
  const projUrl = $('projUrl');
  const projImage = $('projImage');
  const projPreview = $('projPreview');
  const addProj = $('addProj');
  const updateProjBtn = $('updateProj');
  const cancelProj = $('cancelProj');
  const toggleProjForm = $('toggleProjForm');

  const searchInput = $('globalSearch');
  const sortSelect = $('globalSort');

  const confirmModal = $('confirmModal');
  const confirmYes = $('confirmYes');
  const confirmNo = $('confirmNo');
  const confirmTitle = $('confirmTitle');
  const confirmText = $('confirmText');

  // state
  let certs = [], interns = [], projects = [];
  let editing = { type:null, index:-1 };
  const PAGE_SIZE = 6;
  let pendingDelete = null;

  // helpers
  const toast = window.toast || (m=>console.log('toast',m));
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
  function showSkeleton(elOrId, lines=3){
    const el = (typeof elOrId === 'string') ? document.querySelector(elOrId) : elOrId;
    if(!el) return;
    el.innerHTML=''; for(let i=0;i<lines;i++){ const d=document.createElement('div'); d.className='skeleton'; d.style.height='18px'; d.style.marginTop=i?'8px':'0'; el.appendChild(d); }
  }

  function filePreview(file, container){
    if(!container) return;
    if(!file){ container.innerHTML='Preview'; return; }
    const r = new FileReader(); r.onload = e => container.innerHTML = `<img src="${e.target.result}" class="preview-img">`; r.readAsDataURL(file);
  }
  certImage && certImage.addEventListener('change', e => filePreview(e.target.files[0], certPreview));
  projImage && projImage.addEventListener('change', e => filePreview(e.target.files[0], projPreview));

  function toggle(el, show){
    if(!el) return;
    el.style.display = show ? 'block' : 'none';
  }

  // upload helper (guard storage)
  async function uploadFile(file, folder='assets'){
    if(!file) return null;
    if(!storage || !storage.ref) throw new Error('Storage not available');
    const name = Date.now() + '_' + file.name.replace(/\s+/g,'_');
    const ref = storage.ref().child(`${folder}/${name}`);
    await ref.put(file);
    return await ref.getDownloadURL();
  }

  async function fetchDocArray(collection){
    if(!db) return [];
    try{
      const doc = await db.collection(collection).doc('list').get();
      return doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
    }catch(e){ console.error('fetch',collection,e); return []; }
  }

  // apply search & sort
  function applySearchSort(items){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    let out = items.slice();
    if(q) out = out.filter(it => JSON.stringify(it).toLowerCase().includes(q));
    const sortVal = sortSelect ? sortSelect.value : 'newest';
    if(sortVal==='newest') out.sort((a,b)=> (b.addedAt||0) - (a.addedAt||0));
    if(sortVal==='oldest') out.sort((a,b)=> (a.addedAt||0) - (b.addedAt||0));
    if(sortVal==='name_asc') out.sort((a,b)=> ((a.name||a.title||'').localeCompare(b.name||b.title||'')));
    if(sortVal==='name_desc') out.sort((a,b)=> ((b.name||b.title||'').localeCompare(a.name||a.title||'')));
    return out;
  }

  // render functions with pagination
  async function renderCertificates(page=1){
    if(!certList) return;
    showSkeleton(certList,3);
    certs = await fetchDocArray('certificates');
    const items = applySearchSort(certs);
    certList.innerHTML = items.length ? '' : '<p style="opacity:.8">No certificates</p>';
    const total = items.length; const pages = Math.max(1, Math.ceil(total/PAGE_SIZE));
    const start = (page-1)*PAGE_SIZE; const paged = items.slice(start, start+PAGE_SIZE);
    paged.forEach((c, idx) => {
      const gi = start + idx;
      const row = document.createElement('div'); row.className='list-row';
      const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
      if(c.image) left.innerHTML = `<img src="${c.image}" class="preview-img">`;
      const info = document.createElement('div'); info.innerHTML = `<strong>${escapeHtml(c.title)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(c.issuer||'')}</div>`;
      left.appendChild(info); row.appendChild(left);
      const actions = document.createElement('div'); const edit=document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit'; edit.addEventListener('click', ()=> startEdit('cert', gi));
      const del=document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete'; del.addEventListener('click', ()=> confirmDelete('cert', gi));
      actions.appendChild(edit); actions.appendChild(del); row.appendChild(actions); certList.appendChild(row);
    });
    renderPager('certPager', pages, page, (p)=>renderCertificates(p));
  }

  async function renderInternships(page=1){
    if(!internList) return;
    showSkeleton(internList,2);
    interns = await fetchDocArray('internships');
    const items = applySearchSort(interns);
    internList.innerHTML = items.length ? '' : '<p style="opacity:.8">No internships</p>';
    const total = items.length; const pages = Math.max(1, Math.ceil(total/PAGE_SIZE));
    const start=(page-1)*PAGE_SIZE; const paged = items.slice(start, start+PAGE_SIZE);
    paged.forEach((it,idx)=>{
      const gi = start + idx;
      const row=document.createElement('div'); row.className='list-row';
      row.innerHTML = `<div><strong>${escapeHtml(it.company)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(it.role||'')} • ${escapeHtml(it.duration||'')}</div></div>`;
      const edit=document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit'; edit.addEventListener('click', ()=> startEdit('intern', gi));
      const del=document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete'; del.addEventListener('click', ()=> confirmDelete('intern', gi));
      row.appendChild(edit); row.appendChild(del); internList.appendChild(row);
    });
    renderPager('internPager', pages, page, (p)=>renderInternships(p));
  }

  async function renderProjects(page=1){
    if(!projectList) return;
    showSkeleton(projectList,3);
    projects = await fetchDocArray('projects');
    const items = applySearchSort(projects);
    projectList.innerHTML = items.length ? '' : '<p style="opacity:.8">No projects</p>';
    const total = items.length; const pages = Math.max(1, Math.ceil(total/PAGE_SIZE));
    const start=(page-1)*PAGE_SIZE; const paged = items.slice(start,start+PAGE_SIZE);
    paged.forEach((p, idx)=>{
      const gi = start + idx;
      const row=document.createElement('div'); row.className='list-row';
      const left=document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
      if(p.image) left.innerHTML = `<img src="${p.image}" class="preview-img">`;
      const info = document.createElement('div'); info.innerHTML = `<strong>${escapeHtml(p.name)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(p.desc||'')}</div>`;
      left.appendChild(info); row.appendChild(left);
      const edit=document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit'; edit.addEventListener('click', ()=> startEdit('proj', gi));
      const del=document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete'; del.addEventListener('click', ()=> confirmDelete('proj', gi));
      row.appendChild(edit); row.appendChild(del); projectList.appendChild(row);
    });
    renderPager('projPager', pages, page, (p)=>renderProjects(p));
  }

  function renderPager(containerId, pages, current, onPage){
    const el = document.getElementById(containerId); if(!el) return; el.innerHTML=''; if(pages<=1) return;
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='6px';
    for(let i=1;i<=pages;i++){ const b=document.createElement('button'); b.className = i===current ? 'btn' : 'btn-ghost'; b.textContent = i; b.addEventListener('click', ()=> onPage(i)); wrap.appendChild(b); }
    el.appendChild(wrap);
  }

  function startEdit(type, index){
    editing = { type, index };
    if(type==='cert'){ const it = certs[index] || {}; certTitle && (certTitle.value = it.title||''); certIssuer && (certIssuer.value = it.issuer||''); certLink && (certLink.value = it.link||''); certPreview && (certPreview.innerHTML = it.image ? `<img src="${it.image}" class="preview-img">` : 'Preview'); if(addCert) addCert.style.display='none'; if(updateCertBtn) updateCertBtn.style.display='inline-block'; toggle(certFormWrap, true); window.scrollTo({top:0,behavior:'smooth'}); }
    if(type==='intern'){ const it = interns[index]||{}; internCompany && (internCompany.value = it.company||''); internRole && (internRole.value = it.role||''); internDuration && (internDuration.value = it.duration||''); if(addIntern) addIntern.style.display='none'; if(updateInternBtn) updateInternBtn.style.display='inline-block'; toggle(internFormWrap, true); window.scrollTo({top:0,behavior:'smooth'}); }
    if(type==='proj'){ const it = projects[index]||{}; projName && (projName.value = it.name||''); projDesc && (projDesc.value = it.desc||''); projUrl && (projUrl.value = it.url||''); projPreview && (projPreview.innerHTML = it.image ? `<img src="${it.image}" class="preview-img">` : 'Preview'); if(addProj) addProj.style.display='none'; if(updateProjBtn) updateProjBtn.style.display='inline-block'; toggle(projFormWrap, true); window.scrollTo({top:0,behavior:'smooth'}); }
  }

  function cancelEditAll(){
    editing = { type:null, index:-1 };
    if(certTitle) certTitle.value=''; if(certIssuer) certIssuer.value=''; if(certImage) certImage.value=''; if(certPreview) certPreview.innerHTML='Preview'; if(certLink) certLink.value='';
    if(internCompany) internCompany.value=''; if(internRole) internRole.value=''; if(internDuration) internDuration.value='';
    if(projName) projName.value=''; if(projDesc) projDesc.value=''; if(projUrl) projUrl.value=''; if(projImage) projImage.value=''; if(projPreview) projPreview.innerHTML='Preview';
    if(addCert) addCert.style.display='inline-block'; if(updateCertBtn) updateCertBtn.style.display='none';
    if(addIntern) addIntern.style.display='inline-block'; if(updateInternBtn) updateInternBtn.style.display='none';
    if(addProj) addProj.style.display='inline-block'; if(updateProjBtn) updateProjBtn.style.display='none';
    toggle(certFormWrap, false); toggle(internFormWrap, false); toggle(projFormWrap, false);
  }

  function confirmDelete(type, index){
    pendingDelete = { type, index };
    if(confirmTitle) confirmTitle.textContent = 'Delete';
    if(confirmText) confirmText.textContent = 'Are you sure you want to delete this item? This cannot be undone.';
    if(confirmModal) confirmModal.classList.add('show');
  }

  confirmNo && confirmNo.addEventListener('click', ()=> { pendingDelete = null; confirmModal && confirmModal.classList.remove('show'); });
  confirmYes && confirmYes.addEventListener('click', async ()=>{
    if(!pendingDelete) return;
    const { type, index } = pendingDelete;
    try{
      if(type==='cert') await deleteCertificate(index);
      if(type==='intern') await deleteIntern(index);
      if(type==='proj') await deleteProject(index);
      toast('Deleted');
    }catch(e){ toast('Delete failed', {type:'error'}); console.error(e); }
    pendingDelete = null; confirmModal && confirmModal.classList.remove('show');
  });

  // CRUD operations (with defensive checks)
  async function addCertificate(){
    if(!db) return fatal('Database not available');
    const title = (certTitle && certTitle.value||'').trim(); if(!title) return toast('Title required', {type:'error'});
    addCert && (addCert.disabled = true);
    try{
      const file = certImage && certImage.files && certImage.files[0];
      const url = file ? await uploadFile(file, 'certificates') : null;
      const ref = db.collection('certificates').doc('list');
      await db.runTransaction(async tx => {
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        items.push({ title, issuer: certIssuer && certIssuer.value.trim(), image: url, link: certLink && certLink.value.trim() || null, addedAt: Date.now() });
        tx.set(ref, { items }, { merge:true });
      });
      toast('Certificate added');
      cancelEditAll(); await renderCertificates();
    }catch(e){ console.error(e); toast('Add failed', {type:'error'}); }
    addCert && (addCert.disabled = false);
  }

  async function addIntern(){ if(!db) return fatal('Database not available'); const company = (internCompany && internCompany.value||'').trim(); if(!company) return toast('Company required', {type:'error'}); addIntern && (addIntern.disabled=true);
    try{ const ref = db.collection('internships').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items.push({ company, role: internRole && internRole.value.trim(), duration: internDuration && internDuration.value.trim(), addedAt: Date.now() }); tx.set(ref, { items }, { merge:true }); }); toast('Internship added'); cancelEditAll(); await renderInternships(); }catch(e){ console.error(e); toast('Add failed', {type:'error'}); } addIntern && (addIntern.disabled=false); }

  async function addProject(){ if(!db) return fatal('Database not available'); const name = (projName && projName.value||'').trim(); if(!name) return toast('Project name required', {type:'error'}); addProj && (addProj.disabled=true);
    try{ const file = projImage && projImage.files && projImage.files[0]; const url = file ? await uploadFile(file,'projects') : null; const ref = db.collection('projects').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items.push({ name, desc: projDesc && projDesc.value.trim(), url: projUrl && projUrl.value.trim() || null, image: url || null, addedAt: Date.now() }); tx.set(ref, { items }, { merge:true }); }); toast('Project added'); cancelEditAll(); await renderProjects(); }catch(e){ console.error(e); toast('Add failed', {type:'error'}); } addProj && (addProj.disabled=false); }

  async function updateCertificate(){ if(!db) return fatal('Database not available'); const idx = editing.index; if(idx<0) return cancelEditAll(); updateCertBtn && (updateCertBtn.disabled=true);
    try{ const ref = db.collection('certificates').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; const file = certImage && certImage.files && certImage.files[0]; const url = file ? await uploadFile(file,'certificates') : (items[idx] && items[idx].image) || null; items[idx] = { ...items[idx], title: certTitle && certTitle.value.trim(), issuer: certIssuer && certIssuer.value.trim(), link: certLink && certLink.value.trim() || null, image: url, updatedAt: Date.now() }; tx.set(ref, { items }); }); toast('Certificate updated'); cancelEditAll(); await renderCertificates(); }catch(e){ console.error(e); toast('Update failed', {type:'error'}); } updateCertBtn && (updateCertBtn.disabled=false); }

  async function updateIntern(){ if(!db) return fatal('Database not available'); const idx = editing.index; if(idx<0) return cancelEditAll(); updateInternBtn && (updateInternBtn.disabled=true); try{ const ref = db.collection('internships').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items[idx] = { ...items[idx], company: internCompany && internCompany.value.trim(), role: internRole && internRole.value.trim(), duration: internDuration && internDuration.value.trim(), updatedAt: Date.now() }; tx.set(ref, { items }); }); toast('Internship updated'); cancelEditAll(); await renderInternships(); }catch(e){ console.error(e); toast('Update failed', {type:'error'}); } updateInternBtn && (updateInternBtn.disabled=false); }

  async function updateProject(){ if(!db) return fatal('Database not available'); const idx = editing.index; if(idx<0) return cancelEditAll(); updateProjBtn && (updateProjBtn.disabled=true); try{ const ref = db.collection('projects').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; const file = projImage && projImage.files && projImage.files[0]; const url = file ? await uploadFile(file,'projects') : (items[idx] && items[idx].image) || null; items[idx] = { ...items[idx], name: projName && projName.value.trim(), desc: projDesc && projDesc.value.trim(), url: projUrl && projUrl.value.trim() || null, image: url, updatedAt: Date.now() }; tx.set(ref, { items }); }); toast('Project updated'); cancelEditAll(); await renderProjects(); }catch(e){ console.error(e); toast('Update failed', {type:'error'}); } updateProjBtn && (updateProjBtn.disabled=false); }

  async function deleteCertificate(i){ if(!db) return fatal('Database not available'); const ref = db.collection('certificates').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items.splice(i,1); tx.set(ref, { items }); }); await renderCertificates(); }
  async function deleteIntern(i){ if(!db) return fatal('Database not available'); const ref = db.collection('internships').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items.splice(i,1); tx.set(ref, { items }); }); await renderInternships(); }
  async function deleteProject(i){ if(!db) return fatal('Database not available'); const ref = db.collection('projects').doc('list'); await db.runTransaction(async tx=>{ const d = await tx.get(ref); const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : []; items.splice(i,1); tx.set(ref, { items }); }); await renderProjects(); }

  // admin helpers
  async function exportData(){ if(!db) return fatal('Database not available'); const payload = { certificates: await fetchDocArray('certificates'), internships: await fetchDocArray('internships'), projects: await fetchDocArray('projects'), exportedAt: Date.now() }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'export.json'; a.click(); URL.revokeObjectURL(url); toast('Export started'); }
  async function recalcTimestamps(){ if(!db) return fatal('Database not available'); toast('Recalc started'); await Promise.all(['certificates','internships','projects'].map(async col=>{ const ref = db.collection(col).doc('list'); const d = await ref.get(); if(!d.exists) return; const items = d.data().items.map(it=> ({ ...it, syncedAt: Date.now() })); await ref.set({ items }, { merge:true }); })); toast('Recalc finished'); }

  $('exportData')?.addEventListener('click', exportData);
  $('clearCache')?.addEventListener('click', ()=> { localStorage.clear(); toast('Local cache cleared'); });
  $('recalcTimestamps')?.addEventListener('click', recalcTimestamps);

  toggleCertForm?.addEventListener('click', ()=> toggle(certFormWrap, certFormWrap.style.display === 'none' ? true : false));
  toggleInternForm?.addEventListener('click', ()=> toggle(internFormWrap, internFormWrap.style.display === 'none' ? true : false));
  toggleProjForm?.addEventListener('click', ()=> toggle(projFormWrap, projFormWrap.style.display === 'none' ? true : false));

  addCert?.addEventListener('click', addCertificate);
  addIntern?.addEventListener('click', addIntern);
  addProj?.addEventListener('click', addProject);

  updateCertBtn?.addEventListener('click', updateCertificate);
  updateInternBtn?.addEventListener('click', updateIntern);
  updateProjBtn?.addEventListener('click', updateProject);

  cancelCert?.addEventListener('click', cancelEditAll);
  cancelIntern?.addEventListener('click', cancelEditAll);
  cancelProj?.addEventListener('click', cancelEditAll);

  signOutBtn && signOutBtn.addEventListener('click', ()=> { if(!auth){ location.href='login.html'; return; } auth.signOut().then(()=> location.href='login.html'); });
  themeToggle && themeToggle.addEventListener('click', ()=> window.toggleTheme && window.toggleTheme());

  searchInput && searchInput.addEventListener('input', ()=> { renderCertificates(); renderInternships(); renderProjects(); });
  sortSelect && sortSelect.addEventListener('change', ()=> { renderCertificates(); renderInternships(); renderProjects(); });

  // AUTH: require sign in and admin email check
  async function ensureAdminAndRender(){
    if(!auth || !db){
      // If no firebase, render placeholders (avoid blocking UI)
      renderCertificates(); renderInternships(); renderProjects();
      return;
    }
    auth.onAuthStateChanged(async user => {
      if(!user){ location.href = 'login.html'; return; }
      try{
        const doc = await db.collection('admin').doc('list').get();
        const emails = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
        if(!emails.includes(user.email)){
          toast('Not authorized', {type:'error'}); await auth.signOut(); location.href='login.html'; return;
        }
      }catch(e){
        console.warn('admin check failed', e);
        // proceed anyway if check can't be performed
      }
      await Promise.all([renderCertificates(), renderInternships(), renderProjects()]);
    });
  }

  ensureAdminAndRender();

})();
