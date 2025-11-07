# Attraction Technology Virtual Lab

A comprehensive web-based virtual lab for testing attraction control systems, Modbus/PLC communication, and ICS/SCADA cybersecurity scenarios with **10 CTF challenges**.

## Overview

This project simulates a Disney-style attraction ride control system with:
- Multi-zone attraction with 5 controllable zones
- Advanced state machine (Idle, Starting, Running, Stopping, Emergency, Maintenance)
- Real-time Modbus TCP communication with OpenPLC
- Safety interlock system (E-stop, safety gate, master enable)
- MITM attack capabilities and traffic interception
- 10 CTF challenges ranging from easy to hard
- Runtime and cycle counters with maintenance triggers
- Speed control and position tracking

## Architecture

### Web Interface (React + TypeScript)
- **AttractionVisualizer**: Visual representation of the ride with car and lights
- **ControlPanel**: Ride control interface with MitM proxy toggle
- **PLCStatus**: WebSocket and PLC connection status
- **PLCStateMonitor**: Real-time PLC state machine and system status
- **CoilStatus**: Live Modbus coil state visualization
- **CTFChallenges**: Real-time challenge tracking with points system
- **AttackConsole**: Interactive Python environment for executing attacks
- Connects to WebSocket server for real-time PLC communication

### Standalone Server (Python)
- **standalone_server.py**: All-in-one server serving web interface, WebSocket, and Modbus
- Maintains persistent Modbus TCP connection to PLC
- Handles WebSocket connections from web interface
- Bridges browser ↔ PLC communication
- Logs events to Supabase database

### Database (Supabase PostgreSQL)
- `lab_sessions`: Tracks individual lab sessions with scenario types
- `modbus_events`: Logs all Modbus communication (reads/writes)
- `attraction_states`: Records attraction state snapshots over time
- `security_alerts`: Security event logging and anomaly detection
- `challenges`: CTF challenge definitions with difficulty and points
- `challenge_completions`: Tracks completed challenges per session

### Python Scripts
Located in `/scripts`:
- **standalone_server.py**: Integrated web + WebSocket + Modbus server (started via start.sh)
- **HMI.py**: Standalone HMI simulator with auditor logging
- **light_test_sim.py**: Simplified HMI without auditor
- **intercept.py**: MITM proxy for attack scenarios
- **probe.py**: Diagnostic tool for Modbus testing
- **plc_docker.sh**: OpenPLC Docker setup
- **attack_zone_manipulation.py**: Zone control attack demo
- **attack_safety_bypass.py**: Safety interlock bypass demo
- **attack_state_machine.py**: State machine manipulation demo

### PLC Program
- **attraction_control.st**: Enhanced Structured Text program with:
  - 6-state machine (Idle, Starting, Running, Stopping, Emergency, Maintenance)
  - 5 controllable zones with position tracking
  - Safety interlock logic (gate, e-stop, master enable)
  - Speed setpoint control (0-100%)
  - Runtime hours and cycle counters
  - Maintenance flag triggers
  - Error code tracking

## CTF Challenges

### Easy Challenges (100-150 points)
1. **Lights Out** - Prevent flash light activation using MitM attack
2. **Emergency Override** - Trigger emergency stop via Modbus

### Medium Challenges (150-250 points)
3. **Stealth Mode** - Keep ride running for 3 laps without flashing
4. **Traffic Analysis** - Intercept and log 10+ Modbus commands
5. **Zone Manipulation** - Disable attraction zones during operation
6. **Runtime Manipulation** - Trigger maintenance flag through counter manipulation

### Hard Challenges (300-400 points)
7. **Speed Control** - Modify ride speed through register manipulation
8. **Safety Bypass** - Start ride with safety gate open
9. **State Machine Attack** - Force PLC into maintenance mode
10. **Full Laps Silent** - Complete 3 laps without any flash light activations

**Total Points Available: 2,350**

