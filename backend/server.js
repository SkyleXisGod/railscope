import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import chalk from 'chalk';
import sqlite3 from 'sqlite3'; 
import bcrypt from 'bcrypt';   
import { log } from "console";
import net from 'net'; 
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import nodemailer from "nodemailer";
dotenv.config();

// 0. Log system with optional external log terminal

let logSocket = null;
const connectLogTerminal = () => {
    logSocket = net.connect({ port: 9123 }, () => {
        console.log(chalk.bgGray.white(' EXTERNAL ') + ' 🔗 Connected to external HTTP log window.');
    });

    logSocket.on('error', () => {
        console.error(chalk.bgRed.white(' ERR! LOG ') + ' 🔗 Error connecting to external HTTP log window. Turn on ' + chalk.cyan('window-log.js') + ' and restart ' + chalk.cyan('server.js') + '.');
        logSocket = null; 
    });
};
connectLogTerminal();

const logInfo = (emoji, text, num) => {
    const tag = chalk.bgBlue.white(' INFO LOG ');
    if (typeof num !== 'undefined') console.log(`${tag} ${emoji} ${text} : ${chalk.yellow(num)}`);
    else console.log(`${tag} ${emoji} ${text}`);
};

const logWarn = (emoji, text) => {
    const tag = chalk.bgYellow.black(' WARN LOG ');
    console.warn(`${tag} ${emoji} ${text}`);
};

const logSuccess = (emoji, text, num) => {
    const tag = chalk.bgGreen.black(' POSITIVE ');
    if (typeof num !== 'undefined') console.log(`${tag} ${emoji} ${text} : ${chalk.cyan(num)}`);
    else console.log(`${tag} ${emoji} ${text}`);
};

const logFeed = (emoji, text, data) => {
    const tag = chalk.bgMagenta.white(' FEED LOG ');
    if (data !== undefined) console.log(`${tag} ${emoji} ${text} ${chalk.gray(JSON.stringify(data))}`);
    else console.log(`${tag} ${emoji} ${text}`);
};

const logError = (emoji, text, err) => {
    const tag = chalk.bgRed.white(' ERR! LOG ');
    if (err) console.error(`${tag} ${emoji} ${text}`, err);
    else console.error(`${tag} ${emoji} ${text}`);
};

// 1. Database setup and connection

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const db = new sqlite3.Database('./railscope.db', (err) => {
    if (err) logError('❌', 'Database connection error:', err.message);
    else {
        logSuccess('✅', 'Connected to SQLite database.');
        logInfo('🛠️', ' Ensuring database tables exist...');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            avatar TEXT DEFAULT '',
            role TEXT DEFAULT 'USER'
        )`, (err) => {
            if (err) logError('❌', 'Error creating users table:', err.message);
        });
        
        db.run(`CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY,
            language TEXT DEFAULT 'PL',
            theme TEXT DEFAULT '#00ffd5',
            accent_color TEXT DEFAULT '#00ffd5',
            animations TEXT DEFAULT 'block',
            text_color TEXT DEFAULT '#FFFFFF',
            text_outline INTEGER DEFAULT 0,
            background_mode TEXT DEFAULT 'dark',
            map_theme TEXT DEFAULT 'dark',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) logError('❌', 'Error creating user_settings table:', err.message);
        });

        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (!err && columns) {
                const names = columns.map(c => c.name);
                if (!names.includes('role')) {
                    db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'");
                }
                if (!names.includes('avatar')) {
                    db.run("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''");
                }
                if (!names.includes('premiumDate')) {
                    db.run("ALTER TABLE users ADD COLUMN premiumDate TEXT DEFAULT NULL");
                }
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS mailbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            sender TEXT,
            subject TEXT,
            content TEXT,
            unread BOOLEAN DEFAULT 1,
            tag TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) logError('❌', 'Error creating mailbox table:', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            title TEXT,
            category TEXT,
            description TEXT,
            status TEXT DEFAULT 'Otwarty',
            adminReply TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            db.all("PRAGMA table_info(tickets)", (err, columns) => {
                if (!err && columns.length > 0) {
                    const hasAdminReply = columns.some(c => c.name === 'adminReply');
                    const hasUpdatedAt = columns.some(c => c.name === 'updatedAt');
                    
                    if (!hasAdminReply) {
                        db.run("ALTER TABLE tickets ADD COLUMN adminReply TEXT");
                    }
                    if (!hasUpdatedAt) {
                        db.run("ALTER TABLE tickets ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP");
                    }
                }
            });
        });

        // db.run(`ALTER TABLE mailbox ADD COLUMN folder TEXT DEFAULT 'inbox'`);

        // db.run(`ALTER TABLE mailbox ADD COLUMN deletedAt TEXT`);

        db.all("PRAGMA table_info(user_settings)", (err, columns) => {
            if (!err && columns) {
                const names = columns.map(c => c.name);
                if (!names.includes('language')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN language TEXT DEFAULT 'PL'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column language:', err.message);
                    });
                }
                if (!names.includes('theme')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN theme TEXT DEFAULT '#00ffd5'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column theme:', err.message);
                    });
                }
                if (!names.includes('accent_color')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN accent_color TEXT DEFAULT '#00ffd5'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column accent_color:', err.message);
                    });
                }
                if (!names.includes('animations')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN animations TEXT DEFAULT 'block'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column animations:', err.message);
                    });
                }
                if (!names.includes('text_color')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN text_color TEXT DEFAULT '#FFFFFF'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column text_color:', err.message);
                    });
                }
                if (!names.includes('text_outline')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN text_outline INTEGER DEFAULT 0", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column text_outline:', err.message);
                    });
                }
                if (!names.includes('background_mode')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN background_mode TEXT DEFAULT 'dark'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column background_mode:', err.message);
                    });
                }
                if (!names.includes('map_theme')) {
                    db.run("ALTER TABLE user_settings ADD COLUMN map_theme TEXT DEFAULT 'dark'", (err) => {
                        if (err && !err.message.includes('duplicate column name')) logError('❌', 'Error adding column map_theme:', err.message);
                    });
                }
            }
        });
    }
});

// 2. Express server and Socket.IO setup
const serverStartTime = Date.now();
const activeUsers = new Map();

let plkApiRequestsCount = 0;

axios.interceptors.request.use(config => {
    if (config.url && config.url.includes('plk-sa.pl')) {
        plkApiRequestsCount++;
    }
    return config;
});

