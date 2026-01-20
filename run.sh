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

check_node() {
    if ! command -v npm &> /dev/null; then
        echo "[ERROR] Node.js/npm is not installed!"
        echo "Install from: https://nodejs.org/"
        exit 1
    fi
    echo "[OK] Node.js found"
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

install_node_deps() {
    if [ ! -d "node_modules" ]; then
        echo "[SETUP] Installing Node dependencies..."
        npm install --silent
        echo "[OK] Node dependencies installed"
    else
        echo "[OK] Node dependencies already installed"
    fi
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

PYTHON_PID=""
VITE_PID=""

cleanup() {
    echo ""
    echo "[STOPPING] Shutting down..."

    if [ -n "$VITE_PID" ] && kill -0 $VITE_PID 2>/dev/null; then
        kill $VITE_PID 2>/dev/null || true
    fi

    if [ -n "$PYTHON_PID" ] && kill -0 $PYTHON_PID 2>/dev/null; then
        kill $PYTHON_PID 2>/dev/null || true
    fi

    $COMPOSE_CMD down 2>/dev/null || true
    echo "[OK] All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "--- Checking Prerequisites ---"
check_docker
check_node
check_python
install_node_deps
install_python_deps
echo ""

echo "--- Starting Services ---"
start_plcs
upload_plc_programs
echo ""

echo "[STARTING] Backend server..."
cd scripts
$PYTHON_CMD standalone_server.py &
PYTHON_PID=$!
cd ..

sleep 2

echo "[STARTING] Frontend dev server..."
npm run dev &
VITE_PID=$!

sleep 3

echo ""
echo "============================================"
echo "  READY! Open your browser to:"
echo ""
echo "    http://localhost:5173"
echo ""
echo "============================================"
echo ""
echo "  Backend Services:"
echo "    WebSocket:      ws://localhost:8765"
echo ""
echo "  PLC Dashboards (login: openplc / openplc):"
echo "    Main PLC:       http://localhost:8080"
echo "    Safety PLC:     http://localhost:8081"
echo "    Effects PLC:    http://localhost:8082"
echo ""
echo "  Modbus TCP: 502 (Main), 503 (Safety), 504 (Effects)"
echo ""
echo "  Press Ctrl+C to stop everything"
echo "============================================"
echo ""

wait $PYTHON_PID $VITE_PID
