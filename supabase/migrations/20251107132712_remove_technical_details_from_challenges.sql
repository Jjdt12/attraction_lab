/*
  # Remove Technical Details from CTF Challenge Descriptions

  ## Changes
  - Update all challenge descriptions to remove references to specific coils, registers, and technical addresses
  - Keep challenge objectives clear but require players to consult documentation
  - Make the game more exploration-based rather than instruction-based

  ## Security
  - No RLS changes needed - only updating challenge descriptions
*/

-- Update Lights Out challenge
UPDATE challenges
SET description = 'The photo flash is annoying guests. Can you disable it without consulting the documentation?

**Objective:** Disable the photo flash event.

**Hint:** Check the attraction documentation to understand how events are controlled.'
WHERE title = 'Lights Out';

-- Update Speed Demon challenge
UPDATE challenges
SET description = 'The ride is running too slow. Management wants you to "optimize" the speed during the mid-course brake section.

**Objective:** Achieve significantly higher speeds than normal safety limits allow.

**Hint:** The system monitors speed in certain zones. Find out how to bypass these checks.'
WHERE title = 'Speed Demon';

-- Update Zone Lockout challenge
UPDATE challenges
SET description = 'Zone 1 is under maintenance. Lock it out to prevent the ride from entering it.

**Objective:** Disable Zone 1 entirely while the ride attempts to operate.

**Hint:** Zones can be enabled or disabled. Consult the documentation to learn how.'
WHERE title = 'Zone Lockout';

-- Update Safety Bypass challenge
UPDATE challenges
SET description = 'The safety interlock is blocking a quick launch. Bypass it AND successfully launch the ride.

**Objective:**
1. Bypass the safety interlock system
2. Successfully complete a full ride cycle

**Hint:** Safety systems check certain conditions at specific positions. Timing is key.'
WHERE title = 'Safety Bypass';

-- Update Event Chaos challenge
UPDATE challenges
SET description = 'Trigger multiple events simultaneously - even though they are in completely different zones.

**Objective:** Make three events from different zones all active at the exact same time.

**Hint:** Events normally activate based on vehicle position. How can you make the system think you''re in multiple places?'
WHERE title = 'Event Chaos';

-- Update Stealth Speed Run challenge
UPDATE challenges
SET description = 'Change the speed significantly without triggering the system''s anomaly detection.

**Objective:** Reach a high speed while keeping the stealth detection counter at zero.

**Hint:** The system detects sudden changes. Gradual adjustments might go unnoticed.'
WHERE title = 'Stealth Speed Run';

-- Update State Machine Takeover challenge
UPDATE challenges
SET description = 'Force the ride into running state without going through the proper startup sequence.

**Objective:** Skip the normal state transitions and jump directly to the running state.

**Hint:** The state machine follows a specific sequence. What if you bypass it entirely?'
WHERE title = 'State Machine Takeover';

-- Update Position Teleporter challenge
UPDATE challenges
SET description = 'Skip an entire event section by "teleporting" the vehicle position forward.

**Objective:** Make the vehicle position jump forward by a significant distance in a single moment.

**Hint:** Position normally increments gradually. Direct manipulation might allow instant jumps.'
WHERE title = 'Position Teleporter';

-- Update Total Domination challenge
UPDATE challenges
SET description = 'Take complete control of all zones simultaneously while the ride is running.

**Objective:** Control all three zones in a specific pattern while maintaining running state for several seconds.

**Hint:** This requires coordinating multiple system components at once. The system will protest.'
WHERE title = 'Total Domination';

-- Update Ghost in the Machine challenge
UPDATE challenges
SET description = 'Complete a full ride cycle while manipulating multiple parameters without triggering any alarms or detection.

**Objective:** Change at least three different system parameters during a complete cycle while keeping all monitoring counters at zero.

**Hint:** The ultimate stealth challenge. Perfect timing, smooth transitions, and deep system knowledge required.'
WHERE title = 'Ghost in the Machine';