setInterval(() => {
    db.run(`DELETE FROM mailbox WHERE folder = 'trash' AND datetime(deletedAt, '+12 hours') < datetime('now')`, function(err) {
        if (err) {
            console.error("❌ Błąd automatycznego opróżniania kosza maili:", err.message);
        } else if (this.changes > 0) {
            console.log(`🧹 [Kosz Mailbox] Automatycznie usunięto ${this.changes} wiadomości (starsze niż 12h).`);
        }
    });
}, 10 * 60 * 1000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const todosFilePath = path.join(__dirname, 'todos.json');
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});
app.use(cors());
app.use(express.json());

const broadcastOnlineStatus = () => {
    const onlineUserIds = Array.from(new Set(Array.from(activeUsers.values())
        .map(u => u.userId)
        .filter(id => id))); 

        logFeed('🟢', `Użytkownicy w sesji: ${onlineUserIds.length}.`);
    
    io.emit('users_status_update', onlineUserIds);
};

const activeUserSockets = new Map();

io.on('connection', (socket) => {

    socket.on('user_ident', (userData) => {
        if (userData && userData.id) {
            const userId = Number(userData.id);

            activeUsers.set(socket.id, {
                userId: userId,
                username: userData.username,
                role: userData.role
            });

            if (activeUserSockets.has(userId)) {
                const oldSocketId = activeUserSockets.get(userId);
                
                if (oldSocketId !== socket.id) {
                    // Powiadamiamy starą sesję
                    io.to(oldSocketId).emit('force_logout', { 
                        reason: 'Zalogowano się z innego urządzenia lub przeglądarki.' 
                    });
                    
                    logFeed('⚠️', `Wymuszono wylogowanie z poprzedniej sesji: Użytkownik ${userData.username} (ID: ${userId}).`);
                    
                    const oldSocket = io.sockets.sockets.get(oldSocketId);
                    if (oldSocket) {
                        oldSocket.disconnect(true);
                    }
                }
            }

            activeUserSockets.set(userId, socket.id);
            
            logFeed('🟢', `Sesja aktywna: Użytkownik ${userData.username} (ID: ${userId}) jest ONLINE.`);
                
            broadcastOnlineStatus();
        }
    });

    socket.on('get_chat_history', () => {
        const query = `
            SELECT 
                cm.id, 
                cm.user_id AS senderId, 
                cm.text, 
                cm.timestamp,
                u.username, 
                u.role 
            FROM chat_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            ORDER BY cm.id ASC 
            LIMIT 100
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error("❌ Błąd pobierania historii czatu z bazy:", err.message);
                return;
            }
            socket.emit('chat_history', rows);
        });
    });

    socket.on('send_message', (data) => {
        const { senderId, text } = data;
        
        if (!text || !text.trim() || !senderId) return;

        db.get(`SELECT username, role FROM users WHERE id = ?`, [senderId], (err, userRow) => {
            if (err || !userRow) {
                console.error("❌ Nie można zweryfikować użytkownika czatu o ID:", senderId);
                return;
            }

            const username = userRow.username;
            const role = userRow.role || 'USER';
            const timestamp = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
            const cleanText = text.trim();

            db.run(
                `INSERT INTO chat_messages (user_id, text, timestamp) VALUES (?, ?, ?)`,
                [senderId, cleanText, timestamp],
                function(insertErr) {
                    if (insertErr) {
                        db.run(
                            `INSERT INTO chat_messages (user_id, text) VALUES (?, ?)`,
                            [senderId, cleanText],
                            function(fallbackErr) {
                                if (fallbackErr) {
                                    console.error("❌ Krytyczny błąd zapisu w czacie:", fallbackErr.message);
                                    return;
                                }
                                io.emit('receive_message', {
                                    id: this.lastID,
                                    senderId,
                                    username,
                                    role,
                                    text: cleanText,
                                    timestamp
                                });
                            }
                        );
                        return;
                    }
                    
                    io.emit('receive_message', {
                        id: this.lastID,
                        senderId,
                        username,  
                        role,      
                        text: cleanText,
                        timestamp
                    });
                }
            );
        });
    });

    socket.on('disconnect', () => {
        const userSession = activeUsers.get(socket.id);
        
        if (userSession) {
            const userId = userSession.userId;
            logFeed('🔴', `Sesja zakończona: Użytkownik ${userSession.username} (ID: ${userId}) jest OFFLINE.`);

            activeUsers.delete(socket.id);

            if (activeUserSockets.get(userId) === socket.id) {
                activeUserSockets.delete(userId);
            }

            broadcastOnlineStatus();
        } else {
            logFeed('🔌', `Rozłączono niezidentyfikowanego klienta (Socket ID: ${socket.id})`);
        }
    });
});

// 4. API Endpoint for Message Handling

app.use((req, res, next) => {
    const inboundMsg = `➡️ HTTP ${req.method} ${req.originalUrl}`;
    
    if (logSocket) {
        logSocket.write(inboundMsg + '\n');
    }

    res.on('finish', () => {
        const outboundMsg = `⬅️ HTTP ${req.method} ${req.originalUrl} ${res.statusCode}`;
        if (logSocket) {
            logSocket.write(outboundMsg + '\n');
        }
    });
    next();
});

process.on('uncaughtException', (err) => {
    logError('💥', 'Uncaught Exception', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
    logError('💥', 'Unhandled Rejection', reason);
});

// 5. API endpoints for showing tickets by user 

app.get("/api/tickets/:userId", (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. API endpoints for creating tickets

app.post("/api/tickets", (req, res) => {
    const { userId, title, category, description } = req.body;
    db.run(
        `INSERT INTO tickets (userId, title, category, description, status) VALUES (?, ?, ?, ?, 'Otwarty')`,
        [userId, title, category, description],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, ticketId: this.lastID });
        }
    );
    logFeed('🎫', `Nowe zgłoszenie od użytkownika ID: ${userId} - ${title} [${category}]`);
});

// 7. API endpoints for admin to view all tickets

app.get("/api/admin/tickets", (req, res) => {
    db.all(`SELECT * FROM tickets ORDER BY createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 8. API endpoints for specific user mailbox, sending mailbox notifications, sending mailbox to another user and deleting mailboxes

app.get('/api/mailbox/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = "SELECT * FROM mailbox WHERE userId = ? ORDER BY createdAt DESC";
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Błąd bazy danych:', err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        res.json(rows);
    });
});

app.post("/api/mailbox", (req, res) => {
    let { to, userId, sender, subject, content, tag, folder } = req.body;

    // 1. Zabezpieczenie przed brakującymi polami (odporność na błąd 400)
    if (!subject) subject = "Powiadomienie systemowe";
    if (!content) content = "Treść powiadomienia została zaktualizowana przez system.";
    if (!sender) sender = "System";
    if (!tag) tag = "system";
    if (!folder) folder = "inbox";

    // Wspólna funkcja wykonująca zapis do bazy danych
    const insertMessage = (targetUserId) => {
        const query = `
            INSERT INTO mailbox (userId, sender, subject, content, unread, tag, folder) 
            VALUES (?, ?, ?, ?, 1, ?, ?)
        `;
        db.run(query, [targetUserId, sender, subject, content, tag, folder], function (err) {
            if (err) {
                console.error("❌ Błąd zapisu wiadomości w DB:", err.message);
                return res.status(500).json({ error: "Nie udało się zapisać powiadomienia w bazie danych." });
            }

            // Powiadomienie w czasie rzeczywistym przez Socket.io o nowej wiadomości
            if (typeof io !== 'undefined') {
                io.emit("mailbox_update", { userId: targetUserId });
            }

            return res.json({ success: true, message: "Powiadomienie dostarczone pomyślnie." });
        });
    };

    // Scenariusz A: Wywołanie z MailboxService (posiada bezpośrednio userId)
    if (userId) {
        return insertMessage(parseInt(userId));
    }

    // Scenariusz B: Wywołanie z formularza Mailbox.jsx (posiada nazwę użytkownika w polu 'to')
    if (to) {
        db.get("SELECT id FROM users WHERE username = ?", [to], (err, row) => {
            if (err || !row) {
                // Koło ratunkowe: jeśli 'to' jest ID przekazanym jako string (np. "33")
                if (!isNaN(to)) {
                    return insertMessage(parseInt(to));
                }
                return res.status(404).json({ error: "Nie znaleziono odbiorcy o podanej nazwie." });
            }
            return insertMessage(row.id);
        });
    } else {
        return res.status(400).json({ error: "Brak zdefiniowanego odbiorcy (wymagane pole 'to' lub 'userId')." });
    }
});

app.post('/api/mailbox/:id/delete', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT folder FROM mailbox WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Wiadomość nie istnieje." });

        if (row.folder === 'trash') {
            db.run(`DELETE FROM mailbox WHERE id = ?`, [id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, permanent: true });
            });
        } else {
            db.run(`UPDATE mailbox SET folder = 'trash', deletedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, permanent: false });
            });
        }
    });
});

// 9. API endpoint for sending a notification to a user (e.g., after admin replies to ticket)

app.post('/api/mailbox', (req, res) => {
    const { userId, sender, subject, content, tag, unread } = req.body;
    
    const sql = `INSERT INTO mailbox (userId, sender, subject, content, tag, unread, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))`;
    
    db.run(sql, [userId, sender, subject, content, tag, unread ? 1 : 0], function(err) {
        if (err) {
            console.error('Błąd zapisu do mailbox:', err);
            return res.status(500).json({ error: "Nie udało się zapisać wiadomości" });
        }
        res.status(201).json({ id: this.lastID, message: "Powiadomienie wysłane!" });
    });
    logFeed('🎫', `Wysłano powiadomienie w sprawie ticketu: ${userId} - ${subject} [${tag}]`);
});

// 10. API endpoint for marking a message as read

app.put('/api/mailbox/read/:id', (req, res) => {
    const { id } = req.params;

    const sql = `UPDATE mailbox SET unread = 0 WHERE id = ?`;

    db.run(sql, [id], function(err) {
        if (err) {
            console.error("Błąd podczas aktualizacji statusu wiadomości:", err.message);
            return res.status(500).json({ error: "Błąd bazy danych przy oznaczaniu jako przeczytane" });
        }
        
        res.json({ success: true, message: "Wiadomość została oznaczona jako przeczytana" });
    });
});

// 11. API endpoint for getting count of unread messages

app.get('/api/mailbox/:userId/unread-count', (req, res) => {
    const { userId } = req.params;
    db.get(`SELECT COUNT(*) as count FROM mailbox WHERE userId = ? AND unread = 1 AND folder = 'inbox'`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row ? row.count : 0 });
    });
});

// 12. API endpoints for admin to update ticket status, reply, and delete tickets

app.patch("/api/admin/tickets/:id", (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    db.run(`UPDATE tickets SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post("/api/admin/tickets/:id/reply", (req, res) => {
    const { id } = req.params;
    const { message, adminName } = req.body;
    
    const fullReply = `[${adminName}]: ${message}`;

    db.run(
        `UPDATE tickets SET adminReply = ?, status = 'W trakcie', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, 
        [fullReply, id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Odpowiedź wysłana" });
        }
    );

    logFeed('💬', `Admin ${adminName} odpowiedział na zgłoszenie ID: ${id} - ${message}`);
});

app.delete("/api/admin/tickets/:id", (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM tickets WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Pomyślnie usunięto zgłoszenie" });
    });
    
    logFeed('🗑️', `Zgłoszenie ID: ${id} zostało usunięte przez administratora.`);
});

// 13. API endpoint for admin to ban/unban users

app.post("/api/admin/update-user", (req, res) => {
    const { username, bannedUntil} = req.body;
    
    db.run(
        `UPDATE users SET bannedUntil = ? WHERE username = ?`,
        [bannedUntil, username],
        function(err) {
            if (err) {
                console.error("Błąd SQL:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );

    logFeed('⛔', `Użytkownik ${username} został zbanowany do ${bannedUntil ? bannedUntil : 'odwołania'}.`);
});

// 14. API endpoints for user authentication, login, register and profile management

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            logError('❌', `DB error during login for ${email}`, err.message || err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!user) {
            logWarn('⚠️', `Nieudana próba logowania: ${email} - użytkownik nie znaleziony`);
            return res.status(401).json({ error: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logWarn('⚠️', `Nieudana próba logowania: ${email} - niepoprawne hasło`);
            return res.status(401).json({ error: "Incorrect password" });
        }

        db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [user.id], (err, settings) => {
            if (err) logWarn('⚠️', 'Error fetching user settings:', err.message);
            const defaultSettings = { language: 'PL', theme: '#00ffd5', accent_color: '#00ffd5', animations: 'block', text_color: '#FFFFFF', text_outline: 0, background_mode: 'dark', map_theme: 'dark' };
            const userSettings = settings || defaultSettings;
            const { password, ...userSafeData } = user;
            if (!userSafeData.role) userSafeData.role = 'USER';
            logFeed('🔐', `Użytkownik (${userSafeData.username || '—'}) [ mail: ${userSafeData.email} ] zalogował się do systemu`);
            res.json({ user: { ...userSafeData, settings: userSettings } });

            // Sesja / Session / User / Użytkownik / Logowanie / Sesja na podstawie JSON
        });
    });
});

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        
        db.run(query, [username, email, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: "User with this email already exists." });
            }
            const userId = this.lastID;
            db.run(`INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`, [userId], (settingsErr) => {
                if (settingsErr) logError('❌', 'Error creating user settings:', settingsErr.message);
            });
            logFeed('🆕', `Utworzono konto: ${username || '—'} [ ${email} ]`);
            res.status(201).json({ message: "Account created successfully." });
        });
    } catch (error) {
        logError('❌', 'Registration error:', error);
        res.status(500).json({ error: "Server error during registration." });
    }
});

app.post('/api/update-profile', async (req, res) => {
    const { userId, username, email, currentPassword, newPassword, avatar } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing user identifier.' });

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const updates = [];
        const values = [];

        if (username && username !== user.username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email && email !== user.email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(avatar);
        }
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Provide current password to change password.' });
            }
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) return res.status(401).json({ error: 'Incorrect current password.' });
            const hashed = await bcrypt.hash(newPassword, 10);
            updates.push('password = ?');
            values.push(hashed);
        }

        if (updates.length === 0) {
            const { password, ...userSafeData } = user;
            return res.json({ user: { ...userSafeData } });
        }

        values.push(userId);
        db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(updateErr) {
            if (updateErr) {
                logError('❌', 'Error updating profile:', updateErr.message);
                return res.status(500).json({ error: 'Profile update error.' });
            }
            db.get(`SELECT * FROM users WHERE id = ?`, [userId], (selectErr, updatedUser) => {
                if (selectErr) return res.status(500).json({ error: 'Error reading user.' });
                const { password, ...userSafeData } = updatedUser;
                res.json({ user: { ...userSafeData } });
            });
        });
    });
});

// 15. API endpoint for saving user settings

app.post('/api/settings', (req, res) => {
    const { userId, language, theme, accentColor, animations, textColor, textOutline, backgroundMode, mapTheme } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "Missing user identifier" });
    }
    
    const sql = `INSERT OR REPLACE INTO user_settings (user_id, language, theme, accent_color, animations, text_color, text_outline, background_mode, map_theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [userId, language || 'PL', theme || '#00ffd5', accentColor || '#00ffd5', animations || 'block', textColor || '#FFFFFF', textOutline ? 1 : 0, backgroundMode || 'dark', mapTheme || 'dark'], (err) => {
        if (err) {
            logError('❌', 'Error saving settings:', err.message);
            return res.status(500).json({ error: "Save error: " + err.message });
        }
        res.json({ message: "Settings saved" });
    });
});

// 16. API endpoint for deleting account, upgrading user account to premium and cancelling premium subscription

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Account deleted" });
    });
});

