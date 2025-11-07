# MitM Attack Setup Guide

## Overview

The `mitm_proxy.py` script implements a Man-in-the-Middle attack that sits between the WebSocket HMI Server and the actual PLC, intercepting and modifying Modbus TCP traffic.

## Architecture

```
[Web HMI Interface]
       |
       | WebSocket
       ↓
[WebSocket HMI Server]
       |
       | Modbus TCP
       ↓
[MitM PROXY] ← You are here (mitm_proxy.py)
       |
       | Modbus TCP
       ↓
[Real PLC at 129.212.183.179:502]
```

## How It Works

1. **Proxy listens** on port 502 (standard Modbus port)
2. **WebSocket server connects** to the proxy (thinking it's the PLC)
3. **Proxy connects** to the real PLC
4. **Traffic flows** through the proxy in both directions
5. **Attack logic** intercepts Write Single Coil commands (Function Code 5)
6. When it sees `proxi_sensor = TRUE` (address 0, value 0xFF00), it **changes it to FALSE** (value 0x0000)
7. The PLC never sees the sensor triggered, so the flash light never activates

## Deployment Steps

### 1. Start the MitM Proxy

```bash
cd scripts
python mitm_proxy.py
```

Or specify custom PLC address:
```bash
python mitm_proxy.py 192.168.1.100 502
```

The proxy will:
- Listen on `0.0.0.0:502` for incoming HMI connections
- Forward traffic to the real PLC
- Print all intercepted packets
- Allow toggling attack ON/OFF by pressing 'O'

### 2. Configure Connection

When connecting from the web interface, use:
- **Host**: `localhost` (or the IP where proxy is running)
- **Port**: `502`

### 3. Run the System

1. Start MitM proxy: `python mitm_proxy.py`
2. Start the server: `./start.sh`
3. Open web interface at http://localhost:8080
4. Connect to PLC (will actually connect to proxy)
5. Start the ride

### 4. Control the Attack

While the proxy is running:
- Press **'O' + Enter** to toggle attack ON/OFF
- Press **'S' + Enter** to show statistics
- Press **'Q' + Enter** to quit

## Expected Behavior

### Attack ENABLED (default):
- Car reaches position 5
- HMI writes `proxi_sensor = TRUE` to coil 0
- **Proxy intercepts and changes to FALSE**
- PLC receives `proxi_sensor = FALSE`
- Flash light DOES NOT activate
- Car continues without light flash

### Attack DISABLED:
- Car reaches position 5
- HMI writes `proxi_sensor = TRUE` to coil 0
- Proxy passes through unmodified
- PLC receives `proxi_sensor = TRUE`
- Flash light activates
- Normal operation

## Console Output

```
======================================================================
🎭 MODBUS TCP MAN-IN-THE-MIDDLE PROXY
======================================================================
[CONFIG] Listening on 0.0.0.0:502
[CONFIG] Forwarding to PLC at 129.212.183.179:502
[ATTACK] Initial state: ENABLED
======================================================================

[PROXY] 🚀 Ready! Waiting for HMI connections...

[CONNECTION 1] 🔌 New connection from ('127.0.0.1', 54321)
[CONNECTION 1] ✓ Connected to PLC at 129.212.183.179:502
[INTERCEPT] FC5 Write Coil: addr=0, value=0xff00 (trans_id=1)
[ATTACK] 🎯 Changing proxi_sensor TRUE → FALSE
[ATTACK] ✓ Packet modified (trans_id=1)
```

## Security Notes

This is an educational tool demonstrating:
- ICS/SCADA vulnerability to network-based attacks
- Importance of network segmentation
- Why protocol-level encryption/authentication is critical
- How integrity attacks differ from availability attacks

**Real-world mitigations:**
- Use VLANs to isolate control networks
- Implement Modbus/TCP security extensions
- Use VPNs or encrypted tunnels
- Deploy IDS/IPS for protocol anomaly detection
- Implement digital signatures on critical commands
