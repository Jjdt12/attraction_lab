/*
  # Add Advanced CTF Challenges

  1. Changes
    - Add new advanced challenges that leverage the enhanced PLC program features
    - Challenges target multi-zone manipulation, safety bypass, and state analysis

  2. New Challenges
    - Zone Manipulation: Control individual attraction zones through Modbus
    - Emergency Override: Trigger emergency stop through coil manipulation
    - Speed Control: Modify ride speed through discrete inputs
    - Safety Bypass: Circumvent safety interlocks
    - State Machine Attack: Force the PLC into maintenance mode
    - Runtime Manipulation: Alter runtime counters
*/

-- Insert new advanced challenges
INSERT INTO challenges (title, description, difficulty, points, order_index) VALUES
  ('Zone Manipulation', 'Enable or disable individual attraction zones (zones 1-5) through Modbus coil writes', 'medium', 200, 4),
  ('Emergency Override', 'Trigger the emergency stop through Modbus while the ride is running', 'easy', 150, 5),
  ('Speed Control', 'Modify the ride speed setpoint through holding register manipulation', 'hard', 300, 6),
  ('Safety Bypass', 'Make the ride start despite safety_gate_closed being false', 'hard', 350, 7),
  ('State Machine Attack', 'Force the PLC state machine into maintenance mode (state 5)', 'hard', 400, 8),
  ('Runtime Manipulation', 'Alter the runtime_hours counter to trigger maintenance_flag', 'medium', 250, 9),
  ('Full Laps Silent', 'Complete 3 full laps without the flash light activating once', 'hard', 300, 10)
ON CONFLICT DO NOTHING;