import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const serverStartTime = Date.now();

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

app.get("/api/statistics", (req, res) => {
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
const FULL_STATIONS_CACHE = path.join(DATA_DIR, "regiocacheStations.json");

let stations = [];
let trainInfoMap = new Map(); 
let trainNumberMap = new Map(); 
let allTrainsList = []; 
let categoryNames = {};
let stationNamesDict = {};
let stationCoordsDict = {};
let trainToShapeMap = new Map();
let shapeCoordsMap = new Map();

const cleanNum = (n) => {
    if (!n) return "";
    return String(n).split('/')[0].replace(/\D/g, '');
};

const loadGTFS = () => {
    console.log("🛠️ Ładowanie danych GTFS...");

    const GTFS_DIR = path.join(__dirname, "..", "gtfs");
    const tripsPath = path.join(GTFS_DIR, "trips.txt");
    const shapesPath = path.join(GTFS_DIR, "shapes.txt");

    if (!fs.existsSync(tripsPath) || !fs.existsSync(shapesPath)) {
        console.error("❌ BŁĄD: Nie znaleziono plików GTFS w lokalizacji:", GTFS_DIR);
        return;
    }

    if (fs.existsSync(shapesPath)) {
        const lines = fs.readFileSync(shapesPath, "utf8").split("\n");
        const tempShapes = {};
        const headers = lines[0].split(",").map(h => h.trim());
        const idIdx = headers.indexOf("shape_id");
        const seqIdx = headers.indexOf("shape_pt_sequence");
        const latIdx = headers.indexOf("shape_pt_lat");
        const lonIdx = headers.indexOf("shape_pt_lon");

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(",");
            const id = cols[idIdx]?.trim();
            if (!id) continue;
            
            if (!tempShapes[id]) tempShapes[id] = [];
            tempShapes[id].push({
                lat: parseFloat(cols[latIdx]),
                lon: parseFloat(cols[lonIdx]),
                seq: parseInt(cols[seqIdx] || 0)
            });
        }

        for (const id in tempShapes) {
            tempShapes[id].sort((a, b) => a.seq - b.seq);
            shapeCoordsMap.set(id, tempShapes[id].map(p => [p.lat, p.lon]));
        }
        console.log(`✅ Kształty wczytane: ${shapeCoordsMap.size}`);
    }

    if (fs.existsSync(tripsPath)) {
        const lines = fs.readFileSync(tripsPath, "utf8").split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        const plkNumIdx = headers.indexOf("plk_train_number");
        const shortNameIdx = headers.indexOf("trip_short_name");
        const shapeIdIdx = headers.indexOf("shape_id");

        const bestShapes = new Map();
        
        const getVariants = (raw) => {
            if (!raw) return [];
            const cleanRaw = raw.trim();
            const variants = new Set();
            
            if (cleanRaw.includes('/')) {
                const parts = cleanRaw.split('/');
                const base = parts[0].replace(/\D/g, ''); 
                const suffix = parts[1].replace(/\D/g, ''); 
                
                if (base) variants.add(base);
                
                if (base && suffix) {
                    const prefixLength = base.length - suffix.length;
                    if (prefixLength > 0) {
                        variants.add(base.substring(0, prefixLength) + suffix);
                    }
                }
            } else {
                variants.add(cleanRaw.replace(/\D/g, ''));
            }
            return Array.from(variants).filter(Boolean);
        };

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(",");
            const rawNum = cols[plkNumIdx]?.trim();
            const shortName = cols[shortNameIdx]?.trim();
            const shapeId = cols[shapeIdIdx]?.trim();

            if (!shapeId) continue;

            const allVariants = [...getVariants(rawNum), ...getVariants(shortName)];

            allVariants.forEach(v => {
                if (!trainToShapeMap.has(v)) {
                    trainToShapeMap.set(v, new Set());
                }
                trainToShapeMap.get(v).add(shapeId);
            });
        }
        console.log(`✅ Powiązania tras wczytane: ${trainToShapeMap.size}`);
    }
};

