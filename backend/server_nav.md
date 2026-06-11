# 🗺️ RAILSCOPE BACKEND - SERVER.JS NAVIGATION MAP

Plik indeksowy ułatwiający nawigację po strukturze głównego serwera aplikacji (`server.js`). 
Sekcje ułożone chronologicznie od góry do dołu pliku.

---

## 🏗️ 0. CONFIGURATION & CORE LOGGING
* **`// 0. Optional external log terminal`**
  - Inicjalizacja połączenia TCP z zewnętrznym oknem logów (`net.connect` na porcie `9123`).
  - Obsługa błędów połączenia w przypadku braku odpalonego `window-log.js`.
* **`// 1. Cool looking log system`**
  - Definicje customowych funkcji logujących z użyciem `chalk`:
    - `logInfo(emoji, text, num)`
    - `logSuccess(emoji, text)`
    - `logWarn(emoji, text)`
    - `logFeed(emoji, text)`

## 🛣️ MIDDLEWARE & ROUTING BASE
* **`// [Sekcja Środkowa - Express Config]`**
  - Inicjalizacja aplikacji Express, CORS, parsery JSON (`express.json()`).
  - Podłączenie zmiennych środowiskowych (`dotenv.config()`).
  - Konfiguracja bazy danych SQLite3 oraz systemów pomocniczych (Nodemailer, Crypto, Bcrypt).

## 🔑 AUTHENTICATION & USERS API
* **`// [Sekcja API: Auth / Mailbox]`**
  - Endpointy rejestracji, logowania i walidacji siły haseł.
  - Generowanie tokenów resetowania haseł i wysyłka maili zabezpieczających.
  - Integracja z systemem powiadomień wewnętrznych (skrypty powiązane z `MailboxService.js`).

## 🔌 WEBSOCKET CORE (SOCKET.IO)
* **`// [Sekcja Real-time Engine]`**
  - Blok `io.on('connection', (socket) => ...)` obsługujący architekturę czasu rzeczywistego.
  - Mapowanie aktywnych sesji użytkowników (`activeUsers`, `activeUserSockets`).
  - Funkcja `broadcastOnlineStatus()` synchronizująca stany UI z frontendem.
  - **`socket.on('disconnect')`**: Zabezpieczony flagą `isShuttingDown` tryb cichy podczas wyłączania.

## 🧪 EASTER EGGS & SYSTEM SEQUENCERS
* **`// 27. THE END`**
  - Zakomentowane logo Aperture Science generowane w ASCII art.
* **`// 56. CMD: Post-exit sequence`**
  - Funkcja `runShutdownSequence(mode)` - pełen credit roll piosenki *"Still Alive"* z Portala (efekt maszyny do pisania przez `process.stdout.write`).
  - Funkcja `handlePostSequence(mode)` - systemowe wygaszanie portów oraz czyszczenie środowiska:
    - **`exit`**: Odliczenie 3s, ubicie procesów Node i zamknięcie całego Windows Terminal (`wt.exe`).
    - **`restart`**: Wyczyszczenie środowiska i ponowne odpalenie pliku `railscope_startup.bat`.
* **`// 57. CMD: Exit and restart phrase listener`**
  - `process.stdin` nasłuchujący na komendy wpisywane bezpośrednio w konsoli serwera (`exit` / `restart`).
  - Obsługa sygnału `SIGINT` (Ctrl+C).

---
*Ostatnia aktualizacja mapy: Czerwiec 2026*