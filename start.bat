@echo off
title Billiard Club CRM
echo ====================================================
echo        Zapusk Billiard Club CRM Pro
echo ====================================================
echo.
echo Zapusk API servera i Clienta...
echo.

start "Billiard CRM Server" cmd /k "cd /d %~dp0server && node server.js"
timeout /t 2 /nobreak >nul
start "Billiard CRM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo CRM uspeshno zapushena!
echo Otkroyte v brauzere: http://localhost:5173
echo.
pause
