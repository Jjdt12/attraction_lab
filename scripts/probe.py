from pymodbus.client import ModbusTcpClient
import time

PLC_HOST = "localhost"
PLC_PORT = 502
COIL_RANGE = 32  # Try a wider range if needed

client = ModbusTcpClient(PLC_HOST, port=PLC_PORT)
client.connect()

try:
    print("Resetting all coils to False...")
    for addr in range(COIL_RANGE):
        client.write_coil(address=addr, value=False)
    time.sleep(1)

    print("\nProbing each coil (writing True one at a time):")
    for test_addr in range(COIL_RANGE):
        print(f"\nSetting coil {test_addr} to True...")
        client.write_coil(address=test_addr, value=True)
        time.sleep(0.2)
        # Read back all coils after each write
        result = client.read_coils(address=0, count=COIL_RANGE)
        if result and not result.isError():
            print(f"Coil states after setting {test_addr}:", result.bits)
        else:
            print(f"[!] Error reading back coils at {test_addr}")

        # Optionally, reset the coil to False after reading
        client.write_coil(address=test_addr, value=False)
        time.sleep(0.1)

finally:
    client.close()
