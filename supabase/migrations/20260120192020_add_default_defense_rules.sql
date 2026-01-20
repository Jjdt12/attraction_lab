/*
  # Default Defense Rules

  Populates the security training system with example defense rules.
  All rules are DISABLED by default - the system starts vulnerable.

  ## Rule Categories:
  1. Firewall Rules - Network-level blocking
  2. Protocol Filters - Modbus function code filtering
  3. IDS Signatures - Intrusion detection rules
  4. ACL Rules - Access control lists
  5. Rate Limits - Request throttling
*/

DO $$
DECLARE
  default_config_id uuid;
BEGIN
  SELECT id INTO default_config_id 
  FROM security_configurations 
  WHERE name = 'Default Vulnerable' 
  LIMIT 1;
  
  IF default_config_id IS NULL THEN
    RAISE NOTICE 'No default configuration found, skipping rule insertion';
    RETURN;
  END IF;

  -- Firewall Rules
  INSERT INTO defense_rules (config_id, rule_type, name, description, rule_definition, enabled, order_priority, blocks_challenges) VALUES
  (default_config_id, 'firewall', 'Block External Modbus', 
   'Block Modbus TCP (port 502) from external networks',
   '{"action": "deny", "source": "external", "dest_port": 502, "protocol": "tcp"}'::jsonb,
   false, 10, ARRAY['challenge_01', 'challenge_02']),
  
  (default_config_id, 'firewall', 'Allow HMI to PLC Only',
   'Only allow HMI zone (10.0.1.0/24) to communicate with PLCs',
   '{"action": "allow", "source": "10.0.1.0/24", "dest": "10.0.0.0/24", "dest_port": 502}'::jsonb,
   false, 20, ARRAY['challenge_04']),
  
  (default_config_id, 'firewall', 'Block Inter-Zone Traffic',
   'Deny direct traffic between non-adjacent Purdue levels',
   '{"action": "deny", "source": "level_3+", "dest": "level_0", "protocol": "any"}'::jsonb,
   false, 30, ARRAY['challenge_10']);

  -- Protocol Filter Rules
  INSERT INTO defense_rules (config_id, rule_type, name, description, rule_definition, enabled, order_priority, blocks_challenges) VALUES
  (default_config_id, 'protocol_filter', 'Block Write Coils (FC5)',
   'Block Modbus function code 5 (Write Single Coil) from unauthorized sources',
   '{"function_code": 5, "action": "deny", "except_sources": ["10.0.1.0/24"]}'::jsonb,
   false, 10, ARRAY['challenge_03', 'challenge_07']),
  
  (default_config_id, 'protocol_filter', 'Block Write Registers (FC6)',
   'Block Modbus function code 6 (Write Single Register) from unauthorized sources',
   '{"function_code": 6, "action": "deny", "except_sources": ["10.0.1.0/24"]}'::jsonb,
   false, 20, ARRAY['challenge_05', 'challenge_06']),
  
  (default_config_id, 'protocol_filter', 'Block Multiple Write (FC15/16)',
   'Block Modbus function codes 15 and 16 (Write Multiple) from all external sources',
   '{"function_codes": [15, 16], "action": "deny", "except_sources": []}'::jsonb,
   false, 30, ARRAY['challenge_09']),
  
  (default_config_id, 'protocol_filter', 'Allow Read Only from External',
   'Only allow read operations (FC1, FC2, FC3, FC4) from external networks',
   '{"function_codes": [1, 2, 3, 4], "action": "allow", "sources": ["*"]}'::jsonb,
   false, 100, ARRAY[]::text[]);

  -- IDS Signature Rules
  INSERT INTO defense_rules (config_id, rule_type, name, description, rule_definition, enabled, order_priority, blocks_challenges) VALUES
  (default_config_id, 'ids_signature', 'Emergency Stop Manipulation',
   'Detect attempts to write to emergency stop coil (address 3)',
   '{"type": "modbus_write", "addresses": [3], "alert_severity": "critical", "action": "alert_and_block"}'::jsonb,
   false, 10, ARRAY['challenge_03']),
  
  (default_config_id, 'ids_signature', 'Rapid Coil Writes',
   'Detect rapid successive coil writes (possible attack pattern)',
   '{"type": "rate_anomaly", "threshold": 10, "window_seconds": 1, "function_codes": [5, 15], "alert_severity": "high"}'::jsonb,
   false, 20, ARRAY['challenge_07', 'challenge_09']),
  
  (default_config_id, 'ids_signature', 'Safety System Access',
   'Alert on any access to safety-critical addresses (0-10)',
   '{"type": "address_monitor", "address_range": [0, 10], "alert_severity": "high", "action": "alert"}'::jsonb,
   false, 30, ARRAY['challenge_09']),
  
  (default_config_id, 'ids_signature', 'Unauthorized PLC Connection',
   'Detect Modbus connections from unknown IP addresses',
   '{"type": "connection_monitor", "allowed_sources": ["10.0.1.0/24"], "alert_severity": "medium"}'::jsonb,
   false, 40, ARRAY['challenge_01', 'challenge_02']),
  
  (default_config_id, 'ids_signature', 'State Machine Manipulation',
   'Detect writes to state machine registers',
   '{"type": "modbus_write", "addresses": [1024, 1025, 1039], "alert_severity": "critical", "action": "alert_and_block"}'::jsonb,
   false, 50, ARRAY['challenge_05', 'challenge_10']);

  -- ACL Rules
  INSERT INTO defense_rules (config_id, rule_type, name, description, rule_definition, enabled, order_priority, blocks_challenges) VALUES
  (default_config_id, 'acl', 'HMI Read/Write Access',
   'Allow full Modbus access from HMI workstations',
   '{"source": "10.0.1.0/24", "permissions": ["read", "write"], "addresses": "*"}'::jsonb,
   false, 10, ARRAY[]::text[]),
  
  (default_config_id, 'acl', 'Engineering Write Access',
   'Allow write access only from engineering workstation with authentication',
   '{"source": "10.0.2.10", "permissions": ["read", "write"], "requires_auth": true}'::jsonb,
   false, 20, ARRAY[]::text[]),
  
  (default_config_id, 'acl', 'SCADA Read Only',
   'Allow read-only access from SCADA servers',
   '{"source": "10.0.3.0/24", "permissions": ["read"], "addresses": "*"}'::jsonb,
   false, 30, ARRAY[]::text[]);

  -- Rate Limit Rules
  INSERT INTO defense_rules (config_id, rule_type, name, description, rule_definition, enabled, order_priority, blocks_challenges) VALUES
  (default_config_id, 'rate_limit', 'Global Rate Limit',
   'Limit all sources to 100 requests per second',
   '{"max_requests": 100, "window_seconds": 1, "action": "throttle"}'::jsonb,
   false, 10, ARRAY['challenge_08']),
  
  (default_config_id, 'rate_limit', 'Write Rate Limit',
   'Limit write operations to 10 per second per source',
   '{"max_requests": 10, "window_seconds": 1, "function_codes": [5, 6, 15, 16], "action": "block"}'::jsonb,
   false, 20, ARRAY['challenge_07', 'challenge_09']);

  -- Protocol Policies
  INSERT INTO protocol_policies (config_id, name, source_zone, function_codes_allowed, enabled) VALUES
  (default_config_id, 'HMI Zone Policy', '10.0.1.0/24', ARRAY[1, 2, 3, 4, 5, 6, 15, 16], false),
  (default_config_id, 'Engineering Zone Policy', '10.0.2.0/24', ARRAY[1, 2, 3, 4, 5, 6, 15, 16], false),
  (default_config_id, 'External/Unknown Policy', '*', ARRAY[1, 2, 3, 4], false);

  RAISE NOTICE 'Successfully inserted default defense rules for config %', default_config_id;
END $$;
