/*
  # Add External Attack Challenges

  1. Changes
    - Remove old challenges that don't match detection system
    - Add new challenges that match the external attack scripts and detection hooks

  2. Challenge List
    - First Contact (50pts): Connect and explore PLC network
    - Portal Disruption (100pts): Disable event 4 in Scene 4
    - Emergency Override (150pts): Trigger E-stop via Modbus
    - Zone Lockout (200pts): Disable zone while vehicle inside
    - Launch Override (250pts): Set extreme speed values
    - Reality Shift (250pts): Teleport across zones
    - Scene Blackout (300pts): Disable 3+ events simultaneously
    - Heartbeat Hijack (350pts): Spoof Safety PLC ready signal
    - Safety Bypass (400pts): Start ride with safety gate open
    - The Nexus Core (450pts): Force maintenance mode
    - PLC Impersonation (450pts): Activate events without enables
    - Ghost Ride (500pts): 3 cycles with all events disabled
    - Stealth Operator (550pts): 5 cycles with subtle manipulation
    - The Convergence (650pts): Multi-PLC coordinated attack
    - Reality Junction (750pts): Create position desynchronization
*/

-- Clear existing challenges
DELETE FROM challenges;

-- Insert challenges that match the detection system
INSERT INTO challenges (title, description, difficulty, points, order_index) VALUES
  ('First Contact', 'Establish connection to the Project Nexus control network and explore the system through Modbus', 'easy', 50, 1),
  ('Portal Disruption', 'Disable the photo flash event in Scene 4 (Portal Chamber) while the ride is running', 'easy', 100, 2),
  ('Emergency Override', 'Trigger the emergency stop through Modbus (not the UI button) while the ride is running', 'easy', 150, 3),
  ('Zone Lockout', 'Disable Zone 2 while the vehicle is inside it', 'medium', 200, 4),
  ('Launch Override', 'Set the ride speed to an extreme value (>80% or <10%) during operation', 'medium', 250, 5),
  ('Reality Shift', 'Teleport the vehicle across zones by directly manipulating the position register', 'medium', 250, 6),
  ('Scene Blackout', 'Disable 3 or more show events simultaneously during ride operation', 'medium', 300, 7),
  ('Heartbeat Hijack', 'Fake the Safety PLC Ready signal to bypass safety checks', 'hard', 350, 8),
  ('Safety Bypass', 'Start the ride with the safety gate open', 'hard', 400, 9),
  ('The Nexus Core', 'Force the PLC state machine into maintenance mode (state 5)', 'hard', 450, 10),
  ('PLC Impersonation', 'Activate show events without their corresponding enable signals', 'hard', 450, 11),
  ('Ghost Ride', 'Complete 3 full ride cycles with all 9 show events disabled', 'expert', 500, 12),
  ('Stealth Operator', 'Complete 5 cycles with continuous subtle manipulations without triggering major alerts', 'expert', 550, 13),
  ('The Convergence', 'Execute a coordinated attack on all three PLCs simultaneously', 'expert', 650, 14),
  ('Reality Junction', 'Create position desynchronization between PLCs', 'expert', 750, 15)
ON CONFLICT DO NOTHING;
