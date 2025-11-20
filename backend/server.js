const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// --------------------- VALIDATE ENV VARS ---------------------
const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

for (const v of requiredEnv) {
  if (!process.env[v]) {
    console.error(`ERROR: Missing environment variable ${v}`);
    process.exit(1); // exit immediately if any key is missing
  }
}

// --------------------- FIREBASE INITIALIZATION ---------------------
// Ensure that in Render, FIREBASE_PRIVATE_KEY uses real line breaks
// Not literal \n
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
    console.error("Error saving profile:", err);
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save certificates
app.post("/saveCertificates", async (req, res) => {
  try {
    await db.collection("certificates").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    console.error("Error saving certificates:", err);
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save internships
app.post("/saveInternships", async (req, res) => {
  try {
    await db.collection("internships").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    console.error("Error saving internships:", err);
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Save projects
app.post("/saveProjects", async (req, res) => {
  try {
    await db.collection("projects").doc("list").set(req.body);
    res.send({ status: "success" });
  } catch (err) {
    console.error("Error saving projects:", err);
    res.status(500).send({ status: "error", error: err.message });
  }
});

// Auto import GitHub projects
app.get("/fetchGithub/:username", async (req, res) => {
  try {
    const url = `https://api.github.com/users/${req.params.username}/repos`;
    const response = await axios.get(url);
    res.send(response.data);
  } catch (err) {
    console.error("Error fetching GitHub repos:", err);
    res.status(500).send({ error: err.message });
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
