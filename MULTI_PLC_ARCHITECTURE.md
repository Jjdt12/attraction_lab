# Multi-PLC Architecture

The Attraction Technology Lab now features a **realistic three-PLC architecture** that mirrors real industrial control systems.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MAIN PLC      │     │   SAFETY PLC    │     │  EFFECTS PLC    │
│   Port 502      │     │   Port 503      │     │   Port 504      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Sequencing    │     │ • Safety Gates  │     │ • Show Lighting │
│ • Position      │     │ • E-Stops       │     │ • Audio         │
│ • Speed Control │     │ • Interlocks    │     │ • Effects       │
│ • Zone Logic    │     │ • Event Safety  │     │ • Fog/Strobe    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  HMI Interface  │
                        │  Port 3000      │
                        └─────────────────┘
```

## PLC Responsibilities

### Main PLC (Port 502)
**Primary control logic for ride operation**

- Ride state machine (IDLE, STARTING, RUNNING, STOPPING, EMERGENCY)
- Vehicle position tracking (0-26 positions)
- Speed setpoint and ramping logic
- Zone management (Zone 1/2/3 enable/disable)
- Process variables:
  - Motor current (50-130A)
  - Hydraulic pressure (1100-1300 PSI)
  - Bearing temperature (ambient to 85°C)
  - Brake wear (0-100%)
  - Vibration levels

**Ladder Logic:** `scripts/attraction_control_main.st`

### Safety PLC (Port 503)
**Safety-critical monitoring and interlocks**

- Master Enable control
- Emergency Stop monitoring
- Safety Gate status
- Event-based safety checks:
  - Speed limits in brake zones
  - Safety interlock validation
  - Station approach speed
- Safety violation counter
- Alarm generation

**Ladder Logic:** `scripts/attraction_control_safety.st`

### Effects PLC (Port 504)
**Show elements and special effects**

- Position-based lighting scenes (4 scenes)
- Audio trigger management (3 channels)
- Special effects:
  - Fog machines
  - Strobe lights
  - Laser effects
  - Photo flash
- Effect runtime tracking

**Ladder Logic:** `scripts/attraction_control_effects.st`

## How It Works

### 1. **Current Implementation (Single Connection)**

The HMI currently connects to the **Main PLC (port 502)** for primary control:

```javascript
// Frontend auto-connects to Main PLC
ws.send(JSON.stringify({
  action: 'connect_plc',
  host: 'localhost',
  port: 502
}));
```

- **Main PLC**: Direct Modbus connection via WebSocket
- **Safety PLC**: Runs independently, accessible via web UI (port 8081)
- **Effects PLC**: Runs independently, accessible via web UI (port 8082)

### 2. **UI Access Points**

| Interface | URL | Purpose |
|-----------|-----|---------|
| **SCADA HMI** | http://localhost:3000 | Main operator interface with tabs |
| **Main PLC Admin** | http://localhost:8080 | OpenPLC configuration (openplc/openplc) |
| **Safety PLC Admin** | http://localhost:8081 | OpenPLC configuration (openplc/openplc) |
| **Effects PLC Admin** | http://localhost:8082 | OpenPLC configuration (openplc/openplc) |

### 3. **HMI Tabs**

The SCADA HMI at port 3000 includes these tabs:

- **Overview**: Main ride visualization and control
- **Diagnostics**: Multi-PLC status, system health, process variables
- **Trends**: Live charts for position, speed, temperature, current
- **Alarms**: Active alarms and alarm history
- **Events**: System event log with filtering
- **Network**: Modbus traffic monitor
- **Documentation**: In-universe operator manuals and service bulletins

## Educational Value

### Learning Multi-PLC Systems

Students learn about:

1. **Separation of Concerns**
   - Why safety logic is isolated
   - How show effects are decoupled
   - Benefits of distributed control

2. **Inter-PLC Communication**
   - Modbus TCP networking
   - Register mapping across PLCs
   - Cross-system dependencies

3. **Attack Surface Analysis**
   - Multiple entry points
   - Cascading failures
   - Cross-PLC exploits

### Attack Scenarios

The multi-PLC architecture enables realistic attack scenarios:

- **Bypass Main via Safety**: Manipulate Safety PLC to override Main PLC interlocks
- **Effects-Based Attacks**: Use Effects PLC to distract or mislead operators
- **Cross-PLC State Manipulation**: Exploit register sharing between PLCs
- **Network Segmentation Testing**: Attack network between PLCs

## Future Expansion

The system is designed for easy expansion:

### Phase 2: Multi-PLC HMI Connection

Extend `useMultiPLCConnection` hook to connect to all three PLCs simultaneously:

```typescript
// Future implementation
const { plcs, operations } = useMultiPLCConnection();

// Connect to all PLCs
await connectToAllPLCs();

// Read from specific PLC
const mainSpeed = await readHoldingRegisters('MAIN', 0, 1);
const safetyStatus = await readCoils('SAFETY', 30, 1);
const effectsScene = await readHoldingRegisters('EFFECTS', 60, 1);
```

### Phase 3: Real-time Cross-PLC Monitoring

- Live comparison of values across PLCs
- Detection of sync issues
- Cross-PLC alarm correlation

### Phase 4: Advanced Challenges

- Multi-PLC coordination attacks
- Network traffic injection
- PLC-to-PLC communication hijacking

## Development

### Adding New PLCs

To add a fourth PLC:

1. Update `docker-compose.yml`:
```yaml
plc-newname:
  image: tuttas/openplc_v3:latest
  container_name: attraction-plc-newname
  ports:
    - "8083:8080"
    - "505:502"
```

2. Create ladder logic: `scripts/attraction_control_newname.st`

3. Update `scripts/upload_multi_plc.py` PLCS array

4. Add to frontend `useMultiPLCConnection` DEFAULT_PLCS

### Testing Individual PLCs

Test each PLC independently:

```bash
# Test Main PLC
python3 -c "from pymodbus.client import ModbusTcpClient; c = ModbusTcpClient('localhost', 502); print(c.connect())"

# Test Safety PLC
python3 -c "from pymodbus.client import ModbusTcpClient; c = ModbusTcpClient('localhost', 503); print(c.connect())"

# Test Effects PLC
python3 -c "from pymodbus.client import ModbusTcpClient; c = ModbusTcpClient('localhost', 504); print(c.connect())"
```

## Troubleshooting

### PLCs Won't Start

```bash
# Check container status
docker ps -a | grep plc

# View logs
docker logs attraction-plc-main
docker logs attraction-plc-safety
docker logs attraction-plc-effects

# Restart specific PLC
docker restart attraction-plc-main
```

### Connection Issues

1. **Check ports are not in use:**
```bash
lsof -i :502
lsof -i :503
lsof -i :504
```

2. **Verify network connectivity:**
```bash
telnet localhost 502
telnet localhost 503
telnet localhost 504
```

3. **Check firewall:**
```bash
# Allow Modbus ports (if needed)
sudo ufw allow 502/tcp
sudo ufw allow 503/tcp
sudo ufw allow 504/tcp
```

### Program Upload Fails

If `upload_multi_plc.py` fails:

1. Wait longer for containers to start (increase timeout)
2. Check ST file syntax in ladder logic files
3. Manually upload via OpenPLC web UI as fallback

## Summary

The multi-PLC architecture provides:

✅ Realistic industrial control system structure
✅ Proper separation of safety and control logic
✅ Multiple attack surfaces for security training
✅ Professional SCADA-style interface
✅ Room for future expansion

Students experience real-world ICS architecture while learning about distributed control systems, network protocols, and multi-layered security.
