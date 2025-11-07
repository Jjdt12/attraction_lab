# Attraction Control System - CTF Challenge Solutions

This directory contains Python exploit scripts for all 10 CTF challenges in the Attraction Technology Lab. These scripts demonstrate real ICS/SCADA attack techniques using Modbus TCP protocol against an OpenPLC system.

## Prerequisites

```bash
pip install pymodbus
```

## System Architecture

The attraction control system features:
- **3 Zones**: Loading (0-120), Main Track (121-240), Return (241-360)
- **9 Events**: Position-triggered events across the 3 zones
- **5 States**: IDLE(0), STARTING(1), RUNNING(2), STOPPING(3), EMERGENCY(4)
- **OpenPLC Backend**: Real industrial PLC running Structured Text (ST) logic

## Challenge Solutions

### Easy Challenges (100-150 points)

#### Challenge 1: Lights Out
**Difficulty:** Easy | **Points:** 100 | **Flag:** `FLAG{D4RK_ROOM_PH0T0_B00TH}`

```bash
python3 challenge_01_lights_out.py <PLC_IP> [PORT]
```

**Objective:** Disable the photo flash at Event 4

**Solution:**
- Event 4 (Photo Flash) is controlled by coil 11 (`event_4_enable`)
- Set coil 11 to FALSE to disable the flash
- Must be maintained for 3+ seconds while ride is running

**Key Addresses:**
- Coil 11: `event_4_enable`
- Coil 20: `event_4_active` (read-only status)

---

#### Challenge 2: Speed Demon
**Difficulty:** Easy | **Points:** 100 | **Flag:** `FLAG{BR4K3S_4R3_0PT10N4L}`

```bash
python3 challenge_02_speed_demon.py <PLC_IP> [PORT]
```

**Objective:** Set speed to 85%+ during Event 5 brake zone

**Solution:**
- Event 5 (Mid-Course Brake, position 161-200) enforces 70% speed limit
- Write 85 to register 0 (`speed_setpoint`)
- The PLC will generate error code 202 (speed violation)

**Key Addresses:**
- Register 0: `speed_setpoint` (0-100%)
- Register 1: `current_position`
- Register 1029: `last_error_code`

---

#### Challenge 3: Zone Lockout
**Difficulty:** Easy | **Points:** 150 | **Flag:** `FLAG{Z0N3_MAINT3N4NC3_M0D3}`

```bash
python3 challenge_03_zone_lockout.py <PLC_IP> [PORT]
```

**Objective:** Disable Zone 1 entirely

**Solution:**
- Zone 1 enable is coil 5
- Set to FALSE to lock out the zone
- Hold for 5+ seconds

**Key Addresses:**
- Coil 5: `zone_1_enable`
- Coil 6: `zone_2_enable`
- Coil 7: `zone_3_enable`

---

### Medium Challenges (200-250 points)

#### Challenge 4: Safety Bypass
**Difficulty:** Medium | **Points:** 200 | **Flag:** `FLAG{S4F3TY_TH1RD_R1GHT}`

```bash
python3 challenge_04_safety_bypass.py <PLC_IP> [PORT]
```

**Objective:** Bypass Event 2 safety interlock

**Solution:**
- Event 2 (Safety Interlock) performs checks at position 41-80
- Disable coil 9 (`event_2_enable`) before entering zone
- Complete a full cycle without safety errors

**Key Addresses:**
- Coil 9: `event_2_enable`
- Register 1029: `last_error_code`

---

#### Challenge 5: Event Chaos
**Difficulty:** Medium | **Points:** 250 | **Flag:** `FLAG{QU4NTUM_EV3NT_SUP3RP0S1T10N}`

```bash
python3 challenge_05_event_chaos.py <PLC_IP> [PORT]
```

**Objective:** Make Events 1, 4, and 7 active simultaneously

**Solution:**
- Events trigger based on position: E1(0-40), E4(121-160), E7(241-280)
- Cannot be in 3 positions at once... or can you?
- Hint: Exploit PLC scan timing by rapidly jumping positions

**Key Addresses:**
- Register 1: `current_position`
- Coils 17, 20, 23: `event_1/4/7_active` (read-only)

---

#### Challenge 6: Stealth Speed Run
**Difficulty:** Medium | **Points:** 250 | **Flag:** `FLAG{SL0W_4ND_ST34DY_W1NS}`

```bash
python3 challenge_06_stealth_speed.py <PLC_IP> [PORT]
```

**Objective:** Change speed to 75% without triggering stealth counter

