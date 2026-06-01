# 🚄 RailScope (Testing Branch)

RailScope to zaawansowana aplikacja webowa przeznaczona dla miłośników kolei, automatyki kolejowej oraz symulacji, oferująca m.in. dynamiczne mapy, statystyki pojazdów (Vessels), bazy danych stacji, rozbudowany profil użytkownika oraz dedykowaną strefę gier zręcznościowych (Tavern/Arcade) z pełnym systemem lokalizacji w 10 językach.

Ta gałąź (testing) służy do wdrażania i testowania nowych mechanik, systemów tłumaczeń oraz optymalizacji komponentów gier przed połączeniem z głównym wydaniem.

---

## 🛠️ Wymagania systemowe

Zanim przejdziesz do instalacji, upewnij się, że na Twoim komputerze zainstalowane są następujące narzędzia:

* Node.js: Wersja v18.x lub nowsza (zalecana wersja LTS).
* npm (instalowany automatycznie razem z Node.js) lub Yarn jako menedżer pakietów.
* Git: Do klonowania repozytorium i zarządzania gałęziami.
* Dowolny edytor kodu: Zalecany Visual Studio Code (VS Code).

---

## 🚀 Instalacja od ZERA (Krok po kroku)

### Krok 1: Klonowanie repozytorium
Otwórz terminal (np. Git Bash, CMD lub terminal w VS Code) i pobierz repozytorium, przechodząc od razu na odpowiednią gałąź testową:

git clone -b testing https://github.com/SkyleXisGod/railscope.git

# Wejdź do katalogu projektu
cd railscope

---

### Krok 2: Instalacja zależności (Pakietów)
W zależności od struktury projektu, zainstaluj wszystkie niezbędne biblioteki:

* Jeśli projekt posiada jeden wspólny plik pakietów w głównym folderze:
npm install

* Jeśli projekt jest podzielony na osobny folder dla frontendu i backendu:
# Instalacja dla Frontendu
cd client # lub 'frontend' / 'railscope' w zależności od struktury folderów
npm install

# Instalacja dla Backendu (jeśli występuje)
cd ../server # lub 'backend'
npm install

---

### Krok 3: Konfiguracja plików środowiskowych .env

Aplikacja do poprawnego działania wymaga zmiennych środowiskowych. W głównym folderze odpowiedniego modułu (w root projektu lub wewnątrz folderów client/server) utwórz plik o nazwie .env i uzupełnij go według poniższego wzorca:

#### Przykładowa konfiguracja dla Frontendu (React / Vite):
# Jeśli używasz Vite, zmienne muszą zaczynać się od VITE_. Jeśli używasz Create React App, od REACT_APP_.

VITE_API_URL=http://localhost:5000

# Konfiguracja bazy danych / Firebase (jeśli dotyczy)
VITE_FIREBASE_API_KEY=twoj_klucz_api
VITE_FIREBASE_AUTH_DOMAIN=railscope.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=railscope
VITE_FIREBASE_STORAGE_BUCKET=railscope.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=twoj_sender_id
VITE_FIREBASE_APP_ID=twoj_app_id

VITE_DEFAULT_LANGUAGE=PL

#### Przykładowa konfiguracja dla Serwera (Backend - jeśli występuje):
PORT=5000
MONGO_URI=twoj_link_do_bazy_danych_mongodb
JWT_SECRET=super_tajny_klucz_do_autoryzacji_tokenow

---

## 💻 Uruchomienie aplikacji

Po pomyślnej instalacji pakietów oraz konfiguracji pliku .env, możesz uruchomić projekt w trybie deweloperskim.

* Dla projektów opartych o Vite:
npm run dev
(Aplikacja będzie dostępna pod adresem: http://localhost:5173)

* Dla projektów opartych o Create React App:
npm start
(Aplikacja będzie dostępna pod adresem: http://localhost:3000)

* Uruchomienie Backendu (jeśli występuje):
# W osobnym oknie terminala w folderze serwera
npm run dev # lub node server.js / nodemon server.js

---

## 📂 Główne Funkcjonalności na branchu testing

1. System Lokalizacji Gier: Implementacja wielojęzyczności (10 języków) zorganizowana centralnie w głównym obiekcie translations i przekazywana dynamicznie do mini-gier za pomocą propsa t.
2. Moduł Gier Zręcznościowych (Tavern): Architektura komponentów takich jak BrakeGame.jsx pozwalająca na pełną izolację logiki rozgrywki od wybranego języka aplikacji.
3. Zarządzanie Stanem: Integracja z useAuth() w celu sprawdzania ustawień językowych użytkownika (user?.settings?.language) oraz weryfikacji statusu konta Premium do odblokowania zawartości strefy Arcade.

---

## ⚠️ Rozwiązywanie problemów (Troubleshooting)

* Błąd node_modules lub wersji Node: Jeśli napotkasz błędy podczas budowania projektu, usuń folder node_modules oraz plik package-lock.json, upewnij się, że używasz Node 18+, i uruchom ponownie npm install.
* Błąd braku zmiennych środowiskowych: Jeśli aplikacja się uruchamia, ale nie autoryzuje użytkowników lub sypie błędami API, upewnij się, że plik .env znajduje się w odpowiednim katalogu i nazwy zmiennych nie zawierają literówek.