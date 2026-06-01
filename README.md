# 🚄 RailScope (Testing Branch)

RailScope to zaawansowana aplikacja webowa oparta na React i Vite, przeznaczona dla miłośników kolei, automatyki kolejowej oraz symulacji. Oferuje m.in. dynamiczne mapy, statystyki pojazdów, bazy danych stacji, system autoryzacji Supabase oraz dedykowaną strefę gier zręcznościowych (Tavern/Arcade) z pełnym systemem lokalizacji w 10 językach.

Ta gałąź (testing) służy do wdrażania i testowania nowych mechanik, systemów tłumaczeń oraz optymalizacji komponentów gier przed połączeniem z głównym wydaniem.

---

## 🛠️ Wymagania systemowe

Zanim przejdziesz do instalacji, upewnij się, że na Twoim komputerze zainstalowane są następujące narzędzia:

* Node.js: Wersja v18.x lub nowsza (zalecana wersja LTS).
* npm (instalowany automatycznie razem z Node.js).
* Git: Do klonowania repozytorium z GitHub.

---

## 🚀 Instalacja od ZERA (Krok po kroku)

### Krok 1: Klonowanie repozytorium
Otwórz terminal (np. Git Bash, CMD lub terminal wbudowany w VS Code) i pobierz repozytorium, przechodząc od razu na odpowiednią gałąź testową:

git clone -b testing https://github.com/SkyleXisGod/railscope.git

# Wejdź do katalogu projektu
cd railscope

---

### Krok 2: Instalacja zależności (Pakietów)
Wszystkie pakiety instalujemy w głównym katalogu projektu, gdzie znajduje się plik package.json:

npm install

---

### Krok 3: Konfiguracja plików środowiskowych .env

Projekt wykorzystuje środowisko uruchomieniowe Vite, dlatego zmienne deweloperskie muszą posiadać odpowiednie prefiksy. W głównym folderze projektu (obok pliku vite.config.js) utwórz plik o nazwie:
.env

Następnie uzupełnij go Twoimi customowymi kluczami oraz danymi dostępowymi Supabase:

# Customowa konfiguracja API Kolejowego (PLK)
PLK_API_URL=twoj_url_do_api
PLK_API_KEY=twoj_token_autoryzacji_plk

# Konfiguracja Supabase (Autoryzacja i Baza danych)
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj_publiczny_anon_key_supabase

---

## 💻 Uruchomienie aplikacji

Po pomyślnej instalacji pakietów oraz konfiguracji pliku .env, możesz uruchomić serwer deweloperski Vite:

npm run dev

Aplikacja zostanie skompilowana i będzie dostępna w przeglądarce pod domyślnym adresem:
http://localhost:5173

---

## 📂 Struktura Projektu (Główne foldery)

Zgodnie z architekturą repozytorium, kluczowe elementy znajdują się w katalogu src/:
* src/components/ – Wspólne elementy interfejsu oraz widoki systemowe (np. GamesPage.jsx).
* src/context/ – Warstwa logiczna aplikacji (np. AuthContext.jsx zarządzający sesją użytkownika z Supabase).
* src/games/ – Dedykowany katalog zawierający pliki mini-gier zręcznościowych (w tym BrakeGame.jsx).
* src/constants/ – Pliki konfiguracyjne, w tym system lokalizacji tłumaczeń translations.js.

---

## 📂 Główne Funkcjonalności na branchu testing

1. Kompleksowa Lokalizacja (10 języków): Dynamiczne tłumaczenie całego interfejsu gier. Komponenty gier (np. BrakeGame.jsx) przyjmują gotowy obiekt językowy t z poziomu GamesPage.jsx, bazując na user?.settings?.language.
2. Integracja z Supabase: System rejestracji, logowania oraz sprawdzania statusu premium konta użytkownika w czasie rzeczywistym.
3. Optymalizacja Wydajności: Wykorzystanie Vite do błyskawicznego Hot Module Replacement (HMR) podczas prac deweloperskich nad mechaniką gier.

---

## ⚠️ Rozwiązywanie problemów (Troubleshooting)

* Błąd usuwania pamięci podręcznej (node_modules): Jeśli po instalacji nowych gier lub zmianie brancha występują błędy kompilacji, usuń folder node_modules oraz plik package-lock.json, a następnie wywołaj ponownie:
  npm install
* Brak tłumaczeń lub błędny stan użytkownika: Upewnij się, że obiekt użytkownika w Supabase posiada w bazie zdefiniowane pole settings.language (domyślnie ustawiane na 'PL').