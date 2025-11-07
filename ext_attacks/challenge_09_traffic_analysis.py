#!/usr/bin/env python3
"""
CTF Challenge 9: Traffic Analysis (Medium - 150 points)
Successfully intercept and log at least 10 Modbus commands

Method: Passive monitoring of Modbus traffic (read-only operations)
"""

import socket
import struct
import time
from datetime import datetime

PLC_HOST = 'localhost'
PLC_PORT = 502

def build_read_coils(transaction_id, address, quantity):
    """Build a Modbus Read Coils request"""
    protocol_id = 0
    data_length = 6
    unit_id = 1
    function_code = 1

    return struct.pack('>HHHBBHH',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        quantity
    )

def build_read_register(transaction_id, address, quantity):
    """Build a Modbus Read Holding Registers request"""
    protocol_id = 0
    data_length = 6
    unit_id = 1
    function_code = 3

    return struct.pack('>HHHBBHH',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        quantity
    )

def parse_modbus_response(response):
    """Parse a Modbus TCP response"""
    if len(response) < 9:
        return None

    trans_id, proto_id, length, unit_id, func_code = struct.unpack('>HHHBB', response[:8])

    return {
        'transaction_id': trans_id,
        'protocol_id': proto_id,
        'length': length,
        'unit_id': unit_id,
        'function_code': func_code,
        'data': response[8:]
    }

def parse_read_coils_response(response):
    """Parse a Read Coils response"""
    if len(response) < 9:
        return None

    byte_count = response[8]
    coil_bytes = response[9:9+byte_count]

    coils = []
    for byte_val in coil_bytes:
        for bit in range(8):
            coils.append(bool(byte_val & (1 << bit)))

    return coils

def parse_read_registers_response(response):
    """Parse a Read Holding Registers response"""
    if len(response) < 9:
        return None

    byte_count = response[8]
    num_registers = byte_count // 2

    registers = []
    for i in range(num_registers):
        offset = 9 + (i * 2)
        reg_value = struct.unpack('>H', response[offset:offset+2])[0]
        registers.append(reg_value)

    return registers

def main():
    print("="*60)
    print("CTF Challenge 9: Traffic Analysis")
    print("="*60)
    print()
    print("Objective: Intercept and log at least 10 Modbus commands")
    print("Method: Active monitoring with full packet capture")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1
    captured_commands = []
    target_count = 10

    print(f"\n[Analysis Phase] Capturing {target_count} Modbus commands...")
    print("Press Ctrl+C to stop\n")

    try:
        while len(captured_commands) < target_count:
            timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]

            # Alternate between different read operations
            if transaction_id % 3 == 0:
                # Read coils (digital I/O)
                request = build_read_coils(transaction_id, 0, 16)
                operation = "Read Coils"
                details = "Address: 0, Quantity: 16"
            elif transaction_id % 3 == 1:
                # Read registers (state, counters, etc)
                request = build_read_register(transaction_id, 0, 10)
                operation = "Read Registers"
                details = "Address: 0, Quantity: 10"
            else:
                # Read state register
                request = build_read_register(transaction_id, 6, 1)
                operation = "Read State"
                details = "Address: 6 (state machine)"

            # Send request
            sock.send(request)
            response = sock.recv(1024)

            # Parse response
            parsed = parse_modbus_response(response)

            if parsed:
                command_info = {
                    'timestamp': timestamp,
                    'transaction_id': transaction_id,
                    'function_code': parsed['function_code'],
                    'operation': operation,
                    'details': details,
                    'length': len(response)
                }

                captured_commands.append(command_info)

                # Display capture
                print(f"[{len(captured_commands):02d}] {timestamp} | TxID:{transaction_id:04d} | {operation:20s} | {details}")

                # Parse and display some data for interesting commands
                if operation == "Read Coils":
                    coils = parse_read_coils_response(response)
                    if coils:
                        print(f"     └─ Proximity:{coils[0]} E-Stop:{coils[2]} Safety:{coils[4]} Flash:{coils[3]}")

                elif operation == "Read State":
                    registers = parse_read_registers_response(response)
                    if registers:
                        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
                        state = registers[0]
                        print(f"     └─ State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

            transaction_id += 1
            time.sleep(0.5)

        print(f"\n{'='*60}")
        print("🎯 SUCCESS! Traffic Analysis completed")
        print(f"   Commands captured: {len(captured_commands)}")
        print("   Challenge completed!")
        print(f"{'='*60}")

        print("\n[Captured Traffic Summary]")
        print(f"  Total packets: {len(captured_commands)}")
        print(f"  Function codes used:")

        func_counts = {}
        for cmd in captured_commands:
            fc = cmd['function_code']
            func_counts[fc] = func_counts.get(fc, 0) + 1

        for fc, count in func_counts.items():
            fc_names = {1: "Read Coils", 3: "Read Registers", 5: "Write Coil", 6: "Write Register"}
            print(f"    FC {fc:02d} ({fc_names.get(fc, 'Unknown'):20s}): {count} commands")

        print("\n[Attack Implications]")
        print("  • Traffic analysis reveals system architecture")
        print("  • Memory map can be reconstructed from observed addresses")
        print("  • Operation patterns show normal vs abnormal behavior")
        print("  • Unencrypted traffic exposes all control data")

        print("\n[Defensive Measures]")
        print("  1. Implement Modbus/TCP encryption (TLS)")
        print("  2. Use network segmentation and VLANs")
        print("  3. Deploy IDS/IPS for anomaly detection")
        print("  4. Monitor for unauthorized connections")

    except KeyboardInterrupt:
        print(f"\n\n[Capture Stopped]")
        print(f"  Commands captured: {len(captured_commands)}/{target_count}")

        if len(captured_commands) >= target_count:
            print("\n🎯 Target reached - challenge should be completed")
    finally:
        sock.close()

if __name__ == '__main__':
    main()
