#!/usr/bin/env python3
"""
Challenge 01: First Contact (50 points)
Difficulty: Easy

Objective: Establish connection to the Project Nexus control network and explore
the system by reading multiple Modbus registers.

Requirements:
- Perform at least 5 different register reads via Modbus
- Explore the PLC memory map to understand the system

Educational Value:
- Learn basic Modbus/TCP communication
- Understand PLC register addressing
- Practice reconnaissance techniques
"""

from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = 'localhost'
MAIN_PLC_PORT = 502

def explore_plc():
    """
    Connect to Main PLC and read various registers to map the system
    """
    print("=" * 60)
    print("Challenge 01: First Contact")
    print("=" * 60)
    print()

    client = ModbusTcpClient(PLC_HOST, port=MAIN_PLC_PORT)

    if not client.connect():
        print("✗ Failed to connect to Main PLC")
        return False

    print(f"✓ Connected to Main PLC at {PLC_HOST}:{MAIN_PLC_PORT}")
    print()
    print("Exploring PLC memory map...")
    print("-" * 60)

    # Read 1: Speed setpoint (MW0 = address 1024)
    result = client.read_holding_registers(1024, 1, slave=1)
    if not result.isError():
        print(f"[Read 1] Speed Setpoint (MW0): {result.registers[0]}%")
        time.sleep(0.2)

    # Read 2: Current position (MW1 = address 1025)
    result = client.read_holding_registers(1025, 1, slave=1)
    if not result.isError():
        print(f"[Read 2] Current Position (MW1): {result.registers[0]}")
        time.sleep(0.2)

    # Read 3: State machine (MW15 = address 1039)
    result = client.read_holding_registers(1039, 1, slave=1)
    if not result.isError():
        state_names = ['Idle', 'Starting', 'Running', 'Stopping', 'Emergency']
        state = result.registers[0]
        state_name = state_names[state] if state < len(state_names) else 'Unknown'
        print(f"[Read 3] State Machine (MW15): {state} ({state_name})")
        time.sleep(0.2)

    # Read 4: Current speed (MW2 = address 1026)
    result = client.read_holding_registers(1026, 1, slave=1)
    if not result.isError():
        print(f"[Read 4] Current Speed (MW2): {result.registers[0]}%")
        time.sleep(0.2)

    # Read 5: Motor current (MW5 = address 1029)
    result = client.read_holding_registers(1029, 1, slave=1)
    if not result.isError():
        print(f"[Read 5] Motor Current (MW5): {result.registers[0]} A")
        time.sleep(0.2)

    # Read 6: Hydraulic pressure (MW6 = address 1030)
    result = client.read_holding_registers(1030, 1, slave=1)
    if not result.isError():
        print(f"[Read 6] Hydraulic Pressure (MW6): {result.registers[0]} PSI")
        time.sleep(0.2)

    # Read 7: Bearing temperature (MW7 = address 1031)
    result = client.read_holding_registers(1031, 1, slave=1)
    if not result.isError():
        print(f"[Read 7] Bearing Temperature (MW7): {result.registers[0]}°C")

    print("-" * 60)
    print()
    print("✓ Network exploration complete!")
    print()
    print("System Overview:")
    print("  • Main PLC: Port 502 (Sequencing & Control)")
    print("  • Safety PLC: Port 503 (Safety Interlocks)")
    print("  • Effects PLC: Port 504 (Show Control)")
    print()
    print("🎯 Challenge 01 should now be completed!")
    print("   Check the CTF dashboard to verify.")

    client.close()
    return True

if __name__ == "__main__":
    try:
        explore_plc()
    except KeyboardInterrupt:
        print("\n\n✗ Attack interrupted by user")
    except Exception as e:
        print(f"\n✗ Attack failed: {e}")
