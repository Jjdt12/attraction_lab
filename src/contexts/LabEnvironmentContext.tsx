import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Zone {
  id: string;
  name: string;
  level: number;
  securityLevel: number;
  devices: Device[];
  color: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'plc' | 'hmi' | 'scada' | 'historian' | 'firewall' | 'switch' | 'router' | 'workstation' | 'server' | 'sis' | 'sensor' | 'actuator';
  ipAddress: string;
  zoneId: string;
  protocols: string[];
  status: 'online' | 'offline' | 'warning' | 'error';
}

export interface FirewallRule {
  id: string;
  name: string;
  sourceZone: string;
  destZone: string;
  protocol: string;
  ports: string;
  action: 'allow' | 'deny' | 'log';
  enabled: boolean;
}

export interface SecurityAssessment {
  iec62443: {
    sl1: number;
    sl2: number;
    sl3: number;
    sl4: number;
    overallLevel: number;
  };
  nistCsf: {
    identify: number;
    protect: number;
    detect: number;
    respond: number;
    recover: number;
  };
  gaps: string[];
  recommendations: string[];
}

interface LabEnvironmentContextType {
  zones: Zone[];
  devices: Device[];
  firewallRules: FirewallRule[];
  assessment: SecurityAssessment;
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  addFirewallRule: (rule: Omit<FirewallRule, 'id'>) => void;
  updateFirewallRule: (id: string, updates: Partial<FirewallRule>) => void;
  removeFirewallRule: (id: string) => void;
  recalculateAssessment: () => void;
}

const defaultZones: Zone[] = [
  { id: 'z0', name: 'Enterprise Network (Level 5)', level: 5, securityLevel: 1, devices: [], color: '#3b82f6' },
  { id: 'z1', name: 'Site Business (Level 4)', level: 4, securityLevel: 2, devices: [], color: '#8b5cf6' },
  { id: 'z2', name: 'Site Operations (Level 3)', level: 3, securityLevel: 2, devices: [], color: '#06b6d4' },
  { id: 'z3', name: 'Area Control (Level 2)', level: 2, securityLevel: 3, devices: [], color: '#10b981' },
  { id: 'z4', name: 'Basic Control (Level 1)', level: 1, securityLevel: 3, devices: [], color: '#f59e0b' },
  { id: 'z5', name: 'Process (Level 0)', level: 0, securityLevel: 4, devices: [], color: '#ef4444' },
  { id: 'idmz', name: 'Industrial DMZ', level: 3.5, securityLevel: 3, devices: [], color: '#ec4899' },
];

const defaultDevices: Device[] = [
  { id: 'd1', name: 'Main PLC', type: 'plc', ipAddress: '10.0.1.10', zoneId: 'z4', protocols: ['Modbus TCP', 'Ethernet/IP'], status: 'online' },
  { id: 'd2', name: 'Safety PLC', type: 'sis', ipAddress: '10.0.1.20', zoneId: 'z4', protocols: ['ProfiSafe'], status: 'online' },
  { id: 'd3', name: 'HMI Station 1', type: 'hmi', ipAddress: '10.0.2.10', zoneId: 'z3', protocols: ['Modbus TCP'], status: 'online' },
  { id: 'd4', name: 'SCADA Server', type: 'scada', ipAddress: '10.0.3.10', zoneId: 'z2', protocols: ['OPC UA', 'Modbus TCP'], status: 'online' },
  { id: 'd5', name: 'Historian', type: 'historian', ipAddress: '10.0.3.20', zoneId: 'idmz', protocols: ['OPC UA'], status: 'online' },
  { id: 'd6', name: 'OT Firewall', type: 'firewall', ipAddress: '10.0.0.1', zoneId: 'idmz', protocols: [], status: 'online' },
  { id: 'd7', name: 'IT Firewall', type: 'firewall', ipAddress: '192.168.1.1', zoneId: 'z1', protocols: [], status: 'online' },
];

