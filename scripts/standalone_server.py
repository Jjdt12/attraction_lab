"""
Standalone HMI Server - Serves Web Interface + WebSocket + Modbus
All-in-one solution for the Attraction Technology Lab

Run: python standalone_server.py
Access: http://localhost:3000
"""

import asyncio
import json
import os
import mimetypes
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import websockets
from aiohttp import web
from pymodbus.client import ModbusTcpClient
from dotenv import load_dotenv

from plc_modbus_map import (
    COILS, INPUT_REGISTERS, HOLDING_REGISTERS, HOLDING_REGISTERS_DINT,
    COIL_RANGE, HOLDING_REGISTER_RANGES
)

# Get project paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent

# Load environment variables from project root
load_dotenv(PROJECT_DIR / '.env')

# Configuration
HTTP_PORT = int(os.getenv("HTTP_PORT", "3000"))
WS_PORT = int(os.getenv("WS_PORT", "8765"))
HOST = os.getenv("WS_HOST", "0.0.0.0")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

TRACK_LENGTH = 9
EVENT_POS = 5

# Multi-PLC Configuration
PLC_CONFIGS = {
    'MAIN': {'host': 'localhost', 'port': 502, 'name': 'Main Control'},
    'SAFETY': {'host': 'localhost', 'port': 503, 'name': 'Safety Systems'},
    'EFFECTS': {'host': 'localhost', 'port': 504, 'name': 'Show Effects'},
}

# Global state
modbus_clients: dict[str, ModbusTcpClient] = {}
plc_connected_status: dict[str, bool] = {}
connected_clients = set()
previous_coil_states = {}
previous_register_states = {}
polling_task = None

# Backward compatibility - default to MAIN PLC
modbus_client: Optional[ModbusTcpClient] = None
current_plc_host: Optional[str] = None
current_plc_port: Optional[int] = None
is_plc_connected: bool = False

# Dist directory path
DIST_DIR = PROJECT_DIR / "dist"

# Create reverse lookup dictionaries for names
COIL_NAMES = {v: k for k, v in COILS.items()}
REGISTER_NAMES = {v: k for k, v in {**HOLDING_REGISTERS, **HOLDING_REGISTERS_DINT}.items()}


def init_modbus(host: str, port: int):
    """Initialize and connect to Modbus PLC"""
    global modbus_client, current_plc_host, current_plc_port, is_plc_connected

    # Close existing connection if any
    if modbus_client:
        try:
            modbus_client.close()
        except:
            pass
        is_plc_connected = False

    try:
        modbus_client = ModbusTcpClient(host=host, port=port)
        if modbus_client.connect():
            current_plc_host = host
            current_plc_port = port
            is_plc_connected = True
            print(f"✓ Connected to PLC at {host}:{port}")
            return True
        else:
            print(f"✗ Failed to connect to PLC at {host}:{port}")
            current_plc_host = None
            current_plc_port = None
            is_plc_connected = False
            return False
    except Exception as e:
        print(f"✗ Error connecting to PLC: {e}")
        current_plc_host = None
        current_plc_port = None
        is_plc_connected = False
        return False


def connect_to_plc(plc_id: str) -> bool:
    """Connect to a specific PLC by ID"""
    global modbus_clients, plc_connected_status, modbus_client, current_plc_host, current_plc_port, is_plc_connected

    if plc_id not in PLC_CONFIGS:
        print(f"✗ Unknown PLC ID: {plc_id}")
        return False

    config = PLC_CONFIGS[plc_id]

    try:
        # Close existing connection for this PLC if any
        if plc_id in modbus_clients:
            try:
                modbus_clients[plc_id].close()
            except:
                pass

        # Create new connection
        client = ModbusTcpClient(host=config['host'], port=config['port'])
        if client.connect():
            modbus_clients[plc_id] = client
            plc_connected_status[plc_id] = True
            print(f"✓ Connected to {config['name']} PLC at {config['host']}:{config['port']}")

            # If this is the MAIN PLC, also set backward compatibility variables
            if plc_id == 'MAIN':
                modbus_client = client
                current_plc_host = config['host']
                current_plc_port = config['port']
                is_plc_connected = True

            return True
        else:
            plc_connected_status[plc_id] = False
            print(f"✗ Failed to connect to {config['name']} PLC at {config['host']}:{config['port']}")
            return False
    except Exception as e:
        plc_connected_status[plc_id] = False
        print(f"✗ Error connecting to {config['name']} PLC: {e}")
        return False


def connect_to_all_plcs() -> dict:
    """Connect to all configured PLCs"""
    results = {}
    for plc_id in PLC_CONFIGS.keys():
        results[plc_id] = connect_to_plc(plc_id)

        # Initialize safety ready registers after MAIN PLC connects
        if plc_id == 'MAIN' and results[plc_id] and modbus_clients.get('MAIN'):
            try:
                # Set safety_plc_ready_reg (MW102) = 1 - write to HOLDING register
                result1 = modbus_clients['MAIN'].write_registers(address=102, values=[1])
                # Set effects_plc_ready_reg (MW103) = 1 - write to HOLDING register
                result2 = modbus_clients['MAIN'].write_registers(address=103, values=[1])
                if not result1.isError() and not result2.isError():
                    print("✓ [INIT] Initialized safety and effects ready input registers on MAIN PLC")
                else:
                    print(f"✗ [INIT] Error writing input registers: {result1}, {result2}")
            except Exception as e:
                print(f"✗ [INIT] Failed to initialize ready registers: {e}")

    return results


