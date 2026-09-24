@echo off
title Food Delivery Application Launcher
echo ===================================================
echo     Launching Food Delivery Full Stack Application
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server on http://localhost:5000 ...
start "Food Delivery - Backend" cmd /k "cd Backend && npm run dev"

echo [2/2] Starting Frontend Client on http://localhost:5173 ...
start "Food Delivery - Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ===================================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo   Admin:    http://localhost:5173/admin/login
echo.
echo   Customer: user@fooddelivery.com / User@123
echo   Admin:    admin@fooddelivery.com / Admin@123
echo ===================================================
echo.
