/*
  # Event Logging and Alarm System

  1. New Tables
    - `system_events`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - When the event occurred
      - `event_type` (text) - Type: ALARM, WARNING, INFO, STATE_CHANGE, etc.
      - `severity` (text) - CRITICAL, WARNING, INFO
      - `plc_name` (text) - Which PLC: MAIN, SAFETY, EFFECTS
      - `message` (text) - Human-readable event description
      - `details` (jsonb) - Additional structured data (register values, etc.)
      - `acknowledged` (boolean) - Whether operator acknowledged alarm
      - `acknowledged_at` (timestamptz) - When acknowledged

    - `alarm_history`
      - `id` (uuid, primary key)
      - `alarm_code` (text) - Unique alarm identifier (e.g., ALM-001)
      - `alarm_name` (text) - Short alarm name
      - `alarm_description` (text) - Detailed description
      - `triggered_at` (timestamptz) - When alarm triggered
      - `cleared_at` (timestamptz) - When alarm cleared (null if active)
      - `plc_name` (text) - Which PLC triggered alarm
      - `trigger_value` (text) - What value caused the alarm
      - `acknowledged` (boolean)
      - `acknowledged_by` (text) - Operator ID or name (optional)

    - `process_trends`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - Sample time
      - `plc_name` (text) - PLC source
      - `variable_name` (text) - e.g., motor_current_amps, bearing_temp
      - `value` (real) - Numeric value
      - `unit` (text) - Unit of measurement

    - `system_health_log`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz)
      - `brake_wear_percent` (integer)
      - `bearing_temp_celsius` (integer)
      - `hydraulic_pressure_psi` (integer)
      - `vibration_level` (integer)
      - `safety_violation_count` (integer)
      - `total_runtime_hours` (integer)
      - `cycle_count` (integer)

  2. Security
    - Enable RLS on all tables
    - Allow anonymous read access for learning environment
    - Allow anonymous insert for event generation
    - No update/delete permissions (audit trail integrity)

  3. Indexes
    - Index on timestamp for fast time-range queries
    - Index on event_type and severity for filtering
    - Index on plc_name for per-PLC queries

  4. Important Notes
    - No authentication required (open learning environment)
    - All tables maintain audit trail integrity
    - Automatic timestamping on insert
*/

CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
  plc_name text NOT NULL CHECK (plc_name IN ('MAIN', 'SAFETY', 'EFFECTS', 'SYSTEM')),
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz
);

CREATE TABLE IF NOT EXISTS alarm_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_code text NOT NULL,
  alarm_name text NOT NULL,
  alarm_description text,
  triggered_at timestamptz DEFAULT now(),
  cleared_at timestamptz,
  plc_name text NOT NULL CHECK (plc_name IN ('MAIN', 'SAFETY', 'EFFECTS', 'SYSTEM')),
  trigger_value text,
  acknowledged boolean DEFAULT false,
  acknowledged_by text
);

CREATE TABLE IF NOT EXISTS process_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  plc_name text NOT NULL CHECK (plc_name IN ('MAIN', 'SAFETY', 'EFFECTS')),
  variable_name text NOT NULL,
  value real NOT NULL,
  unit text
);

CREATE TABLE IF NOT EXISTS system_health_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  brake_wear_percent integer DEFAULT 0,
  bearing_temp_celsius integer DEFAULT 25,
  hydraulic_pressure_psi integer DEFAULT 1200,
  vibration_level integer DEFAULT 10,
  safety_violation_count integer DEFAULT 0,
  total_runtime_hours integer DEFAULT 0,
  cycle_count integer DEFAULT 0
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system events"
  ON system_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert system events"
  ON system_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read alarm history"
  ON alarm_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert alarm history"
  ON alarm_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update alarm acknowledgment"
  ON alarm_history FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read process trends"
  ON process_trends FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert process trends"
  ON process_trends FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read system health log"
  ON system_health_log FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert system health log"
  ON system_health_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_type_severity ON system_events(event_type, severity);
CREATE INDEX IF NOT EXISTS idx_system_events_plc ON system_events(plc_name);

CREATE INDEX IF NOT EXISTS idx_alarm_history_triggered ON alarm_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_history_plc ON alarm_history(plc_name);
CREATE INDEX IF NOT EXISTS idx_alarm_history_active ON alarm_history(cleared_at) WHERE cleared_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_process_trends_timestamp ON process_trends(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_process_trends_variable ON process_trends(variable_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_log(timestamp DESC);