const buildIndexes = () => {
    console.log("🛠️ Budowanie indeksów RailScope...");
    trainInfoMap.clear();
    trainNumberMap.clear();
    allTrainsList = [];
    stationNamesDict = {};
    stationCoordsDict = {};
    stations = []; 

    if (fs.existsSync(STATIONS_CACHE)) {
        try {
            const mainData = JSON.parse(fs.readFileSync(STATIONS_CACHE, "utf8"));
            const stationsArray = Array.isArray(mainData) ? mainData : (mainData.results || []);
            stationsArray.forEach(s => {
                stationNamesDict[String(s.id)] = s.name;
                stationCoordsDict[String(s.id)] = { lat: s.lat, lon: s.lon };
                stations.push({
                    id: s.id,
                    name: s.name,
                    lat: s.lat,
                    lon: s.lon,
                    isRegional: false 
                });
            });
            console.log(`📍 Stacje GŁÓWNE załadowane: ${stations.length}`);
        } catch (e) { console.error("Błąd głównego cache:", e); }
    }

    if (fs.existsSync(FULL_STATIONS_CACHE)) {
        try {
            let regCount = 0;
            const fullData = JSON.parse(fs.readFileSync(FULL_STATIONS_CACHE, "utf8"));
            fullData.forEach(s => {
                if (!stationNamesDict[String(s.id)]) {
                    stationNamesDict[String(s.id)] = s.name;
                    stationCoordsDict[String(s.id)] = { lat: s.lat, lon: s.lon };
                    stations.push({
                        id: s.id,
                        name: s.name,
                        lat: s.lat,
                        lon: s.lon,
                        isRegional: true 
                    });
                    regCount++;
                }
            });
            console.log(`📚 Stacje REGIONALNE (nowe) załadowane: ${regCount}`);
        } catch (e) { console.error("Błąd wczytywania pełnej bazy:", e); }
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
            console.log(`🚀 Indeks rozkładów gotowy. Pociągów w bazie: ${allTrainsList.length}`);
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

        loadGTFS();

        if (!fs.existsSync(FULL_STATIONS_CACHE)) {
            await fetchFullStationDatabase(); 
        } else {
            buildIndexes();
        }
    } catch (err) { 
        console.error("Błąd podczas startowego pobierania:", err.message);
        loadGTFS();
        buildIndexes(); 
    }
};

downloadInitialData().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend gotowy na http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Błąd krytyczny podczas startu serwera:", err);
});

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
        const regPrefixes = ["R", "RP", "RG", "RE", "AP", "Os", "OsP", "S", "K", "W", "KM", "WKD", "SKM", "A", "Z", "AZ", "KW", "KD", "Ł", "KA"];

        const enriched = rawTrains.map(t => {
            const opCleanNum = cleanNum(t.trainNumber);
            let staticInfo = trainInfoMap.get(String(t.trainOrderId)) || trainNumberMap.get(opCleanNum) || {};

            let catCode = (staticInfo.categorySymbol || t.trainCategory || "REG").toUpperCase();
            let finalCat = "REG"; 

            if (icTypes.includes(catCode)) {
                finalCat = catCode;
            } 
            else if (regPrefixes.some(p => catCode.startsWith(p)) || catCode.includes("REG") || catCode.includes("BUS") || catCode === "ZKA") {
                finalCat = "REG";
            }
            else if (["KSL", "KM", "KD", "PR"].includes(t.carrierCode)) { 
                finalCat = "REG";
            }

            let fallbackRelation = "Relacja nieznana";
            if (t.stations && t.stations.length > 1) {
                const first = t.stations[0].stationName;
                const last = t.stations[t.stations.length - 1].stationName;
                fallbackRelation = `${first} ➔ ${last}`;
            }

            return {
                ...t,
                stations: t.stations || [], 
                cleanNumber: opCleanNum,
                trainName: staticInfo.name || "",
                trainCategory: finalCat,
                relation: staticInfo.relation || fallbackRelation,
                displayNumber: staticInfo.number || t.trainNumber,
                route: staticInfo.route || []
            };
        });

        res.json(enriched);
    } catch (err) { res.status(500).json({ error: "Błąd PLK" }); }
});

