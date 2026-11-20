@echo off
setlocal enabledelayedexpansion
title Pakistan Market Intelligence - Desktop

:: Always run in the directory where this script is located
cd /d "%~dp0"

cls
echo =====================================================================
echo          PAKISTAN MARKET INTELLIGENCE - DESKTOP LAUNCHER
echo =====================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found on your system!
    echo.
    echo To run this application, please download and install Node.js:
    echo https://nodejs.org/ (Download the Recommended/LTS version)
    echo.
    echo After installing Node.js, double-click this file again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo [1/3] Node.js detected (%NODE_VER%) - OK
echo.

:: 2. Check if node_modules exists
if not exist "node_modules\" (
    echo [2/3] First-time setup: Installing required libraries...
    echo       (This is a one-time process and may take 1-2 minutes)
    echo.
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Please verify your internet connection and try running: npm install
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Libraries installed successfully.
    echo.
) else (
    echo [2/3] Libraries verified - OK
)

:: 3. Check if production build exists (dist/index.html and dist/server.cjs)
if not exist "dist\index.html" (
    set NEED_BUILD=1
) else if not exist "dist\server.cjs" (
    set NEED_BUILD=1
) else (
    set NEED_BUILD=0
)

if "!NEED_BUILD!"=="1" (
    echo.
    echo [SETUP] Compiling application bundle for desktop...
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Application compilation failed.
        pause
        exit /b 1
    )
    echo [OK] Compilation complete.
    echo.
)

:: 4. Launch browser and run production server
echo.
echo =====================================================================
echo  [3/3] Starting server on http://localhost:3000...
echo        Opening your browser automatically...
echo =====================================================================
echo.
echo  Tip: Keep this console window open while using the application.
echo       To stop the application, press [Ctrl + C] in this window.
echo.

:: Give Windows 1.5 seconds then open the default browser
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the standalone server
node dist/server.cjs

if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Application server stopped or encountered an error.
    pause
)