app.post('/api/upgrade', (req, res) => {
    const { id, role } = req.body; 
    const premiumDate = role === 'PLUS' ? new Date().toISOString().split('T')[0] : null;
    db.run(`UPDATE users SET role = ?, premiumDate = ? WHERE id = ?`, [role, premiumDate, id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Role updated" });
    });
});

app.post('/api/cancel-premium', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing user identifier.' });
    }

    db.run(`UPDATE users SET role = 'USER', premiumDate = NULL WHERE id = ?`, [userId], function(err) {
        if (err) return res.status(500).json({ error: 'Error cancelling subscription.' });

        db.get(`SELECT * FROM users WHERE id = ?`, [userId], (selectErr, updatedUser) => {
            if (selectErr) return res.status(500).json({ error: 'Error reading user.' });
            const { password, ...userSafeData } = updatedUser;
            res.json({ user: { ...userSafeData } });
        });
    });
});

// 17. API endpoint for fetching PLK API usage statistics (number of requests made by this backend)

app.get("/api/statistics", (req, res) => {
    res.json({
        sessionRequests: plkApiRequestsCount,
        message: "PLK API does not provide a limit-check endpoint. Returning the number of requests made by this backend since last restart."
    });
});

// 18. Easter egg 

app.post('/api/secret-unlock', (req, res) => {
    const { userId, message } = req.body;
    
    logFeed('🐣',`Użytkownik ID: ${userId || 'Niezalogowany'} odblokował sekret: ${message || 'Brak wiadomości'}`);

    res.status(200).json({ success: true });
});

