@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Attraction Technology Lab
echo   ICS/SCADA Security Testing Environment
echo ============================================
echo.

cd /d "%~dp0"

REM Check Docker
echo --- Checking Prerequisites ---
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    exit /b 1
)
echo [OK] Docker is ready

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    exit /b 1
)
echo [OK] Python found

REM Install Python dependencies
python -c "import aiohttp, pymodbus, websockets" >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Installing Python dependencies...
    python -m pip install -q -r scripts\requirements.txt
    echo [OK] Python dependencies installed
) else (
    echo [OK] Python dependencies already installed
)

REM Build frontend if needed
if not exist "dist\index.html" (
    echo [SETUP] Building frontend...
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] npm not found! Please install Node.js
        exit /b 1
    )
    call npm install --silent
    call npm run build --silent
    echo [OK] Frontend built
) else (
    echo [OK] Frontend already built
)

echo.
echo --- Starting Services ---

REM Start PLCs
echo [STARTING] OpenPLC containers...
docker compose up -d plc-main plc-safety plc-effects
echo [OK] PLC containers started

REM Upload PLC programs
echo [SETUP] Uploading PLC programs (this takes ~30 seconds)...
cd scripts
python upload_multi_plc.py
cd ..

echo.
echo ============================================
echo   READY!
echo ============================================
echo.
echo   Web Interface:    http://localhost:3000
echo.
echo   PLC Dashboards:
echo     Main PLC:       http://localhost:8080
echo     Safety PLC:     http://localhost:8081
echo     Effects PLC:    http://localhost:8082
echo     (login: openplc / openplc)
echo.
echo   Modbus TCP Ports:
echo     Main:    502
echo     Safety:  503
echo     Effects: 504
echo.
echo   Press Ctrl+C to stop (then run: docker compose down)
echo ============================================
echo.

cd scripts
python standalone_server.py

REM Cleanup on exit
cd ..
docker compose down
