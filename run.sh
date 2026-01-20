#!/bin/bash

set -e

echo ""
echo "============================================"
echo "  Attraction Technology Lab"
echo "  ICS/SCADA Security Testing Environment"
echo "============================================"
echo ""

cd "$(dirname "$0")"

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "[ERROR] Docker is not installed!"
        echo "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo "[ERROR] Docker is not running!"
        echo "Please start Docker Desktop and try again."
        exit 1
    fi

    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "[ERROR] Docker Compose not available!"
        exit 1
    fi
    echo "[OK] Docker is ready"
}

check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "[ERROR] Python 3 is not installed!"
        exit 1
    fi
    echo "[OK] Python found: $PYTHON_CMD"
}

install_python_deps() {
    if ! $PYTHON_CMD -c "import aiohttp, pymodbus, websockets" 2>/dev/null; then
        echo "[SETUP] Installing Python dependencies..."
        $PYTHON_CMD -m pip install -q -r scripts/requirements.txt
        echo "[OK] Python dependencies installed"
    else
        echo "[OK] Python dependencies already installed"
    fi
}

build_frontend() {
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        echo "[SETUP] Building frontend..."
        if ! command -v npm &> /dev/null; then
            echo "[ERROR] npm not found! Please install Node.js"
            exit 1
        fi
        npm install --silent
        npm run build --silent
        echo "[OK] Frontend built"
    else
        echo "[OK] Frontend already built"
    fi
}

start_plcs() {
    echo "[STARTING] OpenPLC containers (Main, Safety, Effects)..."
    $COMPOSE_CMD up -d plc-main plc-safety plc-effects
    echo "[OK] PLC containers started"
}

upload_plc_programs() {
    echo "[SETUP] Uploading PLC programs (this takes ~30 seconds)..."
    cd scripts
    $PYTHON_CMD upload_multi_plc.py || echo "[WARN] Some PLCs may not have initialized"
    cd ..
}

cleanup() {
    echo ""
    echo "[STOPPING] Shutting down..."
    $COMPOSE_CMD down 2>/dev/null || true
    echo "[OK] All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "--- Checking Prerequisites ---"
check_docker
check_python
install_python_deps
build_frontend
echo ""

echo "--- Starting Services ---"
start_plcs
upload_plc_programs
echo ""

echo "============================================"
echo "  READY!"
echo "============================================"
echo ""
echo "  Web Interface:    http://localhost:3000"
echo ""
echo "  PLC Dashboards:"
echo "    Main PLC:       http://localhost:8080"
echo "    Safety PLC:     http://localhost:8081"
echo "    Effects PLC:    http://localhost:8082"
echo "    (login: openplc / openplc)"
echo ""
echo "  Modbus TCP Ports:"
echo "    Main:    502"
echo "    Safety:  503"
echo "    Effects: 504"
echo ""
echo "  Press Ctrl+C to stop everything"
echo "============================================"
echo ""

cd scripts
$PYTHON_CMD standalone_server.py
