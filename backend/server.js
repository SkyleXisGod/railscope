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

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const PLK_API_KEY = process.env.PLK_API_KEY || "bg1dOGfvZFyhQwsdLxUnX0InmHEEB7sx2962bwWtQd7OfZaP9H-fR5ShgUYyRYsGlqL4I3yczbTVY7BvOQnDCA";
const BASE_URL = "https://pdp-api.plk-sa.pl/api/v1";
const plkHeaders = { 'X-API-Key': PLK_API_KEY };

let stations = [];
let trainInfoMap = new Map();
let categoryNames = {};

// --- MAPY PAMIĘCI (INDEXING) ---
const buildIndexes = () => {
    console.log("🛠️ Indeksowanie danych w pamięci RAM...");

    // 1. Indeksowanie Stacji
    if (fs.existsSync(STATIONS_CACHE)) {
        try {
            stations = JSON.parse(fs.readFileSync(STATIONS_CACHE, "utf8"));
            console.log(`✅ Zaindeksowano ${stations.length} stacji.`);
        } catch (e) { console.error("Błąd stacji:", e.message); }
    }

    // 2. Indeksowanie Kategorii
    if (fs.existsSync(CATEGORIES_CACHE)) {
        try {
            const catData = JSON.parse(fs.readFileSync(CATEGORIES_CACHE, "utf8"));
            // Poprawka pod Twoją strukturę: szukamy w .commercialCategories
            const list = catData.commercialCategories || (Array.isArray(catData) ? catData : []);
            list.forEach(c => {
                categoryNames[c.code] = c.name;
            });
            console.log("✅ Zaindeksowano słownik kategorii.");
        } catch (e) { console.error("Błąd kategorii:", e.message); }
    }

    // 3. Indeksowanie Rozkładów (Schedules)
    if (fs.existsSync(SCHEDULES_CACHE)) {
        try {
            const scheduleRaw = JSON.parse(fs.readFileSync(SCHEDULES_CACHE, "utf8"));
            // Poprawka pod Twoją strukturę: dane są w polu .routes
            const routes = scheduleRaw.routes || (Array.isArray(scheduleRaw) ? scheduleRaw : []);
            
            routes.forEach(s => {
                trainInfoMap.set(String(s.trainOrderId), {
                    name: s.name || "",
                    number: s.nationalNumber || s.trainNumber || "",
                    categorySymbol: s.commercialCategorySymbol || "REG"
                });
            });
            console.log(`🚀 System gotowy. Zaindeksowano ${trainInfoMap.size} pociągów.`);
        } catch (e) { console.error("Błąd rozkładów:", e.message); }
    }
};

// --- FUNKCJA POBIERANIA DANYCH ---
const downloadInitialData = async () => {
    console.log("📡 Inicjalizacja bazy danych RailScope...");

    try {
        if (!fs.existsSync(STATIONS_CACHE)) {
            console.log("📥 Pobieranie stacji...");
            const res = await axios.get(`${BASE_URL}/dictionaries/stations`, { headers: plkHeaders });
            fs.writeFileSync(STATIONS_CACHE, JSON.stringify(res.data, null, 2));
        }

        if (!fs.existsSync(CATEGORIES_CACHE)) {
            console.log("📥 Pobieranie kategorii...");
            const res = await axios.get(`${BASE_URL}/dictionaries/commercial-categories`, { headers: plkHeaders });
            fs.writeFileSync(CATEGORIES_CACHE, JSON.stringify(res.data, null, 2));
        }

        if (!fs.existsSync(SCHEDULES_CACHE)) {
            console.log("📥 Pobieranie rozkładu (routes)...");
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.get(`${BASE_URL}/schedules`, { 
                headers: plkHeaders, 
                params: { operatingDate: today, pageSize: 5000 } 
            });
            fs.writeFileSync(SCHEDULES_CACHE, JSON.stringify(res.data, null, 2));
        }

        buildIndexes();
    } catch (err) {
        console.error("❌ Krytyczny błąd pobierania danych:", err.message);
        // Próbuj indeksować to co już jest, jeśli pobieranie padło
        buildIndexes();
    }
};

downloadInitialData();

// --- ENDPOINTY ---

app.get("/api/timetable/:id", async (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0]; 
    try {
        const response = await axios.get(`${BASE_URL}/operations`, {
            headers: plkHeaders,
            params: { stations: id, operatingDate: today, withPlanned: true, pageSize: 1000 }
        });

        const rawTrains = response.data.trains || [];

        const enrichedTrains = rawTrains.map(t => {
            const staticInfo = trainInfoMap.get(String(t.trainOrderId)) || {};
            const catCode = staticInfo.categorySymbol || "REG";
            
            const stationsWithCoords = t.stations?.map(s => {
                const stationCoord = stations.find(st => String(st.id) === String(s.stationId));
                return {
                    ...s,
                    lat: stationCoord?.lat,
                    lon: stationCoord?.lon,
                    name: stationCoord?.name
                };
            });

            return {
                ...t,
                trainName: staticInfo.name || "",
                trainNumber: staticInfo.number || t.trainNumber || "",
                trainCategory: catCode,
                trainCategoryFull: categoryNames[catCode] || catCode,
                stations: stationsWithCoords
            };
        });

        res.json(enrichedTrains);
    } catch (err) { 
        console.error("Błąd PLK:", err.message);
        res.status(500).json({ error: "Błąd PLK" }); 
    }
});

app.get("/api/stations", (req, res) => res.json(stations));

// --- DIAGNOSTYKA (ZACHOWANA) ---
app.get("/api/test/all/health", async (req, res) => {
    try {
        const response = await axios.get(`https://pdp-api.plk-sa.pl/api/diagnostics/health`);
        res.json(response.data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [Reszta Twoich endpointów diagnostycznych 1-11...]
// Kopiuj je tutaj, jeśli ich potrzebujesz, ale najważniejszy jest powyższy kod.

app.listen(PORT, () => {
    console.log(`🚀 RailScope Backend na http://localhost:${PORT}`);
});