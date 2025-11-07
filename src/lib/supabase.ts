import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LabSession = {
  id: string;
  session_name: string;
  scenario_type: 'normal' | 'attack' | 'defense';
  started_at: string;
  ended_at?: string;
  status: 'running' | 'completed' | 'error';
  plc_host: string;
  notes: string;
  created_at: string;
};

export type ModbusEvent = {
  id: string;
  session_id: string;
  timestamp: string;
  event_type: 'read_coil' | 'write_coil' | 'intercepted' | 'modified';
  address: number;
  value: boolean;
  original_value?: boolean;
  source: 'hmi' | 'proxy' | 'plc';
  metadata: Record<string, any>;
};

export type AttractionState = {
  id: string;
  session_id: string;
  timestamp: string;
  car_position: number;
  ride_running: boolean;
  light_flash: boolean;
  proxi_sensor: boolean;
};

export type SecurityAlert = {
  id: string;
  session_id: string;
  timestamp: string;
  alert_type: 'anomaly' | 'mitm_detected' | 'unauthorized_write';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
};
