import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import db from './database.js';

const app = express();
app.use(express.json());
app.use(cors());

// --- REJESTRACJA ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [username, email, hashedPassword], function(err) {
        if (err) return res.status(400).json({ error: "Użytkownik już istnieje" });
        
        // Tworzenie domyślnych ustawień dla nowego usera
        db.run(`INSERT INTO user_settings (user_id) VALUES (?)`, [this.lastID]);
        res.json({ message: "Zarejestrowano pomyślnie", userId: this.lastID });
    });
});

// --- LOGOWANIE ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Błędne dane logowania" });
        }
        
        // Pobierz ustawienia użytkownika
        db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [user.id], (err, settings) => {
            res.json({ user, settings });
        });
    });
});

// --- AKTUALIZACJA USTAWIEŃ ---
app.post('/api/settings', (req, res) => {
    const { userId, language, theme, accentColor } = req.body;
    const sql = `UPDATE user_settings SET language = ?, theme = ?, accent_color = ? WHERE user_id = ?`;
    
    db.run(sql, [language, theme, accentColor, userId], (err) => {
        if (err) return res.status(500).json({ error: "Błąd zapisu" });
        res.json({ message: "Ustawienia zapisane" });
    });
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Serwer RailScope śmiga na porcie ${PORT}`));