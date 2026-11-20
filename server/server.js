/**
 * ANKIT & SUJATA — Wedding Invitation Backend
 * -------------------------------------------
 * Serves the static frontend (public/) and exposes a small
 * REST API for RSVP submissions, stored in a local JSON file.
 *
 * Run locally:   npm install && npm start
 * Deploy:        works as-is on Render / Railway / Cyclic / Fly.io / a VPS.
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

// Path to the JSON file that stores RSVPs (acts as a lightweight DB)
const DATA_FILE = path.join(__dirname, "data", "rsvps.json");

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Serve the static frontend from ../public
app.use(express.static(path.join(__dirname, "..", "public")));

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readRSVPs() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw || "[]");
    } catch (err) {
        console.error("Failed to read RSVP data:", err);
        return [];
    }
}

function writeRSVPs(list) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

function isValidPayload(body) {
    const { name, phone, guests, attending } = body || {};
    if (!name || typeof name !== "string" || name.trim().length < 2) return false;
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) return false;
    if (!guests) return false;
    if (!["yes", "no"].includes(attending)) return false;
    return true;
}

// ---------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------

// POST /api/rsvp — submit a new RSVP
app.post("/api/rsvp", (req, res) => {
    const body = req.body;

    if (!isValidPayload(body)) {
        return res.status(400).json({
            message: "Please fill in your name, phone number, guest count, and response.",
        });
    }

    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: body.name.trim(),
        phone: body.phone.trim(),
        guests: body.guests,
        attending: body.attending,
        message: (body.message || "").trim(),
        submittedAt: new Date().toISOString(),
    };

    const rsvps = readRSVPs();
    rsvps.push(entry);
    writeRSVPs(rsvps);

    const reply =
        body.attending === "yes" ?
        "Thank you! Your presence will make our day even more special. 🙏" :
        "Thank you for letting us know — you'll be in our hearts. 🙏";

    res.status(201).json({ message: reply, id: entry.id });
});

// GET /api/rsvp — list all RSVPs (protect this in production!)
app.get("/api/rsvp", (req, res) => {
    const adminKey = req.query.key;
    if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(readRSVPs());
});

// Health check (useful for deployment platforms)
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback: send index.html for any unknown non-API route (nice for direct links)
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ---------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`💍 Krishna & Radha's wedding site running on port ${PORT}`);
});