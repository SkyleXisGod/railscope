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
const PLK_API_KEY = "bg1dOGfvZFyhQwsdLxUnX0InmHEEB7sx2962bwWtQd7OfZaP9H-fR5ShgUYyRYsGlqL4I3yczbTVY7BvOQnDCA";
const BASE_URL = "https://pdp-api.plk-sa.pl/api/v1";

let stations = [];

if (fs.existsSync(CACHE_FILE)) {
    stations = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    console.log(`✅ Załadowano ${stations.length} stacji z cacheStations.json`);
} else {
    console.error(`❌ NIE ZNALEZIONO PLIKU: ${CACHE_FILE}`);
}

app.get("/api/timetable/:id", async (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0]; 

    try {
        const response = await axios.get(`https://pdp-api.plk-sa.pl/api/v1/operations`, {
            headers: { 'X-API-Key': PLK_API_KEY },
            params: {
                stations: id,
                operatingDate: today
            }
        });
        res.json(response.data.trains || []);
    } catch (err) {
        res.status(500).json({ error: "Błąd PLK" });
    }
});

app.get("/api/admin/fix-cache", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/dictionaries/stations`, {
            headers: { 'X-API-Key': PLK_API_KEY },
            params: { pageSize: 5000 }
        });
        
        const plkStations = response.data.stations;
        const localStations = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
        
        const fixedStations = localStations.map(local => {
            const match = plkStations.find(plk => 
                plk.name.toLowerCase().trim() === local.name.toLowerCase().trim()
            );

            if (match) {
                return {
                    ...local,
                    id: match.id.toString(),
                    name: match.name
                };
            }
            return local;
        });

        fs.writeFileSync(CACHE_FILE, JSON.stringify(fixedStations, null, 2));
        
        stations = fixedStations; 
        
        res.json({ status: "Success", count: fixedStations.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/stations", (req, res) => {
    try {
        const data = fs.readFileSync(CACHE_FILE, "utf8");
        const currentStations = JSON.parse(data);
        res.json(currentStations);
    } catch (err) {
        res.status(500).json({ error: "Błąd odczytu bazy stacji" });
    }
});

app.listen(PORT, () => console.log(`🚀 Serwer na http://localhost:${PORT}`));

// Kacper Zagłoba i Mateusz Kuśmierski 4P