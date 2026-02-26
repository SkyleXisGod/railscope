import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const CACHE_FILE = "./data/stationsCache.json";

/*
=====================================
CACHE HELPERS
=====================================
*/
function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return [];
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

/*
=====================================
OSM GEOCODER (DWORCE KOLEJOWE)
=====================================
*/
async function geocodeStation(name) {
  try {
    const res = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: { q: `${name} PKP railway station`, format: "json", limit: 1 },
        headers: { "User-Agent": "railscope-school-project" }
      }
    );
    if (!res.data.length) return null;
    return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
  } catch {
    return null;
  }
}

/*
=====================================
CACHE GENERATOR (POC – NAJPIERW 10 POCIĄGÓW)
=====================================
*/
app.get("/api/generate-cache", async (req, res) => {
  try {
    const opsRes = await axios.get(`${process.env.BASE_URL}/operations`, {
      headers: { "X-API-Key": process.env.API_KEY },
      params: { carriersInclude: "IC", pageSize: 10 } // <-- tylko 10 dla testu
    });

    const trains = opsRes.data.data.routes || [];
    const stationsMap = new Map();

    for (const train of trains) {
      for (const st of train.stations) {
        if (!stationsMap.has(st.stationId)) {
          stationsMap.set(st.stationId, st.stationName || `Station ${st.stationId}`);
        }
      }
    }

    const result = [];
    for (const [id, name] of stationsMap.entries()) {
      const coords = await geocodeStation(name);
      if (!coords) continue;
      result.push({ id, name, ...coords });
      console.log(`Geocoded: ${name} -> ${result.length} stations so far..`);
    }

    saveCache(result);
    res.json({ status: "Cache generated", count: result.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*
=====================================
API STATIONS (FRONTEND USE)
=====================================
*/
app.get("/api/stations", (req, res) => {
  try {
    const data = loadCache();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Błąd odczytu cache" });
  }
});

app.listen(PORT, () => {
  console.log("Backend działa na http://localhost:" + PORT);
});