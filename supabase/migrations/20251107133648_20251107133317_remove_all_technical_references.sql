/*
  # Remove ALL Technical References from Challenge Descriptions

  ## Changes
  - Remove all references to coils, registers, and memory addresses from ALL challenges
  - Update old challenges that weren't cleaned up previously
  - Keep only high-level objectives without technical implementation details

  ## Security
  - No RLS changes needed - only updating challenge descriptions
*/

-- Update Lights Out
UPDATE challenges
SET description = 'Disable the photo flash event.

Check the attraction documentation to understand how events are controlled.'
WHERE title = 'Lights Out';

-- Update Speed Demon
UPDATE challenges
SET description = 'Achieve significantly higher speeds than normal safety limits allow.

The system monitors speed in certain zones. Find out how to bypass these checks.'
WHERE title = 'Speed Demon';

-- Update Zone Lockout
UPDATE challenges
SET description = 'Disable Zone 1 entirely while the ride attempts to operate.

Zones can be enabled or disabled. Consult the documentation to learn how.'
WHERE title = 'Zone Lockout';

-- Update Safety Bypass
UPDATE challenges
SET description = '1. Bypass the safety interlock system
2. Successfully complete a full ride cycle

Safety systems check certain conditions at specific positions. Timing is key.'
WHERE title = 'Safety Bypass';

-- Update Event Chaos
UPDATE challenges
SET description = 'Make three events from different zones all active at the exact same time.

Events normally activate based on vehicle position. How can you make the system think you are in multiple places?'
WHERE title = 'Event Chaos';

-- Update Stealth Speed Run
UPDATE challenges
SET description = 'Reach a high speed while keeping the stealth detection counter at zero.

The system detects sudden changes. Gradual adjustments might go unnoticed.'
WHERE title = 'Stealth Speed Run';

-- Update State Machine Takeover
UPDATE challenges
SET description = 'Skip the normal state transitions and jump directly to the running state.

The state machine follows a specific sequence. What if you bypass it entirely?'
WHERE title = 'State Machine Takeover';

-- Update Position Teleporter
UPDATE challenges
SET description = 'Make the vehicle position jump forward by a significant distance in a single moment.

Position normally increments gradually. Direct manipulation might allow instant jumps.'
WHERE title = 'Position Teleporter';

-- Update Total Domination
UPDATE challenges
SET description = 'Control all three zones in a specific pattern while maintaining running state for several seconds.

This requires coordinating multiple system components at once. The system will protest.'
WHERE title = 'Total Domination';

-- Update Ghost in the Machine
UPDATE challenges
SET description = 'Change at least three different system parameters during a complete cycle while keeping all monitoring counters at zero.

The ultimate stealth challenge. Perfect timing, smooth transitions, and deep system knowledge required.'
WHERE title = 'Ghost in the Machine';

-- Update Emergency Override (remove coil reference)
UPDATE challenges
SET description = 'Trigger the emergency stop while the ride is running.

Find the emergency stop control in the system documentation.'
WHERE title = 'Emergency Override';

-- Update Zone Manipulation (remove coil references)
UPDATE challenges
SET description = 'Enable or disable individual attraction zones while the system is active.

Learn how zones are controlled through the documentation.'
WHERE title = 'Zone Manipulation';

-- Update Speed Control (remove register reference)
UPDATE challenges
SET description = 'Modify the ride speed setpoint during operation.

Speed can be adjusted through the control system.'
WHERE title = 'Speed Control';

-- Update State Machine Attack (remove register and state number references)
UPDATE challenges
SET description = 'Force the PLC state machine into maintenance mode.

Research how the state machine operates and what modes are available.'
WHERE title = 'State Machine Attack';

-- Update Event Disable (remove coil references)
UPDATE challenges
SET description = 'Disable specific ride events while the ride is running to skip attractions.

Events can be controlled individually - check the documentation.'
WHERE title = 'Event Disable';

-- Update Stealth Mode (remove position numbers)
UPDATE challenges
SET description = 'Keep the ride running for at least 3 complete cycles without triggering any event detection.

Monitor the system carefully to avoid detection.'
WHERE title = 'Stealth Mode';

-- Update Position Teleport (remove register reference)
UPDATE challenges
SET description = 'Manipulate the vehicle position to jump across zones instantly.

The position value can be directly controlled if you know where to look.'
WHERE title = 'Position Teleport';

-- Update Ghost Mode
UPDATE challenges
SET description = 'Complete 3 full cycles with all 9 events disabled simultaneously.

This requires disabling every event while maintaining ride operation.'
WHERE title = 'Ghost Mode';
