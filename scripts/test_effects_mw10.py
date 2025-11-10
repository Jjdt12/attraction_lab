#!/usr/bin/env python3
"""Test if EFFECTS PLC MW10 is accessible"""

import sys
sys.path.append('/tmp/cc-agent/59654547/project/scripts')

from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('localhost', port=504)
client.connect()

# Write test value to MW10 (holding register 10)
print("Writing value 7 to MW10 (register 10)...")
result = client.write_register(10, 7)
print(f"Write result: {result}")

# Read it back
print("\nReading MW10...")
result = client.read_holding_registers(10, 1)
if result.isError():
    print(f"Error: {result}")
else:
    print(f"MW10 value: {result.registers[0]}")

# Now read memory bits 800-808 (coils 800-808 = event enables)
print("\nReading event enables (coils 800-808)...")
result = client.read_coils(800, 9)
if result.isError():
    print(f"Error: {result}")
else:
    for i, bit in enumerate(result.bits[:9]):
        print(f"  event_{i+1}_enable (coil {800+i}): {bit}")

client.close()
