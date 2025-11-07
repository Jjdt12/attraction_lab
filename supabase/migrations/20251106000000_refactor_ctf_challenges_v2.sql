/*
  # Complete CTF Challenge Refactor - 3 Zones, 9 Events

  ## Changes
  1. Delete all existing challenges
  2. Create 10 new progressive challenges mapped to 9 events across 3 zones
  3. Update challenge detection to match new PLC logic

  ## Challenge Progression
  Easy (1-3): Single action attacks
  Medium (4-6): Multi-step sequences
  Hard (7-8): State machine & interlocking logic
  Expert (9-10): Advanced stealth & coordination

  ## New Event System
  Zone 1 (0-120): Loading Gate, Safety Interlock, Launch
  Zone 2 (121-240): Photo Flash, Mid-Brake, Track Switch
  Zone 3 (241-360): Final Brake, Station Approach, Unload
*/

-- Clean slate: delete all old challenges
DELETE FROM ctf_challenges;

-- ===================================
-- EASY CHALLENGES (1-3)
-- ===================================

INSERT INTO ctf_challenges (
  id, title, description, difficulty, flag, points, 
  detection_type, detection_config, hints, order_index
) VALUES 
(
  gen_random_uuid(),
  'Lights Out',
  'The photo flash at Event 4 (position 121-160) is annoying guests. Can you disable it?

**Objective:** Disable the photo flash by turning off Event 4.

**What you need to know:**
- Event 4 is controlled by coil 11 (event_4_enable)
- Set it to FALSE (0) to disable the flash
- The ride must be running for this to count',
  'easy',
  'FLAG{D4RK_ROOM_PH0T0_B00TH}',
  100,
  'event_disabled',
  '{"event_coil": 11, "event_name": "event_4", "min_duration_sec": 3}',
  ARRAY[
    'Events are controlled by enable coils starting at coil 8',
    'Event 4 enable is at coil 11',
    'Use write_coil(11, 0) to disable it'
  ],
  1
),
(
  gen_random_uuid(),
  'Speed Demon',
  'The ride is running too slow. Management wants you to "optimize" the speed during Event 5 (Mid-Course Brake).

**Objective:** Set speed to 85% or higher while in Event 5 zone (position 161-200).

**What you need to know:**
- Speed setpoint is at input register 0
- Event 5 triggers speed checks - bypass them
- The PLC will alert if speed > 70% in this zone',
  'easy',
  'FLAG{BR4K3S_4R3_0PT10N4L}',
  100,
  'speed_violation',
  '{"min_speed": 85, "event_zone": [161, 200], "required_cycles": 1}',
  ARRAY[
    'Speed setpoint is at input register 0',
    'Write values 0-100 (percentage)',
    'The PLC enforces a 70% limit in Event 5'
  ],
  2
),
(
  gen_random_uuid(),
  'Zone Lockout',
  'Zone 1 is under maintenance. Lock it out to prevent the ride from entering it.

**Objective:** Disable Zone 1 entirely by setting zone_1_enable to FALSE.

**What you need to know:**
- Zone enables start at coil 5
- Zone 1 is coil 5, Zone 2 is coil 6, Zone 3 is coil 7
- The PLC will throw errors but keep running',
  'easy',
  'FLAG{Z0N3_MAINT3N4NC3_M0D3}',
  150,
  'zone_disabled',
  '{"zone_coil": 5, "zone_number": 1, "min_duration_sec": 5}',
  ARRAY[
    'Zone enables are coils 5, 6, 7',
    'Zone 1 = coil 5',
    'Set it to FALSE to lock out the zone'
  ],
  3
),

-- ===================================
-- MEDIUM CHALLENGES (4-6)
-- ===================================

(
  gen_random_uuid(),
  'Safety Bypass',
  'Event 2 (Safety Interlock) is blocking a quick launch. Bypass it AND successfully launch the ride.

**Objective:** 
1. Disable Event 2 (coil 9)
2. Successfully transition through Zone 1 without triggering safety errors

**What you need to know:**
- Event 2 performs safety checks at position 41-80
- You must bypass it before entering that zone
- The ride must complete a full cycle',
  'medium',
  'FLAG{S4F3TY_TH1RD_R1GHT}',
  200,
  'multi_event',
  '{"required_events": [{"coil": 9, "state": false}], "zones_crossed": [1, 2], "no_errors": true}',
  ARRAY[
    'Event 2 enable is coil 9',
    'Disable it before position 41',
    'Monitor error code register (1029) to confirm no safety errors'
  ],
  4
),
(
  gen_random_uuid(),
  'Event Chaos',
  'Trigger Events 1, 4, and 7 simultaneously - even though they are in different zones.

**Objective:** Make event_1_active, event_4_active, and event_7_active all TRUE at the same time.

**What you need to know:**
- You cannot directly write to event_X_active coils (they are outputs)
- You need to manipulate position to be in multiple event zones
- Or find another creative way...',
  'medium',
  'FLAG{QU4NTUM_EV3NT_SUP3RP0S1T10N}',
  250,
  'position_manipulation',
  '{"active_coils": [17, 20, 23], "all_true_simultaneously": true}',
  ARRAY[
    'Event active coils: 17 (evt1), 20 (evt4), 23 (evt7)',
    'Position register is 1 (current_position)',
    'Think about how position determines which events are active'
  ],
  5
),
(
  gen_random_uuid(),
  'Stealth Speed Run',
  'Change the speed to 75% without triggering the stealth_counter.

**Objective:** Modify speed while keeping stealth_counter at 0.

**What you need to know:**
- The PLC increments stealth_counter (register 1055) when it detects suspicious changes
- Large speed jumps (>30%) trigger detection
- You need to ramp slowly or find another method',
  'medium',
  'FLAG{SL0W_4ND_ST34DY_W1NS}',
  250,
  'stealth_attack',
  '{"target_speed": 75, "max_stealth_count": 0, "register": 1055}',
  ARRAY[
    'Stealth counter is at register 1055 (MW31)',
    'Speed jumps > 30% increment the counter',
    'Try ramping speed gradually'
  ],
  6
),

