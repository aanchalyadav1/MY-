const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// --------------------- FIREBASE INITIALIZATION ---------------------
let serviceAccount;

try {
  // Read the secret file path provided by Render
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT;
  serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase initialized successfully");
} catch (err) {
  console.error("❌ Firebase initialization failed:", err);
  process.exit(1);
}

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
