@echo off
setlocal enabledelayedexpansion

echo ==================================
echo Attraction Lab - Installation
echo ==================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python 3 is not installed. Please install Python 3.8+ first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [32m✓ Prerequisites check passed[0m
echo.

REM Install Node.js dependencies
echo [36m📦 Installing Node.js dependencies...[0m
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo [32m✓ Node.js dependencies installed[0m
echo.

REM Build the web interface
echo [36m🔨 Building web interface...[0m
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to build web interface
    pause
    exit /b 1
)
echo [32m✓ Web interface built[0m
echo.

REM Create Python virtual environment
echo [36m🐍 Creating Python virtual environment...[0m
python -m venv venv
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to create virtual environment
    pause
    exit /b 1
)
echo [32m✓ Virtual environment created[0m
echo.

REM Activate virtual environment and install Python dependencies
echo [36m📦 Installing Python dependencies...[0m
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r scripts\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)
echo [32m✓ Python dependencies installed[0m
echo.

echo ==================================
echo Installation Complete!
echo ==================================
echo.
echo [36m🪟 Windows Installation Detected[0m
echo.
echo To start the lab, run:
echo   venv\Scripts\activate
echo   cd scripts
echo   start.bat
echo.
echo [33mNote: Make sure Docker Desktop is running before starting the lab![0m
echo.

pause
