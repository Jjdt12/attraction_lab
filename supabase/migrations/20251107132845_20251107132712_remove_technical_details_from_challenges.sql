/*
  # Clean Up CTF Challenge Descriptions

  ## Changes
  - Remove all flavor text, keep only objectives and hints
  - Fix markdown formatting (newlines for proper rendering)
  - Make descriptions concise and clear

  ## Security
  - No RLS changes needed - only updating challenge descriptions
*/

-- Update Lights Out challenge
UPDATE challenges
SET description = 'Disable the photo flash event.

Check the attraction documentation to understand how events are controlled.'
WHERE title = 'Lights Out';

-- Update Speed Demon challenge
UPDATE challenges
SET description = 'Achieve significantly higher speeds than normal safety limits allow.

The system monitors speed in certain zones. Find out how to bypass these checks.'
WHERE title = 'Speed Demon';

-- Update Zone Lockout challenge
UPDATE challenges
SET description = 'Disable Zone 1 entirely while the ride attempts to operate.

Zones can be enabled or disabled. Consult the documentation to learn how.'
WHERE title = 'Zone Lockout';

-- Update Safety Bypass challenge
UPDATE challenges
SET description = '1. Bypass the safety interlock system
2. Successfully complete a full ride cycle

Safety systems check certain conditions at specific positions. Timing is key.'
WHERE title = 'Safety Bypass';

-- Update Event Chaos challenge
UPDATE challenges
SET description = 'Make three events from different zones all active at the exact same time.

Events normally activate based on vehicle position. How can you make the system think you are in multiple places?'
WHERE title = 'Event Chaos';

-- Update Stealth Speed Run challenge
UPDATE challenges
SET description = 'Reach a high speed while keeping the stealth detection counter at zero.

The system detects sudden changes. Gradual adjustments might go unnoticed.'
WHERE title = 'Stealth Speed Run';

-- Update State Machine Takeover challenge
UPDATE challenges
SET description = 'Skip the normal state transitions and jump directly to the running state.

The state machine follows a specific sequence. What if you bypass it entirely?'
WHERE title = 'State Machine Takeover';

-- Update Position Teleporter challenge
UPDATE challenges
SET description = 'Make the vehicle position jump forward by a significant distance in a single moment.

Position normally increments gradually. Direct manipulation might allow instant jumps.'
WHERE title = 'Position Teleporter';

-- Update Total Domination challenge
UPDATE challenges
SET description = 'Control all three zones in a specific pattern while maintaining running state for several seconds.

This requires coordinating multiple system components at once. The system will protest.'
WHERE title = 'Total Domination';

-- Update Ghost in the Machine challenge
UPDATE challenges
SET description = 'Change at least three different system parameters during a complete cycle while keeping all monitoring counters at zero.

The ultimate stealth challenge. Perfect timing, smooth transitions, and deep system knowledge required.'
WHERE title = 'Ghost in the Machine';
