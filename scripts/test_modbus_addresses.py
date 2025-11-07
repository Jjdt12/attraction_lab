"""
Test script to verify OpenPLC Modbus address mapping
Reads all important registers to confirm they're at the correct addresses
"""

from pymodbus.client import ModbusTcpClient
from plc_modbus_map import COILS, HOLDING_REGISTERS, HOLDING_REGISTERS_DINT
import sys

def test_modbus_addresses(host='localhost', port=502):
    """Test all Modbus addresses are readable"""
    print(f"🔗 Connecting to OpenPLC at {host}:{port}...")
    client = ModbusTcpClient(host, port=port)

    if not client.connect():
        print("❌ Failed to connect to PLC")
        return False

    print("✅ Connected successfully\n")

    # Test all coils
    print("=" * 60)
    print("TESTING COILS (%QX)")
    print("=" * 60)
    for name, address in sorted(COILS.items(), key=lambda x: x[1]):
        try:
            result = client.read_coils(address, 1)
            if not result.isError():
                value = result.bits[0]
                print(f"✅ Coil {address:2d} ({name:25s}): {value}")
            else:
                print(f"❌ Coil {address:2d} ({name:25s}): ERROR - {result}")
        except Exception as e:
            print(f"❌ Coil {address:2d} ({name:25s}): EXCEPTION - {e}")

    # Test all holding registers
    print("\n" + "=" * 60)
    print("TESTING HOLDING REGISTERS (%QW and %MW)")
    print("=" * 60)
    for name, address in sorted(HOLDING_REGISTERS.items(), key=lambda x: x[1]):
        try:
            result = client.read_holding_registers(address, 1)
            if not result.isError():
                value = result.registers[0]
                plc_type = "%MW" if address >= 1024 else "%QW"
                print(f"✅ Reg {address:4d} ({plc_type}, {name:25s}): {value}")

                if name == 'state':
                    print(f"   🎯 STATE MACHINE VALUE: {value}")
                    print(f"   Expected values: 0=IDLE, 1=STARTING, 2=RUNNING, 3=STOPPING, 4=ERROR, 5=MAINTENANCE")
            else:
                print(f"❌ Reg {address:4d} ({name:25s}): ERROR - {result}")
        except Exception as e:
            print(f"❌ Reg {address:4d} ({name:25s}): EXCEPTION - {e}")

    # Test DINT registers (32-bit)
    print("\n" + "=" * 60)
    print("TESTING DINT REGISTERS (%MD)")
    print("=" * 60)
    for name, address in sorted(HOLDING_REGISTERS_DINT.items(), key=lambda x: x[1]):
        try:
            result = client.read_holding_registers(address, 2)
            if not result.isError():
                high_word = result.registers[0]
                low_word = result.registers[1]
                dint_value = (high_word << 16) | low_word
                print(f"✅ Reg {address:4d} (%MD, {name:25s}): {dint_value}")
            else:
                print(f"❌ Reg {address:4d} ({name:25s}): ERROR - {result}")
        except Exception as e:
            print(f"❌ Reg {address:4d} ({name:25s}): EXCEPTION - {e}")

    client.close()
    print("\n✅ Address mapping test complete!")
    return True

if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else 'localhost'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 502
    test_modbus_addresses(host, port)
