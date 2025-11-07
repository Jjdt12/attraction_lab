# OpenPLC Modbus Address Refactor Summary

## Problem
The HMI was reading incorrect Modbus addresses, causing the state machine value to always show 0 even when the motor was running. This was because we were reading holding register 15, but OpenPLC maps `%MW15` to Modbus address **1039**, not 15.

## Root Cause
OpenPLC uses a specific address offset system:
- **Coils (%QX):** Direct mapping → address 0-799
- **Input Registers (%IW):** Direct mapping → address 0-1023
- **Holding Registers:**
  - `%QW0-%QW1023` → address **0-1023** (analog output words)
  - `%MW0-%MW1023` → address **1024-2047** (memory words)
  - `%MD0-%MD1023` → address **2048-4095** (double words/DINTs)

## What Was Changed

### 1. Created Address Mapping File
**File:** `scripts/plc_modbus_map.py`
- Complete mapping of all PLC variables to correct Modbus addresses
- Defines address ranges for efficient polling
- Documents the OpenPLC address offset rules

### 2. Refactored Backend Server
**File:** `scripts/standalone_server.py`
- Now imports address mappings from `plc_modbus_map.py`
- Polls multiple address ranges to capture all variables:
  - Coils 0-16
  - Holding registers 0-14 (zone positions)
  - Holding registers 1028-1029 (maintenance_flag, last_error_code)
  - Holding register **1039** (STATE - the critical one!)
  - Holding registers 2050-2053 (runtime_hours, cycle_counter DINTs)
- Broadcasts include both `address` and `name` fields for clarity

### 3. Updated Frontend
**File:** `src/hooks/useWebSocketSimulation.ts`
- Changed from address-based mapping to **name-based mapping**
- Now uses the `name` field from broadcasts instead of hardcoded addresses
- More maintainable and decoupled from Modbus addressing details

### 4. Cleaned Up Unused Files
Removed simulation files that weren't being used:
- `src/hooks/useSimulation.ts`
- `src/hooks/useEnhancedSimulation.ts`
- `src/hooks/usePythonExecutor.ts`
- `scripts/light_test_sim.py`
- `scripts/HMI.py`
- `scripts/HMI copy.py`
- `scripts/web_hmi_integration.py`

### 5. Created Test Script
**File:** `scripts/test_modbus_addresses.py`
- Validates all Modbus addresses are readable
- Shows current values of all coils, registers, and DINTs
- Helps diagnose connectivity issues

## Key Address Changes

| Variable           | PLC Address | Old Modbus Addr | New Modbus Addr |
|-------------------|-------------|-----------------|-----------------|
| current_position  | %QW1        | 1               | 1               |
| maintenance_flag  | %MW4        | 4               | **1028**        |
| last_error_code   | %MW5        | 5               | **1029**        |
| **state**         | **%MW15**   | **15**          | **1039** 🎯     |
| runtime_hours     | %MD2        | 2               | **2050**        |
| cycle_counter     | %MD3        | 3               | **2051**        |

## Testing

Run the test script to verify all addresses:
```bash
cd scripts
python3 test_modbus_addresses.py <plc-host> <plc-port>
```

Example:
```bash
python3 test_modbus_addresses.py 192.168.1.100 502
```

This will show:
- All coil states
- All holding register values
- State machine current value (should match actual PLC state)

## What Should Work Now

1. **State Machine Display:** The HMI should correctly show state values 0-5
2. **Motor Status Alignment:** When motor_running coil is true, state should be 1 or 2 (not 0)
3. **Real-time Updates:** All PLC variables update correctly in the web interface
4. **Name-based Mapping:** Frontend is decoupled from specific Modbus addresses

## Next Steps

1. Start OpenPLC with the `attraction_control.st` program
2. Run `scripts/standalone_server.py`
3. Open web interface at `http://localhost:8080`
4. Verify state machine shows correct values
5. Trigger start/stop commands and verify state transitions
