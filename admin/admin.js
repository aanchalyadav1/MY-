const API = "https://my-junc.onrender.com";

function saveCertificates() {
  const certData = document.getElementById('certData').value;
  fetch(API + "/saveCertificates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: JSON.parse(certData) })
  }).then(()=>alert('Saved certificates'));
}

async function fetchGithub() {
  const user = document.getElementById("githubUser").value;
  const r = await fetch(API + "/fetchGithub/" + user);
  const data = await r.json();

  document.getElementById('projectsBox').value = JSON.stringify(
    data.map(p => ({
      name: p.name,
      desc: p.description,
      url: p.html_url
    })), null, 2);
}

function saveProjects() {
  const projectsBox = document.getElementById('projectsBox').value;
  fetch(API + "/saveProjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: projectsBox
  }).then(()=>alert('Saved projects'));
}