// 19. GTFS data loading and processing

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

const parseTimeString = (time) => {
    if (!time || time === "-" || time === "??:??") return null;
    const value = String(time).trim();
    const hhmmss = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;
    const match = value.match(hhmmss);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
            return hours * 60 + minutes;
        }
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return date.getHours() * 60 + date.getMinutes() + (date.getDate() - 1) * 1440;
    }
    return null;
};

const normalizeRouteTimes = (route) => {
    let lastAbs = -Infinity;
    return route.map((stop) => {
        const arr = parseTimeString(stop.arr);
        const dep = parseTimeString(stop.dep);
        let absArr = arr;
        let absDep = dep;

        if (absArr !== null) {
            while (absArr <= lastAbs) absArr += 1440;
            lastAbs = Math.max(lastAbs, absArr);
        }

        if (absDep !== null) {
            const base = Math.max(lastAbs, absArr !== null ? absArr : lastAbs);
            while (absDep <= base) absDep += 1440;
            lastAbs = Math.max(lastAbs, absDep);
        }

        return {
            ...stop,
            arrAbs: absArr,
            depAbs: absDep
        };
    });
};

const loadGTFS = () => {
    process.stdout.write('\x1Bc');
    logInfo('🛠️', ' Loading GTFS data...');

    const GTFS_DIR = path.join(__dirname, "..", "gtfs");
    const tripsPath = path.join(GTFS_DIR, "trips.txt");
    const shapesPath = path.join(GTFS_DIR, "shapes.txt");

    if (!fs.existsSync(tripsPath) || !fs.existsSync(shapesPath)) {
        logError('❌', `GTFS files not found at ${GTFS_DIR}`);
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
        logSuccess('✅', 'Shapes loaded', shapeCoordsMap.size);
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
        logSuccess('✅', 'Train->shape relations loaded', trainToShapeMap.size);
    }
};

// 20. Building in-memory indexes for stations, schedules, and categories

