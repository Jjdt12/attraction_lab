"""
Modbus Address Mapping for Attraction Control System
Matches the OpenPLC Structured Text (ST) variable mappings

Modbus Address Spaces in OpenPLC:
- Coils (%QX):              0-65535  (Read/Write digital)
- Input Registers (%IW):    0-65535  (Read/Write 16-bit)
- Holding Registers (%QW):  0-65535  (Read/Write 16-bit)
- Memory Words (%MW):       1024+    (Offset by 1024 in holding registers)
- Double Words (%MD):       2048+    (Offset by 2048, uses 2 consecutive registers)
"""

# ============================================
# COILS (%QX) - Digital I/O
# ============================================
COILS = {
    # Core Control
    'master_enable': 0,              # %QX0.0
    'start_command': 1,              # %QX0.1
    'stop_command': 2,               # %QX0.2
    'emergency_stop_button': 3,      # %QX0.3
    'safety_gate_closed': 4,         # %QX0.4

    # Zone Enable/Disable
    'zone_1_enable': 5,              # %QX0.5
    'zone_2_enable': 6,              # %QX0.6
    'zone_3_enable': 7,              # %QX0.7

    # Event Enable/Disable (9 events)
    'event_1_enable': 8,             # %QX0.8  - Loading Gate
    'event_2_enable': 9,             # %QX0.9  - Safety Interlock
    'event_3_enable': 10,            # %QX0.10 - Launch Accelerator
    'event_4_enable': 11,            # %QX0.11 - Photo Flash
    'event_5_enable': 12,            # %QX0.12 - Mid-Course Brake
    'event_6_enable': 13,            # %QX0.13 - Track Switch
    'event_7_enable': 14,            # %QX0.14 - Final Brake
    'event_8_enable': 15,            # %QX0.15 - Station Approach
    'event_9_enable': 16,            # %QX0.16 - Unload Platform

    # Event Active States (READ-ONLY outputs)
    'event_1_active': 17,            # %QX0.17
    'event_2_active': 18,            # %QX0.18
    'event_3_active': 19,            # %QX0.19
    'event_4_active': 20,            # %QX0.20
    'event_5_active': 21,            # %QX0.21
    'event_6_active': 22,            # %QX0.22
    'event_7_active': 23,            # %QX0.23
    'event_8_active': 24,            # %QX0.24
    'event_9_active': 25,            # %QX0.25

    # System Outputs
    'motor_running': 26,             # %QX3.2
    'brake_engaged': 27,             # %QX3.3
    'flash_light': 28,               # %QX3.4
    'alert_active': 29,              # %QX3.5
    'safety_ok': 30,                 # %QX3.6
    'safety_plc_ready': 31,          # %QX3.7
    'effects_plc_ready': 32,         # %QX4.0

    # Proximity Sensors (READ-ONLY outputs from Main PLC)
    # %QX5.0 through %QX6.0 = coils 40-48
    'proximity_sensor_1': 40,        # %QX5.0 - Sensor at pos 0-2 (Loading Gate)
    'proximity_sensor_2': 41,        # %QX5.1 - Sensor at pos 3-5 (Safety Interlock)
    'proximity_sensor_3': 42,        # %QX5.2 - Sensor at pos 6-8 (Launch)
    'proximity_sensor_4': 43,        # %QX5.3 - Sensor at pos 9-11 (Photo Flash)
    'proximity_sensor_5': 44,        # %QX5.4 - Sensor at pos 12-14 (Mid Brake)
    'proximity_sensor_6': 45,        # %QX5.5 - Sensor at pos 15-17 (Track Switch)
    'proximity_sensor_7': 46,        # %QX5.6 - Sensor at pos 18-20 (Final Brake)
    'proximity_sensor_8': 47,        # %QX5.7 - Sensor at pos 21-23 (Station Approach)
    'proximity_sensor_9': 48,        # %QX6.0 - Sensor at pos 24-26 (Unload Platform)
}

