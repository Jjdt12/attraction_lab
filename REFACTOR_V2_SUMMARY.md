# Attraction Control System - Major Refactor v2.0

## Overview

Complete system refactor from 5 zones / 8 positions to **3 zones / 9 events** with progressive CTF challenge difficulty.

**Date:** November 6, 2025  
**Scope:** Full-stack refactor (PLC logic, frontend, database, attack scripts)

---

## What Changed

### 1. PLC Logic (Structured Text)

**File:** `scripts/attraction_control.st`

**New Structure:**
- **3 Zones**: Loading/Launch (0-120), Main Track (121-240), Return/Station (241-360)
- **9 Events**: 3 events per zone with specific position ranges
- **Position System**: 0-360 degree continuous track

**New Features:**
- Event-based triggering (position ranges activate events)
- Event enable/disable coils (coils 8-16)
- Event active status coils (coils 17-25) - READ-ONLY
- Event counters (registers 1044-1052)
- Stealth detection counter (register 1055)
- Alarm register (register 1054)

**Event Details:**

| Event | Position | Zone | Description | Coils | Register |
|-------|----------|------|-------------|-------|----------|
| 1 | 0-40 | 1 | Loading Gate | Enable:8, Active:17 | Counter:1044 |
| 2 | 41-80 | 1 | Safety Interlock | Enable:9, Active:18 | Counter:1045 |
| 3 | 81-120 | 1 | Launch Accelerator | Enable:10, Active:19 | Counter:1046 |
| 4 | 121-160 | 2 | Photo Flash | Enable:11, Active:20 | Counter:1047 |
| 5 | 161-200 | 2 | Mid-Course Brake | Enable:12, Active:21 | Counter:1048 |
| 6 | 201-240 | 2 | Track Switch | Enable:13, Active:22 | Counter:1049 |
| 7 | 241-280 | 3 | Final Brake | Enable:14, Active:23 | Counter:1050 |
| 8 | 281-320 | 3 | Station Approach | Enable:15, Active:24 | Counter:1051 |
| 9 | 321-360 | 3 | Unload Platform | Enable:16, Active:25 | Counter:1052 |

---

### 2. Modbus Address Map

**File:** `scripts/plc_modbus_map.py`

**Complete Rewrite:**

```python
# Core Control
master_enable: 0
start_command: 1
stop_command: 2
emergency_stop_button: 3
safety_gate_closed: 4

# Zones (3 total)
zone_1_enable: 5
zone_2_enable: 6
zone_3_enable: 7

# Event Enable/Disable (9 events)
event_1_enable: 8 through event_9_enable: 16

# Event Active Status (READ-ONLY)
event_1_active: 17 through event_9_active: 25

# System Outputs
motor_running: 26
brake_engaged: 27
flash_light: 28
alert_active: 29
safety_ok: 30

# Registers
speed_setpoint: 0 (IW0)
current_position: 1 (QW1)
current_speed: 2 (QW2)
state: 1039 (MW15)
event_1_counter: 1044 (MW20) through event_9_counter: 1052 (MW28)
alarm_register: 1054 (MW30)
stealth_counter: 1055 (MW31)
```

**New Helper Data:**
- EVENT_POSITIONS: Position ranges for each event
- ZONE_POSITIONS: Zone boundaries
- STATE_MACHINE: State value definitions
- ERROR_CODES: Complete error code reference

---

### 3. CTF Challenges

**File:** `supabase/migrations/20251106000000_refactor_ctf_challenges_v2.sql`

**10 Progressive Challenges:**

#### Easy (100-150 points)
1. **Lights Out** - Disable Event 4 photo flash (coil 11)
2. **Speed Demon** - Set speed to 85% in Event 5 brake zone
3. **Zone Lockout** - Disable Zone 1 (coil 5)

#### Medium (200-250 points)
4. **Safety Bypass** - Skip Event 2 safety checks
5. **Event Chaos** - Trigger Events 1, 4, 7 simultaneously
6. **Stealth Speed Run** - Change speed without incrementing stealth_counter

#### Hard (300-350 points)
7. **State Machine Takeover** - Force state=2 without startup
8. **Position Teleporter** - Jump position to skip Event 6

#### Expert (400-500 points)
9. **Total Domination** - Control all 3 zones with specific pattern
10. **Ghost in the Machine** - Complete lap with 3+ changes, zero detection

---

### 4. Attack Scripts

**Directory:** `ext_attacks/`

