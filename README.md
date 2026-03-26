# Attraction Technology Virtual Lab

![Attraction Technology Lab Interface](public/image%20copy.png)

A comprehensive web-based virtual lab for testing attraction control systems, Modbus/PLC communication, and ICS/Show Control cybersecurity scenarios with **10 CTF challenges**.

## Overview

This project simulates a realistic industrial attraction control system with:
- **Three-PLC distributed architecture** (Main, Safety, Effects)
- 26-position track with 9 proximity sensors
- Advanced state machine (Idle, Starting, Running, Stopping, Emergency)
- Real-time Modbus TCP communication with OpenPLC
- Safety interlock system with independent Safety PLC
- Position-based show effects and lighting scenes
- 10 CTF challenges ranging from easy to hard
- Process variable simulation (motor current, hydraulic pressure, temperature)
- Speed control and position tracking

## Architecture

### Multi-PLC System

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MAIN PLC      │     │   SAFETY PLC    │     │  EFFECTS PLC    │
│   Port 502      │     │   Port 503      │     │   Port 504      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Sequencing    │     │ • Safety Gates  │     │ • Show Lighting │
│ • Position      │     │ • E-Stops       │     │ • Audio         │
│ • Speed Control │     │ • Interlocks    │     │ • Effects       │
│ • Zone Logic    │     │ • Event Safety  │     │ • Fog/Strobe    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  HMI Interface  │
                        │  Port 3000      │
                        └─────────────────┘
```

**See `MULTI_PLC_ARCHITECTURE.md` for detailed architecture documentation.**

### Web Interface (React + TypeScript)
- **AttractionVisualizer**: Visual representation of the attraction with vehicle and lights
- **ControlPanel**: Attraction control interface
- **MultiPLCStatus**: Connection status for all three PLCs
- **SystemHealthDashboard**: Real-time diagnostics and process variables
- **ShowEventsMonitor**: 9 proximity sensor event tracking
- **TrendChart**: Live charts for position, speed, temperature, current
- **AlarmPanel**: Active alarms and alarm history
- **NetworkMonitor**: Modbus traffic analysis
- **CTFChallenges**: Real-time challenge tracking with points system
- **DocumentationViewer**: In-universe operator manuals and service bulletins

### Standalone Server (Python)
- **standalone_server.py**: All-in-one server serving web interface, WebSocket, and Modbus
- Maintains persistent Modbus TCP connection to Main PLC (port 502)
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
- **upload_multi_plc.py**: Automated deployment of all three PLC programs
- **probe.py**: Diagnostic tool for Modbus testing
- **plc_modbus_map.py**: Memory map definitions for Modbus communication

### PLC Programs
Three separate Structured Text programs:
- **attraction_control_main.st**: Main sequencing, position tracking, speed control, zone logic
- **attraction_control_safety.st**: Safety interlocks, event-based safety checks, alarm generation
- **attraction_control_effects.st**: Show lighting scenes, audio triggers, special effects

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
  - **Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - **macOS**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - **Linux**: Install Docker Engine using your package manager

### Installation & Setup

Run the automated installation script for your operating system:

#### Linux / macOS
```bash
bash install.sh
```

#### Windows (Command Prompt or PowerShell)
```cmd
install.bat
```

#### Windows (Git Bash)
```bash
bash install.sh
```

This will:
- Install Node.js dependencies
- Build the web interface
- Create a Python virtual environment
- Install Python dependencies

Environment variables are pre-configured in `.env` - no setup needed!

### Running the Lab

#### Linux / macOS

1. **Activate the Python virtual environment:**
```bash
source venv/bin/activate
```

2. **Start Everything (3 OpenPLC containers + WebSocket Server):**
```bash
cd scripts && bash start.sh
```

#### Windows (Command Prompt or PowerShell)

1. **Activate the Python virtual environment:**
```cmd
venv\Scripts\activate
```

2. **Start Everything:**
```cmd
cd scripts
start.bat
```

#### Windows (Git Bash)

1. **Activate the Python virtual environment:**
```bash
source venv/Scripts/activate
```

2. **Start Everything:**
```bash
cd scripts && bash start.sh
```

---

The startup script will:
- Start 3 OpenPLC containers with Docker (Main, Safety, Effects)
- Upload and compile all three PLC programs
- Start all PLC runtimes
- Launch the integrated web server with WebSocket support

**Open in Browser:**
- **SCADA HMI:** http://localhost:3000 (main operator interface)
- The lab will **automatically connect** to Main PLC at localhost:502
- The system will auto-initialize with safe baseline conditions
- Click the **Help** button in the header to read the attraction documentation and get started!

  ![Help Button](public/image%20copy%20copy.png)

**PLC Access Points:**
| Interface | URL | Credentials |
|-----------|-----|-------------|
| Main PLC Admin | http://localhost:8080 | openplc / openplc |
| Safety PLC Admin | http://localhost:8081 | openplc / openplc |
| Effects PLC Admin | http://localhost:8082 | openplc / openplc |

**Modbus TCP Ports:**
- Main PLC: localhost:502
- Safety PLC: localhost:503
- Effects PLC: localhost:504

#### Attack Scenarios

Attack scripts are available in `/ext_attacks` with examples for each CTF challenge. These demonstrate various attack vectors:

```bash
# Example: Zone manipulation attack
python ext_attacks/challenge_03_zone_manipulation.py

