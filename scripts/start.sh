#!/bin/bash

# Quick start script for Attraction Technology Lab

echo "============================================"
echo "  Attraction Technology Lab"
echo "  ICS/SCADA Security Testing Environment"
echo "============================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from:"
    echo "  https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available!"
    exit 1
fi

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import aiohttp" 2>/dev/null; then
    echo "❌ Python dependencies not installed!"
    echo ""
    echo "Please install them using one of these methods:"
    echo "  • pip3 install -r scripts/requirements.txt"
    echo "  • python3 -m pip install -r scripts/requirements.txt"
    echo "  • brew install python3 (to get pip on macOS)"
    echo ""
    exit 1
fi

# Check if dist directory exists
if [ ! -d "../dist" ]; then
    echo "❌ Build files not found!"
    echo "Please run 'npm run build' from the project root first"
    exit 1
fi

# Start all three PLCs in Docker
echo "🐳 Starting Multi-PLC Runtime (Ride, Safety, Show)..."
cd ..
$COMPOSE_CMD up -d plc-ride plc-safety plc-show
cd scripts

# Wait for OpenPLC and upload programs to all three PLCs
echo "⏳ Initializing all three PLCs with control programs..."
python3 upload_multi_plc.py

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Some PLCs may not have initialized properly"
    echo "Continuing anyway - system may work in degraded mode"
fi

echo ""
echo "🚀 Starting Attraction Technology Lab..."
echo ""
echo "   Web Interface:  http://localhost:3000"
echo ""
echo "   PLC Interfaces:"
echo "     • Ride Control:  http://localhost:8080 (openplc/openplc)"
echo "     • Safety PLC:    http://localhost:8081 (openplc/openplc)"
echo "     • Show Control:  http://localhost:8082 (openplc/openplc)"
echo ""
echo "   Modbus TCP:"
echo "     • Ride:   localhost:502"
echo "     • Safety: localhost:503"
echo "     • Show:   localhost:504"
echo ""
echo "   WebSocket:     ws://localhost:8765"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    cd ..
    $COMPOSE_CMD down
    echo "✓ Stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the server
python3 standalone_server.py
