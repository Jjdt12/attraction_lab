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

REM Start OpenPLC in Docker
echo Starting OpenPLC Runtime...
cd ..
%COMPOSE_CMD% up -d openplc
cd scripts

REM Wait for OpenPLC and upload program
echo Initializing OpenPLC with attraction control program...
python upload_st_to_openplc.py

if errorlevel 1 (
    echo.
    echo Error: Failed to initialize OpenPLC
    echo Stopping containers...
    cd ..
    %COMPOSE_CMD% down
    pause
    exit /b 1
)

echo.
echo Starting Attraction Technology Lab...
echo.
echo    Web Interface: http://localhost:8080
echo    OpenPLC UI:    http://localhost:8080 (user: openplc / pass: openplc)
echo    WebSocket:     ws://localhost:8765
echo    Modbus TCP:    localhost:502
echo.
echo Press Ctrl+C to stop
echo.

REM Start the server
python standalone_server.py

REM Cleanup on exit
cd ..
%COMPOSE_CMD% down
echo Stopped
