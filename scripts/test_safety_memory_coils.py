#!/usr/bin/env python3
"""
Test script to verify we can write to Safety PLC memory coils (%MX addresses)
"""

from pymodbus.client import ModbusTcpClient
import time

# Connect to Safety PLC
client = ModbusTcpClient('localhost', port=503)

if not client.connect():
    print("❌ Failed to connect to Safety PLC on port 503")
    exit(1)

print("✅ Connected to Safety PLC on port 503")

# Test writing to memory coils 1024, 1025, 1026 (%MX0.0, %MX0.1, %MX0.2)
print("\n📝 Writing to memory coils...")
print("   Writing coil 1024 (%MX0.0) = True")
result1 = client.write_coil(1024, True)
print(f"   Result: {result1}")

print("   Writing coil 1025 (%MX0.1) = False")
result2 = client.write_coil(1025, False)
print(f"   Result: {result2}")

print("   Writing coil 1026 (%MX0.2) = True")
result3 = client.write_coil(1026, True)
print(f"   Result: {result3}")

time.sleep(0.5)

# Read back the coils
print("\n📖 Reading back memory coils...")
coils = client.read_coils(1024, 3)
if not coils.isError():
    print(f"   Coil 1024 (%MX0.0) = {coils.bits[0]}")
    print(f"   Coil 1025 (%MX0.1) = {coils.bits[1]}")
    print(f"   Coil 1026 (%MX0.2) = {coils.bits[2]}")
else:
    print(f"   ❌ Error reading coils: {coils}")

# Read MW100 to see if safety logic ran
print("\n📖 Reading MW100 (safety_ok_reg)...")
regs = client.read_holding_registers(100, 1)
if not regs.isError():
    print(f"   MW100 = {regs.registers[0]}")
    if regs.registers[0] == 1:
        print("   ✅ Safety logic is working! MW100 = 1")
    else:
        print("   ⚠️  Safety logic not triggered. MW100 = 0")
        print("      This means either:")
        print("      1. The coils aren't being read by the PLC logic")
        print("      2. The memory coil mapping (1024+) is wrong")
        print("      3. There's a scan cycle delay")
else:
    print(f"   ❌ Error reading MW100: {regs}")

client.close()
print("\n✅ Test complete")