**Solution:**
- PLC increments `stealth_counter` (register 1055) on large speed jumps (>30%)
- Ramp speed gradually in small increments (2-5% per step)
- Use delays between writes to avoid detection

**Key Addresses:**
- Register 0: `speed_setpoint`
- Register 1055: `stealth_counter` (MW31)

---

### Hard Challenges (300-350 points)

#### Challenge 7: State Machine Takeover
**Difficulty:** Hard | **Points:** 300 | **Flag:** `FLAG{ST4T3_M4CH1N3_H4CK3D}`

```bash
python3 challenge_07_state_machine.py <PLC_IP> [PORT]
```

**Objective:** Force ride into RUNNING state without proper startup

**Solution:**
- Normal state flow: 0 (IDLE) → 1 (STARTING) → 2 (RUNNING)
- Directly write 2 to register 1039 (`state`)
- Must also set coil 26 (`motor_running`) to TRUE
- May need to set coil 27 (`brake_engaged`) to FALSE

**Key Addresses:**
- Register 1039: `state` (MW15)
- Coil 26: `motor_running`
- Coil 27: `brake_engaged`

---

#### Challenge 8: Position Teleporter
**Difficulty:** Hard | **Points:** 350 | **Flag:** `FLAG{T3L3P0RT4T10N_1S_R34L}`

```bash
python3 challenge_08_position_teleport.py <PLC_IP> [PORT]
```

**Objective:** Skip Event 6 by teleporting position

**Solution:**
- Wait until position is ~195
- Write position 245+ to register 1
- This skips Event 6 zone (201-240)
- Verify with `event_6_counter` (register 1048)

**Key Addresses:**
- Register 1: `current_position`
- Register 1048: `event_6_counter` (MW25)

---

### Expert Challenges (400-500 points)

#### Challenge 9: Total Domination
**Difficulty:** Expert | **Points:** 400 | **Flag:** `FLAG{Z0N3_0WN3RSHIP_C0MPL3T3}`

```bash
python3 challenge_09_total_domination.py <PLC_IP> [PORT]
```

**Objective:** Control all 3 zones simultaneously with specific states

**Solution:**
- Required configuration:
  - Zone 1: DISABLED (coil 5 = FALSE)
  - Zone 2: ENABLED (coil 6 = TRUE)
  - Zone 3: DISABLED (coil 7 = FALSE)
- Must maintain while state = 2 (RUNNING)
- Hold for 5+ seconds

**Key Addresses:**
- Coils 5-7: `zone_1/2/3_enable`
- Register 1039: `state`
- Register 1054: `alarm_register` (MW30)

---

#### Challenge 10: Ghost in the Machine
**Difficulty:** Expert | **Points:** 500 | **Flag:** `FLAG{UND3T3CT4BL3_0P3R4T0R}`

```bash
python3 challenge_10_ghost_mode.py <PLC_IP> [PORT]
```

**Objective:** Complete a full lap with 3+ modifications and zero detection

**Solution:**
- Must change: speed, event enable, zone enable (min 3 actions)
- Requirements:
  - `alarm_register` (1054) stays at 0
  - `stealth_counter` (1055) stays at 0
  - `cycle_counter` (2051) increments by 1
- Perfect timing and smooth transitions required

**Key Addresses:**
- Register 2051: `cycle_counter` (MD3 - DINT)
- Register 1054: `alarm_register` (MW30)
- Register 1055: `stealth_counter` (MW31)

---

## Complete Modbus Address Reference

### Coils (Digital I/O)

| Address | Name | Description |
|---------|------|-------------|
| 0 | master_enable | System master enable |
| 1 | start_command | Start ride |
| 2 | stop_command | Stop ride |
| 3 | emergency_stop_button | E-Stop trigger |
| 4 | safety_gate_closed | Safety gate status |
| 5-7 | zone_1/2/3_enable | Zone enable/disable |
| 8-16 | event_1-9_enable | Event enable/disable |
| 17-25 | event_1-9_active | Event active status (RO) |
| 26 | motor_running | Motor status (RO) |
| 27 | brake_engaged | Brake status (RO) |
| 28 | flash_light | Flash light status (RO) |
| 29 | alert_active | Alert status (RO) |
| 30 | safety_ok | Safety interlock status (RO) |

### Registers (16-bit)