const buildIndexes = () => {
    logInfo('🛠️', ' Building RailScope indexes...');
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
            logSuccess('📍', 'Main stations loaded', stations.length);
            } catch (e) { logError('❌', 'Main stations cache error:', e); }
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
            logSuccess('📚', 'Regional stations (new) loaded', regCount);
        } catch (e) { logError('❌', 'Full stations DB load error:', e); }
    }

    if (fs.existsSync(CATEGORIES_CACHE)) {
        try {
            const data = JSON.parse(fs.readFileSync(CATEGORIES_CACHE, "utf8"));
            const list = data.commercialCategories || [];
            list.forEach(c => { categoryNames[c.code] = c.name; });
        } catch (e) { logError('❌', 'Categories load error:', e); }
    }

    if (fs.existsSync(SCHEDULES_CACHE)) {
        try {
            const data = JSON.parse(fs.readFileSync(SCHEDULES_CACHE, "utf8"));
            const routes = data.routes || [];
            
            routes.forEach(s => {
                const firstId = s.stations?.[0]?.stationId;
                const lastId = s.stations?.[s.stations.length - 1]?.stationId;
                
                const routeStops = normalizeRouteTimes((s.stations?.map(st => {
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
                }) || []));

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
            logSuccess('🚀', 'Schedules index ready', allTrainsList.length);
        } catch (e) { logError('❌', 'Schedules/index error:', e); }
    }
};

// 21. Initial data download and server startup constants and function

const PLK_API_KEY = process.env.PLK_API_KEY;
const BASE_URL = process.env.PLK_BASE_URL;
const plkHeaders = { 'X-API-Key': PLK_API_KEY };
const MAX_SHAPE_JOIN_DISTANCE = 0.25; 

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
        logError('❌', 'Error during initial data download:', err.message);
        loadGTFS();
        buildIndexes(); 
    }
};

downloadInitialData().then(() => {
    httpServer.listen(PORT, () => {
        logSuccess('🚀', `Backend ready at http://localhost:${PORT} (Express + WebSockets)`);
    });
}).catch(err => {
    logError('❌', 'Critical server start error:', err);
});

// 22. API endpoints for health check, stations list, timetable for a station, and train search

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: Math.floor((Date.now() - serverStartTime) / 1000) });
});

app.get("/api/stations", (req, res) => {
        res.json(stations)
    });

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
                relation: staticInfo.relation || "Relacja nieznana",
                displayNumber: staticInfo.number || t.trainNumber,
                route: staticInfo.route || []
            };
        }).filter(t => t.relation !== "Relacja nieznana")

        logFeed('📊', `Someone looked up station ID ${id}. Total trains: ${enriched.length}`);
        res.json(enriched);
    } catch (err) { logError('❌', 'PLK API error:', err.message); res.status(500).json({ error: "PLK API error" }); }
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

    logFeed('🔍', `Train search | Number: ${number || '-'} | Name: ${name || '-'} | Category: ${category || '-'} | Start: ${start || '-'} | End: ${end || '-'} | Experimental: ${experimental === "true" ? 'Yes' : 'No'} | Results: ${uniqueResults.length}`);
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
                    
                    if (bestMatchIdx === -1 || bestDist > MAX_SHAPE_JOIN_DISTANCE) {
                        if (bestMatchIdx !== -1) {
                            logWarn('⚠️', `Shape chain stopped: endpoint gap too large (${bestDist.toFixed(3)} deg)`);
                        }
                        break;
                    }

                    let match = shapes.splice(bestMatchIdx, 1)[0];
                    if (reverseShape) match.reverse();
                    if (appendTo === 'end') {
                        chain = chain.concat(match);
                    } else {
                        chain = match.concat(chain);
                    }
                }
                finalCoords = chain;
            }
        }
        
        
        logFeed('🔎', `Searching train ${opNum} | Attempts: [${possibleNumbers.join(', ')}] | ShapeIDs: ${shapeIds ? Array.from(shapeIds).join(' + ') : 'None'}`);

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
            logFeed('📍', `Station lookup: ID ${stationId} - ${station.name}`);
            res.json(station);
        } else {
            logError('❌', `Station ID ${stationId} not found in cache.`);
            res.status(404).send("Station not found");
        }
    } catch (err) {
        logError('❌', 'Error reading stations cache:', err.message);
        res.status(500).send("Error reading stations cache");
    }
});

// 23. API endpoints for admin user management and statistics
app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT id, username, email, role, avatar, premiumDate, bannedUntil FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

app.put("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, email, role, bannedUntil } = req.body;

    // Automatyczna bezpieczna migracja - dodaje kolumnę jeśli nie istnieje w railscope.db
    db.run("ALTER TABLE users ADD COLUMN bannedUntil TEXT", () => {
        // Ignorujemy błąd, jeśli kolumna już istnieje, i przechodzimy do aktualizacji
        
        const query = `
            UPDATE users 
            SET username = ?, email = ?, role = ?, bannedUntil = ? 
            WHERE id = ?
        `;
        
        db.run(query, [username, email, role, bannedUntil, id], function (err) {
            if (err) {
                console.error("❌ Błąd podczas aktualizacji użytkownika w DB:", err.message);
                return res.status(500).json({ error: "Błąd wewnętrzny bazy danych podczas zapisu." });
            }

            // Poinformuj system przez Socket.io o zmianie danych (opcjonalne, dla real-time)
            if (typeof io !== 'undefined') {
                io.emit("user_updated", { id: parseInt(id), username, role });
            }

            res.json({ 
                success: true, 
                message: "Dane użytkownika zostały pomyślnie zaktualizowane w bazie." 
            });
        });
    });
});

