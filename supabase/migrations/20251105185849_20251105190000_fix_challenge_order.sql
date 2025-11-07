/*
  # Fix CTF Challenge Display Order

  1. Changes
    - Update order_index to match the ext_attacks folder numbering
    - Remove obsolete "Coil Override" challenge
    - Add missing "Stealth Mode" challenge
    - Ensure challenges are ordered 1-10 matching the challenge files

  2. Challenge Order
    1. Lights Out
    2. Emergency Override
    3. Zone Manipulation
    4. Speed Control
    5. Safety Bypass
    6. State Machine Attack
    7. Runtime Manipulation
    8. Stealth Mode
    9. Traffic Analysis
    10. Full Laps Silent
*/

-- Delete obsolete challenge
DELETE FROM challenges WHERE title = 'Coil Override';

-- Update order to match ext_attacks folder
UPDATE challenges SET order_index = 1 WHERE title = 'Lights Out';
UPDATE challenges SET order_index = 2 WHERE title = 'Emergency Override';
UPDATE challenges SET order_index = 3 WHERE title = 'Zone Manipulation';
UPDATE challenges SET order_index = 4 WHERE title = 'Speed Control';
UPDATE challenges SET order_index = 5 WHERE title = 'Safety Bypass';
UPDATE challenges SET order_index = 6 WHERE title = 'State Machine Attack';
UPDATE challenges SET order_index = 7 WHERE title = 'Runtime Manipulation';
UPDATE challenges SET order_index = 9 WHERE title = 'Traffic Analysis';
UPDATE challenges SET order_index = 10 WHERE title = 'Full Laps Silent';

-- Insert Stealth Mode challenge if it doesn't exist
INSERT INTO challenges (title, description, difficulty, points, order_index)
VALUES ('Stealth Mode', 'Keep the ride running for at least 3 full laps without the light ever flashing', 'medium', 200, 8)
ON CONFLICT DO NOTHING;