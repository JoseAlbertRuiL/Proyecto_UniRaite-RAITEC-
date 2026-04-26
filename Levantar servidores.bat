@echo off
title UNIRAITE - Levantar Servidores

echo [1/3] Iniciando BACKEND (Node.js + Prisma)...
start "UNIRAITE Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/3] Iniciando FRONTEND (Expo)...
start "UNIRAITE Frontend" cmd /k "npx expo start -c"

timeout /t 2 /nobreak >nul

echo [3/3] Iniciando DATABASE (Prisma)...
start "UNIRAITE DATABASE" cmd /k "cd backend && npx prisma studio"

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