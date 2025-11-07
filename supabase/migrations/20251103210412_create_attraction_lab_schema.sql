/*
  # Attraction Technology Virtual Lab Schema

  ## Overview
  This schema supports a virtual lab for testing attraction control systems, 
  Modbus/PLC communication, and cybersecurity scenarios (MITM attacks, intrusion detection).

  ## New Tables

  ### `lab_sessions`
  Tracks individual lab sessions when users run simulations
  - `id` (uuid, primary key)
  - `session_name` (text) - User-defined name for the session
  - `scenario_type` (text) - Type: 'normal', 'attack', 'defense'
  - `started_at` (timestamptz) - When session began
  - `ended_at` (timestamptz) - When session ended
  - `status` (text) - 'running', 'completed', 'error'
  - `plc_host` (text) - Target PLC hostname
  - `notes` (text) - User notes about the session

  ### `modbus_events`
  Logs all Modbus communication events for analysis
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key to lab_sessions)
  - `timestamp` (timestamptz) - When event occurred
  - `event_type` (text) - 'read_coil', 'write_coil', 'intercepted', 'modified'
  - `address` (integer) - Modbus coil/register address
  - `value` (boolean) - Value read/written
  - `original_value` (boolean) - Original value before modification (for attacks)
  - `source` (text) - 'hmi', 'proxy', 'plc'
  - `metadata` (jsonb) - Additional event details

  ### `attraction_states`
  Tracks the state of the simulated attraction over time
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key to lab_sessions)
  - `timestamp` (timestamptz) - State snapshot time
  - `car_position` (integer) - Position on track (0-8)
  - `ride_running` (boolean) - Whether ride is active
  - `light_flash` (boolean) - Whether light is flashing
  - `proxi_sensor` (boolean) - Proximity sensor state

  ### `security_alerts`
  Records security events detected during lab sessions
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key to lab_sessions)
  - `timestamp` (timestamptz) - When alert triggered
  - `alert_type` (text) - 'anomaly', 'mitm_detected', 'unauthorized_write'
  - `severity` (text) - 'low', 'medium', 'high', 'critical'
  - `description` (text) - Human-readable alert description
  - `details` (jsonb) - Technical details about the alert

  ## Security
  - Enable RLS on all tables
  - Public read access for educational/demo purposes
  - Authenticated users can create and manage their own sessions
*/

-- Create lab_sessions table
CREATE TABLE IF NOT EXISTS lab_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL DEFAULT '',
  scenario_type text NOT NULL DEFAULT 'normal',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  plc_host text NOT NULL DEFAULT 'localhost',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create modbus_events table
CREATE TABLE IF NOT EXISTS modbus_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES lab_sessions(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL,
  address integer NOT NULL DEFAULT 0,
  value boolean NOT NULL DEFAULT false,
  original_value boolean,
  source text NOT NULL DEFAULT 'hmi',
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create attraction_states table
CREATE TABLE IF NOT EXISTS attraction_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES lab_sessions(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  car_position integer NOT NULL DEFAULT 0,
  ride_running boolean NOT NULL DEFAULT false,
  light_flash boolean NOT NULL DEFAULT false,
  proxi_sensor boolean NOT NULL DEFAULT false
);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES lab_sessions(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE lab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modbus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attraction_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for demo/educational purposes
CREATE POLICY "Public can view all lab sessions"
  ON lab_sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view all modbus events"
  ON modbus_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view all attraction states"
  ON attraction_states FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view all security alerts"
  ON security_alerts FOR SELECT
  TO public
  USING (true);

-- Public write access for lab scripts to log data
CREATE POLICY "Public can insert lab sessions"
  ON lab_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update lab sessions"
  ON lab_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can insert modbus events"
  ON modbus_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert attraction states"
  ON attraction_states FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert security alerts"
  ON security_alerts FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_modbus_events_session_id ON modbus_events(session_id);
CREATE INDEX IF NOT EXISTS idx_modbus_events_timestamp ON modbus_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attraction_states_session_id ON attraction_states(session_id);
CREATE INDEX IF NOT EXISTS idx_attraction_states_timestamp ON attraction_states(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_session_id ON security_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_status ON lab_sessions(status);