**Created 10 Complete Scripts:**
- `challenge_01_lights_out.py` through `challenge_10_ghost_mode.py`
- Each demonstrates real Modbus TCP attack techniques
- Includes detailed comments and flag capture
- Uses pymodbus library with correct addresses

**Features:**
- PLC connection handling
- Address verification
- Real-time monitoring
- Challenge-specific logic
- Flag display on success

---

### 5. Frontend Types

**File:** `src/types/rideEvents.ts`

**Redesigned Data Structures:**

```typescript
// New Event Interface
export interface RideEvent {
  eventNumber: number;          // 1-9
  position: [number, number];   // [start, end] range
  coilEnable: number;           // Modbus coil for enable
  coilActive: number;           // Modbus coil for status
  counterRegister: number;      // Event counter register
  ...
}

// New Zone Interface  
export interface RideZone {
  id: number;                   // 1-3
  coil: number;                 // Zone enable coil
  events: RideEvent[];          // 3 events per zone
  ...
}
```

**Helper Functions:**
- `getEventAtPosition(pos)` - Find event at position
- `getZoneAtPosition(pos)` - Find zone at position
- `getActiveEvents(pos)` - Get all active events

---

## Technical Details

### State Machine

| Value | State | Description |
|-------|-------|-------------|
| 0 | IDLE | Stopped, ready for start |
| 1 | STARTING | Warmup sequence (1 second) |
| 2 | RUNNING | Normal operation |
| 3 | STOPPING | Shutdown sequence |
| 4 | EMERGENCY | E-Stop activated |

### Error Codes

| Code | Description |
|------|-------------|
| 0 | No Error |
| 100 | Emergency Stop |
| 201-204 | Event safety violations |
| 210-212 | Startup safety failures |
| 220 | Safety lost during operation |
| 230-232 | Zone disabled during operation |

### Speed Control

- **Speed Setpoint**: Register 0 (0-100%)
- **Actual Speed**: Register 2 (after ramping)
- **Ramp Rate**: 2% per scan cycle
- **Detection**: Jumps >30% increment stealth_counter

### Position Tracking

- **Range**: 0-360 continuous
- **Wrap**: Position > 360 → 0
- **Increment**: Based on actual_speed
- **Scale Factor**: 1000 accumulator ticks per position unit

---

## Files Changed

### Backend (PLC/Server)
- ✅ `scripts/attraction_control.st` - Complete rewrite
- ✅ `scripts/plc_modbus_map.py` - Complete rewrite
- ✅ `scripts/standalone_server.py` - Compatible (uses map file)

### Database
- ✅ `supabase/migrations/20251106000000_refactor_ctf_challenges_v2.sql` - New challenges

### Attack Scripts
- ✅ `ext_attacks/challenge_01_lights_out.py` - New
- ✅ `ext_attacks/challenge_02_speed_demon.py` - New
- ✅ `ext_attacks/challenge_03_zone_lockout.py` - New
- ✅ `ext_attacks/challenge_04_safety_bypass.py` - New
- ✅ `ext_attacks/challenge_05_event_chaos.py` - New
- ✅ `ext_attacks/challenge_06_stealth_speed.py` - New
- ✅ `ext_attacks/challenge_07_state_machine.py` - New
- ✅ `ext_attacks/challenge_08_position_teleport.py` - New
- ✅ `ext_attacks/challenge_09_total_domination.py` - New
- ✅ `ext_attacks/challenge_10_ghost_mode.py` - New
- ✅ `ext_attacks/README.md` - Complete documentation

### Frontend
- ✅ `src/types/rideEvents.ts` - Complete rewrite
- ⚠️ `src/components/AttractionVisualizer.tsx` - Type-compatible, visualization pending
- ⚠️ `src/hooks/useWebSocketSimulation.ts` - May need address updates
- ⚠️ `src/hooks/useChallengeDetection.ts` - May need logic updates

---

## Next Steps

### Required for Full Operation

1. **Upload New ST File to OpenPLC**
   ```bash
   # Access OpenPLC web interface
   # Navigate to Programs
   # Upload scripts/attraction_control.st
   # Start the PLC
   ```

2. **Apply Database Migration**
   ```bash
   # Migration will auto-apply on Supabase connection
   # Or manually run the SQL file
   ```

3. **Update Frontend Hooks** (Optional but recommended)
   - Update `useWebSocketSimulation.ts` to use new address constants
   - Update challenge detection logic for new event system
   - Test all 10 CTF challenges

