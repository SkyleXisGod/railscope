@echo off
echo ===================================================
echo   Uruchamianie Railscope IDE Dashboard...
echo ===================================================

:: Otwiera Windows Terminal, dzieli go na panele (Split) i odpala w nich procesy
start wt -M -d C:\Users\kaper\railscope\backend cmd /k "title LOG_WINDOW && node log-window.js" ; split-pane -H -d C:\Users\kaper\railscope\backend cmd /k "title SERVER_BACKEND && node server.js" ; split-pane -V -d C:\Users\kaper\railscope\frontend cmd /k "title FRONTEND_VITE && npm run dev"

timeout /t 3

:: Otwarcie projektu w Operze GX
start http://localhost:5173

echo ===================================================
echo   Wszystko gotowe! Okna podzielone automatycznie.
echo ===================================================
timeout /t 2