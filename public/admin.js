/* admin.js - Neon Glow Admin
   Requires:
   - firebase.js (compat) that sets window.auth, window.db, window.storage
   - global.js (toast & theme helpers)
   - This script is intentionally defensive to avoid runtime errors if firebase is missing.
*/

(async function(){
  // small helper guard
  if(!window.firebase){
    console.error('Firebase SDK missing. Ensure firebase.js is loaded.');
    // still allow UI interactions that don't need firebase
  }

  const auth = window.auth || (window.firebase && window.firebase.auth && firebase.auth());
  const db = window.db || (window.firebase && window.firebase.firestore && firebase.firestore());
  const storage = window.storage || (window.firebase && window.firebase.storage && firebase.storage());

  // DOM refs
  const signOutBtn = document.getElementById('signOutBtn');
  const themeToggle = document.getElementById('themeToggle');
  const toastsWrap = document.getElementById('toasts');

  // Lists
  const certList = document.getElementById('certList');
  const internList = document.getElementById('internList');
  const projectList = document.getElementById('projectList');

  // Forms & preview
  const certFormWrap = document.getElementById('certFormWrap');
  const certTitle = document.getElementById('certTitle');
  const certIssuer = document.getElementById('certIssuer');
  const certImage = document.getElementById('certImage');
  const certPreview = document.getElementById('certPreview');
  const certLink = document.getElementById('certLink');
  const addCert = document.getElementById('addCert');
  const updateCertBtn = document.getElementById('updateCert');
  const cancelCert = document.getElementById('cancelCert');
  const toggleCertForm = document.getElementById('toggleCertForm');

  const internFormWrap = document.getElementById('internFormWrap');
  const internCompany = document.getElementById('internCompany');
  const internRole = document.getElementById('internRole');
  const internDuration = document.getElementById('internDuration');
  const addIntern = document.getElementById('addIntern');
  const updateInternBtn = document.getElementById('updateIntern');
  const cancelIntern = document.getElementById('cancelIntern');
  const toggleInternForm = document.getElementById('toggleInternForm');

  const projFormWrap = document.getElementById('projFormWrap');
  const projName = document.getElementById('projName');
  const projDesc = document.getElementById('projDesc');
  const projUrl = document.getElementById('projUrl');
  const projImage = document.getElementById('projImage');
  const projPreview = document.getElementById('projPreview');
  const addProj = document.getElementById('addProj');
  const updateProjBtn = document.getElementById('updateProj');
  const cancelProj = document.getElementById('cancelProj');
  const toggleProjForm = document.getElementById('toggleProjForm');

  // search & sort
  const searchInput = document.getElementById('globalSearch');
  const sortSelect = document.getElementById('globalSort');

  // modal
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmText = document.getElementById('confirmText');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  // state
  let certs = [], interns = [], projects = [];
  let editing = { type: null, index: -1, id: null }; // id is index in array doc
  const PAGE_SIZE = 6;

  // toast utility (if global.toast exists, use it)
  const toast = window.toast || function(message, opts={type:'ok', duration:4200}){
    if(typeof window.toast === 'function') return window.toast(message, opts);
    if(!toastsWrap) return console.log('toast:', message);
    const el = document.createElement('div');
    el.className = 'toast' + (opts.type === 'error' ? ' error' : '');
    el.textContent = message;
    toastsWrap.appendChild(el);
    setTimeout(()=> el.remove(), opts.duration || 4200);
  };

  // small helpers
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
  function showSkeleton(container, lines=2){
    if(!container) return;
    container.innerHTML = '';
    for(let i=0;i<lines;i++){
      const d = document.createElement('div'); d.className='skeleton'; d.style.height='18px'; d.style.marginTop = i? '8px':'0';
      container.appendChild(d);
    }
  }

  // file preview
  function filePreview(file, container){
    if(!file){ container.innerHTML = 'Preview'; return; }
    const r = new FileReader();
    r.onload = e => container.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="preview">`;
    r.readAsDataURL(file);
  }
  certImage && certImage.addEventListener('change', e => filePreview(e.target.files[0], certPreview));
  projImage && projImage.addEventListener('change', e => filePreview(e.target.files[0], projPreview));

  // toggle form helpers
  function toggle(el, show){
    if(!el) return;
    if(show){ el.classList.remove('collapsed'); } else { el.classList.add('collapsed'); }
  }

  // upload helper (firebase storage)
  async function uploadFile(file, folder='assets'){
    if(!file) return null;
    try{
      const name = Date.now() + '_' + file.name.replace(/\s+/g,'_');
      const ref = storage.ref().child(`${folder}/${name}`);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      return url;
    }catch(e){
      console.error('uploadFile error', e);
      throw e;
    }
  }

  // fetch array helper
  async function fetchDocArray(collectionName){
    try{
      const doc = await db.collection(collectionName).doc('list').get();
      return doc.exists && Array.isArray(doc.data().items) ? doc.data().items.slice() : [];
    }catch(e){
      console.error('fetchDocArray', e);
      return [];
    }
  }

  // render with search + sort + pagination
  function applySearchSort(items){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    let out = items.slice();
    if(q){
      out = out.filter(it => JSON.stringify(it).toLowerCase().includes(q));
    }
    const sortVal = (sortSelect && sortSelect.value) || 'newest';
    if(sortVal === 'newest') out.sort((a,b)=> (b.addedAt||0) - (a.addedAt||0));
    if(sortVal === 'oldest') out.sort((a,b)=> (a.addedAt||0) - (b.addedAt||0));
    if(sortVal === 'name_asc') out.sort((a,b)=> ((a.name||a.title||'').localeCompare(b.name||b.title||'')));
    if(sortVal === 'name_desc') out.sort((a,b)=> ((b.name||b.title||'').localeCompare(a.name||a.title||'')));
    return out;
  }

  // render lists
  async function renderCertificates(page=1){
    showSkeleton(certList, 3);
    certs = await fetchDocArray('certificates');
    const items = applySearchSort(certs);
    certList.innerHTML = items.length ? '' : `<p style="opacity:.8">No certificates</p>`;
    // pagination
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page-1)*PAGE_SIZE;
    const paged = items.slice(start, start + PAGE_SIZE);
    paged.forEach((c, idx) => {
      const globalIdx = start + idx;
      const row = document.createElement('div'); row.className='list-row';
      const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
      if(c.image) left.innerHTML = `<img src="${c.image}" class="preview-img" alt="cert">`;
      const info = document.createElement('div'); info.innerHTML = `<strong>${escapeHtml(c.title)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(c.issuer||'')}</div>`;
      left.appendChild(info);
      row.appendChild(left);

      const actions = document.createElement('div');
      const edit = document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit';
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      edit.addEventListener('click', ()=> startEdit('cert', globalIdx));
      del.addEventListener('click', ()=> confirmDelete('cert', globalIdx));
      actions.appendChild(edit); actions.appendChild(del);
      row.appendChild(actions);
      certList.appendChild(row);
    });
    // pager
    renderPager('certPager', pages, page, (p)=> renderCertificates(p));
  }

  async function renderInternships(page=1){
    showSkeleton(internList, 2);
    interns = await fetchDocArray('internships');
    const items = applySearchSort(interns);
    internList.innerHTML = items.length ? '' : `<p style="opacity:.8">No internships</p>`;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page-1)*PAGE_SIZE;
    const paged = items.slice(start, start + PAGE_SIZE);
    paged.forEach((it, idx) => {
      const globalIdx = start + idx;
      const row = document.createElement('div'); row.className='list-row';
      row.innerHTML = `<div><strong>${escapeHtml(it.company)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(it.role||'')} • ${escapeHtml(it.duration||'')}</div></div>`;
      const edit = document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit';
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      edit.addEventListener('click', ()=> startEdit('intern', globalIdx));
      del.addEventListener('click', ()=> confirmDelete('intern', globalIdx));
      row.appendChild(edit); row.appendChild(del);
      internList.appendChild(row);
    });
    renderPager('internPager', pages, page, (p)=> renderInternships(p));
  }

  async function renderProjects(page=1){
    showSkeleton(projectList, 3);
    projects = await fetchDocArray('projects');
    const items = applySearchSort(projects);
    projectList.innerHTML = items.length ? '' : `<p style="opacity:.8">No projects</p>`;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page-1)*PAGE_SIZE;
    const paged = items.slice(start, start + PAGE_SIZE);
    paged.forEach((p, idx) => {
      const globalIdx = start + idx;
      const row = document.createElement('div'); row.className='list-row';
      const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
      if(p.image) left.innerHTML = `<img src="${p.image}" class="preview-img" alt="proj">`;
      const info = document.createElement('div'); info.innerHTML = `<strong>${escapeHtml(p.name)}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(p.desc||'')}</div>`;
      left.appendChild(info);
      row.appendChild(left);
      const edit = document.createElement('button'); edit.className='btn-ghost'; edit.textContent='Edit';
      const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
      edit.addEventListener('click', ()=> startEdit('proj', globalIdx));
      del.addEventListener('click', ()=> confirmDelete('proj', globalIdx));
      row.appendChild(edit); row.appendChild(del);
      projectList.appendChild(row);
    });
    renderPager('projPager', pages, page, (p)=> renderProjects(p));
  }

  function renderPager(containerId, totalPages, currentPage, onPage){
    const el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = '';
    if(totalPages <= 1) return;
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='6px'; wrap.style.marginTop='12px';
    for(let i=1;i<=totalPages;i++){
      const b = document.createElement('button'); b.className = i === currentPage ? 'btn' : 'btn-ghost'; b.textContent = i;
      b.addEventListener('click', ()=> onPage(i));
      wrap.appendChild(b);
    }
    el.appendChild(wrap);
  }

  // start editing
  function startEdit(type, index){
    editing.type = type; editing.index = index;
    if(type === 'cert'){
      const item = certs[index];
      certTitle.value = item.title || '';
      certIssuer.value = item.issuer || '';
      certLink.value = item.link || '';
      certPreview.innerHTML = item.image ? `<img src="${item.image}" class="preview-img">` : 'Preview';
      addCert.style.display='none'; updateCertBtn.style.display='inline-block';
      toggle(certFormWrap, true);
      window.scrollTo({ top: 0, behavior:'smooth' });
    }
    if(type === 'intern'){
      const item = interns[index];
      internCompany.value = item.company || '';
      internRole.value = item.role || '';
      internDuration.value = item.duration || '';
      addIntern.style.display='none'; updateInternBtn.style.display='inline-block';
      toggle(internFormWrap, true);
      window.scrollTo({ top: 0, behavior:'smooth' });
    }
    if(type === 'proj'){
      const item = projects[index];
      projName.value = item.name || '';
      projDesc.value = item.desc || '';
      projUrl.value = item.url || '';
      projPreview.innerHTML = item.image ? `<img src="${item.image}" class="preview-img">` : 'Preview';
      addProj.style.display='none'; updateProjBtn.style.display='inline-block';
      toggle(projFormWrap, true);
      window.scrollTo({ top: 0, behavior:'smooth' });
    }
  }

  // cancel edit
  function cancelEditAll(){
    editing = { type: null, index: -1, id: null };
    // reset forms
    certTitle.value=''; certIssuer.value=''; certImage.value=''; certPreview.innerHTML='Preview'; certLink.value='';
    internCompany.value=''; internRole.value=''; internDuration.value='';
    projName.value=''; projDesc.value=''; projUrl.value=''; projImage.value=''; projPreview.innerHTML='Preview';
    addCert.style.display='inline-block'; updateCertBtn.style.display='none';
    addIntern.style.display='inline-block'; updateInternBtn.style.display='none';
    addProj.style.display='inline-block'; updateProjBtn.style.display='none';
    toggle(certFormWrap, false); toggle(internFormWrap, false); toggle(projFormWrap, false);
  }

  // confirm delete modal
  let pendingDelete = null;
  function confirmDelete(type, index){
    pendingDelete = { type, index };
    confirmTitle.textContent = 'Delete';
    confirmText.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';
    openModal();
  }
  function openModal(){ confirmModal.setAttribute('open',''); confirmModal.classList.add('show'); confirmModal.style.visibility='visible'; }
  function closeModal(){ confirmModal.removeAttribute('open'); confirmModal.classList.remove('show'); confirmModal.style.visibility='hidden'; }

  confirmYes.addEventListener('click', async () => {
    if(!pendingDelete) return closeModal();
    const { type, index } = pendingDelete;
    try{
      if(type === 'cert'){ await deleteCertificate(index); }
      if(type === 'intern'){ await deleteIntern(index); }
      if(type === 'proj'){ await deleteProject(index); }
      toast('Deleted');
    }catch(e){
      toast('Delete failed', {type:'error'});
    }
    pendingDelete = null;
    closeModal();
  });
  confirmNo.addEventListener('click', ()=> { pendingDelete = null; closeModal(); });

  // Add / Update functions (use transactions)
  async function addCertificate(){
    const title = (certTitle.value || '').trim();
    if(!title) return toast('Title required', {type:'error'});
    addCert.disabled = true;
    try{
      const file = certImage.files[0];
      const url = file ? await uploadFile(file, 'certificates') : null;
      const ref = db.collection('certificates').doc('list');
      await db.runTransaction(async tx => {
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        items.push({ title, issuer: certIssuer.value.trim(), image: url, link: certLink.value.trim() || null, addedAt: Date.now() });
        tx.set(ref, { items }, { merge:true });
      });
      toast('Certificate added');
      cancelEditAll();
      await renderCertificates();
    }catch(e){
      console.error(e);
      toast('Add failed', {type:'error'});
    }
    addCert.disabled = false;
  }

  async function addIntern(){
    const company = (internCompany.value || '').trim();
    if(!company) return toast('Company required', {type:'error'});
    addIntern.disabled = true;
    try{
      const ref = db.collection('internships').doc('list');
      await db.runTransaction(async tx=>{
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        items.push({ company, role: internRole.value.trim(), duration: internDuration.value.trim(), addedAt: Date.now() });
        tx.set(ref, { items }, { merge:true });
      });
      toast('Internship added');
      cancelEditAll();
      await renderInternships();
    }catch(e){
      console.error(e);
      toast('Add failed', {type:'error'});
    }
    addIntern.disabled = false;
  }

  async function addProject(){
    const name = (projName.value || '').trim();
    if(!name) return toast('Project name required', {type:'error'});
    addProj.disabled = true;
    try{
      const file = projImage.files[0];
      const url = file ? await uploadFile(file, 'projects') : null;
      const ref = db.collection('projects').doc('list');
      await db.runTransaction(async tx=>{
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        items.push({ name, desc: projDesc.value.trim(), url: projUrl.value.trim() || null, image: url || null, addedAt: Date.now() });
        tx.set(ref, { items }, { merge:true });
      });
      toast('Project added');
      cancelEditAll();
      await renderProjects();
    }catch(e){
      console.error(e);
      toast('Add failed', {type:'error'});
    }
    addProj.disabled = false;
  }

  // update implementations
  async function updateCertificate(){
    const idx = editing.index;
    if(idx < 0) return cancelEditAll();
    updateCertBtn.disabled = true;
    try{
      const ref = db.collection('certificates').doc('list');
      await db.runTransaction(async tx=>{
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        const file = certImage.files[0];
        const url = file ? await uploadFile(file, 'certificates') : items[idx].image || null;
        items[idx] = { ...items[idx], title: certTitle.value.trim(), issuer: certIssuer.value.trim(), link: certLink.value.trim() || null, image: url, updatedAt: Date.now() };
        tx.set(ref, { items });
      });
      toast('Certificate updated');
      cancelEditAll();
      await renderCertificates();
    }catch(e){
      console.error(e);
      toast('Update failed', {type:'error'});
    }
    updateCertBtn.disabled = false;
  }

  async function updateIntern(){
    const idx = editing.index;
    if(idx < 0) return cancelEditAll();
    updateInternBtn.disabled = true;
    try{
      const ref = db.collection('internships').doc('list');
      await db.runTransaction(async tx=>{
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        items[idx] = { ...items[idx], company: internCompany.value.trim(), role: internRole.value.trim(), duration: internDuration.value.trim(), updatedAt: Date.now() };
        tx.set(ref, { items });
      });
      toast('Internship updated');
      cancelEditAll();
      await renderInternships();
    }catch(e){
      console.error(e);
      toast('Update failed', {type:'error'});
    }
    updateInternBtn.disabled = false;
  }

  async function updateProject(){
    const idx = editing.index;
    if(idx < 0) return cancelEditAll();
    updateProjBtn.disabled = true;
    try{
      const ref = db.collection('projects').doc('list');
      await db.runTransaction(async tx=>{
        const d = await tx.get(ref);
        const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
        const file = projImage.files[0];
        const url = file ? await uploadFile(file, 'projects') : items[idx].image || null;
        items[idx] = { ...items[idx], name: projName.value.trim(), desc: projDesc.value.trim(), url: projUrl.value.trim() || null, image: url, updatedAt: Date.now() };
        tx.set(ref, { items });
      });
      toast('Project updated');
      cancelEditAll();
      await renderProjects();
    }catch(e){
      console.error(e);
      toast('Update failed', {type:'error'});
    }
    updateProjBtn.disabled = false;
  }

  // delete operations (called from modal confirm)
  async function deleteCertificate(idx){
    const ref = db.collection('certificates').doc('list');
    await db.runTransaction(async tx=>{
      const d = await tx.get(ref);
      const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
      items.splice(idx,1);
      tx.set(ref, { items });
    });
    await renderCertificates();
  }

  async function deleteIntern(idx){
    const ref = db.collection('internships').doc('list');
    await db.runTransaction(async tx=>{
      const d = await tx.get(ref);
      const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
      items.splice(idx,1);
      tx.set(ref, { items });
    });
    await renderInternships();
  }

  async function deleteProject(idx){
    const ref = db.collection('projects').doc('list');
    await db.runTransaction(async tx=>{
      const d = await tx.get(ref);
      const items = d.exists && Array.isArray(d.data().items) ? d.data().items.slice() : [];
      items.splice(idx,1);
      tx.set(ref, { items });
    });
    await renderProjects();
  }

  // admin-only utilities
  async function exportData(){
    const payload = {
      certificates: await fetchDocArray('certificates'),
      internships: await fetchDocArray('internships'),
      projects: await fetchDocArray('projects'),
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'export.json'; a.click();
    URL.revokeObjectURL(url);
    toast('Export triggered');
  }

  async function recalcTimestamps(){
    toast('Recalc started');
    await Promise.all(['certificates','internships','projects'].map(async collection => {
      const ref = db.collection(collection).doc('list');
      const d = await ref.get();
      if(!d.exists) return;
      const items = d.data().items.map(it => ({ ...it, syncedAt: Date.now() }));
      await ref.set({ items }, { merge:true });
    }));
    toast('Recalc finished');
  }

  // listeners
  toggleCertForm && toggleCertForm.addEventListener('click', ()=> toggle(certFormWrap, !certFormWrap.classList.contains('collapsed')));
  toggleInternForm && toggleInternForm.addEventListener('click', ()=> toggle(internFormWrap, !internFormWrap.classList.contains('collapsed')));
  toggleProjForm && toggleProjForm.addEventListener('click', ()=> toggle(projFormWrap, !projFormWrap.classList.contains('collapsed')));

  addCert && addCert.addEventListener('click', addCertificate);
  addIntern && addIntern.addEventListener('click', addIntern);
  addProj && addProj.addEventListener('click', addProject);

  updateCertBtn && updateCertBtn.addEventListener('click', updateCertificate);
  updateInternBtn && updateInternBtn.addEventListener('click', updateIntern);
  updateProjBtn && updateProjBtn.addEventListener('click', updateProject);

  cancelCert && cancelCert.addEventListener('click', cancelEditAll);
  cancelIntern && cancelIntern.addEventListener('click', cancelEditAll);
  cancelProj && cancelProj.addEventListener('click', cancelEditAll);

  document.getElementById('exportData')?.addEventListener('click', exportData);
  document.getElementById('clearCache')?.addEventListener('click', ()=> { localStorage.clear(); toast('Local cache cleared'); });
  document.getElementById('recalcTimestamps')?.addEventListener('click', recalcTimestamps);

  confirmModal && confirmModal.addEventListener('click', (e)=> { if(e.target === confirmModal) closeModal(); });

  signOutBtn && signOutBtn.addEventListener('click', ()=> {
    if(!auth) { location.href = 'login.html'; return; }
    auth.signOut().then(()=> location.href = 'login.html');
  });

  searchInput && searchInput.addEventListener('input', ()=> { renderCertificates(); renderInternships(); renderProjects(); });
  sortSelect && sortSelect.addEventListener('change', ()=> { renderCertificates(); renderInternships(); renderProjects(); });

  // theme toggle (delegated to global.js if present)
  themeToggle && themeToggle.addEventListener('click', ()=> {
    const cur = localStorage.getItem('ay_theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ay_theme', next);
    window.location.reload(); // quick way to apply theme vars
  });

  // auth check and data load
  if(auth && db){
    auth.onAuthStateChanged(async user => {
      if(!user){ location.href = 'login.html'; return; }
      // check admin list
      try{
        const doc = await db.collection('admin').doc('list').get();
        const list = doc.exists && Array.isArray(doc.data().emails) ? doc.data().emails : [];
        if(!list.includes(user.email)){
          toast('Not authorized', {type:'error'});
          await auth.signOut();
          location.href = 'login.html';
          return;
        }
      }catch(e){
        console.warn('admin list check failed', e);
      }
      // load content
      await Promise.all([renderCertificates(), renderInternships(), renderProjects()]);
    });
  } else {
    // if firebase missing, render empty skeletons
    renderCertificates(); renderInternships(); renderProjects();
  }
})();