-- ===================================
-- HARD CHALLENGES (7-8)
-- ===================================

(
  gen_random_uuid(),
  'State Machine Takeover',
  'Force the ride into RUNNING state (state=2) without going through the proper startup sequence.

**Objective:** Set state register to 2 while bypassing STARTING state (1).

**What you need to know:**
- State machine is at register 1039 (MW15)
- States: 0=IDLE, 1=STARTING, 2=RUNNING, 3=STOPPING, 4=EMERGENCY
- The PLC expects: 0 → 1 → 2 transition
- Motor_running (coil 26) must also be TRUE',
  'hard',
  'FLAG{ST4T3_M4CH1N3_H4CK3D}',
  300,
  'state_manipulation',
  '{"target_state": 2, "motor_coil": 26, "bypass_starting": true}',
  ARRAY[
    'State register is 1039',
    'Motor running coil is 26',
    'Write directly to state register',
    'You may need to set multiple conditions'
  ],
  7
),
(
  gen_random_uuid(),
  'Position Teleporter',
  'Skip Event 6 (Track Switch) by "teleporting" the position from 195 to 245.

**Objective:** Jump position by at least 50 units in a single scan cycle.

**What you need to know:**
- Current position is at register 1 (QW1)
- Event 6 is at position 201-240
- The PLC normally increments position gradually
- You need to write a large jump directly',
  'hard',
  'FLAG{T3L3P0RT4T10N_1S_R34L}',
  350,
  'position_jump',
  '{"min_jump": 50, "skip_event": 6, "event_zone": [201, 240]}',
  ARRAY[
    'Position register is 1',
    'Write a value 50+ higher than current position',
    'Monitor event_6_counter to verify it was skipped'
  ],
  8
),

-- ===================================
-- EXPERT CHALLENGES (9-10)
-- ===================================

(
  gen_random_uuid(),
  'Total Domination',
  'Control all 3 zones simultaneously: Disable Zone 1, keep Zone 2 enabled, disable Zone 3, while ride is running.

**Objective:** Set zone_1_enable=FALSE, zone_2_enable=TRUE, zone_3_enable=FALSE while state=2.

**What you need to know:**
- Zone coils: 5 (Z1), 6 (Z2), 7 (Z3)
- State must be 2 (RUNNING)
- Hold this configuration for 5 seconds
- The PLC will generate errors',
  'expert',
  'FLAG{Z0N3_0WN3RSHIP_C0MPL3T3}',
  400,
  'multi_zone_control',
  '{"zone_states": {"5": false, "6": true, "7": false}, "required_state": 2, "duration_sec": 5}',
  ARRAY[
    'Zone coils: 5, 6, 7',
    'State register: 1039',
    'You need to coordinate multiple writes',
    'Monitor alarm_register (1054) for system response'
  ],
  9
),
(
  gen_random_uuid(),
  'Ghost in the Machine',
  'Complete a full lap (cycle_counter +1) with alarm_register=0 AND stealth_counter=0 while manipulating at least 3 parameters.

**Objective:** Change speed, disable an event, and modify a zone - all without detection.

**What you need to know:**
- Cycle counter: register 2051 (MD3)
- Alarm register: 1054 (MW30)
- Stealth counter: 1055 (MW31)
- The PLC tracks unauthorized changes
- This requires perfect timing and smooth transitions',
  'expert',
  'FLAG{UND3T3CT4BL3_0P3R4T0R}',
  500,
  'perfect_stealth',
  '{"min_actions": 3, "max_alarm": 0, "max_stealth": 0, "cycle_increment": 1}',
  ARRAY[
    'Monitor registers: 2051 (cycles), 1054 (alarms), 1055 (stealth)',
    'Make changes gradually',
    'Smooth speed transitions prevent detection',
    'Timing is everything'
  ],
  10
);

-- Update challenge order to match difficulty
UPDATE ctf_challenges SET order_index = 1 WHERE title = 'Lights Out';
UPDATE ctf_challenges SET order_index = 2 WHERE title = 'Speed Demon';
UPDATE ctf_challenges SET order_index = 3 WHERE title = 'Zone Lockout';
UPDATE ctf_challenges SET order_index = 4 WHERE title = 'Safety Bypass';
UPDATE ctf_challenges SET order_index = 5 WHERE title = 'Event Chaos';
UPDATE ctf_challenges SET order_index = 6 WHERE title = 'Stealth Speed Run';
UPDATE ctf_challenges SET order_index = 7 WHERE title = 'State Machine Takeover';
UPDATE ctf_challenges SET order_index = 8 WHERE title = 'Position Teleporter';
UPDATE ctf_challenges SET order_index = 9 WHERE title = 'Total Domination';
UPDATE ctf_challenges SET order_index = 10 WHERE title = 'Ghost in the Machine';