# ============================================
# INPUT REGISTERS (%IW) - 16-bit inputs
# ============================================
INPUT_REGISTERS = {
    # MAIN PLC now uses %MW instead of %IW
}

# ============================================
# HOLDING REGISTERS - All converted to %MW
# %MW addresses start at Modbus 1024
# ============================================
HOLDING_REGISTERS = {
    # MAIN PLC - converted from %IW/%QW to %MW
    'speed_setpoint': 1024 + 0,      # %MW0 (was %IW0)
    'current_position': 1024 + 1,    # %MW1 (was %QW1)
    'current_speed': 1024 + 2,       # %MW2 (was %QW2)

    # Zone Position Indicators
    'zone_1_position': 1024 + 10,    # %MW10 (was %QW10)
    'zone_2_position': 1024 + 11,    # %MW11 (was %QW11)
    'zone_3_position': 1024 + 12,    # %MW12 (was %QW12)

    # State and diagnostics
    'last_error_code': 1024 + 5,     # %MW5
    'state': 1024 + 15,               # %MW15 - State machine

    # Event Counters
    'event_1_counter': 1024 + 20,    # %MW20
    'event_2_counter': 1024 + 21,    # %MW21
    'event_3_counter': 1024 + 22,    # %MW22
    'event_4_counter': 1024 + 23,    # %MW23
    'event_5_counter': 1024 + 24,    # %MW24
    'event_6_counter': 1024 + 25,    # %MW25
    'event_7_counter': 1024 + 26,    # %MW26
    'event_8_counter': 1024 + 27,    # %MW27
    'event_9_counter': 1024 + 28,    # %MW28

    # System Registers
    'alarm_register': 1024 + 30,     # %MW30 (bitfield for alarms)
    'stealth_counter': 1024 + 31,    # %MW31 (counts unauthorized actions)
}

