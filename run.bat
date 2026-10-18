@echo off
title Kartiva E-Commerce - Dev Server
color 0b

echo ========================================================
echo               KARTIVA E-COMMERCE RUNNER
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages with npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: 3. Check for .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo [WARN] .env.local not found. Creating from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [INFO] .env.local created. Please verify your Supabase and database credentials if needed.
        echo.
    )
)

echo Starting development server...
echo --------------------------------------------------------
echo  - Customer Store:  http://localhost:3000
echo  - Admin Dashboard: http://localhost:3000/admin
echo    (Admin login: admin@kartiva.dev / Admin@kartiva123)
echo --------------------------------------------------------
echo  Press Ctrl+C anytime to stop the server.
echo ========================================================
echo.

call npm run dev %*

if errorlevel 1 (
    echo.
    echo [INFO] Dev server stopped.
    pause
)
