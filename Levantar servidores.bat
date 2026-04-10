@echo off
title UNIRAITE - Levantar Servidores

echo [1/2] Iniciando BACKEND (Node.js + Prisma)...
start "UNIRAITE Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Iniciando FRONTEND (Expo)...
start "UNIRAITE Frontend" cmd /k "npx expo start -c"

echo.
echo ========================================
echo    ¡SERVIDORES INICIADOS!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: Escanea el QR con Expo Go
echo.
echo Cierra las ventanas para detener los servidores
echo ========================================
echo.

pause