app.get("/api/trains/search", (req, res) => {
    const { number, name, start, end, category, experimental } = req.query;

    const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN", "NJ"];
    const regPrefixes = ["R", "RP", "RG", "RE", "AP", "Os", "OsP", "S", "K", "W", "KM", "WKD", "SKM", "A", "Z", "AZ", "KW", "KD", "Ł", "KA"];
    
    let results = [...allTrainsList];
    
    if (experimental !== "true") {
        results = results.filter(t => 
            premiumCats.includes(t.categorySymbol)
        );
    }
    
    if (number) {
        const cNum = cleanNum(number);
        results = results.filter(t => cleanNum(t.number).includes(cNum));
    }

    if (name) {
        const cName = name.toLowerCase();
        results = results.filter(t => (t.name || "").toLowerCase().includes(cName));
    }

    if (category) {
        if (category === "REG") {
            results = results.filter(t => 
                !premiumCats.includes(t.categorySymbol) || 
                regPrefixes.some(p => t.categorySymbol.startsWith(p))
            );
        } else if (category === "BUS") {
            results = results.filter(t => 
                t.categorySymbol.includes("BUS") || t.categorySymbol === "ZKA"
            );
        } else {
            results = results.filter(t => t.categorySymbol === category);
        }
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
    uniqueResults.sort((a, b) => a.number.localeCompare(b.number));

    res.json(uniqueResults.slice(0, 50));
});

app.get("/api/trains/:id", (req, res) => {
    const { id } = req.params;
    const train = trainInfoMap.get(id);
    
    if (train) {
        const opNum = cleanNum(train.number);
        
        const possibleNumbers = [opNum];
        if (opNum.length === 5) {
            possibleNumbers.push(opNum.substring(0, 4));
            possibleNumbers.push(opNum.substring(0, 2) + opNum.substring(3)); 
        }
        
        let shapeIds = null;
        let matched = "";
        
        for (const n of possibleNumbers) {
            if (trainToShapeMap.has(n)) {
                shapeIds = trainToShapeMap.get(n);
                matched = n;
                break;
            }
        }

        let finalCoords = [];
        if (shapeIds) {
            const idsArr = Array.from(shapeIds);
            let shapes = idsArr.map(sid => shapeCoordsMap.get(sid)).filter(Boolean);
            
            if (shapes.length > 0) {
                shapes.sort((a, b) => b.length - a.length); 
                let chain = shapes.shift();
                
                while (shapes.length > 0) {
                    let chainStart = chain[0];
                    let chainEnd = chain[chain.length - 1];
                    
                    let bestMatchIdx = -1;
                    let bestDist = Infinity;
                    let appendTo = 'end';
                    let reverseShape = false;
                    
                    shapes.forEach((sh, idx) => {
                        let shStart = sh[0];
                        let shEnd = sh[sh.length - 1];
                        
                        let d1 = Math.hypot(chainEnd[0]-shStart[0], chainEnd[1]-shStart[1]);
                        if (d1 < bestDist) { bestDist = d1; bestMatchIdx = idx; appendTo = 'end'; reverseShape = false; }
                        
                        let d2 = Math.hypot(chainEnd[0]-shEnd[0], chainEnd[1]-shEnd[1]);
                        if (d2 < bestDist) { bestDist = d2; bestMatchIdx = idx; appendTo = 'end'; reverseShape = true; }
                        
                        let d3 = Math.hypot(chainStart[0]-shEnd[0], chainStart[1]-shEnd[1]);
                        if (d3 < bestDist) { bestDist = d3; bestMatchIdx = idx; appendTo = 'start'; reverseShape = false; }
                        
                        let d4 = Math.hypot(chainStart[0]-shStart[0], chainStart[1]-shStart[1]);
                        if (d4 < bestDist) { bestDist = d4; bestMatchIdx = idx; appendTo = 'start'; reverseShape = true; }
                    });
                    
                    if (bestMatchIdx !== -1) {
                        let match = shapes.splice(bestMatchIdx, 1)[0];
                        if (reverseShape) match.reverse();
                        if (appendTo === 'end') {
                            chain = chain.concat(match);
                        } else {
                            chain = match.concat(chain);
                        }
                    } else {
                        break;
                    }
                }
                finalCoords = chain;
            }
        }

        console.log(`Szukam pociągu: "${opNum}" | Próby: [${possibleNumbers.join(', ')}] | Wynik ShapeID: ${shapeIds ? Array.from(shapeIds).join(' + ') : 'Brak'}`);

        res.json({
            ...train,
            shapeCoords: finalCoords 
        });
    } else {
        res.status(404).json({ error: "Nie znaleziono pociągu" });
    }
});

app.get("/api/stations/:id", (req, res) => {
    const stationId = req.params.id;

    try {
        const stationsData = JSON.parse(fs.readFileSync(FULL_STATIONS_CACHE, "utf8"));
        const station = stationsData.find(s => String(s.id) === String(stationId));
        
        if (station) {
            res.json(station);
        } else {
            res.status(404).send("Station not found");
        }
    } catch (err) {
        res.status(500).send("Error reading stations cache");
    }
});

app.get("/api/stats", async (req, res) => {
    try {
        const trains = allTrainsList;
        const totalTrains = trains.length;
 
        const majorStations = ["465", "10", "1011"]; 
        let maxDelay = { value: 0, name: "Brak danych", number: "-" };
        let totalDelay = 0;
        let trainsWithDelayData = 0;

        try {
            const today = new Date().toISOString().split('T')[0];
            const opsRes = await axios.get(`${BASE_URL}/operations`, {
                headers: plkHeaders,
                params: { stations: majorStations.join(','), operatingDate: today, pageSize: 100 }
            });

            const liveTrains = opsRes.data.trains || [];
            liveTrains.forEach(t => {
                const currentDelay = Math.max(...(t.stations || []).map(s => s.delay || 0), 0);
                
                if (currentDelay > 0) {
                    totalDelay += currentDelay;
                    trainsWithDelayData++;
                }

                if (currentDelay > maxDelay.value) {
                    const staticInfo = trainNumberMap.get(cleanNum(t.trainNumber)) || {};
                    maxDelay = {
                        value: currentDelay,
                        name: staticInfo.name || t.trainCategory || "Pociąg",
                        number: t.trainNumber
                    };
                }
            });
        } catch (e) { console.error("Błąd pobierania live delay:", e.message); }

        const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN", "NJ"];
        const icCount = trains.filter(t => premiumCats.includes(t.categorySymbol)).length;
        
        const uniqueDestinations = new Set();
        trains.forEach(t => {
            if (t.route && t.route.length > 0) {
                uniqueDestinations.add(t.route[t.route.length - 1].name);
            }
        });

        const uptimeMs = Date.now() - serverStartTime;
        const hours = Math.floor((uptimeMs / (1000 * 60 * 60)));
        const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);

        res.json({
            system: {
                uptime: `${hours}h ${minutes}m`,
                apiRequests: plkApiRequestsCount,
                totalStations: Object.keys(stationNamesDict).length, 
                activeTrains: totalTrains
            },
            traffic: {
                punctuality: trainsWithDelayData > 0 ? `${(100 - (trainsWithDelayData/liveTrains.length*100)).toFixed(1)}%` : "98.5%",
                averageDelay: trainsWithDelayData > 0 ? `${Math.round(totalDelay / trainsWithDelayData)} min` : "~2 min",
                biggestDelay: maxDelay, 
                destinations: uniqueDestinations.size
            },
            distribution: {
                IC: icCount,
                REG: totalTrains - icCount,
                BUS: trains.filter(t => t.categorySymbol.includes("BUS") || t.categorySymbol === "ZKA").length
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Błąd serwera" });
    }
});