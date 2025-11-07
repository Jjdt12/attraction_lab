#!/bin/bash

set -e

echo "=================================="
echo "Attraction Lab - Installation"
echo "=================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✓ Prerequisites check passed"
echo ""

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✓ Node.js dependencies installed"
echo ""

# Build the web interface
echo "🔨 Building web interface..."
npm run build
echo "✓ Web interface built"
echo ""

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
echo "✓ Virtual environment created"
echo ""

# Activate virtual environment and install Python dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r scripts/requirements.txt
echo "✓ Python dependencies installed"
echo ""

echo "=================================="
echo "Installation Complete!"
echo "=================================="
echo ""
echo "To start the lab, run:"
echo "  source venv/bin/activate"
echo "  cd scripts && ./start.sh"
echo ""