| Address | Name | Description |
|---------|------|-------------|
| 0 | speed_setpoint | Speed 0-100% (IW0) |
| 1 | current_position | Position 0-360 (QW1) |
| 2 | current_speed | Actual speed (QW2) |
| 10-12 | zone_1/2/3_position | Zone indicators (QW10-12) |
| 1029 | last_error_code | Last error (MW5) |
| 1039 | state | State machine (MW15) |
| 1044-1052 | event_1-9_counter | Event counters (MW20-28) |
| 1054 | alarm_register | Alarm bitfield (MW30) |
| 1055 | stealth_counter | Stealth detection (MW31) |

### DINT Registers (32-bit)

| Address | Name | Description |
|---------|------|-------------|
| 2050 | runtime_hours | Runtime hours (MD2) |
| 2051 | cycle_counter | Total laps (MD3) |

---

## Event Position Ranges

| Event | Position | Zone | Description |
|-------|----------|------|-------------|
| 1 | 0-40 | 1 | Loading Gate |
| 2 | 41-80 | 1 | Safety Interlock |
| 3 | 81-120 | 1 | Launch Accelerator |
| 4 | 121-160 | 2 | Photo Flash |
| 5 | 161-200 | 2 | Mid-Course Brake |
| 6 | 201-240 | 2 | Track Switch |
| 7 | 241-280 | 3 | Final Brake |
| 8 | 281-320 | 3 | Station Approach |
| 9 | 321-360 | 3 | Unload Platform |

---

## State Machine Values

| Value | State | Description |
|-------|-------|-------------|
| 0 | IDLE | Stopped, waiting for start |
| 1 | STARTING | Warmup sequence |
| 2 | RUNNING | Normal operation |
| 3 | STOPPING | Shutdown sequence |
| 4 | EMERGENCY | E-Stop activated |

---

## Error Codes

| Code | Description |
|------|-------------|
| 0 | No Error |
| 100 | Emergency Stop Activated |
| 201 | Safety Interlock Failure (Event 2) |
| 202 | Speed Violation in Brake Zone (Event 5) |
| 203 | Speed Violation in Final Brake (Event 7) |
| 204 | Speed Violation in Station Approach (Event 8) |
| 210-212 | Safety failures on start |
| 220 | Safety lost during starting |
| 230-232 | Zone disabled during operation |

---

## Usage Tips

### Running Challenges

1. Start the OpenPLC server with the new ST file
2. Open the HMI web interface
3. Start a ride session
4. Run the appropriate challenge script
5. Check the CTF dashboard for completion

### Common Modbus Operations

```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('134.199.202.235', port=502)
client.connect()

# Read coils (digital)
result = client.read_coils(address, count)
values = result.bits

# Write coil
client.write_coil(address, True/False)

# Read holding registers (16-bit)
result = client.read_holding_registers(address, count)
values = result.registers

# Write register
client.write_register(address, value)

client.close()
```

### DINT (32-bit) Handling

```python
# Reading DINT (uses 2 consecutive registers)
result = client.read_holding_registers(2051, 2)  # cycle_counter
high = result.registers[0]
low = result.registers[1]
dint_value = (high << 16) | low

# Writing DINT
high = (value >> 16) & 0xFFFF
low = value & 0xFFFF
client.write_registers(2051, [high, low])
```

---

## Learning Objectives

These challenges demonstrate:
1. **Modbus TCP Protocol** - Industrial protocol fundamentals
2. **PLC Memory Structure** - Coils, registers, DINT values
3. **State Machine Attacks** - Direct state manipulation
4. **Timing Attacks** - Exploiting scan cycle timing
5. **Stealth Techniques** - Avoiding detection systems
6. **Multi-Stage Attacks** - Coordinating complex sequences

---

## Security Implications

Real ICS/SCADA systems face these threats:
- **No Authentication**: Modbus has no built-in auth
- **No Encryption**: All traffic is cleartext
- **Direct Access**: Any client can read/write any address
- **State Manipulation**: Critical systems can be forced into unsafe states
- **Timing Exploitation**: Scan cycles create race conditions

### Defensive Measures

1. Network segmentation & firewalls
2. VPN/TLS encryption overlays
3. Authentication gateways
4. Anomaly detection systems
5. Independent safety systems
6. Physical security controls

---

**⚠️ Educational Use Only**

These scripts are for authorized security research and education in controlled lab environments. Never use these techniques against production systems or systems you don't own/control.

---

## References

- [Modbus TCP Specification](http://www.modbus.org/)
- [OpenPLC Documentation](https://autonomylogic.com/)
- [ICS-CERT Advisories](https://www.cisa.gov/ics)
- [NIST ICS Security Guide](https://csrc.nist.gov/publications/detail/sp/800-82/rev-2/final)