const defaultFirewallRules: FirewallRule[] = [
  { id: 'r1', name: 'Allow HMI to PLC', sourceZone: 'z3', destZone: 'z4', protocol: 'Modbus TCP', ports: '502', action: 'allow', enabled: true },
  { id: 'r2', name: 'Allow SCADA to HMI', sourceZone: 'z2', destZone: 'z3', protocol: 'OPC UA', ports: '4840', action: 'allow', enabled: true },
  { id: 'r3', name: 'Block Enterprise to OT', sourceZone: 'z0', destZone: 'z4', protocol: 'any', ports: '*', action: 'deny', enabled: true },
  { id: 'r4', name: 'Historian Read Only', sourceZone: 'idmz', destZone: 'z2', protocol: 'OPC UA', ports: '4840', action: 'allow', enabled: true },
];

const LabEnvironmentContext = createContext<LabEnvironmentContextType | null>(null);

export function LabEnvironmentProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Zone[]>(defaultZones);
  const [devices, setDevices] = useState<Device[]>(defaultDevices);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(defaultFirewallRules);
  const [assessment, setAssessment] = useState<SecurityAssessment>({
    iec62443: { sl1: 85, sl2: 70, sl3: 55, sl4: 30, overallLevel: 2 },
    nistCsf: { identify: 75, protect: 68, detect: 55, respond: 45, recover: 40 },
    gaps: [
      'No network segmentation between Level 2 and Level 3',
      'Missing intrusion detection in OT network',
      'Insufficient logging on PLC communications',
      'No backup authentication mechanism',
    ],
    recommendations: [
      'Implement additional firewall between SCADA and HMI layers',
      'Deploy OT-specific IDS/IPS solution',
      'Enable Modbus TCP logging and monitoring',
      'Configure redundant authentication server',
    ],
  });

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addZone = useCallback((zone: Omit<Zone, 'id'>) => {
    setZones(prev => [...prev, { ...zone, id: generateId() }]);
  }, []);

  const updateZone = useCallback((id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  }, []);

  const removeZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  }, []);

  const addDevice = useCallback((device: Omit<Device, 'id'>) => {
    setDevices(prev => [...prev, { ...device, id: generateId() }]);
  }, []);

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const addFirewallRule = useCallback((rule: Omit<FirewallRule, 'id'>) => {
    setFirewallRules(prev => [...prev, { ...rule, id: generateId() }]);
  }, []);

  const updateFirewallRule = useCallback((id: string, updates: Partial<FirewallRule>) => {
    setFirewallRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const removeFirewallRule = useCallback((id: string) => {
    setFirewallRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const recalculateAssessment = useCallback(() => {
    const hasIdmz = zones.some(z => z.name.toLowerCase().includes('dmz'));
    const hasFirewallBetweenLevels = firewallRules.filter(r => r.enabled && r.action === 'deny').length > 0;
    const deviceCount = devices.length;
    const sisDevices = devices.filter(d => d.type === 'sis').length;

    const sl1 = Math.min(100, 50 + (hasIdmz ? 20 : 0) + (hasFirewallBetweenLevels ? 15 : 0) + deviceCount * 2);
    const sl2 = Math.min(100, 40 + (firewallRules.length * 5) + (sisDevices * 10));
    const sl3 = Math.min(100, 30 + (zones.filter(z => z.securityLevel >= 3).length * 10));
    const sl4 = Math.min(100, 20 + (sisDevices * 15));

    const overallLevel = sl4 >= 60 ? 4 : sl3 >= 60 ? 3 : sl2 >= 60 ? 2 : 1;

    setAssessment(prev => ({
      ...prev,
      iec62443: { sl1, sl2, sl3, sl4, overallLevel },
    }));
  }, [zones, devices, firewallRules]);

  return (
    <LabEnvironmentContext.Provider
      value={{
        zones,
        devices,
        firewallRules,
        assessment,
        addZone,
        updateZone,
        removeZone,
        addDevice,
        updateDevice,
        removeDevice,
        addFirewallRule,
        updateFirewallRule,
        removeFirewallRule,
        recalculateAssessment,
      }}
    >
      {children}
    </LabEnvironmentContext.Provider>
  );
}

export function useLabEnvironment() {
  const context = useContext(LabEnvironmentContext);
  if (!context) {
    throw new Error('useLabEnvironment must be used within LabEnvironmentProvider');
  }
  return context;
}
