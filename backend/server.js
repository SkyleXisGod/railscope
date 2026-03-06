import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const CACHE_FILE = path.join(__dirname, "data", "cacheStations.json");
const PLK_API_KEY = process.env.PLK_API_KEY || "bg1dOGfvZFyhQwsdLxUnX0InmHEEB7sx2962bwWtQd7OfZaP9H-fR5ShgUYyRYsGlqL4I3yczbTVY7BvOQnDCA";
const BASE_URL = "https://pdp-api.plk-sa.pl/api/v1";

// Definicja nagłówków dla wszystkich testów
const plkHeaders = { 'X-API-Key': PLK_API_KEY };

let stations = [];
if (fs.existsSync(CACHE_FILE)) {
    stations = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    console.log(`✅ Załadowano ${stations.length} stacji`);
}

// --- PRODUKCYJNE ENDPOINTY ---

app.get("/api/timetable/:id", async (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0]; 
    try {
        const response = await axios.get(`${BASE_URL}/operations`, {
            headers: plkHeaders,
            params: { stations: id, operatingDate: today, withPlanned: true, pageSize: 1000 }
        });
        res.json(response.data.trains || []);
    } catch (err) { res.status(500).json({ error: "Błąd PLK" }); }
});

app.get("/api/stations", (req, res) => {
    res.json(stations);
});

// --- KOMPLETNY ZESTAW DIAGNOSTYCZNY (WSZYSTKIE ENDPOINTY Z DOKUMENTACJI) ---

// 1. ROZKŁADY PLANOWE (Schedules)
app.get("/api/test/all/schedules", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/schedules`, { 
            headers: plkHeaders, params: req.query 
        });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 2. REALIZACJA (Operations)
app.get("/api/test/all/operations", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/operations`, { 
            headers: plkHeaders, params: { withPlanned: true, ...req.query } 
        });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 3. UTRUDNIENIA (Disruptions)
app.get("/api/test/all/disruptions", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/disruptions`, { 
            headers: plkHeaders, params: req.query 
        });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 4. TRASA KONKRETNEGO POCIĄGU (Wykonanie - Real Time)
app.get("/api/test/all/operations/train/:sid/:oid/:date", async (req, res) => {
    try {
        const { sid, oid, date } = req.params;
        const response = await axios.get(`${BASE_URL}/operations/train/${sid}/${oid}/${date}`, { headers: plkHeaders });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 5. TRASA KONKRETNEGO POCIĄGU (Plan - Schedule)
app.get("/api/test/all/schedules/route/:sid/:oid", async (req, res) => {
    try {
        const { sid, oid } = req.params;
        const response = await axios.get(`${BASE_URL}/schedules/route/${sid}/${oid}`, { headers: plkHeaders });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 6. LISTA TRAS NA DZIEŃ
app.get("/api/test/all/schedules/routes/:date", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/schedules/routes/${req.params.date}`, { headers: plkHeaders });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 7. STATYSTYKI OPERACYJNE
app.get("/api/test/all/stats", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/operations/statistics`, { 
            headers: plkHeaders, params: { date: req.query.date || new Date().toISOString().split('T')[0] } 
        });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 8. WERSJA DANYCH
app.get("/api/test/all/data-version", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/data-version`, { headers: plkHeaders });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 9. SŁOWNIKI (Dynamiczne: stations, carriers, stop-types, commercial-categories)
app.get("/api/test/all/dict/:type", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/dictionaries/${req.params.type}`, { 
            headers: plkHeaders, params: req.query 
        });
        res.json(response.data);
    } catch (err) { res.status(500).json(err.response?.data || err.message); }
});

// 10. POLA (Struktura JSON - nie wymaga klucza)
app.get("/api/test/all/fields/:type", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/fields/${req.params.type}`);
        res.json(response.data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11. DIAGNOSTYKA SYSTEMOWA
app.get("/api/test/all/health", async (req, res) => {
    try {
        const response = await axios.get(`https://pdp-api.plk-sa.pl/api/diagnostics/health`);
        res.json(response.data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`🚀 RailScope Backend na http://localhost:${PORT}`));

// Kacper Zagłoba i Mateusz Kuśmierski 4P