# ============================================
# DOUBLE-WORD REGISTERS - Converted to two %MW
# (DINT split into low/high INT registers)
# ============================================
HOLDING_REGISTERS_DINT = {
    'runtime_hours_low': 1024 + 3,   # %MW3 (was %MD2 low word)
    'runtime_hours_high': 1024 + 4,  # %MW4 (was %MD2 high word)
    'cycle_counter_low': 1024 + 6,   # %MW6 (was %MD3 low word)
    'cycle_counter_high': 1024 + 7,  # %MW7 (was %MD3 high word)
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_coil_address(name: str) -> int:
    """Get Modbus coil address for a boolean variable"""
    return COILS.get(name)

def get_input_register_address(name: str) -> int:
    """Get Modbus input register address"""
    return INPUT_REGISTERS.get(name)

def get_holding_register_address(name: str) -> int:
    """Get Modbus holding register address"""
    return HOLDING_REGISTERS.get(name)

def get_dint_register_address(name: str) -> int:
    """Get Modbus double-word register address"""
    return HOLDING_REGISTERS_DINT.get(name)

def get_all_addresses():
    """Return all address mappings for documentation"""
    return {
        'coils': COILS,
        'input_registers': INPUT_REGISTERS,
        'holding_registers': HOLDING_REGISTERS,
        'dint_registers': HOLDING_REGISTERS_DINT,
    }

# ============================================
# ADDRESS RANGES TO POLL
# ============================================
COIL_RANGE = (0, 33)  # Read coils 0-32 (all coils including PLC ready signals)
INPUT_REGISTER_RANGE = (0, 1)  # Read input register 0 (speed_setpoint)
HOLDING_REGISTER_RANGES = [
    (1, 2),  # %QW1-QW2 (current_position, current_speed)
    (10, 3),  # %QW10-QW12 (zone_1_position, zone_2_position, zone_3_position)
    (1024 + 5, 1),  # %MW5 (last_error_code)
    (1024 + 15, 1),  # %MW15 (STATE)
    (1024 + 20, 9),  # %MW20-MW28 (event counters)
    (1024 + 30, 2),  # %MW30-MW31 (alarm_register, stealth_counter)
    (2048 + 2, 4),  # %MD2-MD3 (runtime_hours, cycle_counter - each is 2 registers)
]

# ============================================
# EVENT POSITION RANGES
# ============================================
EVENT_POSITIONS = {
    'event_1': (0, 40),        # Loading Gate
    'event_2': (41, 80),       # Safety Interlock
    'event_3': (81, 120),      # Launch Accelerator
    'event_4': (121, 160),     # Photo Flash
    'event_5': (161, 200),     # Mid-Course Brake
    'event_6': (201, 240),     # Track Switch
    'event_7': (241, 280),     # Final Brake
    'event_8': (281, 320),     # Station Approach
    'event_9': (321, 360),     # Unload Platform
}

# ============================================
# ZONE POSITION RANGES
# ============================================
ZONE_POSITIONS = {
    'zone_1': (0, 120),
    'zone_2': (121, 240),
    'zone_3': (241, 360),
}

# ============================================
# STATE MACHINE VALUES
# ============================================
STATE_MACHINE = {
    0: 'IDLE',
    1: 'STARTING',
    2: 'RUNNING',
    3: 'STOPPING',
    4: 'EMERGENCY',
}

# ============================================
# ERROR CODES
# ============================================
ERROR_CODES = {
    0: 'No Error',
    100: 'Emergency Stop Activated',
    201: 'Safety Interlock Failure (Event 2)',
    202: 'Speed Violation in Brake Zone (Event 5)',
    203: 'Speed Violation in Final Brake (Event 7)',
    204: 'Speed Violation in Station Approach (Event 8)',
    210: 'Safety Gate Open on Start',
    211: 'Emergency Stop Active on Start',
    212: 'Master Enable Inactive on Start',
    220: 'Safety Lost During Starting',
    230: 'Zone 1 Disabled During Operation',
    231: 'Zone 2 Disabled During Operation',
    232: 'Zone 3 Disabled During Operation',
}

if __name__ == '__main__':
    """Print address map for reference"""
    print("=" * 60)
    print("ATTRACTION CONTROL - MODBUS ADDRESS MAP")
    print("=" * 60)

    print("\n🔵 COILS (Digital I/O)")
    print("-" * 60)
    for name, addr in sorted(COILS.items(), key=lambda x: x[1]):
        print(f"  {addr:3d} - {name}")

    print("\n📥 INPUT REGISTERS")
    print("-" * 60)
    for name, addr in sorted(INPUT_REGISTERS.items(), key=lambda x: x[1]):
        print(f"  {addr:4d} - {name}")

    print("\n📤 HOLDING REGISTERS")
    print("-" * 60)
    for name, addr in sorted(HOLDING_REGISTERS.items(), key=lambda x: x[1]):
        print(f"  {addr:4d} - {name}")

    print("\n📊 DINT REGISTERS (32-bit)")
    print("-" * 60)
    for name, addr in sorted(HOLDING_REGISTERS_DINT.items(), key=lambda x: x[1]):
        print(f"  {addr:4d} - {name}")

    print("\n🎯 EVENT POSITIONS")
    print("-" * 60)
    for name, (start, end) in EVENT_POSITIONS.items():
        print(f"  {name}: {start:3d}-{end:3d}")

    print("\n🌍 ZONE POSITIONS")
    print("-" * 60)
    for name, (start, end) in ZONE_POSITIONS.items():
        print(f"  {name}: {start:3d}-{end:3d}")

    print("\n🔄 STATE MACHINE")
    print("-" * 60)
    for code, desc in STATE_MACHINE.items():
        print(f"  {code} - {desc}")

    print("\n⚠️  ERROR CODES")
    print("-" * 60)
    for code, desc in sorted(ERROR_CODES.items()):
        print(f"  {code:3d} - {desc}")

    print("\n" + "=" * 60)