app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, email, role, bannedUntil } = req.body;


    const userUpdateQuery = "UPDATE users SET username = ?, email = ?, role = ?, bannedUntil = ? WHERE id = ?";
    const userParams = [username, email, role, bannedUntil, id];

    db.run(userUpdateQuery, userParams, function (err) {
        if (err) {
            console.error("❌ Błąd DB podczas aktualizacji użytkownika:", err.message);
            return res.status(500).json({ error: "Nie udało się zaktualizować danych użytkownika w bazie." });
        }

        const mailboxQuery = `
            INSERT INTO mailbox (userId, sender, subject, content, unread, folder, tag) 
            VALUES (?, 'System', ?, ?, 1, 'inbox', 'system')
        `;
        
        const subject = "Aktualizacja statusu konta";
        const content = `Twoje konto zostało zmodyfikowane przez administrację. Aktualna rola w systemie: ${role}.`;

        db.run(mailboxQuery, [id, subject, content], function (mailboxErr) {
            if (mailboxErr) {
                console.error("❌ Błąd DB podczas generowania maila systemowego:", mailboxErr.message);
                return res.status(200).json({ 
                    success: true, 
                    message: "Dane zaktualizowane, ale wystąpił problem z wysyłką powiadomienia do skrzynki." 
                });
            }

            if (typeof io !== 'undefined') {
                io.emit("mailbox_update", { userId: id });
                io.emit("user_updated", { id, role });
                console.log(`🔔 Wysłano powiadomienie socket dla użytkownika o ID: ${id}`);
            }

            res.json({ 
                success: true, 
                message: "Użytkownik został pomyślnie zaktualizowany, a powiadomienie trafiło do jego skrzynki!" 
            });
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const targetId = req.params.id;
    const { callerRole } = req.body;

    db.get(`SELECT role FROM users WHERE id = ?`, [targetId], (err, targetUser) => {
        if (!targetUser) return res.status(404).json({ error: "Nie znaleziono" });
        
        if (targetUser.role === 'ZARZADCA') return res.status(403).json({ error: "Zarządca jest nietykalny." });
        if (callerRole === 'ADMIN' && targetUser.role === 'ADMIN') return res.status(403).json({ error: "Brak uprawnień." });

        db.run(`DELETE FROM users WHERE id = ?`, [targetId], function(err) {
            if (err) return res.status(500).json({ error: "Błąd usuwania" });
            res.json({ message: "Usunięto pomyślnie" });
        });
    });
});

// 24. API endpoint for statistics

app.get("/api/stats", async (req, res) => {
    try {
        const trains = allTrainsList;
        const totalTrains = trains.length;
 
        const majorStations = ["60103", "30601", "80416", "38653", "5900"];
        let maxDelay = { value: 0, name: "Brak danych", number: "-" };
        let totalDelay = 0;
        let trainsWithDelayData = 0;

        let liveTrains = [];
        let totalLive = 0;
        const parseStationDelay = (station) => {
            if (!station) return 0;
            const candidates = [];
            if (typeof station.arrivalDelayMinutes === 'number') candidates.push(station.arrivalDelayMinutes);
            if (typeof station.departureDelayMinutes === 'number') candidates.push(station.departureDelayMinutes);
            if (typeof station.delay === 'number') candidates.push(station.delay);
            if (typeof station.delayMinutes === 'number') candidates.push(station.delayMinutes);
            if (typeof station.delayMinute === 'number') candidates.push(station.delayMinute);
            if (typeof station.arrivalDelayMinutes === 'string') {
                const parsed = parseInt(station.arrivalDelayMinutes, 10);
                if (!isNaN(parsed)) candidates.push(parsed);
            }
            if (typeof station.departureDelayMinutes === 'string') {
                const parsed = parseInt(station.departureDelayMinutes, 10);
                if (!isNaN(parsed)) candidates.push(parsed);
            }
            if (typeof station.delay === 'string') {
                const parsed = parseInt(station.delay, 10);
                if (!isNaN(parsed)) candidates.push(parsed);
            }
            if (typeof station.delayMinutes === 'string') {
                const parsed = parseInt(station.delayMinutes, 10);
                if (!isNaN(parsed)) candidates.push(parsed);
            }
            if (typeof station.delayMinute === 'string') {
                const parsed = parseInt(station.delayMinute, 10);
                if (!isNaN(parsed)) candidates.push(parsed);
            }

            const plannedArrival = station.plannedArrival || station.plannedArrivalTime || null;
            const actualArrival = station.actualArrival || null;
            if (!candidates.length && plannedArrival && actualArrival) {
                const planned = parseTimeString(plannedArrival);
                const actual = parseTimeString(actualArrival);
                if (planned !== null && actual !== null) {
                    candidates.push(actual - planned);
                }
            }

            const plannedDeparture = station.plannedDeparture || station.plannedDepartureTime || null;
            const actualDeparture = station.actualDeparture || null;
            if (!candidates.length && plannedDeparture && actualDeparture) {
                const planned = parseTimeString(plannedDeparture);
                const actual = parseTimeString(actualDeparture);
                if (planned !== null && actual !== null) {
                    candidates.push(actual - planned);
                }
            }

            return Math.max(0, ...candidates.filter(Number.isFinite));
        };
        const getTrainDelay = (train) => {
            return Math.max(...(train.stations || []).map(parseStationDelay), 0);
        };

        try {
            const today = new Date().toISOString().split('T')[0];
            const opsRes = await axios.get(`${BASE_URL}/operations`, {
                headers: plkHeaders,
                params: { stations: majorStations.join(','), operatingDate: today, withPlanned: true, pageSize: 1000 }
            });

            liveTrains = opsRes.data.trains || [];
            totalLive = liveTrains.length;
            liveTrains.forEach(t => {
                const currentDelay = getTrainDelay(t);
                if (currentDelay > 0) {
                    totalDelay += currentDelay;
                    trainsWithDelayData++;
                }

                if (currentDelay > maxDelay.value) {
                    const staticInfo = trainNumberMap.get(cleanNum(t.trainNumber)) || {};
                    maxDelay = {
                        value: currentDelay,
                        name: staticInfo.name || t.trainCategory || "Pociąg",
                        number: t.trainNumber || t.trainOrderId || 'N/A'
                    };
                }
            });
        } catch (e) { logWarn('⚠️', 'Live delay fetch error:', e.message); }

        const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN", "NJ"];
        const icCount = trains.filter(t => premiumCats.includes(t.categorySymbol)).length;
        const busCount = trains.filter(t => t.categorySymbol.includes("BUS") || t.categorySymbol === "ZKA").length;

        const routeTrains = trains.filter(t => t.route && t.route.length > 0);
        const uniqueDestinations = new Set();
        const uniqueOrigins = new Set();
        const categoryBreakdown = {};
        const routeLengths = [];
        const routeDurations = [];
        const startHourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }));

        routeTrains.forEach(t => {
            const firstStop = t.route[0];
            const lastStop = t.route[t.route.length - 1];
            const originName = firstStop.name || 'Unknown';
            const destName = lastStop.name || 'Unknown';

            uniqueOrigins.add(originName);
            uniqueDestinations.add(destName);

            const category = t.categorySymbol || 'OTHER';
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

            routeLengths.push(t.route.length);
            const routeTimes = t.route
                .map(stop => stop.depAbs ?? stop.arrAbs)
                .filter(time => Number.isFinite(time));
            const earliest = routeTimes.length ? Math.min(...routeTimes) : null;
            const latest = routeTimes.length ? Math.max(...routeTimes) : null;
            const firstStopTime = Number.isFinite(firstStop.depAbs)
                ? firstStop.depAbs
                : Number.isFinite(firstStop.arrAbs)
                    ? firstStop.arrAbs
                    : earliest;
            const lastStopTime = Number.isFinite(lastStop.arrAbs)
                ? lastStop.arrAbs
                : Number.isFinite(lastStop.depAbs)
                    ? lastStop.depAbs
                    : latest;

            let routeDuration = null;
            if (Number.isFinite(firstStopTime) && Number.isFinite(lastStopTime) && lastStopTime >= firstStopTime) {
                routeDuration = lastStopTime - firstStopTime;
            } else if (Number.isFinite(earliest) && Number.isFinite(latest) && latest >= earliest) {
                routeDuration = latest - earliest;
            }

            if (routeDuration !== null && routeDuration <= 2880) {
                routeDurations.push(routeDuration);
            }
            if (Number.isFinite(firstStopTime)) {
                const hourIndex = Math.floor((firstStopTime / 60) % 24);
                startHourCounts[hourIndex].count += 1;
            }
        });

        const sortedRouteLengths = [...routeLengths].sort((a, b) => a - b);
        const sortedDurations = [...routeDurations].sort((a, b) => a - b);
        const median = (arr) => {
            if (!arr.length) return 0;
            const mid = Math.floor(arr.length / 2);
            return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
        };

        const routeStopBuckets = [
            { label: '1-5', count: 0 },
            { label: '6-10', count: 0 },
            { label: '11-15', count: 0 },
            { label: '16-20', count: 0 },
            { label: '21+', count: 0 }
        ];
        routeLengths.forEach(len => {
            if (len <= 5) routeStopBuckets[0].count += 1;
            else if (len <= 10) routeStopBuckets[1].count += 1;
            else if (len <= 15) routeStopBuckets[2].count += 1;
            else if (len <= 20) routeStopBuckets[3].count += 1;
            else routeStopBuckets[4].count += 1;
        });

        const durationBuckets = [
            { label: '< 2h', count: 0 },
            { label: '2-4h', count: 0 },
            { label: '4-6h', count: 0 },
            { label: '6h+', count: 0 }
        ];
        routeDurations.forEach(value => {
            if (value < 120) durationBuckets[0].count += 1;
            else if (value < 240) durationBuckets[1].count += 1;
            else if (value < 360) durationBuckets[2].count += 1;
            else durationBuckets[3].count += 1;
        });

        const getTopCounts = (map, limit = 5) => {
            return Object.entries(map)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([name, count]) => ({ name, count }));
        };

        const destCountMap = {};
        routeTrains.forEach(t => {
            const destName = t.route[t.route.length - 1].name || 'Unknown';
            destCountMap[destName] = (destCountMap[destName] || 0) + 1;
        });

        const originCountMap = {};
        routeTrains.forEach(t => {
            const originName = t.route[0].name || 'Unknown';
            originCountMap[originName] = (originCountMap[originName] || 0) + 1;
        });

        const topDestinationList = getTopCounts(destCountMap, 5);
        const topOriginList = getTopCounts(originCountMap, 5);

        const delayBuckets = [
            { label: '0 min', count: 0 },
            { label: '1-5 min', count: 0 },
            { label: '6-15 min', count: 0 },
            { label: '16-30 min', count: 0 },
            { label: '30+ min', count: 0 }
        ];

        liveTrains.forEach(t => {
            const currentDelay = getTrainDelay(t);
            if (currentDelay <= 0) delayBuckets[0].count += 1;
            else if (currentDelay <= 5) delayBuckets[1].count += 1;
            else if (currentDelay <= 15) delayBuckets[2].count += 1;
            else if (currentDelay <= 30) delayBuckets[3].count += 1;
            else delayBuckets[4].count += 1;
        });

        const topDelayedTrains = liveTrains
            .map(t => ({
                number: t.trainNumber || t.trainOrderId || 'N/A',
                category: t.trainCategory || 'Unknown',
                delay: getTrainDelay(t)
            }))
            .filter(t => t.delay > 0)
            .sort((a, b) => b.delay - a.delay)
            .slice(0, 5);

        const uptimeMs = Date.now() - serverStartTime;
        const hours = Math.floor((uptimeMs / (1000 * 60 * 60)));
        const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);

        logFeed('📈', 'Statistics requested');
        res.json({
            system: {
                uptime: `${hours}h ${minutes}m`,
                serverStartTimestamp: new Date(serverStartTime).toISOString(),
                apiRequests: plkApiRequestsCount,
                totalStations: Object.keys(stationNamesDict).length,
                activeTrains: totalTrains
            },
            traffic: {
                punctuality: totalLive > 0 ? `${(100 - (trainsWithDelayData / totalLive * 100)).toFixed(1)}%` : '-',
                averageDelay: trainsWithDelayData > 0 ? `${Math.round(totalDelay / trainsWithDelayData)} min` : '-',
                biggestDelay: maxDelay,
                destinations: uniqueDestinations.size,
                origins: uniqueOrigins.size,
                liveDelayBuckets: delayBuckets
            },
            distribution: {
                IC: icCount,
                REG: totalTrains - icCount - busCount,
                BUS: busCount
            },
            categoryBreakdown,
            hourlyTraffic: startHourCounts,
            routeStats: {
                averageStops: routeLengths.length ? (routeLengths.reduce((sum, value) => sum + value, 0) / routeLengths.length).toFixed(1) : 0,
                medianStops: median(sortedRouteLengths),
                minStops: sortedRouteLengths[0] || 0,
                maxStops: sortedRouteLengths[sortedRouteLengths.length - 1] || 0,
                averageDuration: routeDurations.length ? Math.round(routeDurations.reduce((sum, value) => sum + value, 0) / routeDurations.length) : 0,
                durationBuckets,
                stopBuckets: routeStopBuckets
            },
            topDestinations: topDestinationList,
            topOrigins: topOriginList,
            topDelayedTrains
        });
    } catch (error) {
        logError('❌', 'Server error in /api/stats:', error.message || error);
        res.status(500).json({ error: "Server error" });
    }
});

