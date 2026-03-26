# Attraction Technology Lab - Quick Setup Guide

A self-contained ICS/Show Control security testing environment with realistic Modbus protocol implementation.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)

Copy the `.env` file to the scripts directory if you want to use Supabase logging:

```bash
cp ../.env .env
```

The system works without Supabase - it just won't log data to a database.

## Running the System

### Option 1: Full System (Recommended for Beginners)

**Single command to run everything:**

```bash
cd scripts
python standalone_server.py
```

This starts:
- Web interface at `http://localhost:8080`
- WebSocket server at `ws://localhost:8765`

Then open your browser to `http://localhost:8080`

### Option 2: With PLC Simulator

**Terminal 1 - Start the PLC simulator:**
```bash
cd scripts
python light_test_sim.py
```

**Terminal 2 - Start the HMI server:**
```bash
python standalone_server.py
```

**Then:**
1. Open browser to `http://localhost:8080`
2. In the web interface, connect to PLC at `127.0.0.1:5020`
3. Click "Start Ride"

## Architecture

```
┌─────────────────────┐
│   Web Browser       │  ← You interact here
│   localhost:8080    │
└──────────┬──────────┘
           │ HTTP + WebSocket
           ▼
┌─────────────────────┐
│  Standalone Server  │  ← Python server
│  (standalone_server)│
└──────────┬──────────┘
           │ Modbus TCP
           ▼
┌─────────────────────┐
│   PLC Simulator     │  ← Simulated industrial controller
│  (light_test_sim)   │
└─────────────────────┘
```

## What You Get

### Realistic Features:
- ✅ Real Modbus TCP protocol
- ✅ Persistent PLC connection
- ✅ Multi-client support
- ✅ Industrial control logic
- ✅ Real-time visualization

### Perfect for Security Research:
- Network traffic analysis (real Modbus packets)
- Man-in-the-middle demonstrations
- Protocol fuzzing
- ICS vulnerability testing
- Educational workshops

## Security Testing Scenarios

### 1. Traffic Interception
```bash
# Terminal 1: PLC
python light_test_sim.py

# Terminal 2: Proxy (your MITM tool here)
python intercept.py

# Terminal 3: HMI
python standalone_server.py
```

### 2. Protocol Analysis
Use Wireshark to capture traffic on port 5020:
- Filter: `tcp.port == 5020`
- Observe real Modbus frames
- Analyze function codes, registers

### 3. Attack Simulations
- Test unauthorized coil writes
- Replay captured packets
- Modify data in transit
- Denial of service testing

## Troubleshooting

**"Build directory not found"**
```bash
# From project root
npm install
npm run build
```

**"Connection refused to PLC"**
- Make sure `light_test_sim.py` is running first
- Check firewall settings
- Verify port 5020 is available

**"WebSocket connection failed"**
- Check if port 8765 is already in use
- Verify no firewall blocking
- Check browser console for errors

## Configuration Options

Edit these environment variables in scripts (or set in environment):

```python
HTTP_PORT = 8080      # Web interface port
WS_PORT = 8765        # WebSocket port
HOST = "0.0.0.0"      # Bind address (0.0.0.0 = all interfaces)
```

## Distribution

To share with students/colleagues:

1. **Zip the project:**
```bash
zip -r attraction-lab.zip . -x "node_modules/*" ".git/*"
```

2. **Recipients need only:**
   - Install Python dependencies: `pip install -r scripts/requirements.txt`
   - Run: `python scripts/standalone_server.py`
   - Access: `http://localhost:8080`

## Advanced: Production Deployment

For remote access (e.g., classroom server):

```bash
# Set environment
export HOST="0.0.0.0"  # Listen on all interfaces
export HTTP_PORT="8080"

# Run with nohup for persistent session
nohup python standalone_server.py > server.log 2>&1 &
```

Students access via: `http://your-server-ip:8080`

## File Structure

```
scripts/
├── standalone_server.py       # All-in-one server (USE THIS)
├── light_test_sim.py          # PLC simulator
├── intercept.py               # Traffic analysis tool
├── requirements.txt           # Python dependencies
└── ...

dist/                          # Built web interface (auto-generated)
└── index.html, assets/...
```

## Support

For issues or questions, check:
- PLC simulator logs (Terminal 1)
- Server logs (Terminal 2)
- Browser console (F12 Developer Tools)
