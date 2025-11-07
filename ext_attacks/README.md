# Attraction Control System - CTF Challenge Attack Scripts

This directory contains Python exploit scripts for all 10 CTF challenges in the Attraction Technology Lab. These scripts demonstrate real ICS/SCADA attack techniques using Modbus TCP protocol.

## Prerequisites

```bash
pip install pymodbus
```

## Important Notes

- **These scripts perform the attacks but DO NOT print the flags**
- Flags are awarded by the web interface when it detects the challenge conditions
- Check the web interface for flag capture notifications after running scripts
- All scripts require the PLC to be running at the specified IP address
- Most challenges require the ride to be in RUNNING state

## Challenge Scripts

### 1. Lights Out (Easy - 100 points)
```bash
python3 challenge_01_lights_out.py <PLC_IP> [PORT]
```
Disable the photo flash event while the ride is running.

### 2. Emergency Override (Easy - 150 points)
```bash
python3 challenge_02_emergency_override.py
```
Trigger the emergency stop through Modbus while the ride is running.

### 3. Zone Manipulation (Medium - 200 points)
```bash
python3 challenge_03_zone_manipulation.py
```
Enable or disable individual attraction zones during operation.

### 4. Speed Control (Medium - 250 points)
```bash
python3 challenge_04_speed_control.py
```
Modify the ride speed setpoint to maximum during operation.

### 5. Safety Bypass (Hard - 350 points)
```bash
python3 challenge_05_safety_bypass.py <PLC_IP> [PORT]
```
Bypass the safety interlock system and complete a full ride cycle.

### 6. State Machine Attack (Hard - 400 points)
```bash
python3 challenge_06_state_machine_attack.py
```
Force the PLC state machine into maintenance mode.

### 7. Event Disable (Medium - 200 points)
```bash
python3 challenge_07_event_disable.py <PLC_IP> [PORT]
```
Disable specific ride events while the ride is running.

### 8. Stealth Mode (Hard - 300 points)
```bash
python3 challenge_08_stealth_mode.py
```
Keep the ride running for at least 3 complete cycles without triggering any event detection.

### 9. Position Teleport (Medium - 250 points)
```bash
python3 challenge_09_position_teleport.py <PLC_IP> [PORT]
```
Manipulate the vehicle position to jump across zones instantly.

### 10. Ghost Mode (Expert - 500 points)
```bash
python3 challenge_10_ghost_mode.py <PLC_IP> [PORT]
```
Complete 3 full cycles with all 9 events disabled simultaneously.

## General Attack Workflow

1. Start the PLC and ensure it's accessible at the target IP
2. Start the ride using the web interface (unless challenge requires specific state)
3. Run the appropriate challenge script
4. Monitor the script output for attack progress
5. Check the web interface for flag capture notification
6. The flag will appear in the CTF Challenges panel when conditions are met

## System Architecture

The attraction control system features:
- **3 Zones**: Loading & Launch (Zone 1), Main Experience (Zone 2), Return & Station (Zone 3)
- **9 Events**: Position-triggered events across the 3 zones
- **6 States**: IDLE, STARTING, RUNNING, STOPPING, EMERGENCY, MAINTENANCE
- **OpenPLC Backend**: Real industrial PLC running Structured Text logic
- **Modbus TCP**: All communication via standard Modbus protocol on port 502

## Key Modbus Addresses

### Coils (Digital I/O)
- 0-4: Core control (master_enable, start_command, stop_command, emergency_stop, safety_gate)
- 5-7: Zone enables
- 8-16: Event enables (9 events)
- 17-25: Event active states (read-only)
- 26-30: System outputs

### Holding Registers
- 0: speed_setpoint (0-100%)
- 1: current_position (0-360 degrees)
- 2: current_speed
- 1024+: Memory words (state machine, counters, etc.)

## Defensive Lessons

These challenges demonstrate real attack vectors against industrial control systems:

- **Unauthorized Coil Writes**: Direct manipulation of control signals
- **Register Manipulation**: Changing setpoints and position values
- **State Machine Attacks**: Forcing systems into unexpected states
- **Safety Bypass**: Disabling critical safety interlocks
- **Stealth Operations**: Avoiding detection while maintaining control

Each challenge highlights the importance of:
- Authentication and authorization for all write operations
- Logging and monitoring of all Modbus transactions
- Rate limiting and anomaly detection
- Physical segmentation of safety systems
- Regular security audits of ICS protocols