def read_coil_from_plc(plc_id: str, address: int) -> dict:
    """Read from Modbus coil on specific PLC"""
    if plc_id not in modbus_clients or not plc_connected_status.get(plc_id):
        return {"success": False, "error": f"{plc_id} PLC not connected", "value": False}

    try:
        client = modbus_clients[plc_id]
        result = client.read_coils(address=address, count=1)
        if result and not result.isError():
            return {"success": True, "address": address, "value": result.bits[0], "plc": plc_id}
        else:
            return {"success": False, "error": "Read failed", "value": False, "plc": plc_id}
    except Exception as e:
        return {"success": False, "error": str(e), "value": False, "plc": plc_id}


def read_register_from_plc(plc_id: str, address: int, count: int = 1) -> dict:
    """Read from Modbus holding register(s) on specific PLC"""
    if plc_id not in modbus_clients or not plc_connected_status.get(plc_id):
        return {"success": False, "error": f"{plc_id} PLC not connected", "value": 0, "values": []}

    try:
        client = modbus_clients[plc_id]
        result = client.read_holding_registers(address=address, count=count)
        if result and not result.isError():
            if count == 1:
                return {"success": True, "address": address, "value": result.registers[0], "plc": plc_id}
            else:
                return {"success": True, "address": address, "values": result.registers[:count], "plc": plc_id}
        else:
            return {"success": False, "error": "Read failed", "value": 0, "values": [], "plc": plc_id}
    except Exception as e:
        return {"success": False, "error": str(e), "value": 0, "values": [], "plc": plc_id}


def read_input_register(address: int, count: int = 1) -> dict:
    """Read from Modbus input registers"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected", "value": 0, "values": []}

    try:
        result = modbus_client.read_input_registers(address=address, count=count)
        if result and not result.isError():
            if count == 1:
                return {"success": True, "address": address, "value": result.registers[0]}
            else:
                return {"success": True, "address": address, "values": result.registers[:count]}
        else:
            return {"success": False, "error": "Read failed", "value": 0, "values": []}
    except Exception as e:
        return {"success": False, "error": str(e), "value": 0, "values": []}


async def log_modbus_operation(plc: str, operation: str, address: int, value=None, count=None):
    """Broadcast Modbus operation to connected clients for network monitoring"""
    await broadcast({
        "type": "modbus_operation",
        "timestamp": int(time.time() * 1000),
        "plc": plc,
        "operation": operation,
        "address": address,
        "value": value,
        "count": count,
    })


def write_input_register_to_plc(plc_id: str, address: int, value: int) -> dict:
    """Write to Modbus holding register on specific PLC (for input register simulation)"""
    if plc_id not in modbus_clients or not plc_connected_status.get(plc_id):
        return {"success": False, "error": f"{plc_id} PLC not connected"}

    try:
        client = modbus_clients[plc_id]
        result = client.write_register(address=address, value=value)
        if result and not result.isError():
            asyncio.create_task(log_modbus_operation(plc_id, "WRITE_HOLDING", address, value))
            return {"success": True, "address": address, "value": value, "plc": plc_id}
        else:
            return {"success": False, "error": "Write failed", "plc": plc_id}
    except Exception as e:
        return {"success": False, "error": str(e), "plc": plc_id}


def write_coil(address: int, value: bool) -> dict:
    """Write to Modbus coil - writes to MAIN and SAFETY PLCs for safety-related coils"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected"}

    # Safety-related coils that need to be mirrored to SAFETY PLC
    safety_coils = [0, 3, 4]  # master_enable, emergency_stop, safety_gate_closed

    try:
        coil_name = COIL_NAMES.get(address, f"coil_{address}")
        print(f"✍️  [WRITE] Writing {coil_name} (coil {address}) = {value}")

        # Always write to MAIN PLC
        result = modbus_client.write_coil(address=address, value=value)
        if result and not result.isError():
            print(f"✅ [WRITE] Success: {coil_name} = {value}")
            asyncio.create_task(log_modbus_operation("MAIN", "WRITE_COIL", address, value))

            # Safety coils are now mirrored via Bridge 3 as holding registers
            # No need to mirror here anymore

            return {"success": True, "address": address, "value": value}
        else:
            print(f"❌ [WRITE] Failed: {coil_name}")
            return {"success": False, "error": "Write failed"}
    except Exception as e:
        print(f"❌ [WRITE] Exception writing {coil_name}: {e}")
        return {"success": False, "error": str(e)}


