/*
  # Security Training System Schema
  
  This migration creates the foundation for the ICS Security Training Simulator,
  transforming the lab from passive viewing to active security engineering.

  ## Overview
  The system starts in a completely VULNERABLE state. Users progressively harden
  the system by implementing real security controls. The existing CTF attack 
  scripts become the test suite to validate defenses.

  ## 1. New Tables

  ### security_configurations
  Stores the current security posture for each lab session.

  ### defense_rules
  Individual security rules that can be enabled/disabled.

  ### attack_logs
  Records all attack attempts and what blocked/allowed them.

  ### security_scores
  Historical tracking of security posture improvements.

  ### protocol_policies
  Modbus function code policies per source zone.

  ## 2. Security
  - RLS enabled on all tables
  - Policies allow public read/write for lab environment

  ## 3. Default Data
  - Creates default "Vulnerable" configuration with zero security
  - Creates example defense rules (all disabled by default)
*/

-- Create security_configurations table
CREATE TABLE IF NOT EXISTS security_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES lab_sessions(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Configuration',
  is_active boolean NOT NULL DEFAULT false,
  security_score integer NOT NULL DEFAULT 0,
  network_segmentation_enabled boolean NOT NULL DEFAULT false,
  protocol_filtering_enabled boolean NOT NULL DEFAULT false,
  authentication_enabled boolean NOT NULL DEFAULT false,
  ids_enabled boolean NOT NULL DEFAULT false,
  firewall_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE security_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to security_configurations"
  ON security_configurations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to security_configurations"
  ON security_configurations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to security_configurations"
  ON security_configurations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from security_configurations"
  ON security_configurations FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create defense_rules table
CREATE TABLE IF NOT EXISTS defense_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES security_configurations(id) ON DELETE CASCADE,
  rule_type text NOT NULL CHECK (rule_type IN ('firewall', 'protocol_filter', 'ids_signature', 'acl', 'rate_limit')),
  name text NOT NULL,
  description text,
  rule_definition jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT false,
  order_priority integer NOT NULL DEFAULT 100,
  blocks_challenges text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE defense_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to defense_rules"
  ON defense_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to defense_rules"
  ON defense_rules FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to defense_rules"
  ON defense_rules FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from defense_rules"
  ON defense_rules FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create attack_logs table
CREATE TABLE IF NOT EXISTS attack_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES security_configurations(id) ON DELETE SET NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  attack_type text NOT NULL,
  source_ip text NOT NULL DEFAULT '0.0.0.0',
  target_address integer,
  function_code integer,
  blocked boolean NOT NULL DEFAULT false,
  blocked_by text,
  defense_layer text,
  details jsonb DEFAULT '{}'
);

ALTER TABLE attack_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to attack_logs"
  ON attack_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to attack_logs"
  ON attack_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create security_scores table
CREATE TABLE IF NOT EXISTS security_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES security_configurations(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  total_score integer NOT NULL DEFAULT 0,
  network_score integer NOT NULL DEFAULT 0,
  firewall_score integer NOT NULL DEFAULT 0,
  protocol_score integer NOT NULL DEFAULT 0,
  auth_score integer NOT NULL DEFAULT 0,
  ids_score integer NOT NULL DEFAULT 0,
  vulnerabilities_found integer NOT NULL DEFAULT 0,
  attacks_blocked integer NOT NULL DEFAULT 0,
  attacks_allowed integer NOT NULL DEFAULT 0
);

ALTER TABLE security_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to security_scores"
  ON security_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to security_scores"
  ON security_scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create protocol_policies table
CREATE TABLE IF NOT EXISTS protocol_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES security_configurations(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_zone text NOT NULL DEFAULT '*',
  function_codes_allowed integer[] NOT NULL DEFAULT ARRAY[]::integer[],
  address_ranges_allowed jsonb DEFAULT '{}',
  rate_limit_per_second integer DEFAULT 0,
  requires_auth boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  order_priority integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE protocol_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to protocol_policies"
  ON protocol_policies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to protocol_policies"
  ON protocol_policies FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to protocol_policies"
  ON protocol_policies FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from protocol_policies"
  ON protocol_policies FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_defense_rules_config ON defense_rules(config_id);
CREATE INDEX IF NOT EXISTS idx_defense_rules_type ON defense_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_attack_logs_timestamp ON attack_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attack_logs_config ON attack_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_security_scores_config ON security_scores(config_id);
CREATE INDEX IF NOT EXISTS idx_protocol_policies_config ON protocol_policies(config_id);

-- Insert default configuration
INSERT INTO security_configurations (
  name, is_active, security_score,
  network_segmentation_enabled, protocol_filtering_enabled,
  authentication_enabled, ids_enabled, firewall_enabled
) VALUES (
  'Default Vulnerable', true, 0,
  false, false, false, false, false
) ON CONFLICT DO NOTHING;
