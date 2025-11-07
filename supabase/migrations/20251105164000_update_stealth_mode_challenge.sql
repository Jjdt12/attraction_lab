/*
  # Update Stealth Mode Challenge
  
  1. Changes
    - Replace "Stealth Mode" challenge with "Coil Override"
    - New challenge requires writing to coil address 3
    - Keep same difficulty and order but adjust points
  
  2. Details
    - Title: "Coil Override"
    - Description: "Write 'true' to coil address 3 using a Modbus write command"
    - Difficulty: medium
    - Points: 200
*/

UPDATE challenges
SET 
  title = 'Coil Override',
  description = 'Write ''true'' to coil address 3 using a Modbus write command',
  difficulty = 'medium',
  points = 200
WHERE title = 'Stealth Mode';
