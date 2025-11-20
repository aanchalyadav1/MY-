const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

// --------------------- FIREBASE INITIALIZATION ---------------------
// Ensure FIREBASE_PRIVATE_KEY is set in Render with actual \n replaced by real newlines
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  }),
});

const db = admin.firestore();

// --------------------- ROUTES ---------------------

// Save profile data
app.post("/saveProfile", async (req, res) => {
  try {
    await db.collection("profile").doc("main").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save certificates
app.post("/saveCertificates", async (req, res) => {
  try {
    await db.collection("certificates").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save internships
app.post("/saveInternships", async (req, res) => {
  try {
    await db.collection("internships").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save projects
app.post("/saveProjects", async (req, res) => {
  try {
    await db.collection("projects").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Auto import GitHub projects
app.get("/fetchGithub/:username", async (req, res) => {
  try {
    const url = `https://api.github.com/users/${req.params.username}/repos`;
    const r = await axios.get(url);
    res.send(r.data);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// LinkedIn certificate scraper placeholder
app.get("/fetchLinkedIn/:id", async (req, res) => {
  res.send({
    message: "Scraping LinkedIn requires an external server like Puppeteer.",
  });
});

// --------------------- START SERVER ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
