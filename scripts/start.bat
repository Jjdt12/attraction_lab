@echo off
REM Quick start script for Attraction Technology Lab (Windows)

echo ============================================
echo   Attraction Technology Lab
echo   ICS/SCADA Security Testing Environment
echo ============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed!
    echo Please install Docker Desktop from:
    echo   https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo Error: Docker Compose is not available!
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker-compose
) else (
    set COMPOSE_CMD=docker compose
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed!
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import aiohttp" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
)

REM Check if dist directory exists
if not exist "..\dist" (
    echo Error: Build files not found!
    echo Please run 'npm run build' from the project root first
    pause
    exit /b 1
)

REM Start all three PLCs in Docker
echo Starting Multi-PLC Runtime (Ride, Safety, Show)...
cd ..
%COMPOSE_CMD% up -d plc-ride plc-safety plc-show
cd scripts

REM Wait for OpenPLC and upload programs to all three PLCs
echo Initializing all three PLCs with control programs...
python upload_multi_plc.py

if errorlevel 1 (
    echo.
    echo Warning: Some PLCs may not have initialized properly
    echo Continuing anyway - system may work in degraded mode
)

echo.
echo Starting Attraction Technology Lab...
echo.
echo    Web Interface:  http://localhost:3000
echo.
echo    PLC Interfaces:
echo      * Ride Control:  http://localhost:8080 (openplc/openplc)
echo      * Safety PLC:    http://localhost:8081 (openplc/openplc)
echo      * Show Control:  http://localhost:8082 (openplc/openplc)
echo.
echo    Modbus TCP:
echo      * Ride:   localhost:502
echo      * Safety: localhost:503
echo      * Show:   localhost:504
echo.
echo    WebSocket:     ws://localhost:8765
echo.
echo Press Ctrl+C to stop
echo.

REM Start the server
python standalone_server.py

REM Cleanup on exit
cd ..
%COMPOSE_CMD% down
echo Stopped
