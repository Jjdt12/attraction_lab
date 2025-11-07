"""
Standalone HMI Server - Serves Web Interface + WebSocket + Modbus
All-in-one solution for the Attraction Technology Lab

Run: python standalone_server.py
Access: http://localhost:8080
"""

import asyncio
import json
import os
import mimetypes
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

# Load environment variables
load_dotenv()

# Configuration
HTTP_PORT = int(os.getenv("HTTP_PORT", "8080"))
WS_PORT = int(os.getenv("WS_PORT", "8765"))
HOST = os.getenv("HOST", "0.0.0.0")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

TRACK_LENGTH = 9
EVENT_POS = 5

# Global state
modbus_client: Optional[ModbusTcpClient] = None
current_plc_host: Optional[str] = None
current_plc_port: Optional[int] = None
is_plc_connected: bool = False  # Manual connection state tracking
connected_clients = set()
previous_coil_states = {}
previous_register_states = {}
polling_task = None

# Get project paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
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


def write_coil(address: int, value: bool) -> dict:
    """Write to Modbus coil"""
    if not modbus_client:
        return {"success": False, "error": "PLC not connected"}

    try:
        result = modbus_client.write_coil(address=address, value=value)
        if result and not result.isError():
            return {"success": True, "address": address, "value": value}
        else:
            return {"success": False, "error": "Write failed"}
    except Exception as e:
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
    """Continuously poll PLC coils and holding registers, broadcast changes"""
    global previous_coil_states, previous_register_states

    print("🔄 Started PLC polling task")

    while True:
        try:
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
                            # Only log important coil changes
                            if coil_name in ['motor_running', 'emergency_stop_button', 'master_enable', 'start_command', 'stop_command']:
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
                                    # Only log position and state changes
                                    if reg_name in ['current_position', 'state']:
                                        print(f"🔔 [PLC] {reg_name}: {previous_value} -> {current_value}")
                                    previous_register_states[address] = current_value

                                    await broadcast({
                                        "type": "register_change",
                                        "address": address,
                                        "name": reg_name,
                                        "value": current_value,
                                    })

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

            if action == "connect_plc":
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
    print(f"\n📡 Ready for PLC connection")
    print("Press Ctrl+C to stop\n")

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
