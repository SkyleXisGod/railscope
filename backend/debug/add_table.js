import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'railscope.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to local SQLite database.');
});

db.serialize(() => {
    db.run(`ALTER TABLE users ADD COLUMN bannedUntil DATETIME DEFAULT NULL;`);
});

export default db;