# Example: Safety bypass attack
python ext_attacks/challenge_05_safety_bypass.py

# Example: State machine attack
python ext_attacks/challenge_06_state_machine_attack.py
```

See `ext_attacks/README.md` for documentation on all available attack scripts.

## Features

- **Three-PLC Distributed Architecture** - Realistic industrial control system structure
- **Real-time PLC Simulation** - Advanced state machine with 26-position tracking
- **Live Modbus Monitoring** - Watch all coil/register reads and writes across PLCs
- **CTF Challenge System** - 10 challenges with automatic detection and scoring
- **Automated Setup** - One-command deployment with Docker and Python
- **Complete Logging** - All events stored in Supabase for analysis
- **Professional SCADA HMI** - Production-quality interface with tabbed navigation
- **Independent Safety System** - Dedicated Safety PLC with event-based checks
- **Show Effects Control** - Separate Effects PLC for lighting and audio
- **Process Variable Simulation** - Motor current, hydraulic pressure, temperature monitoring
- **Multiple Attack Vectors** - Multi-PLC coordination, zone control, state manipulation
- **Educational Attack Scripts** - Pre-built examples for each challenge

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

## PLC Memory Maps

### Main PLC (Port 502)
**Coils:**
- %QX0.0-0.2: `master_enable`, `emergency_stop_button`, `safety_gate_closed`
- %QX0.5-0.7: `zone_1_enable`, `zone_2_enable`, `zone_3_enable`
- %QX1.0-1.1: `start_command`, `stop_command`
- %QX1.5: `motor_running`

**Registers:**
- %MW0: `speed_setpoint` (0-100%)
- %MW1: `current_position` (0-25 track positions)
- %MW2: `state` (0=Idle, 1=Starting, 2=Running, 3=Stopping, 4=Emergency)
- %MW3: `current_speed` (calculated speed)
- %MW5-14: Process variables (current, pressure, temperature, brake wear, vibration)
- %MW80-88: Proximity sensors 1-9 (position detection)

### Safety PLC (Port 503)
**Coils:**
- %QX0.0-0.2: Safety inputs (master_enable, e-stop, gate)
- %QX1.0-2.0: Event enables (9 events)
- %QX2.1-3.1: Event active flags (9 events)

**Registers:**
- %MW10-11: Current position/speed from Main PLC
- %MW20-28: Event counters (9 events)
- %MW30: `alarm_register`
- %MW31: `stealth_counter`
- %MW50: `safety_violation_count`
- %MW100: `safety_ok_reg` (safety status for Main PLC)

### Effects PLC (Port 504)
**Coils:**
- %QX10.0-10.3: Lighting scenes 1-4
- %QX11.0-11.2: Audio channels 1-3
- %QX12.0-12.3: Special effects (fog, strobe, laser, photo)

**Registers:**
- %MW60: `current_lighting_scene`
- %MW61: `active_audio_channel`
- %MW62: `position_from_main`
- %MW70-73: Effect runtime counters

**See `MULTI_PLC_ARCHITECTURE.md` and `ATTACK_GUIDE.md` for complete memory maps and attack techniques.**

## Security Notes

This is a **defensive security training tool** for learning about ICS/SCADA vulnerabilities. All attack scenarios are demonstrated in an isolated environment for educational purposes only.

**Do not** use these techniques on production systems or systems you don't own.

## License

MIT
