function openSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

async function loadCertificates() {
  try {
    const doc = await db.collection("certificates").doc("list").get();
    const data = doc.exists ? doc.data().items : [];
    let html = "<h2 style='text-align:center'>Certificates</h2>";
    if (!data || data.length === 0) {
      html += '<p style="text-align:center;opacity:0.7">No certificates yet.</p>';
    } else {
      data.forEach(c => {
        html += `<div class='card'><h3>${c.title}</h3><p>${c.platform || ''}</p></div>`;
      });
    }
    document.getElementById("certificates").innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}

async function loadProjects() {
  try {
    const doc = await db.collection("projects").doc("list").get();
    const data = doc.exists ? doc.data().items : [];
    let html = "<h2 style='text-align:center'>Projects</h2>";
    if (!data || data.length === 0) {
      html += '<p style="text-align:center;opacity:0.7">No projects yet.</p>';
    } else {
      data.forEach(p => {
        html += `<div class='card'><h3>${p.name}</h3><p>${p.desc || ''}</p><a href='${p.url || "#"}' target='_blank'>View on GitHub</a></div>`;
      });
    }
    document.getElementById("projects").innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}

async function loadInternships() {
  try {
    const doc = await db.collection("internships").doc("list").get();
    const data = doc.exists ? doc.data().items : [];
    let html = "<h2 style='text-align:center'>Internships</h2>";
    if (!data || data.length === 0) {
      html += '<p style="text-align:center;opacity:0.7">No internships yet.</p>';
    } else {
      data.forEach(i => {
        html += `<div class='card'><h3>${i.company}</h3><p>${i.role || ''}</p><p>${i.duration || ''}</p></div>`;
      });
    }
    document.getElementById("internships").innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}

// initialize loads
window.addEventListener('load', () => {
  if (typeof db === 'undefined') {
    console.warn('Firebase DB not initialized. Did you include firebase.js?');
    return;
  }
  loadCertificates();
  loadProjects();
  loadInternships();
});
