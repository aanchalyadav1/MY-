const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

// Use environment variables instead of serviceAccount.json
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

// --------------------- SAVE PROFILE DATA ---------------------
app.post("/saveProfile", async (req, res) => {
  await db.collection("profile").doc("main").set(req.body);
  res.send({ status: "success" });
});

// --------------------- SAVE CERTIFICATES ---------------------
app.post("/saveCertificates", async (req, res) => {
  await db.collection("certificates").doc("list").set(req.body);
  res.send({ status: "success" });
});

// --------------------- SAVE INTERNSHIPS ---------------------
app.post("/saveInternships", async (req, res) => {
  await db.collection("internships").doc("list").set(req.body);
  res.send({ status: "success" });
});

// --------------------- SAVE PROJECTS ---------------------
app.post("/saveProjects", async (req, res) => {
  await db.collection("projects").doc("list").set(req.body);
  res.send({ status: "success" });
});

// --------------------- AUTO IMPORT GITHUB PROJECTS ---------------------
app.get("/fetchGithub/:username", async (req, res) => {
  try {
    const url = `https://api.github.com/users/${req.params.username}/repos`;
    const r = await axios.get(url);
    res.send(r.data);
  } catch (e) {
    res.send({ error: e.message });
  }
});

// --------------------- LINKEDIN CERTIFICATE SCRAPER ---------------------
app.get("/fetchLinkedIn/:id", async (req, res) => {
  res.send({
    message: "Scraping LinkedIn requires an external server like Puppeteer.",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
