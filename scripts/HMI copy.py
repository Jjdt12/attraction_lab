from pymodbus.client import ModbusTcpClient
from rich.console import Console
from rich.panel import Panel
import time
import os
import socket # <-- ADDED: Import networking library

# --- Configuration ---
#PLC_HOST = "129.212.183.179"
PLC_HOST = "testing.com"
PLC_PORT = 502
TRACK_LENGTH = 9
EVENT_POS = 5  # Light event position

# ADDED: Configuration for the Auditor/IDS server
AUDITOR_IP = "129.212.183.179" 
AUDITOR_PORT = 9999
# --- End Configuration ---

# ADDED: Create the UDP socket for sending log messages
log_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

console = Console()

def draw_lab(flash_light, car_pos, ride_running):
    track = []
    for i in range(TRACK_LENGTH):
        if i == car_pos and ride_running:
            track.append("🚗")
        elif i == EVENT_POS:
            track.append("💡")
        else:
            track.append("—")
    track_line = "".join(track)
    event_message = "[bold yellow][Flashing Light!][/bold yellow]" if flash_light else ""
    subtitle = "Press S to start the ride" if not ride_running else "Ride Running! (Ctrl+C to quit)"
    ascii_art = f"""
       +------------------------+
       |  DISNEY ATTRACTION LAB |
       +========================+
       | Track: {track_line}
       | {event_message}
       +------------------------+
    """
    console.print(Panel(ascii_art, title="Attraction Status", subtitle=subtitle))

def get_flash_light(client):
    result = client.read_coils(address=0, count=1)
    if not result or result.isError():
        return False
    return result.bits[0]

def set_proxi_sensor(client, on):
    client.write_coil(address=0, value=on)
    # ADDED: Send a log message to the Auditor when the sensor is turned ON
    if on:
        log_socket.sendto(b"proxi_sensor=TRUE", (AUDITOR_IP, AUDITOR_PORT))

client = ModbusTcpClient(host=PLC_HOST, port=PLC_PORT)
client.connect()

try:
    car_pos = 0
    ride_running = False

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        flash = get_flash_light(client)
        draw_lab(flash, car_pos, ride_running)

        if not ride_running:
            console.print("[yellow]Press S and Enter to start the ride, or Ctrl+C to quit.[/yellow]")
            key = console.input("").strip().lower()
            if key == "s":
                ride_running = True
            continue

        if car_pos == EVENT_POS:
            set_proxi_sensor(client, True)
        else:
            set_proxi_sensor(client, False)

        print(f"[DEBUG] car_pos={car_pos} | proxi_sensor_sent={car_pos == EVENT_POS} | flash_light_read={flash}")
        time.sleep(0.5)
        car_pos = (car_pos + 1) % TRACK_LENGTH

except KeyboardInterrupt:
    pass
finally:
    set_proxi_sensor(client, False)
    client.close()
    console.print("[green]Lab session ended![/green]")
