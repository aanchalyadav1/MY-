// backend base url
const API = "https://my-junc.onrender.com";

// AUTH helpers
function logout(){
  localStorage.removeItem('adminAuth');
  location.href = 'login.html';
}

// ----- SAVE FUNCTIONS -----
async function saveCertificates(){
  try {
    const raw = document.getElementById('certData').value || '[]';
    const items = JSON.parse(raw);
    await fetch(API + '/saveCertificates', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ items })
    });
    alert('Certificates saved');
  } catch(e){ alert('Error: ' + e.message); }
}

async function saveInternships(){
  try {
    const raw = document.getElementById('internData').value || '[]';
    const items = JSON.parse(raw);
    await fetch(API + '/saveInternships', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ items })
    });
    alert('Internships saved');
  } catch(e){ alert('Error: ' + e.message); }
}

async function saveProjects(){
  try {
    const raw = document.getElementById('projectsBox').value || '[]';
    let payload;
    try {
      payload = JSON.parse(raw);
      if(Array.isArray(payload)) payload = { items: payload };
    } catch(err){
      payload = raw;
    }
    await fetch(API + '/saveProjects', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    });
    alert('Projects saved');
  } catch(e){ alert('Error: ' + e.message); }
}

// ----- GITHUB IMPORT -----
async function fetchGithub(){
  const user = document.getElementById('githubUser').value.trim();
  if(!user) { alert('Enter username'); return; }
  try {
    const r = await fetch(API + '/fetchGithub/' + encodeURIComponent(user));
    const data = await r.json();
    if(data.error){
      alert('Error from backend: ' + (data.error.message || JSON.stringify(data.error)));
      return;
    }
    const mapped = data.map(p => ({ name: p.name, desc: p.description, url: p.html_url }));
    document.getElementById('projectsBox').value = JSON.stringify(mapped, null, 2);
    alert('Fetched ' + mapped.length + ' repos. Edit then Save.');
  } catch(e){
    alert('Fetch failed: ' + e.message);
  }
}

// ----- PREVIEW helpers -----
function previewCertificates(){
  const raw = document.getElementById('certData').value || '[]';
  try {
    const items = JSON.parse(raw);
    showPreview(items.map(i => `<div class="card"><h4>${i.title}</h4><p>${i.platform||''}</p></div>`).join(''));
  } catch(e){ alert('Invalid JSON for certificates'); }
}

function previewInternships(){
  const raw = document.getElementById('internData').value || '[]';
  try {
    const items = JSON.parse(raw);
    showPreview(items.map(i => `<div class="card"><h4>${i.company}</h4><p>${i.role||''}</p><small>${i.duration||''}</small></div>`).join(''));
  } catch(e){ alert('Invalid JSON for internships'); }
}

function previewProjects(){
  const raw = document.getElementById('projectsBox').value || '[]';
  try {
    const items = JSON.parse(raw);
    showPreview(items.map(i => `<div class="card project-card"><div class="meta"><h4>${i.name}</h4><p>${i.desc||''}</p></div><a href="${i.url||'#'}" target="_blank">View</a></div>`).join(''));
  } catch(e){ alert('Invalid JSON for projects'); }
}

function showPreview(html){
  const area = document.getElementById('previewArea');
  area.innerHTML = html;
  area.scrollIntoView({behavior:'smooth'});
}
