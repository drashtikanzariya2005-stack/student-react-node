@echo off
title Food Delivery - Database Seeder
echo ===================================================
echo       Seeding Food Delivery Database (MongoDB)
echo ===================================================
echo.

cd /d "%~dp0Backend"
npm run seed

echo.
echo ===================================================
echo   Seeding complete!
echo ===================================================
pause
