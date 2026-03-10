import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

let plkApiRequestsCount = 0;

axios.interceptors.request.use(config => {
    if (config.url && config.url.includes('plk-sa.pl')) {
        plkApiRequestsCount++;
    }
    return config;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/stats", (req, res) => {
    res.json({
        sessionRequests: plkApiRequestsCount,
        message: "PLK API nie posiada własnego endpointu do sprawdzania limitów. Zwracamy liczbę zapytań wykonanych z Twojego backendu od jego ostatniego restartu."
    });
});

const PORT = 8080;
const DATA_DIR = path.join(__dirname, "data");
const STATIONS_CACHE = path.join(DATA_DIR, "cacheStations.json");
const CATEGORIES_CACHE = path.join(DATA_DIR, "cacheCategories.json");
const SCHEDULES_CACHE = path.join(DATA_DIR, "cacheSchedules.json");

let stations = [];
let trainInfoMap = new Map(); 
let trainNumberMap = new Map(); 
let allTrainsList = []; 
let categoryNames = {};
let stationNamesDict = {};
let stationCoordsDict = {};

const cleanNum = (n) => n ? String(n).replace(/\D/g, '').replace(/^0+/, '') : "";

const buildIndexes = () => {
    console.log("🛠️ Budowanie indeksów RailScope...");
    trainInfoMap.clear();
    trainNumberMap.clear();
    allTrainsList = [];
    stationNamesDict = {};
    stationCoordsDict = {};

    if (fs.existsSync(STATIONS_CACHE)) {
        try {
            stations = JSON.parse(fs.readFileSync(STATIONS_CACHE, "utf8"));
            stations.forEach(s => { 
                stationNamesDict[String(s.id)] = s.name; 
                stationCoordsDict[String(s.id)] = { lat: s.lat, lon: s.lon };
            });
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
                
                const routeStops = s.stations?.map(st => {
                    const plat = st.departurePlatform || st.arrivalPlatform || "";
                    const track = st.departureTrack || st.arrivalTrack || "";
                    const platformDisplay = (plat || track) 
                        ? `${plat ? 'P'+plat : ''}${plat && track ? '/' : ''}${track ? 'T'+track : ''}`
                        : "-";

                    const coords = stationCoordsDict[String(st.stationId)] || { lat: null, lon: null };

                    return {
                        id: st.stationId,
                        name: stationNamesDict[String(st.stationId)] || `Stacja ${st.stationId}`,
                        lat: coords.lat,
                        lon: coords.lon,
                        arr: st.arrivalTime || st.arrivalDepartureTime || "-",
                        dep: st.departureTime || st.arrivalDepartureTime || "-",
                        platform: platformDisplay
                    };
                }) || [];

                const rel = (firstId && lastId) 
                    ? `${stationNamesDict[String(firstId)] || '???'} ➔ ${stationNamesDict[String(lastId)] || '???'}`
                    : "Relacja nieznana";

                const info = {
                    trainOrderId: s.trainOrderId,
                    name: s.name || "",
                    number: s.nationalNumber || s.trainNumber || "",
                    categorySymbol: s.commercialCategorySymbol || "REG",
                    relation: rel,
                    route: routeStops
                };

                trainInfoMap.set(String(s.trainOrderId), info);
                allTrainsList.push(info);

                const cN = cleanNum(info.number);
                if (cN) {
                    if (!trainNumberMap.has(cN) || info.name) {
                        trainNumberMap.set(cN, info);
                    }
                }
            });
            console.log(`🚀 Indeks gotowy. Pociągów: ${allTrainsList.length}`);
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
    } catch (err) { buildIndexes(); }
};

downloadInitialData();

app.get("/api/stations", (req, res) => res.json(stations));