def read_coil(address: int) -> dict:
    """Read from Modbus coil"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected", "value": False}

    try:
        result = modbus_client.read_coils(address=address, count=1)
        if result and not result.isError():
            return {"success": True, "address": address, "value": result.bits[0]}
        else:
            return {"success": False, "error": "Read failed", "value": False}
    except Exception as e:
        return {"success": False, "error": str(e), "value": False}


def write_register(address: int, value: int) -> dict:
    """Write to Modbus holding register"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected"}

    try:
        result = modbus_client.write_register(address=address, value=value)
        if result and not result.isError():
            asyncio.create_task(log_modbus_operation("MAIN", "WRITE_HOLDING", address, value))
            return {"success": True, "address": address, "value": value}
        else:
            return {"success": False, "error": "Write failed"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def read_register(address: int, count: int = 1) -> dict:
    """Read from Modbus holding register(s)"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected", "value": 0, "values": []}

    try:
        result = modbus_client.read_holding_registers(address=address, count=count)
        if result and not result.isError():
            if count == 1:
                return {"success": True, "address": address, "value": result.registers[0]}
            else:
                return {"success": True, "address": address, "values": result.registers[:count]}
        else:
            return {"success": False, "error": "Read failed", "value": 0, "values": []}
    except Exception as e:
        return {"success": False, "error": str(e), "value": 0, "values": []}


def write_multiple_registers(address: int, values: list) -> dict:
    """Write to multiple Modbus holding registers"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected"}

    try:
        result = modbus_client.write_registers(address=address, values=values)
        if result and not result.isError():
            return {"success": True, "address": address, "count": len(values)}
        else:
            return {"success": False, "error": "Write failed"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def broadcast(message: dict):
    """Broadcast message to all connected WebSocket clients"""
    if connected_clients:
        message_str = json.dumps(message)
        await asyncio.gather(
            *[client.send(message_str) for client in connected_clients],
            return_exceptions=True
        )


async def poll_plc_coils():
    """Continuously poll PLC coils and holding registers from all PLCs, broadcast changes"""
    global previous_coil_states, previous_register_states

    print("🔄 Started multi-PLC polling task")

    first_poll = True

    while True:
        try:
            # Inter-PLC Communication Bridge: Run FIRST before reads
            # Use INPUT REGISTERS instead of coils (OpenPLC coil limit is 0-27)
            if modbus_client and is_plc_connected:
                # Bridge 1: Read safety_ok_reg from SAFETY PLC holding register, write to MAIN PLC input register
                if 'SAFETY' in modbus_clients and plc_connected_status.get('SAFETY'):
                    try:
                        safety_result = read_register_from_plc('SAFETY', 100, 1)
                        if safety_result["success"]:
                            safety_ok_value = safety_result["value"]
                            try:
                                # Write to HOLDING register (MW102 = Modbus address 102)
                                result = modbus_client.write_registers(address=102, values=[safety_ok_value])
                                if result and not result.isError():
                                    if safety_ok_value != previous_register_states.get('safety_ready_bridge'):
                                        print(f"🔗 [BRIDGE] safety_ok from SAFETY MW100 -> MAIN MW102: {safety_ok_value}")
                                        previous_register_states['safety_ready_bridge'] = safety_ok_value
                                else:
                                    if first_poll:
                                        print(f"❌ [BRIDGE] Failed to write MW102 to MAIN: {result}")
                            except Exception as e:
                                if first_poll:
                                    print(f"❌ [BRIDGE] Exception writing MW102: {e}")
                        else:
                            if first_poll:
                                print(f"❌ [BRIDGE] Failed to read MW100 from SAFETY: {safety_result}")
                    except Exception as e:
                        if first_poll:
                            print(f"❌ [BRIDGE] Exception reading SAFETY MW100: {e}")

                # Bridge 2: Set effects_plc_ready to TRUE (EFFECTS PLC always ready)
                try:
                    # Write to HOLDING register (MW103 = Modbus address 103)
                    result = modbus_client.write_registers(address=103, values=[1])
                    if result and not result.isError():
                        if previous_register_states.get('effects_ready_bridge') != 1:
                            print(f"🔗 [BRIDGE] effects_plc_ready set on MAIN MW103: 1")
                            previous_register_states['effects_ready_bridge'] = 1
                except Exception as e:
                    pass

                # Bridge 3: Copy control signals from MAIN to SAFETY PLC
                if 'SAFETY' in modbus_clients and plc_connected_status.get('SAFETY'):
                    try:
                        # Read control signals from MAIN PLC
                        master_enable = read_coil_from_plc('MAIN', 0)
                        estop = read_coil_from_plc('MAIN', 3)
                        gate = read_coil_from_plc('MAIN', 4)

                        # Write to SAFETY PLC as holding registers (MW0, MW3, MW4)
                        if master_enable['success']:
                            modbus_clients['SAFETY'].write_register(0, 1 if master_enable['value'] else 0)
                        if estop['success']:
                            modbus_clients['SAFETY'].write_register(3, 1 if estop['value'] else 0)
                        if gate['success']:
                            modbus_clients['SAFETY'].write_register(4, 1 if gate['value'] else 0)

                        # Diagnostic: Read back Safety PLC registers and MW100
                        if first_poll:
                            safety_master = read_register_from_plc('SAFETY', 0, 1)
                            safety_estop = read_register_from_plc('SAFETY', 3, 1)
                            safety_gate = read_register_from_plc('SAFETY', 4, 1)
                            safety_mw100 = read_register_from_plc('SAFETY', 100, 1)
                            print(f"🔍 [SAFETY DIAGNOSTIC] Registers: MW0={safety_master.get('value')}, MW3={safety_estop.get('value')}, MW4={safety_gate.get('value')} | MW100={safety_mw100.get('value')}")
                    except Exception as e:
                        pass

                # Bridge 4: Copy MAIN position/speed/motor to SAFETY PLC
                if 'SAFETY' in modbus_clients and plc_connected_status.get('SAFETY'):
                    try:
                        # Read from MAIN PLC holding registers
                        position = read_register_from_plc('MAIN', 1, 1)  # current_position at %QW1
                        speed = read_register_from_plc('MAIN', 2, 1)  # current_speed at %QW2
                        motor = read_coil_from_plc('MAIN', 26)  # motor_running at %QX3.2 (bit 26)

                        # Write to SAFETY PLC %MW10 and %MW11 (Modbus addresses 1034, 1035)
                        if position['success']:
                            result = modbus_clients['SAFETY'].write_register(1034, position['value'])  # %MW10
                            # Log all position writes (no lag checking)
                            print(f"🔗 [BRIDGE] position {position['value']} -> SAFETY MW10")
                        if speed['success']:
                            modbus_clients['SAFETY'].write_register(1035, speed['value'])  # %MW11
                        if motor['success']:
                            modbus_clients['SAFETY'].write_coil(50, motor['value'])  # %MX50 (memory bit)
                    except Exception as e:
                        print(f"⚠️ [BRIDGE] Error in Bridge 4: {e}")

                # Bridge 5: Copy MAIN position to EFFECTS PLC
                if 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                    try:
                        # Read from MAIN PLC
                        position = read_register_from_plc('MAIN', 1, 1)  # current_position

                        # Write to EFFECTS PLC %MW10 (Modbus address 1034)
                        if position['success']:
                            result = modbus_clients['EFFECTS'].write_register(1034, position['value'])  # %MW10

                            # Log all position writes (no lag checking)
                            print(f"🔗 [BRIDGE] position {position['value']} -> EFFECTS MW10")
                    except Exception as e:
                        print(f"⚠️ [BRIDGE] Error in Bridge 5: {e}")

                # Bridge 6: Copy SAFETY event signals to EFFECTS PLC
                if 'SAFETY' in modbus_clients and plc_connected_status.get('SAFETY') and 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                    try:
                        # Read from SAFETY PLC
                        event1 = read_coil_from_plc('SAFETY', 17)  # event_1_active at %QX2.1
                        event4 = read_coil_from_plc('SAFETY', 20)  # event_4_active at %QX2.4

                        # Write to EFFECTS PLC holding registers
                        if event1['success']:
                            val1 = 1 if event1['value'] else 0
                            modbus_clients['EFFECTS'].write_register(70, val1)  # %MW70
                        if event4['success']:
                            val4 = 1 if event4['value'] else 0
                            modbus_clients['EFFECTS'].write_register(71, val4)  # %MW71
                    except Exception as e:
                        pass

                # Bridge 8: Copy event_enable coils from MAIN to EFFECTS PLC holding registers
                if 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                    try:
                        # Read event_enable from MAIN PLC (coils 8-16)
                        for i in range(1, 10):  # Events 1-9
                            coil_addr = 7 + i  # event_1_enable = coil 8, etc.
                            enable = read_coil_from_plc('MAIN', coil_addr)
                            if enable['success']:
                                # Write to EFFECTS PLC %MW100-%MW108 (Modbus addresses 1124-1132)
                                mw_addr = 99 + i  # event_1 = MW100, event_9 = MW108
                                modbus_addr = 1024 + mw_addr  # MW registers start at Modbus address 1024
                                val = 1 if enable['value'] else 0
                                modbus_clients['EFFECTS'].write_register(modbus_addr, val)
                    except Exception as e:
                        print(f"⚠️ [BRIDGE] Error in Bridge 8: {e}")

                # Bridge 9: Copy proximity sensors from MAIN to SAFETY PLC
                if 'SAFETY' in modbus_clients and plc_connected_status.get('SAFETY'):
                    try:
                        # Read proximity sensors from MAIN PLC (coils 40-48)
                        for i in range(1, 10):  # Sensors 1-9
                            coil_addr = 39 + i  # proximity_sensor_1 = coil 40, etc.
                            sensor = read_coil_from_plc('MAIN', coil_addr)
                            if sensor['success']:
                                # Write to SAFETY PLC %MW80-%MW88 (Modbus addresses 1104-1112)
                                mw_addr = 79 + i  # sensor_1 = MW80, sensor_9 = MW88
                                modbus_addr = 1024 + mw_addr  # MW registers start at Modbus address 1024
                                val = 1 if sensor['value'] else 0
                                modbus_clients['SAFETY'].write_register(modbus_addr, val)
                    except Exception as e:
                        print(f"⚠️ [BRIDGE] Error in Bridge 9 (SAFETY proximity): {e}")

                # Bridge 10: Copy proximity sensors from MAIN to EFFECTS PLC
                if 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                    try:
                        # Read proximity sensors from MAIN PLC (coils 40-48)
                        for i in range(1, 10):  # Sensors 1-9
                            coil_addr = 39 + i  # proximity_sensor_1 = coil 40, etc.
                            sensor = read_coil_from_plc('MAIN', coil_addr)
                            if sensor['success']:
                                # Write to EFFECTS PLC %MW80-%MW88 (Modbus addresses 1104-1112)
                                mw_addr = 79 + i  # sensor_1 = MW80, sensor_9 = MW88
                                modbus_addr = 1024 + mw_addr  # MW registers start at Modbus address 1024
                                val = 1 if sensor['value'] else 0
                                modbus_clients['EFFECTS'].write_register(modbus_addr, val)

                                # Log active sensors (no lag checking)
                                if val == 1:
                                    print(f"🔗 [BRIDGE] proximity_sensor_{i} ACTIVE -> EFFECTS MW{79+i}")
                    except Exception as e:
                        print(f"⚠️ [BRIDGE] Error in Bridge 10 (EFFECTS proximity): {e}")

            # Continuous diagnostic every poll cycle (more verbose debugging)
            if modbus_client and is_plc_connected:
                if first_poll:
                    print("🔍 [DEBUG] === PLC STATE MACHINE DIAGNOSTIC ===")
                    first_poll = False

                # Read all critical values
                start_cmd = read_coil(COILS['start_command'])
                master_en = read_coil(COILS['master_enable'])
                safety_gate = read_coil(COILS['safety_gate_closed'])
                estop = read_coil(COILS['emergency_stop_button'])
                motor_run = read_coil(COILS['motor_running'])
                brake = read_coil(COILS['brake_engaged'])
                state_reg = read_register(HOLDING_REGISTERS['state'], 1)
                error_reg = read_register(HOLDING_REGISTERS['last_error_code'], 1)
                # Read HOLDING registers (MW102, MW103)
                safety_ready_reg = read_register(102, 1)
                effects_ready_reg = read_register(103, 1)

                # Print state machine status every cycle
                print(f"📊 [STATE] state={state_reg.get('value', '?')} | "
                      f"start_cmd={start_cmd.get('value', '?')} | "
                      f"master_en={master_en.get('value', '?')} | "
                      f"gate={safety_gate.get('value', '?')} | "
                      f"estop={estop.get('value', '?')} | "
                      f"safety_plc_ready_reg={safety_ready_reg.get('value', '?')} | "
                      f"effects_plc_ready_reg={effects_ready_reg.get('value', '?')} | "
                      f"motor={motor_run.get('value', '?')} | "
                      f"brake={brake.get('value', '?')} | "
                      f"error={error_reg.get('value', '?')}")

            # Poll Main PLC (backward compatibility)
            if modbus_client and is_plc_connected:
                # Poll coils using defined range
                start_coil, count_coils = COIL_RANGE
                for address in range(start_coil, start_coil + count_coils):
                    result = read_coil(address)
                    if result["success"]:
                        current_value = result["value"]
                        previous_value = previous_coil_states.get(address)

                        if previous_value is None:
                            previous_coil_states[address] = current_value
                        elif previous_value != current_value:
                            coil_name = COIL_NAMES.get(address, f"coil_{address}")
                            # Log ALL coil changes for debugging
                            print(f"🔔 [PLC] {coil_name}: {previous_value} -> {current_value}")
                            previous_coil_states[address] = current_value

                            await broadcast({
                                "type": "coil_change",
                                "address": address,
                                "name": coil_name,
                                "value": current_value,
                            })

                # Poll holding registers using defined ranges
                for start_addr, count in HOLDING_REGISTER_RANGES:
                    # Check if this is a DINT range (addresses >= 2048)
                    if start_addr >= 2048:
                        # Read DINT values (32-bit, 2 registers each)
                        for i in range(0, count, 2):
                            addr = start_addr + i
                            result = read_register(addr, 2)
                            if result["success"] and "values" in result:
                                high_word = result["values"][0]
                                low_word = result["values"][1]
                                dint_value = (high_word << 16) | low_word

                                previous_value = previous_register_states.get(f"dint_{addr}")

                                if previous_value is None:
                                    previous_register_states[f"dint_{addr}"] = dint_value
                                elif previous_value != dint_value:
                                    reg_name = REGISTER_NAMES.get(addr, f"register_{addr}")
                                    # Don't log DINT changes (too verbose)
                                    previous_register_states[f"dint_{addr}"] = dint_value

                                    await broadcast({
                                        "type": "dint_change",
                                        "address": addr,
                                        "name": reg_name,
                                        "value": dint_value,
                                    })
                    else:
                        # Read regular 16-bit registers
                        result = read_register(start_addr, count)
                        if result["success"]:
                            values = result.get("values", [result.get("value")]) if count > 1 else [result.get("value")]
                            for i, current_value in enumerate(values):
                                address = start_addr + i
                                previous_value = previous_register_states.get(address)

                                if previous_value is None:
                                    previous_register_states[address] = current_value
                                elif previous_value != current_value:
                                    reg_name = REGISTER_NAMES.get(address, f"register_{address}")
                                    # Log all register changes for debugging
                                    print(f"🔔 [PLC] {reg_name}: {previous_value} -> {current_value}")
                                    previous_register_states[address] = current_value

                                    await broadcast({
                                        "type": "register_change",
                                        "address": address,
                                        "name": reg_name,
                                        "value": current_value,
                                    })

            # Poll Effects PLC for event coils (addresses 17-25)
            if 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                EVENT_COIL_START = 17
                EVENT_COIL_COUNT = 9  # Events 1-9 (coils 17-25)

                # Log first poll
                if not previous_coil_states.get('effects_poll_started'):
                    print(f"🔍 [EFFECTS] Polling event coils {EVENT_COIL_START}-{EVENT_COIL_START + EVENT_COIL_COUNT - 1}")
                    previous_coil_states['effects_poll_started'] = True

                for address in range(EVENT_COIL_START, EVENT_COIL_START + EVENT_COIL_COUNT):
                    result = read_coil_from_plc('EFFECTS', address)
                    if result["success"]:
                        current_value = result["value"]
                        state_key = f"EFFECTS_{address}"
                        previous_value = previous_coil_states.get(state_key)

                        # Debug log first poll
                        if not previous_coil_states.get('effects_first_values_logged'):
                            event_num = address - EVENT_COIL_START + 1
                            print(f"🔍 [EFFECTS] event_{event_num}_active (coil {address}) = {current_value}")

                        if previous_value is None:
                            previous_coil_states[state_key] = current_value
                        elif previous_value != current_value:
                            event_num = address - EVENT_COIL_START + 1
                            event_name = f"event_{event_num}_active"
                            # Log all event changes for visibility
                            print(f"🎪 [EFFECTS PLC] {event_name}: {previous_value} -> {current_value}")
                            previous_coil_states[state_key] = current_value

                            await broadcast({
                                "type": "event_change",
                                "address": address,
                                "name": event_name,
                                "event_num": event_num,
                                "value": current_value,
                                "plc": "EFFECTS",
                            })

                # Mark first poll complete
                if not previous_coil_states.get('effects_first_values_logged'):
                    previous_coil_states['effects_first_values_logged'] = True
                    print("✓ [EFFECTS] First event poll complete")

                # Poll Effects PLC for actual effect output coils
                EFFECT_COILS = {
                    28: 'flash_light',          # %QX3.4
                    60: 'show_lighting_on',     # %QX7.4
                    61: 'audio_trigger_1',      # %QX7.5
                    62: 'audio_trigger_2',      # %QX7.6
                    63: 'audio_trigger_3',      # %QX7.7
                    64: 'fog_machine_on',       # %QX8.0
                    65: 'strobe_active',        # %QX8.1
                    66: 'laser_effect_on',      # %QX8.2
                }

                for address, name in EFFECT_COILS.items():
                    result = read_coil_from_plc('EFFECTS', address)
                    if result["success"]:
                        current_value = result["value"]
                        state_key = f"EFFECTS_COIL_{address}"
                        previous_value = previous_coil_states.get(state_key)

                        if previous_value is None:
                            # First time reading - broadcast initial state
                            previous_coil_states[state_key] = current_value
                            await broadcast({
                                "type": "coil_change",
                                "address": address,
                                "name": name,
                                "value": current_value,
                                "plc": "EFFECTS",
                            })
                        elif previous_value != current_value:
                            print(f"💡 [EFFECTS] {name} (coil {address}): {previous_value} -> {current_value}")
                            previous_coil_states[state_key] = current_value

                            await broadcast({
                                "type": "coil_change",
                                "address": address,
                                "name": name,
                                "value": current_value,
                                "plc": "EFFECTS",
                            })

                # Debug: Log all event states every 10 seconds
                import time
                if not hasattr(poll_plc_coils, 'last_event_debug_time'):
                    poll_plc_coils.last_event_debug_time = 0
                current_time = time.time()
                if current_time - poll_plc_coils.last_event_debug_time >= 10:
                    poll_plc_coils.last_event_debug_time = current_time
                    event_states = []
                    for addr in range(EVENT_COIL_START, EVENT_COIL_START + EVENT_COIL_COUNT):
                        state_key = f"EFFECTS_{addr}"
                        value = previous_coil_states.get(state_key, False)
                        event_num = addr - EVENT_COIL_START + 1
                        event_states.append(f"E{event_num}={'T' if value else 'F'}")

                    # Also read EFFECTS MW10 to see position value
                    effects_pos = read_register_from_plc('EFFECTS', 10, 1)
                    if effects_pos and effects_pos.get('success'):
                        pos_value = effects_pos['value']
                    else:
                        pos_value = 'ERR'

                    # Read event_enable registers from %MW100-%MW108 (Modbus addresses 1124-1132)
                    enable_states = []
                    enable_reg_values = []
                    for i in range(1, 10):
                        mw_addr = 99 + i  # event_1 = MW100, event_9 = MW108
                        modbus_addr = 1024 + mw_addr  # MW registers start at Modbus address 1024
                        enable_reg = read_register_from_plc('EFFECTS', modbus_addr)
                        if enable_reg and enable_reg.get('success'):
                            enable_states.append(f"EN{i}={'T' if enable_reg['value'] != 0 else 'F'}")
                            enable_reg_values.append(f"MW{mw_addr}={enable_reg['value']}")

                    print(f"📊 [EFFECTS DEBUG] Events: {' '.join(event_states)} | MW10={pos_value} | Enables: {' '.join(enable_states)}")
                    if enable_reg_values:
                        print(f"📊 [EFFECTS RAW] {' '.join(enable_reg_values)}")

            # Inter-PLC Communication: Copy position from MAIN to EFFECTS
            if modbus_client and is_plc_connected and 'EFFECTS' in modbus_clients and plc_connected_status.get('EFFECTS'):
                # Read current_position from MAIN PLC (holding register %QW1)
                position_result = read_register(HOLDING_REGISTERS['current_position'], 1)
                if position_result["success"]:
                    position_value = position_result["value"]
                    # Write to EFFECTS PLC input register %IW10 (address 10)
                    write_result = write_input_register_to_plc('EFFECTS', 10, position_value)
                    # Note: OpenPLC maps input registers to holding registers internally

            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"❌ Error in polling task: {e}")
            await asyncio.sleep(1)


