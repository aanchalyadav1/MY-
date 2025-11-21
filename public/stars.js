// stars.js — FINAL VERSION (less stars + meteor shower)

// Number of stars
const STAR_COUNT = 60;

// Star container
const starContainer = document.createElement("div");
starContainer.id = "star-field";
document.body.appendChild(starContainer);

// ------------------------
// Create stars
// ------------------------
for (let i = 0; i < STAR_COUNT; i++) {
  const star = document.createElement("div");
  star.className = "star";

  star.style.left = Math.random() * 100 + "vw";
  star.style.top = Math.random() * 100 + "vh";
  star.style.animationDuration = (2 + Math.random() * 3) + "s";
  star.style.opacity = 0.5 + Math.random() * 0.5;

  starContainer.appendChild(star);
}


// ------------------------
// Meteor Shower
// ------------------------
function createMeteor() {
  const meteor = document.createElement("div");
  meteor.className = "meteor";

  meteor.style.left = Math.random() * 90 + "vw";
  meteor.style.top = Math.random() * 10 + "vh";

  document.body.appendChild(meteor);

  setTimeout(() => meteor.remove(), 2000);
}

// Random meteor timing (4–8 sec)
setInterval(() => {
  createMeteor();
}, Math.random() * (8000 - 4000) + 4000);