See `ATTACK_GUIDE.md` for detailed attack vectors and methods.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker (for OpenPLC)

### Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
pip install -r scripts/requirements.txt
```

3. Configure environment variables in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_WS_URL=ws://localhost:8765

PLC_HOST=testing.com
PLC_PORT=502
WS_HOST=0.0.0.0
WS_PORT=8765
```

### Running the Lab

#### Quick Start (Complete Setup)

1. **Upload PLC Program to OpenPLC:**
   - Open OpenPLC Web Interface (typically http://localhost:8080)
   - Go to "Programs" → Upload `scripts/attraction_control.st`
   - Start the program

2. **Start the WebSocket Server:**
```bash
cd scripts && ./start.sh
```

3. **Start the Web Interface:**
```bash
npm run dev
```

4. **Open in Browser:**
   - Navigate to http://localhost:5173
   - Click "Connect to PLC" and enter your OpenPLC host:port
   - Start a ride session to begin challenge tracking

#### Attack Scenarios

Run demonstration attack scripts:

```bash
# Zone manipulation attack
python scripts/attack_zone_manipulation.py

# Safety bypass attack
python scripts/attack_safety_bypass.py

# State machine attack
python scripts/attack_state_machine.py
```

Or use the built-in Attack Console in the web interface with Pyodide for in-browser Python execution.

#### Running OpenPLC Locally

For local PLC testing:
```bash
bash scripts/plc_docker.sh
```

Default OpenPLC credentials: `openplc` / `openplc`

## Features

- **Real-time PLC Simulation** - Advanced state machine with multi-zone control
- **Live Modbus Monitoring** - Watch all coil/register reads and writes
- **CTF Challenge System** - 10 challenges with automatic detection and scoring
- **Interactive Attack Console** - In-browser Python environment (Pyodide)
- **MitM Capabilities** - Built-in traffic interception and manipulation
- **Complete Logging** - All events stored in Supabase for analysis
- **Beautiful UI** - Production-ready design with real-time updates
- **Safety System Simulation** - E-stop, safety gates, and interlocks
- **Multiple Attack Vectors** - Zone control, state manipulation, counter tampering

## Use Cases

- **ICS/SCADA Security Training** - Learn real-world attack and defense techniques
- **Modbus Protocol Education** - Understand industrial communication protocols
- **Red Team Exercises** - Practice offensive security in safe environment
- **Blue Team Training** - Detect and respond to ICS attacks
- **CTF Competitions** - Built-in scoring and challenge tracking
- **Attraction Control Learning** - Understand theme park ride safety systems

## Technology Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Lucide React (icons)
- Python + pymodbus
- OpenPLC Runtime (Docker)

## PLC Memory Map

### Digital I/O (Coils)
- Coil 0: `proximity_sensor` - Position sensor trigger
- Coil 1: `master_enable` - System enable
- Coil 2: `emergency_stop_button` - E-stop status
- Coil 3: `flash_light` - Warning light
- Coil 4: `safety_gate_closed` - Safety gate sensor
- Coils 5-9: `zone_1_enable` through `zone_5_enable` - Zone controls
- Coils 10-11: `start_command`, `stop_command` - Ride controls
- Coils 12-15: System status flags

### Registers (Holding Registers)
- Register 0: `speed_setpoint` (0-100%)
- Register 1: `current_position` (0-359 degrees)
- Register 2-3: `runtime_hours` (DINT)
- Register 4-5: `cycle_counter` (DINT)
- Register 6: `state` (0-5: Idle, Starting, Running, Stopping, Emergency, Maintenance)
- Register 7: `maintenance_flag`
- Register 8: `last_error_code`

See `ATTACK_GUIDE.md` for complete memory map and attack techniques.

## Security Notes

This is a **defensive security training tool** for learning about ICS/SCADA vulnerabilities. All attack scenarios are demonstrated in an isolated environment for educational purposes only.

**Do not** use these techniques on production systems or systems you don't own.

## License

MIT
