import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));

dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = 8080;
const GTFS_PATH = "../gtfs/stops.txt";
const CACHE_FILE = "./data/cacheStations.json";

let stations = [];

/*
=====================================
GTFS LOADER
=====================================
*/

function loadGtfs() {
  return new Promise((resolve, reject) => {
    const tempStations = [];

    fs.createReadStream(GTFS_PATH)
      .pipe(csv())
      .on("data", (row) => {
        if (!row.stop_lat || !row.stop_lon) return;

        tempStations.push({
          id: row.stop_id,
          name: row.stop_name,
          lat: parseFloat(row.stop_lat),
          lon: parseFloat(row.stop_lon)
        });
      })
      .on("end", () => {
        stations = tempStations;
        console.log("Załadowano GTFS stacji:", stations.length);
        resolve();
      })
      .on("error", reject);
  });
}

/*
=====================================
CACHE FILE HELPERS
=====================================
*/

function saveCache() {
  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify(stations, null, 2)
  );

  console.log("Cache zapisany:", CACHE_FILE);
}

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return [];

  return JSON.parse(
    fs.readFileSync(CACHE_FILE, "utf8")
  );
}

/*
=====================================
API
=====================================
*/

app.get("/api/stations", (req, res) => {
  try {
    res.json(loadCache());
  } catch {
    res.status(500).json({ error: "Cache read error" });
  }
});

app.get("/api/generate-cache", (req, res) => {
  try {
    saveCache();
    res.json({
      status: "Cache generated",
      count: stations.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
=====================================
STARTUP
=====================================
*/

async function startServer() {
  await loadGtfs();
  saveCache();

  app.listen(PORT, () => {
    console.log("Backend działa na http://localhost:" + PORT);
  });
}

startServer();

app.listen(PORT, () => {
  console.log("Backend działa na http://localhost:" + PORT);
});