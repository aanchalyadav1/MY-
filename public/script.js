// script.js — index page preview loader
const db = window.db || firebase.firestore();

function escapeHtml(str){ return str ? str.replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : ''; }

async function loadPreview(){
  try{
    const cdoc = await db.collection('certificates').doc('list').get();
    const certs = cdoc.exists && Array.isArray(cdoc.data().items) ? cdoc.data().items : [];
    const pc = document.getElementById('previewCerts');
    pc.innerHTML = certs.length ? '' : '<p style="opacity:.7">No certificates yet</p>';
    certs.slice(-3).reverse().forEach(c=>{
      const d = document.createElement('div'); d.className='cardItem';
      d.innerHTML = `<strong>${escapeHtml(c.title)}</strong><div style="color:var(--muted)">${escapeHtml(c.issuer||'')}</div>`;
      if(c.fileUrl){ const a=document.createElement('a'); a.href=c.fileUrl; a.target='_blank'; a.textContent='View'; d.appendChild(a); }
      pc.appendChild(d);
    });

    const pdoc = await db.collection('projects').doc('list').get();
    const projects = pdoc.exists && Array.isArray(pdoc.data().items) ? pdoc.data().items : [];
    const pp = document.getElementById('previewProjects');
    pp.innerHTML = projects.length ? '' : '<p style="opacity:.7">No projects yet</p>';
    projects.slice(-3).reverse().forEach(p=>{
      const d = document.createElement('div'); d.className='cardItem';
      d.innerHTML = `<strong>${escapeHtml(p.name)}</strong><div style="color:var(--muted)">${escapeHtml(p.desc||'')}</div>`;
      if(p.url){ const a=document.createElement('a'); a.href=p.url; a.target='_blank'; a.textContent='Open'; d.appendChild(a); }
      pp.appendChild(d);
    });

  }catch(e){ console.error(e); }
}

document.addEventListener('DOMContentLoaded', loadPreview);
