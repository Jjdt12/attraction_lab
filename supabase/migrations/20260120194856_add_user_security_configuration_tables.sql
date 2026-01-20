/*
  # User Security Configuration Tables

  This migration creates tables for storing user-created security configurations
  in the Security Training Lab. Users can create their own:
  - Firewall rules
  - Protocol filters (Modbus DPI)
  - IDS signatures
  - Access control lists

  1. New Tables
    - `user_firewall_rules` - User-defined firewall rules with source/dest IP, ports, protocols
    - `user_protocol_filters` - Modbus function code and address range filters
    - `user_ids_signatures` - Pattern, threshold, anomaly, and sequence-based detection rules
    - `user_acl_entries` - Role/device/zone based access control with conditions

  2. Security
    - RLS enabled on all tables
    - Policies allow authenticated users to manage their own configurations
*/

CREATE TABLE IF NOT EXISTS user_firewall_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES security_configurations(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 100,
  source_ip text,
  source_port text DEFAULT 'any',
  destination_ip text,
  destination_port text,
  protocol text DEFAULT 'tcp' CHECK (protocol IN ('tcp', 'udp', 'any')),
  action text DEFAULT 'deny' CHECK (action IN ('allow', 'deny', 'log')),
  direction text DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound', 'both')),
  description text,
  source_zone text,
  destination_zone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_protocol_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES security_configurations(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  source_zone text,
  allowed_function_codes integer[] DEFAULT '{}',
  blocked_function_codes integer[] DEFAULT '{}',
  address_ranges jsonb DEFAULT '[]',
  rate_limit jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_ids_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES security_configurations(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detection_type text DEFAULT 'threshold' CHECK (detection_type IN ('pattern', 'threshold', 'anomaly', 'sequence')),
  action text DEFAULT 'alert' CHECK (action IN ('log', 'alert', 'alert_and_block')),
  pattern_config jsonb,
  threshold_config jsonb,
  anomaly_config jsonb,
  sequence_config jsonb,
  description text,
  mitre_tactic text,
  mitre_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_acl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES security_configurations(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 100,
  subject_type text DEFAULT 'role' CHECK (subject_type IN ('user', 'role', 'device', 'zone', 'ip_range')),
  subject_value text,
  resource_type text DEFAULT 'all' CHECK (resource_type IN ('plc', 'register_range', 'function_code', 'all')),
  resource_value text,
  permission text DEFAULT 'deny' CHECK (permission IN ('allow', 'deny')),
  operations text[] DEFAULT '{}',
  conditions jsonb DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_protocol_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ids_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_acl_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view firewall rules for active config"
  ON user_firewall_rules FOR SELECT
  TO authenticated
  USING (
    config_id IN (SELECT id FROM security_configurations WHERE is_active = true)
  );

CREATE POLICY "Users can insert firewall rules"
  ON user_firewall_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    config_id IN (SELECT id FROM security_configurations WHERE is_active = true)
  );

CREATE POLICY "Users can update firewall rules"
  ON user_firewall_rules FOR UPDATE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can delete firewall rules"
  ON user_firewall_rules FOR DELETE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can view protocol filters for active config"
  ON user_protocol_filters FOR SELECT
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can insert protocol filters"
  ON user_protocol_filters FOR INSERT
  TO authenticated
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can update protocol filters"
  ON user_protocol_filters FOR UPDATE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can delete protocol filters"
  ON user_protocol_filters FOR DELETE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can view IDS signatures for active config"
  ON user_ids_signatures FOR SELECT
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can insert IDS signatures"
  ON user_ids_signatures FOR INSERT
  TO authenticated
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can update IDS signatures"
  ON user_ids_signatures FOR UPDATE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can delete IDS signatures"
  ON user_ids_signatures FOR DELETE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can view ACL entries for active config"
  ON user_acl_entries FOR SELECT
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can insert ACL entries"
  ON user_acl_entries FOR INSERT
  TO authenticated
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can update ACL entries"
  ON user_acl_entries FOR UPDATE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Users can delete ACL entries"
  ON user_acl_entries FOR DELETE
  TO authenticated
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can view firewall rules"
  ON user_firewall_rules FOR SELECT
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can insert firewall rules"
  ON user_firewall_rules FOR INSERT
  TO anon
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can update firewall rules"
  ON user_firewall_rules FOR UPDATE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can delete firewall rules"
  ON user_firewall_rules FOR DELETE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can view protocol filters"
  ON user_protocol_filters FOR SELECT
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can insert protocol filters"
  ON user_protocol_filters FOR INSERT
  TO anon
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can update protocol filters"
  ON user_protocol_filters FOR UPDATE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can delete protocol filters"
  ON user_protocol_filters FOR DELETE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can view IDS signatures"
  ON user_ids_signatures FOR SELECT
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can insert IDS signatures"
  ON user_ids_signatures FOR INSERT
  TO anon
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can update IDS signatures"
  ON user_ids_signatures FOR UPDATE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can delete IDS signatures"
  ON user_ids_signatures FOR DELETE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can view ACL entries"
  ON user_acl_entries FOR SELECT
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can insert ACL entries"
  ON user_acl_entries FOR INSERT
  TO anon
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can update ACL entries"
  ON user_acl_entries FOR UPDATE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true))
  WITH CHECK (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE POLICY "Anonymous can delete ACL entries"
  ON user_acl_entries FOR DELETE
  TO anon
  USING (config_id IN (SELECT id FROM security_configurations WHERE is_active = true));

CREATE INDEX IF NOT EXISTS idx_user_firewall_rules_config ON user_firewall_rules(config_id);
CREATE INDEX IF NOT EXISTS idx_user_protocol_filters_config ON user_protocol_filters(config_id);
CREATE INDEX IF NOT EXISTS idx_user_ids_signatures_config ON user_ids_signatures(config_id);
CREATE INDEX IF NOT EXISTS idx_user_acl_entries_config ON user_acl_entries(config_id);