app.get("/api/timetable/:id", async (req, res) => {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0]; 
    try {
        const response = await axios.get(`${BASE_URL}/operations`, {
            headers: plkHeaders,
            params: { stations: id, operatingDate: today, withPlanned: true, pageSize: 2000 }
        });
        
        const rawTrains = response.data.trains || [];
        const icTypes = ["IC", "TLK", "EIP", "EIC", "EC", "EN", "NJ"];
        
        const regPrefixes = [
                            "R", "RP", "RG", "RE", "AP", "Os", "OsP", "S", "K", "W", "KM", "WKD", "SKM", "A", "Z", "AZ","KW", "KD", "Ł", "KA"
                            ];

        const enriched = rawTrains.map(t => {
        const opCleanNum = cleanNum(t.trainNumber);
        let staticInfo = trainInfoMap.get(String(t.trainOrderId)) || trainNumberMap.get(opCleanNum) || {};

        let catCode = (staticInfo.categorySymbol || t.trainCategory || "REG").toUpperCase();
        let finalCat = "REG"; 

        if (icTypes.includes(catCode)) {
            finalCat = catCode;
        } 
        else if (regPrefixes.some(p => catCode.startsWith(p)) || catCode.includes("REG") || catCode === "BUS") {
            finalCat = "REG";
        }
        else if (staticInfo.name && !catCode.includes("BUS")) {
            finalCat = "IC";
        }

            return {
                ...t,
                stations: t.stations || [], 
                cleanNumber: opCleanNum,
                trainName: staticInfo.name || "",
                trainCategory: finalCat,
                relation: staticInfo.relation || "Relacja nieznana",
                displayNumber: staticInfo.number || t.trainNumber,
                route: staticInfo.route || []
                
            };
        })
        .filter(t => t.relation !== "Relacja nieznana")
        .filter(t => [...icTypes, "REG"].includes(t.trainCategory)); 

        res.json(enriched);
    } catch (err) { res.status(500).json({ error: "Błąd PLK" }); }
});

app.get("/api/trains/search", (req, res) => {
    const { number, name, start, end, category, experimental } = req.query;
    const isExp = experimental === 'true';

    const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN"];
    const regPrefixes = ["R", "S", "K", "A", "W", "KM", "SKM", "WKD", "AP", "Os", "OsP"];
    
    let results = allTrainsList.filter(t => {
        const symbol = String(t.categorySymbol).toUpperCase();
        const isPremium = premiumCats.includes(symbol);
        const isReg = regPrefixes.some(p => symbol.startsWith(p)) || symbol.includes("REG");
        const isBus = symbol.includes("BUS") || symbol === "ZKA";

        if (!isExp && !isPremium) return false;
        if (isExp && !isPremium && !isReg && !isBus) return false;

        if (category) {
                if (category === "IC") {
                    if (symbol !== "IC") return false;
                } else if (category === "EIC"){
                    if (symbol !== "EIC") return false;
                } else if (category === "REG") {
                    if (!isReg) return false;
                } else if (category === "BUS") {
                    if (!isBus) return false;
                } else {
                    if (symbol !== category) return false;
                }
            }
            return true;
    });

    if (number) {
        const cNum = cleanNum(number);
        results = results.filter(t => cleanNum(t.number).includes(cNum));
    }
    if (name) {
        const cName = name.toLowerCase();
        results = results.filter(t => (t.name || "").toLowerCase().includes(cName));
    }

    if (start || end) {
        results = results.filter(t => {
            if (!t.route || t.route.length === 0) return false;
            const stopNames = t.route.map(r => r.name.toLowerCase());
            const startIndex = start ? stopNames.findIndex(sn => sn.includes(start.toLowerCase())) : -1;
            const endIndex = end ? stopNames.findIndex(sn => sn.includes(end.toLowerCase())) : -1;

            if (start && end) return startIndex !== -1 && endIndex !== -1 && startIndex < endIndex;
            if (start) return startIndex !== -1;
            if (end) return endIndex !== -1;
            return true;
        });
    }

    const uniqueResults = Array.from(new Map(results.map(item => [item.trainOrderId, item])).values());
    
    uniqueResults.sort((a, b) => {
        const aSymbol = a.categorySymbol.toUpperCase();
        const bSymbol = b.categorySymbol.toUpperCase();
        
        const aScore = premiumCats.includes(aSymbol) ? 0 : 1;
        const bScore = premiumCats.includes(bSymbol) ? 0 : 1;
        
        if (aScore !== bScore) return aScore - bScore;
        return a.number.localeCompare(b.number);
    });

    res.json(uniqueResults.slice(0, 50));
});

app.get("/api/trains/:id", (req, res) => {
    const { id } = req.params;
    const train = trainInfoMap.get(id);
    
    if (train) {
        res.json(train);
    } else {
        res.status(404).json({ error: "Nie znaleziono pociągu" });
    }
});

downloadInitialData().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend gotowy na http://localhost:${PORT}`);
        console.log(`Pociągów w pamięci: ${allTrainsList.length}`);
    });
}).catch(err => {
    console.error("Błąd krytyczny podczas startu serwera:", err);
});