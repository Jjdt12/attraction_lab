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

REM Check Node
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js/npm is not installed!
    echo Install from: https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js found

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    exit /b 1
)
echo [OK] Python found

REM Install Node dependencies
if not exist "node_modules" (
    echo [SETUP] Installing Node dependencies...
    call npm install --silent
    echo [OK] Node dependencies installed
) else (
    echo [OK] Node dependencies already installed
)

REM Install Python dependencies
python -c "import aiohttp, pymodbus, websockets" >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Installing Python dependencies...
    python -m pip install -q -r scripts\requirements.txt
    echo [OK] Python dependencies installed
) else (
    echo [OK] Python dependencies already installed
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
echo [STARTING] Backend server...
start /b python scripts\standalone_server.py

timeout /t 2 /nobreak >nul

echo [STARTING] Frontend dev server...
start "Vite Dev Server" cmd /c "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   READY! Open your browser to:
echo.
echo     http://localhost:5173
echo.
echo ============================================
echo.
echo   Backend Services:
echo     WebSocket:      ws://localhost:8765
echo.
echo   PLC Dashboards (login: openplc / openplc):
echo     Main PLC:       http://localhost:8080
echo     Safety PLC:     http://localhost:8081
echo     Effects PLC:    http://localhost:8082
echo.
echo   Modbus TCP: 502 (Main), 503 (Safety), 504 (Effects)
echo.
echo   Close this window to stop (then run: docker compose down)
echo ============================================
echo.

pause
docker compose down
