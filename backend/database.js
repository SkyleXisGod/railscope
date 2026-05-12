import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'railscope.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Błąd połączenia z bazą:', err.message);
    else console.log('Połączono z lokalną bazą SQLite.');
});

db.serialize(() => {
    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=SkyleX',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela ustawień
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        language TEXT DEFAULT 'PL',
        theme TEXT DEFAULT 'dark',
        animations_enabled BOOLEAN DEFAULT 1,
        accent_color TEXT DEFAULT '#00ffd5',
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

export default db;