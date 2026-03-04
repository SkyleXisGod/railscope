import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// W ES Modules musimy sami zdefiniować __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GTFS_PATH = path.join(__dirname, '..', 'gtfs', 'stops.txt');
const OUTPUT_PATH = path.join(__dirname, 'data', 'cacheStations.json');

function convertGtfsToCache() {
    try {
        console.log("📂 Otwieram plik:", GTFS_PATH);
        const data = fs.readFileSync(GTFS_PATH, 'utf8');
        const lines = data.split('\n');
        
        // Pomijamy nagłówek i czyścimy dane
        const stations = lines.slice(1)
            .filter(line => line.trim() !== '' && line.includes(',')) 
            .map(line => {
                const [id, name, lat, lon] = line.split(',');
                return {
                    id: id?.trim(),
                    name: name?.trim(),
                    lat: parseFloat(lat),
                    lon: parseFloat(lon)
                };
            });

        // Tworzymy folder data, jeśli go nie ma
        if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
            fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stations, null, 2));
        console.log(`✅ Sukces! Przetworzono ${stations.length} stacji.`);
    } catch (err) {
        console.error("❌ Błąd:", err.message);
    }
}

convertGtfsToCache();