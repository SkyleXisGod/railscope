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
const DATA_DIR = path.join(__dirname, "data");
const STATIONS_CACHE = path.join(DATA_DIR, "cacheStations.json");
const CATEGORIES_CACHE = path.join(DATA_DIR, "cacheCategories.json");
const SCHEDULES_CACHE = path.join(DATA_DIR, "cacheSchedules.json");

let stations = [];
let trainInfoMap = new Map(); 
let trainNumberMap = new Map(); 
let categoryNames = {};
let stationNamesDict = {};

// Pomocnik do czyszczenia numerów (usuwa zera z przodu i spacje)
const cleanNum = (n) => n ? String(n).trim().replace(/^0+/, '') : "";

const buildIndexes = () => {
    console.log("🛠️ Budowanie indeksów RailScope...");
    trainInfoMap.clear();
    trainNumberMap.clear();
    stationNamesDict = {};

    if (fs.existsSync(STATIONS_CACHE)) {
        try {
            stations = JSON.parse(fs.readFileSync(STATIONS_CACHE, "utf8"));
            stations.forEach(s => { stationNamesDict[String(s.id)] = s.name; });
        } catch (e) { console.error("Błąd stacji:", e); }
    }

    if (fs.existsSync(CATEGORIES_CACHE)) {
        try {
            const data = JSON.parse(fs.readFileSync(CATEGORIES_CACHE, "utf8"));
            const list = data.commercialCategories || [];
            list.forEach(c => { categoryNames[c.code] = c.name; });
        } catch (e) { console.error("Błąd kategorii:", e); }
    }

    if (fs.existsSync(SCHEDULES_CACHE)) {
        try {
            const data = JSON.parse(fs.readFileSync(SCHEDULES_CACHE, "utf8"));
            const routes = data.routes || [];
            
            routes.forEach(s => {
                const firstId = s.stations?.[0]?.stationId;
                const lastId = s.stations?.[s.stations.length - 1]?.stationId;

                const info = {
                    name: s.name || "",
                    number: s.nationalNumber || s.trainNumber || "",
                    categorySymbol: s.commercialCategorySymbol || "REG",
                    relation: (firstId && lastId) 
                        ? `${stationNamesDict[String(firstId)] || '???'} — ${stationNamesDict[String(lastId)] || '???'}`
                        : "Relacja nieznana"
                };

                // Indeksowanie po unikalnym ID zamówienia
                trainInfoMap.set(String(s.trainOrderId), info);

                // Indeksowanie po wyczyszczonym numerze (np. "8107")
                const cN = cleanNum(info.number);
                if (cN) {
                    // Priorytet dla pociągów z nazwą (np. IC Rybak)
                    if (!trainNumberMap.has(cN) || info.name) {
                        trainNumberMap.set(cN, info);
                    }
                }
            });
            console.log(`🚀 Indeks gotowy. Pociągów: ${trainInfoMap.size}`);
        } catch (e) { console.error("Błąd rozkładów:", e); }
    }
};

const PLK_API_KEY = process.env.PLK_API_KEY || "bg1dOGfvZFyhQwsdLxUnX0InmHEEB7sx2962bwWtQd7OfZaP9H-fR5ShgUYyRYsGlqL4I3yczbTVY7BvOQnDCA";
const BASE_URL = "https://pdp-api.plk-sa.pl/api/v1";
const plkHeaders = { 'X-API-Key': PLK_API_KEY };

const downloadInitialData = async () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    try {
        if (!fs.existsSync(STATIONS_CACHE)) {
            const res = await axios.get(`${BASE_URL}/dictionaries/stations`, { headers: plkHeaders });
            fs.writeFileSync(STATIONS_CACHE, JSON.stringify(res.data, null, 2));
        }
        if (!fs.existsSync(CATEGORIES_CACHE)) {
            const res = await axios.get(`${BASE_URL}/dictionaries/commercial-categories`, { headers: plkHeaders });
            fs.writeFileSync(CATEGORIES_CACHE, JSON.stringify(res.data, null, 2));
        }
        if (!fs.existsSync(SCHEDULES_CACHE)) {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.get(`${BASE_URL}/schedules`, { 
                headers: plkHeaders, 
                params: { operatingDate: today, pageSize: 5000 } 
            });
            fs.writeFileSync(SCHEDULES_CACHE, JSON.stringify(res.data, null, 2));
        }
        buildIndexes();
    } catch (err) { 
        console.error("Błąd pobierania:", err.message);
        buildIndexes(); 
    }
};

downloadInitialData();

app.get("/api/timetable/:id", async (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0]; 
    try {
        const response = await axios.get(`${BASE_URL}/operations`, {
            headers: plkHeaders,
            params: { stations: id, operatingDate: today, withPlanned: true, pageSize: 1000 }
        });
        
        const rawTrains = response.data.trains || [];
        const enriched = rawTrains.map(t => {
            const cN = cleanNum(t.trainNumber);
            // Próba dopasowania: najpierw TrainOrderId, potem wyczyszczony numer
            const staticInfo = trainInfoMap.get(String(t.trainOrderId)) || trainNumberMap.get(cN) || {};

            // Logika kategorii: jeśli w rozkładzie mamy IC/EIP itp., używamy tego. 
            // Ignorujemy "BUS" z API operacyjnego, jeśli statyczne mówi co innego.
            const catCode = staticInfo.categorySymbol || t.trainCategory || "REG";

            return {
                ...t,
                trainName: staticInfo.name || "",
                trainCategory: catCode,
                trainCategoryFull: categoryNames[catCode] || catCode,
                relation: staticInfo.relation || "Relacja nieznana",
                // Zwracamy numer z rozkładu, jeśli go mamy
                displayNumber: staticInfo.number || t.trainNumber 
            };
        });
        res.json(enriched);
    } catch (err) { res.status(500).json({ error: "Błąd PLK" }); }
});

app.get("/api/stations", (req, res) => {
    if (stations.length === 0 && fs.existsSync(STATIONS_CACHE)) {
        stations = JSON.parse(fs.readFileSync(STATIONS_CACHE, "utf8"));
    }
    res.json(stations);
});

app.listen(PORT, () => console.log(`🚀 Backend na http://localhost:${PORT}`));