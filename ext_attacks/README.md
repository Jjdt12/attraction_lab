# External Attack Scripts

This directory contains educational attack scripts demonstrating various ICS/SCADA attack techniques against the Project Nexus attraction control system.

## Overview

These scripts are designed for the **Attraction Technology Virtual Lab** CTF challenges. Each script demonstrates a specific attack vector against the multi-PLC distributed control system.

## Prerequisites

```bash
pip install pymodbus
```

## Challenge Scripts

### Beginner Level

#### Challenge 01: First Contact (50 points)
**File:** `challenge_01_first_contact.py`

Establish connection and explore the PLC network by reading multiple Modbus registers.

```bash
python3 ext_attacks/challenge_01_first_contact.py
```

**Learning Objectives:**
- Basic Modbus/TCP communication
- PLC register addressing
- Network reconnaissance

---

#### Challenge 02: Portal Disruption (100 points)
**File:** `challenge_02_portal_disruption.py`

Disable the photo flash event in Scene 4 (Portal Chamber) via direct Modbus coil write.

```bash
python3 ext_attacks/challenge_02_portal_disruption.py
```

**Requirements:**
- Ride must be running
- Vehicle must be in positions 9-11

**Learning Objectives:**
- Modbus coil manipulation
- Event-based show control
- Timing attacks

---

#### Challenge 03: Emergency Override (150 points)
**File:** `challenge_03_emergency_override.py`

Trigger the emergency stop system via Modbus while ride is operating.

```bash
python3 ext_attacks/challenge_03_emergency_override.py
```

**Requirements:**
- Ride must be running
- E-stop must be triggered via Modbus, not UI

**Learning Objectives:**
- Safety system manipulation
- Emergency stop mechanisms

---

### Easy Level

#### Challenge 04: Zone Lockout (200 points)
**File:** `challenge_04_zone_lockout.py`

Disable Zone 2 via Modbus while the vehicle is moving through it.

```bash
python3 ext_attacks/challenge_04_zone_lockout.py
```

**Requirements:**
- Ride must be running
- Vehicle must be in Zone 2 (positions 9-17)
- Zone disable must be via Modbus

**Learning Objectives:**
- Zone-based ride control
- Maintenance isolation bypass
- Timing-based attacks

---

### Medium Level

#### Challenge 05: Launch Override (250 points)
**File:** `challenge_05_launch_override.py`

Set vehicle speed to an extreme value (>80% or <10%) via Modbus register write.

```bash
python3 ext_attacks/challenge_05_launch_override.py
```

**Requirements:**
- Ride must be running
- Speed manipulation via Modbus only

**Learning Objectives:**
- Holding register manipulation
- Speed control systems
- Process variable tampering

---

#### Challenge 06: Reality Shift (250 points)
**File:** `challenge_06_reality_shift.py`

Teleport the vehicle across zones by writing directly to the position register.

```bash
python3 ext_attacks/challenge_06_reality_shift.py
```

**Requirements:**
- Ride must be running
- Position jump must be >5 positions
- Direct Modbus write to MW1

**Learning Objectives:**
- Position register manipulation
- Vehicle tracking bypass
- State desynchronization

---

#### Challenge 07: Scene Blackout (300 points)
**File:** `challenge_07_scene_blackout.py`

Disable three or more show events simultaneously via Modbus.

```bash
python3 ext_attacks/challenge_07_scene_blackout.py
```

**Requirements:**
- Ride must be running
- At least 3 events disabled via Modbus
- UI controls don't count

**Learning Objectives:**
- Multi-coil manipulation
- Show control systems
- Coordinated attacks

---

#### Challenge 08: Heartbeat Hijack (350 points)
**File:** `challenge_08_heartbeat_hijack.py`

Spoof the Safety PLC Ready signal (Coil 31) to fake inter-PLC communication.

```bash
python3 ext_attacks/challenge_08_heartbeat_hijack.py
```

**Requirements:**
- Write TRUE to coil 31 via Modbus
- Signal must be externally spoofed

**Learning Objectives:**
- PLC heartbeat signals
- Inter-PLC communication
- Signal spoofing attacks