// 25. API endpoints for user todo list

const readTodosFromFile = () => {
    if (!fs.existsSync(todosFilePath)) {
        const defaultTodos = [
            { id: 1, text: "--------------------------------", done: false },
        ];
        fs.writeFileSync(todosFilePath, JSON.stringify(defaultTodos, null, 2));
        return defaultTodos;
    }
    const data = fs.readFileSync(todosFilePath, 'utf8');
    return JSON.parse(data);
};

const writeTodosToFile = (todos) => {
    fs.writeFileSync(todosFilePath, JSON.stringify(todos, null, 2));
};

app.get('/api/todos', (req, res) => {
    try {
        const todos = readTodosFromFile();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: "Błąd odczytu pliku zadań" });
    }
});

app.post('/api/todos', (req, res) => {
    try {
        const { todos } = req.body;
        if (!Array.isArray(todos)) return res.status(400).json({ error: "Nieprawidłowy format danych" });
        
        writeTodosToFile(todos);
        res.json({ success: true, todos });
    } catch (err) {
        res.status(500).json({ error: "Błąd zapisu do pliku" });
    }
});

// 26. Email reset password

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Adres email jest wymagany" });

    db.get("SELECT id, username FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: "Błąd bazy danych" });
        if (!user) {
            return res.json({ success: true, message: "Jeśli email istnieje w systemie, wysłano link resetujący." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 15 * 60 * 1000; // 15 minut

        db.run("ALTER TABLE users ADD COLUMN resetToken TEXT", () => {});
        db.run("ALTER TABLE users ADD COLUMN resetExpires INTEGER", () => {});

        db.run(
            "UPDATE users SET resetToken = ?, resetExpires = ? WHERE id = ?",
            [token, expires, user.id],
            async (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "Błąd zapisu tokenu" });

                const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
                const mailOptions = {
                    from: `"RailScope System" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: '➡ Resetowanie hasła w systemie RailScope',
                    html: `
                        <div style="padding: 40px 20px; font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif;">
                            <div style="max-width: 520px; margin: 0 auto; background-color: #141822; border: 1px solid #2c3545; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                                
                                <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #2c3545; padding-bottom: 25px;">
                                    <span style="font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                                        Rail<span style="color: #00ffd5;">Scope</span>
                                    </span>
                                </div>

                                <div style="color: #ecf0f1; font-size: 15px; line-height: 1.6;">
                                    <p style="margin-top: 0; margin-bottom: 16px; font-size: 17px; color: #ffffff;">
                                        Witaj, <strong style="color: #00ffd5;">${user.username}</strong>!
                                    </p>
                                    <p style="color: #9ba9bf; margin-bottom: 24px;">
                                        Otrzymaliśmy zgłoszenie dotyczące resetowania hasła do Twojego konta w systemie RailScope. Jeśli to Ty wysłałeś tę prośbę, kliknij poniższy przycisk, aby bezpiecznie zdefiniować nowe dane logowania.
                                    </p>
                                    
                                    <div style="text-align: center; margin: 35px 0;">
                                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #00ffd5 0%, #00bfa5 100%); color: #0f121a; padding: 14px 32px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(0, 255, 213, 0.25); text-transform: uppercase;">
                                            Resetuj hasło
                                        </a>
                                    </div>

                                    <div style="background-color: rgba(44, 53, 69, 0.2); border-left: 3px solid #00ffd5; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                                        <p style="margin: 0; font-size: 13px; color: #9ba9bf; line-height: 1.5;">
                                            ⏱️ Ten link autoryzacyjny wygaśnie automatycznie za <strong style="color: #ffffff;">15 minut</strong>.<br>
                                            🔒 Jeżeli ta akcja nie była zainicjowana przez Ciebie, zignoruj tę wiadomość – Twoje aktualne hasło pozostanie całkowicie bezpieczne.
                                        </p>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid #2c3545; padding-top: 20px; text-align: center;">
                                    <p style="font-size: 11px; color: #526077; margin: 0; letter-spacing: 0.5px; line-height: 1.4;">
                                        Wiadomość została wygenerowana automatycznie przez moduł bezpieczeństwa RailScope.<br>
                                        Prosimy nie odpowiadać na tego maila.
                                    </p>
                                </div>

                            </div>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                    res.json({ success: true, message: "Jeśli email istnieje w systemie, wysłano link resetujący." });
                } catch (mailErr) {
                    console.error("Błąd wysyłki maila:", mailErr);
                    res.status(500).json({ error: "Błąd podczas wysyłania wiadomości e-mail" });
                }
            }
        );
    });
});

