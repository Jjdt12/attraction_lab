# Quick Start

## Simplest Way to Run (With OpenPLC)

The easiest way to run the Attraction Technology Lab is using the start scripts, which automatically launch OpenPLC in Docker.

### Prerequisites:
- **Docker Desktop** installed and running
- **Python 3.8+** installed
- **Node.js** installed (for initial build)

### Linux/Mac:
```bash
./start.sh
```

### Windows:
```bash
start.bat
```

This will:
1. Start OpenPLC Runtime in Docker
2. Auto-compile and load `attraction_control.st`
3. Start the web server with WebSocket support
4. Connect to OpenPLC on `localhost:502`

Then open: **http://localhost:8080**

## First Time Setup

1. **Build the web interface** (from project root):
```bash
npm install
npm run build
```

2. **Install Python dependencies**:
```bash
cd scripts
pip install -r requirements.txt
```

3. **Run the start script**:
```bash
./start.sh       # Linux/Mac
start.bat        # Windows
```

## What Gets Started

When you run the start scripts:

- **OpenPLC Runtime** (Docker container)
  - Web UI: http://localhost:8080 (login: openplc / openplc)
  - Modbus TCP: localhost:502
  - Auto-loads your ST program from `attraction_control.st`

- **HMI Web Server** (Python)
  - Interface: http://localhost:8080
  - WebSocket: ws://localhost:8765
  - Serves the React frontend

## Using a Remote PLC

The app is fully modular. To connect to a remote OpenPLC or any other Modbus server:

1. Start just the Python backend:
```bash
python3 standalone_server.py
```

2. In the web interface, enter your remote PLC address:
```
Host: 192.168.1.100
Port: 502
```

3. Click "Connect to PLC"

## Manual OpenPLC Management

If you want to manage OpenPLC manually:

**Start OpenPLC:**
```bash
cd ..
docker compose up -d openplc
```

**Upload ST program:**
```bash
python3 upload_st_to_openplc.py
```

**Stop OpenPLC:**
```bash
cd ..
docker compose down
```

## Files

- `standalone_server.py` - Main HMI server (HTTP + WebSocket + Modbus client)
- `attraction_control.st` - PLC program (Structured Text)
- `upload_st_to_openplc.py` - Auto-upload script for OpenPLC
- `start.sh` / `start.bat` - Quick launch scripts
- `requirements.txt` - Python dependencies
- `../docker-compose.yml` - OpenPLC container orchestration

## Troubleshooting

**"Docker is not installed"**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop

**"Port 8080 already in use"**
- Another service is using port 8080
- Stop other services or modify the port in `docker-compose.yml`

**"Failed to initialize OpenPLC"**
- Check Docker is running: `docker ps`
- Check OpenPLC logs: `docker logs attraction-openplc`

For detailed documentation, see `../SETUP.md`