---

### Hard Level

#### Challenge 09: Safety Bypass (400 points)
**File:** `challenge_09_safety_bypass.py`

Start the ride with the safety gate open by manipulating safety interlocks.

```bash
python3 ext_attacks/challenge_09_safety_bypass.py
```

**Requirements:**
- Ride must be in Idle state
- Start ride with safety_gate_closed = FALSE
- Bypass must occur via Modbus

**Learning Objectives:**
- Safety interlock bypass
- Critical safety systems
- Pre-operation attacks

---

#### Challenge 10: The Nexus Core (450 points)
**File:** `challenge_10_nexus_core.py`

Force the Main PLC state machine into MAINTENANCE mode (state 5) during operation.

```bash
python3 ext_attacks/challenge_10_nexus_core.py
```

**Requirements:**
- Write 5 to state register (MW2)
- Can be done during any state

**Learning Objectives:**
- State machine manipulation
- PLC control flow bypass
- Direct register manipulation

---

## PLC Connection Details

| PLC | Port | Purpose |
|-----|------|---------|
| Main PLC | 502 | Sequencing, position, speed, zones |
| Safety PLC | 503 | Safety interlocks, event validation |
| Effects PLC | 504 | Show lighting, audio, effects |

## Memory Map Reference

### Main PLC (Port 502)

**Key Coils:**
- Coil 2: `emergency_stop_button`
- Coil 4: `safety_gate_closed`
- Coil 6: `zone_2_enable`
- Coils 8-16: Event enables (1-9)
- Coil 10: `start_command`
- Coil 31: `safety_plc_ready`

**Key Registers:**
- MW0: `speed_setpoint` (0-100%)
- MW1: `current_position` (0-25)
- MW2: `state` (0=Idle, 1=Starting, 2=Running, 3=Stopping, 4=Emergency, 5=Maintenance)
- MW3: `current_speed`
- MW5: `motor_current` (A)
- MW6: `hydraulic_pressure` (PSI)
- MW7: `bearing_temperature` (°C)

## Safety Notes

**IMPORTANT:** These attack scripts are for **educational purposes only** in an isolated lab environment.

- **Never** use these techniques on production systems
- **Never** use these techniques on systems you don't own
- These scripts are for learning ICS/SCADA security in a safe environment
- All attacks are demonstrated against a simulated PLC in Docker

## Usage Tips

1. **Start the lab environment first:**
   ```bash
   cd scripts && bash start.sh
   ```

2. **Open the HMI interface:**
   - Navigate to http://localhost:3000
   - Start the ride using the UI

3. **Run attack scripts:**
   - Most scripts require the ride to be running
   - Some require specific positions or states
   - Follow the on-screen instructions

4. **Check the CTF dashboard:**
   - View completed challenges
   - Track your points
   - See challenge descriptions

## Troubleshooting

### Connection Refused
- Ensure OpenPLC containers are running: `docker ps`
- Check Main PLC is on port 502: `telnet localhost 502`

### Challenge Not Completing
- Verify you used Modbus writes, not UI controls
- Check the challenge requirements carefully
- Look at console output for debugging info
- Ensure ride is in the correct state

### Script Hangs
- Some scripts wait for specific conditions
- Press Ctrl+C to interrupt
- Make sure ride is running when required

## Learning Path

Recommended order for beginners:

1. **First Contact** - Learn basic Modbus communication
2. **Portal Disruption** - Practice coil writes with timing
3. **Emergency Override** - Understand safety systems
4. **Zone Lockout** - Advanced timing attacks
5. **Launch Override** - Register manipulation
6. **Reality Shift** - Position control
7. **Scene Blackout** - Coordinated attacks
8. **Heartbeat Hijack** - Inter-PLC communication
9. **Safety Bypass** - Critical safety bypass
10. **The Nexus Core** - State machine attacks

## Additional Resources

- Main documentation: `/public/wiki/index.html`
- Operator manual: `/public/wiki/operator-manual.html`
- PLC programming: `/public/wiki/plc-programming.html`
- Network topology: `/public/wiki/network-topology.html`

## License

MIT - Educational use only
