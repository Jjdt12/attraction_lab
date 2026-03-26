/*
  # Update Terminology: "Attraction" replaces "Ride"
  
  Updates all user-facing text to use professional theme park industry terminology:
  - "Attraction" instead of "Ride"
  - "Show Control" instead of "SCADA"
  - "Effect controllers" for specialized PLCs
  
  Changes applied to:
  1. CTF challenge descriptions and titles
  2. Defense rule descriptions
  3. Column names where applicable
  4. Any other stored text content
  
  This makes the platform vendor-neutral and applicable to:
  - Universal, Six Flags, regional theme parks
  - Museums with interactive exhibits
  - Escape rooms with automation
  - Any entertainment venue automation
*/

-- Update challenges table with new terminology
UPDATE challenges 
SET title = REPLACE(title, 'Ride', 'Attraction')
WHERE title LIKE '%Ride%';

UPDATE challenges
SET description = REPLACE(description, 'ride', 'attraction')
WHERE description LIKE '%ride%';

UPDATE challenges
SET description = REPLACE(description, 'Ride', 'Attraction')
WHERE description LIKE '%Ride%';

UPDATE challenges
SET description = REPLACE(description, 'SCADA', 'Show Control')
WHERE description LIKE '%SCADA%';

-- Update defense rules descriptions
UPDATE defense_rules
SET description = REPLACE(description, 'ride', 'attraction')
WHERE description LIKE '%ride%';

UPDATE defense_rules
SET description = REPLACE(description, 'Ride', 'Attraction')
WHERE description LIKE '%Ride%';

UPDATE defense_rules
SET description = REPLACE(description, 'SCADA', 'Show Control')
WHERE description LIKE '%SCADA%';

UPDATE defense_rules
SET name = REPLACE(name, 'ride', 'attraction')
WHERE name LIKE '%ride%';

UPDATE defense_rules
SET name = REPLACE(name, 'Ride', 'Attraction')
WHERE name LIKE '%Ride%';

-- Update system events
UPDATE system_events
SET message = REPLACE(message, 'ride', 'attraction')
WHERE message LIKE '%ride%';

UPDATE system_events
SET message = REPLACE(message, 'Ride', 'Attraction')
WHERE message LIKE '%Ride%';

-- Update security alerts
UPDATE security_alerts
SET description = REPLACE(description, 'ride', 'attraction')
WHERE description LIKE '%ride%';

UPDATE security_alerts
SET description = REPLACE(description, 'Ride', 'Attraction')
WHERE description LIKE '%Ride%';

-- Rename column in attraction_states table from 'ride_running' to 'attraction_running'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attraction_states' AND column_name = 'ride_running'
  ) THEN
    ALTER TABLE attraction_states RENAME COLUMN ride_running TO attraction_running;
  END IF;
END $$;

-- Add comment to table explaining terminology
COMMENT ON TABLE attraction_states IS 'Tracks the operational state of the attraction system (formerly ride states). Uses professional theme park industry terminology.';