async def handle_websocket(websocket):
    """Handle WebSocket client connection"""
    connected_clients.add(websocket)
    print(f"WebSocket client connected. Total: {len(connected_clients)}")

    try:
        # Send initial connection status
        await websocket.send(json.dumps({
            "type": "connection_status",
            "connected": is_plc_connected,
            "plc_host": current_plc_host,
            "plc_port": current_plc_port,
        }))

        # Send current coil states if connected to PLC
        if modbus_client and is_plc_connected:
            start_coil, count_coils = COIL_RANGE
            for address in range(start_coil, start_coil + count_coils):
                result = read_coil(address)
                if result["success"]:
                    await websocket.send(json.dumps({
                        "type": "coil_change",
                        "address": address,
                        "name": COIL_NAMES.get(address, f"coil_{address}"),
                        "value": result["value"],
                    }))

            # Send all holding registers
            for start_addr, count in HOLDING_REGISTER_RANGES:
                if start_addr >= 2048:
                    # DINT registers
                    for i in range(0, count, 2):
                        addr = start_addr + i
                        result = read_register(addr, 2)
                        if result["success"] and "values" in result:
                            high_word = result["values"][0]
                            low_word = result["values"][1]
                            dint_value = (high_word << 16) | low_word
                            await websocket.send(json.dumps({
                                "type": "dint_change",
                                "address": addr,
                                "name": REGISTER_NAMES.get(addr, f"register_{addr}"),
                                "value": dint_value,
                            }))
                else:
                    # Regular 16-bit registers
                    result = read_register(start_addr, count)
                    if result["success"]:
                        values = result.get("values", [result.get("value")]) if count > 1 else [result.get("value")]
                        for i, value in enumerate(values):
                            await websocket.send(json.dumps({
                                "type": "register_change",
                                "address": start_addr + i,
                                "name": REGISTER_NAMES.get(start_addr + i, f"register_{start_addr + i}"),
                                "value": value,
                            }))

        async for message in websocket:
            data = json.loads(message)
            action = data.get("action")

            if action == "connect_all_plcs":
                # Connect to all three PLCs
                results = connect_to_all_plcs()
                await websocket.send(json.dumps({
                    "type": "multi_plc_connect_result",
                    "results": results,
                    "plc_status": {
                        plc_id: {
                            "connected": plc_connected_status.get(plc_id, False),
                            "config": PLC_CONFIGS[plc_id]
                        }
                        for plc_id in PLC_CONFIGS.keys()
                    }
                }))
                # Also send backward compatible message for MAIN PLC
                await broadcast({
                    "type": "connection_status",
                    "connected": is_plc_connected,
                    "plc_host": current_plc_host,
                    "plc_port": current_plc_port,
                })

            elif action == "connect_plc":
                host = data.get("host")
                port = data.get("port", 502)
                success = init_modbus(host, port)
                await websocket.send(json.dumps({
                    "type": "connect_result",
                    "success": success,
                    "connected": is_plc_connected,
                    "plc_host": current_plc_host,
                    "plc_port": current_plc_port,
                }))
                await broadcast({
                    "type": "connection_status",
                    "connected": is_plc_connected,
                    "plc_host": current_plc_host,
                    "plc_port": current_plc_port,
                })

                # Send initial coil and register states to all clients after successful connection
                if success and modbus_client and is_plc_connected:
                    start_coil, count_coils = COIL_RANGE
                    for address in range(start_coil, start_coil + count_coils):
                        result = read_coil(address)
                        if result["success"]:
                            await broadcast({
                                "type": "coil_change",
                                "address": address,
                                "name": COIL_NAMES.get(address, f"coil_{address}"),
                                "value": result["value"],
                            })

                    # Send all holding registers
                    for start_addr, count in HOLDING_REGISTER_RANGES:
                        if start_addr >= 2048:
                            # DINT registers
                            for i in range(0, count, 2):
                                addr = start_addr + i
                                result = read_register(addr, 2)
                                if result["success"] and "values" in result:
                                    high_word = result["values"][0]
                                    low_word = result["values"][1]
                                    dint_value = (high_word << 16) | low_word
                                    await broadcast({
                                        "type": "dint_change",
                                        "address": addr,
                                        "name": REGISTER_NAMES.get(addr, f"register_{addr}"),
                                        "value": dint_value,
                                    })
                        else:
                            # Regular 16-bit registers
                            result = read_register(start_addr, count)
                            if result["success"]:
                                values = result.get("values", [result.get("value")]) if count > 1 else [result.get("value")]
                                for i, value in enumerate(values):
                                    await broadcast({
                                        "type": "register_change",
                                        "address": start_addr + i,
                                        "name": REGISTER_NAMES.get(start_addr + i, f"register_{start_addr + i}"),
                                        "value": value,
                                    })

            elif action == "write_coil":
                address = data.get("address")
                value = data.get("value")
                result = write_coil(address, value)
                await websocket.send(json.dumps({
                    "type": "write_result",
                    "result": result
                }))

            elif action == "read_coil":
                address = data.get("address")
                result = read_coil(address)
                await websocket.send(json.dumps({
                    "type": "read_result",
                    "result": result
                }))

            elif action == "write_register":
                address = data.get("address")
                value = data.get("value")
                result = write_register(address, value)
                await websocket.send(json.dumps({
                    "type": "write_result",
                    "result": result
                }))

            elif action == "read_register":
                address = data.get("address")
                count = data.get("count", 1)
                result = read_register(address, count)
                await websocket.send(json.dumps({
                    "type": "read_result",
                    "result": result
                }))

            elif action == "write_multiple_registers":
                address = data.get("address")
                values = data.get("values", [])
                result = write_multiple_registers(address, values)
                await websocket.send(json.dumps({
                    "type": "write_result",
                    "result": result
                }))

            elif action == "get_status":
                await websocket.send(json.dumps({
                    "type": "status",
                    "connected": is_plc_connected,
                    "plc_host": current_plc_host,
                    "plc_port": current_plc_port,
                }))

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.remove(websocket)
        print(f"WebSocket client disconnected. Total: {len(connected_clients)}")


