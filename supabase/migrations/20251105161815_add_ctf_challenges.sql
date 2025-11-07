/*
  # Add CTF Challenges System

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text) - Challenge name
      - `description` (text) - What needs to be accomplished
      - `difficulty` (text) - easy, medium, hard
      - `points` (integer) - Points awarded
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
    
    - `challenge_completions`
      - `id` (uuid, primary key)
      - `challenge_id` (uuid, foreign key)
      - `session_id` (uuid, foreign key to lab_sessions)
      - `completed_at` (timestamptz)
      - `method_used` (text) - How it was solved
  
  2. Security
    - Enable RLS on both tables
    - Allow public read access to challenges (educational tool)
    - Allow public insert for completions (track progress)
  
  3. Data
    - Insert initial CTF challenges
*/

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy',
  points integer NOT NULL DEFAULT 100,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
  ON challenges
  FOR SELECT
  TO public
  USING (true);

-- Create challenge completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES lab_sessions(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  method_used text,
  UNIQUE(challenge_id, session_id)
);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view completions"
  ON challenge_completions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert completions"
  ON challenge_completions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert initial challenges
INSERT INTO challenges (title, description, difficulty, points, order_index) VALUES
  ('Lights Out', 'Prevent the flash light from activating when the car reaches position 5 using a Man-in-the-Middle attack', 'easy', 100, 1),
  ('Stealth Mode', 'Keep the ride running for at least 3 full laps without the light ever flashing', 'medium', 200, 2),
  ('Traffic Analysis', 'Successfully intercept and log at least 10 Modbus commands between the HMI and PLC', 'medium', 150, 3)
ON CONFLICT DO NOTHING;