4. **Visual Refactor** (Future enhancement)
   - Update `AttractionVisualizer.tsx` for 3-zone linear layout
   - Show 9 events instead of old system
   - Update position markers and indicators

### Testing Checklist

- [ ] OpenPLC loads new ST file without errors
- [ ] All 31 coils readable (master_enable through safety_ok)
- [ ] State machine transitions correctly (0→1→2)
- [ ] Position increments properly (0-360 wrap)
- [ ] Event triggers work (check event_X_active coils)
- [ ] Event counters increment (registers 1044-1052)
- [ ] All 10 attack scripts execute successfully
- [ ] CTF flags captured correctly

---

## Compatibility Notes

### Backwards Compatibility: ❌ BREAKING

This is a **complete system redesign**. Old configurations will NOT work.

**What breaks:**
- Old attack scripts (different addresses)
- Old CTF challenges (deleted from database)
- Saved PLC programs (new ST file required)
- Hardcoded address references

**Migration path:**
1. Stop all services
2. Upload new ST file to OpenPLC
3. Apply database migration
4. Restart services
5. Use new attack scripts

### Forward Compatibility: ✅ STABLE

The new system is designed for stability:
- Clear address allocation (room for expansion)
- Consistent naming conventions
- Documented interfaces
- Type-safe frontend

---

## Architecture Improvements

### Old System
- 5 zones (confusing for CTF)
- 8 random position events
- Limited challenge variety
- Inconsistent addressing
- Poor documentation

### New System
- **3 logical zones** (easy to understand)
- **9 position-range events** (realistic ICS behavior)
- **10 progressive CTF challenges** (easy → expert)
- **Systematic addressing** (clear patterns)
- **Comprehensive documentation** (this file + ext_attacks/README.md)

### Educational Value

The new system teaches:
1. **Modbus Protocol** - Coils vs Registers, addressing
2. **PLC Logic** - State machines, position tracking, event systems
3. **ICS Security** - Attack patterns, detection, stealth
4. **Progressive Learning** - Easy challenges build to expert
5. **Real-World Scenarios** - Safety bypasses, state manipulation

---

## Performance Considerations

### PLC Scan Cycle
- **Rate**: 20ms (50 Hz)
- **Position Update**: Every scan based on speed
- **Event Checks**: All 9 events evaluated per scan
- **Counters**: Increment on edge detection (not every scan)

### Frontend Updates
- **WebSocket**: Real-time updates to browser
- **Polling**: Server polls PLC every cycle
- **State Sync**: Efficient delta transmission

### Attack Timing
- **Stealth Detection**: >30% speed jump triggers
- **Event Windows**: 40-position ranges (0.8-8 seconds at various speeds)
- **State Transitions**: 50 scan minimum (1 second)

---

## Security Implications

### Educational Threats Demonstrated

1. **No Authentication**: Modbus allows any client
2. **No Encryption**: Cleartext protocol
3. **State Manipulation**: Direct register writes
4. **Safety Bypass**: Disable interlocks
5. **Timing Attacks**: Exploit scan cycles
6. **Stealth Techniques**: Gradual parameter changes

### Defensive Concepts

1. **Network Segmentation**: Isolate ICS networks
2. **Anomaly Detection**: Monitor for unusual patterns (stealth_counter)
3. **Safety Systems**: Independent safety relays
4. **Access Control**: Firewall rules, VPNs
5. **Monitoring**: Log all Modbus transactions

---

## Credits & References

- **OpenPLC**: https://autonomylogic.com/
- **Modbus Spec**: http://www.modbus.org/
- **ICS Security**: https://www.cisa.gov/ics
- **Educational Use**: Lab environment only!

---

**⚠️ Legal Notice**

This system is for authorized security education only. All attack techniques are demonstrated in a controlled lab environment. Never use these methods against production systems or systems you don't own.

---

## Quick Reference Card

```
ZONES:          1: 0-120  |  2: 121-240  |  3: 241-360

EVENTS:         E1: 0-40    E2: 41-80    E3: 81-120
                E4: 121-160  E5: 161-200  E6: 201-240
                E7: 241-280  E8: 281-320  E9: 321-360

STATE MACHINE:  0=IDLE  1=STARTING  2=RUNNING  3=STOPPING  4=EMERGENCY

KEY REGISTERS:  1: position  |  2: speed  |  1039: state
                1044-1052: event counters
                1054: alarms  |  1055: stealth

KEY COILS:      0-4: control  |  5-7: zones  |  8-16: event enables
                17-25: event active  |  26-30: system status
```