async def start_websocket_server():
    """Start WebSocket server"""
    print(f"Starting WebSocket server on {HOST}:{WS_PORT}")
    async with websockets.serve(handle_websocket, HOST, WS_PORT):
        await asyncio.Future()  # Run forever


# HTTP Server for static files
async def test_modbus(request):
    """Test Modbus connection endpoint - reads all coils"""
    if not modbus_client or not current_plc_host:
        return web.json_response({"error": "PLC not configured"}, status=400)

    try:
        # Read all coils
        coil_states = {}
        start_coil, count_coils = COIL_RANGE
        for address in range(start_coil, start_coil + count_coils):
            result = read_coil(address)
            coil_states[f"coil_{address}"] = {
                "address": address,
                "value": result.get("value", False),
                "success": result.get("success", False)
            }

        return web.json_response({
            "connected": is_plc_connected,
            "host": current_plc_host,
            "port": current_plc_port,
            "coils": coil_states
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def serve_static(request):
    """Serve static files from dist directory"""
    path = request.match_info.get('path', 'index.html')

    # Security: prevent directory traversal
    if '..' in path or path.startswith('/'):
        raise web.HTTPNotFound()

    # Default to index.html for root
    if path == '' or path == '/':
        path = 'index.html'

    file_path = DIST_DIR / path

    # If file doesn't exist, serve index.html (for SPA routing)
    if not file_path.exists() or not file_path.is_file():
        file_path = DIST_DIR / 'index.html'

    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    if content_type is None:
        content_type = 'application/octet-stream'

    # Read and serve file
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        return web.Response(body=content, content_type=content_type)
    except Exception as e:
        print(f"Error serving {file_path}: {e}")
        raise web.HTTPNotFound()


async def start_http_server():
    """Start HTTP server for static files"""
    app = web.Application()
    app.router.add_get('/api/test-modbus', test_modbus)
    app.router.add_get('/', serve_static)
    app.router.add_get('/{path:.*}', serve_static)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, HOST, HTTP_PORT)
    await site.start()
    print(f"HTTP server running on http://{HOST}:{HTTP_PORT}")


async def main():
    """Main entry point - run both servers"""
    global polling_task

    print("=" * 60)
    print("   Attraction Technology Lab - Standalone Server")
    print("=" * 60)
    print(f"\n📁 Serving from: {DIST_DIR}")
    print(f"🌐 Web Interface: http://localhost:{HTTP_PORT}")
    print(f"🔌 WebSocket: ws://localhost:{WS_PORT}")
    print(f"\n📡 Ready for multi-PLC connection")
    print("   → Will auto-connect to all three PLCs:")
    print("      • Main Control (localhost:502)")
    print("      • Safety Systems (localhost:503)")
    print("      • Show Effects (localhost:504)")
    print("\nPress Ctrl+C to stop\n")

    # Check if dist directory exists
    if not DIST_DIR.exists():
        print(f"❌ ERROR: Build directory not found at {DIST_DIR}")
        print("Please run 'npm run build' first!")
        return

    try:
        # Start polling task
        polling_task = asyncio.create_task(poll_plc_coils())

        # Start both servers concurrently
        await asyncio.gather(
            start_http_server(),
            start_websocket_server()
        )
    except KeyboardInterrupt:
        print("\n\nShutting down...")
    finally:
        if modbus_client:
            modbus_client.close()
            print("✓ PLC connection closed")


if __name__ == "__main__":
    asyncio.run(main())
