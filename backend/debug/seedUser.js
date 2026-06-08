import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite = sqlite3.verbose();

const dbPath = path.resolve(__dirname, 'railscope.db');
const db = new sqlite.Database(dbPath, (err) => {
    if (err) return console.error('Błąd połączenia z bazą:', err.message);
    console.log('🔌 Połączono z bazą danych SQLite (ESM).');
});

const USERS_COUNT = 5392; 

const prefixes = ['Hipper', 'Neon', 'Alpha', 'Bravo', 'Cyber', 'Mega', 'Turbo', 'Shadow', 'Quantum', 'Iron', 'Golden', 'Silver', 'Rusty', 'Speedy', 'Sonic', 'Cosmic', 'Stellar', 'Pixel', 'Crypto', 'Dread', 'Captain', 'Maverick'];
const nouns = ['Duck', 'Train', 'Wagon', 'Conductor', 'Track', 'Boiler', 'Signal', 'Driver', 'Rider', 'Pirate', 'Falcon', 'Raptor', 'Ghost', 'Knight', 'Wolf', 'Fox', 'Bear', 'Eagle', 'Titan', 'Cyborg'];

const dummyPasswordHash = '$2b$10$ExX2Xm1X2Xm1X2Xm1X2Xm.O7e6S7i3N8e1R2a3I4l5S6c7o8p9e.';

// Przyjmujemy index (i) z pętli, aby zagwarantować unikalność
function generateUser(index) {
    const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(10 + Math.random() * 90); // Krótki losowy los
    
    // Dodanie `index` na końcu loginu i maila daje 100% gwarancji unikalności w tej paczce
    const username = `${pref}${noun}${randomNum}${index}`;
    const email = `${pref.toLowerCase()}.${noun.toLowerCase()}${index}@mail.com`;
    
    const role = Math.random() < 0.25 ? 'PLUS' : 'USER'; 

    return { username, email, role };
}

db.serialize(() => {
    const query = `
        INSERT INTO users (username, email, password, role) 
        VALUES (?, ?, ?, ?)
    `;

    const stmt = db.prepare(query, (err) => {
        if (err) {
            console.error('❌ Błąd struktury tabeli. Sprawdź nazwy kolumn w bazie!', err.message);
            process.exit(1);
        }
    });

    console.log(`⏳ Przygotowywanie transakcji dla ${USERS_COUNT} użytkowników...`);
    
    db.run("BEGIN TRANSACTION;");

    for (let i = 0; i < USERS_COUNT; i++) {
        // Przekazujemy aktualny numer iteracji 'i'
        const u = generateUser(i);
        stmt.run(u.username, u.email, dummyPasswordHash, u.role);
    }

    stmt.finalize();

    db.run("COMMIT;", (err) => {
        if (err) {
            console.error('❌ Błąd podczas zapisu (COMMIT):', err.message);
        } else {
            console.log(`🚀 SUKCES! Baza została pomyślnie zasypana liczbą ${USERS_COUNT} użytkowników typu USER/PLUS.`);
        }
        db.close();
    });
});