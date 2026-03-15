import fs from 'fs';

const csv = fs.readFileSync('../gtfs/extended_stops.txt', 'utf8');
const lines = csv.split('\n').slice(1); 

const regionalStations = lines.map(line => {
    const parts = line.split(',');
    if (parts.length < 4) return null;
    return {
        id: parts[0].trim(),
        name: parts[1].trim(),
        lat: parseFloat(parts[2]),
        lon: parseFloat(parts[3])
    };
}).filter(s => s && s.id && !isNaN(s.lat) && !isNaN(s.lon));

fs.writeFileSync('data/regiocacheStations.json', JSON.stringify(regionalStations, null, 2));
console.log(`Gotowe! Zapisano ${regionalStations.length} stacji regionalnych do JSON.`);