app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token oraz nowe hasło są wymagane." });
    }

    const currentTime = Date.now();

    db.get(
        "SELECT id FROM users WHERE resetToken = ? AND resetExpires > ?",
        [token, currentTime],
        async (err, user) => {
            if (err) return res.status(500).json({ error: "Błąd bazy danych" });
            if (!user) return res.status(400).json({ error: "Token jest nieprawidłowy lub wygasł." });

            try {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

                db.run(
                    "UPDATE users SET password = ?, resetToken = NULL, resetExpires = NULL WHERE id = ?",
                    [hashedPassword, user.id],
                    (updateErr) => {
                        if (updateErr) return res.status(500).json({ error: "Błąd podczas aktualizacji hasła" });
                        res.json({ success: true, message: "Hasło zostało pomyślnie zmienione. Możesz się zalogować." });
                    }
                );
            } catch (hashErr) {
                res.status(500).json({ error: "Błąd szyfrowania hasła" });
            }
        }
    );
});

// 27. THE END

/* Insert portal logo lol

.,-:;//;:=,
         . :H@@@MM@M#H/.,+%;,
      ,/X+ +M@@M@MM%=,-%HMMM@X/,
     -+@MM; $M@@MH+-,;XMMMM@MMMM@+-
    ;@M@@M- XM@X;. -+XXXXXHHH@M@M#@/.
  ,%MM@@MH ,@%=            .---=-=:=,.
  -@#@@@MX .,              -%HX$$%%%+;
 =-./@M@M$                  .;@MMMM@MM:
 X@/ -$MM/                    .+MM@@@M$
,@M@H: :@:                    . -X#@@@@-
,@@@MMX, .                    /H- ;@M@M=
.H@@@@M@+,                    %MM+..%#$.
 /MMMM@MMH/.                  XM@MH; -;
  /%+%$XHH@$=              , .H@@@@MX,
   .=--------.           -%H.,@@@@@MX,
   .%MM@@@HHHXX$$$%+- .:$MMX -M@@MM%.
     =XMMM@MM@MM#H;,-+HMM@M+ /MMMX=
       =%@M@M#@$-.=$@MM@@@M; %M%=
         ,:+$+-,/H#MMMMMMM@- -,
               =++%%%%+/:-.                   

*/