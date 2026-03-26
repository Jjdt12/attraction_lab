import { useState, useEffect } from 'react';
import { Layers, Shield, Network, Grid3x3 as Grid3X3, BookOpen, Target, CheckCircle, Circle, ChevronRight, ChevronDown, AlertTriangle, Lightbulb, Server, Database, Monitor, Cpu, Router, Lock, ArrowRight, ArrowDown, Plus, Trash2, Save, RefreshCw, Award, Zap } from 'lucide-react';

interface PurdueLevel {
  level: string;
  name: string;
  description: string;
  examples: string[];
  color: string;
  ipRange: string;
  securityRequirements: string[];
}

const PURDUE_LEVELS: PurdueLevel[] = [
  {
    level: '5',
    name: 'Enterprise Network',
    description: 'Corporate IT network including email, web, ERP systems. This is where business operations happen but should have ZERO direct access to control systems.',
    examples: ['Email servers', 'Web servers', 'ERP systems', 'Corporate databases', 'Internet gateway'],
    color: '#3b82f6',
    ipRange: '10.0.0.0/16',
    securityRequirements: ['Standard IT security', 'Perimeter firewall', 'No OT access'],
  },
  {
    level: '4',
    name: 'Site Business Planning',
    description: 'Site-level IT systems that need some OT data for business planning, reporting, and scheduling. Data should flow UP from OT, not down.',
    examples: ['MES systems', 'Production scheduling', 'Batch management', 'Lab systems'],
    color: '#6366f1',
    ipRange: '10.0.0.0/16',
    securityRequirements: ['DMZ access only', 'Read-only OT data', 'No control capability'],
  },
  {
    level: '3.5',
    name: 'Industrial DMZ',
    description: 'THE CRITICAL SECURITY BOUNDARY. This zone contains security devices that mediate ALL traffic between IT (Level 4-5) and OT (Level 0-3). Nothing crosses without inspection.',
    examples: ['Industrial firewalls', 'Data diodes', 'Jump servers', 'Historian mirrors', 'Patch servers'],
    color: '#ec4899',
    ipRange: '10.1.0.0/24',
    securityRequirements: ['Dual firewalls', 'Data diodes', 'Jump servers with MFA', 'No direct routing'],
  },
  {
    level: '3',
    name: 'Site Operations',
    description: 'Operations and control center where operators monitor and control the process. HMIs, SCADA servers, and engineering workstations live here.',
    examples: ['SCADA servers', 'HMI stations', 'Engineering workstations', 'Process historian', 'Alarm servers'],
    color: '#10b981',
    ipRange: '10.2.0.0/24',
    securityRequirements: ['Application whitelisting', 'Locked-down workstations', 'Physical security'],
  },
  {
    level: '2',
    name: 'Area Supervisory Control',
    description: 'Local control systems that directly manage process equipment. PLCs, RTUs, and local HMIs that control specific areas or processes.',
    examples: ['PLCs', 'RTUs', 'Local HMIs', 'Variable frequency drives', 'Motor control centers'],
    color: '#22c55e',
    ipRange: '10.3.0.0/24',
    securityRequirements: ['Network segmentation', 'Protocol filtering', 'No external access'],
  },
  {
    level: '1',
    name: 'Basic Control',
    description: 'Direct control devices including sensors, actuators, and I/O modules. These devices directly interact with the physical process.',
    examples: ['I/O modules', 'Intelligent sensors', 'Actuators', 'Motor starters', 'Valves'],
    color: '#84cc16',
    ipRange: '10.4.0.0/24',
    securityRequirements: ['Physically secured', 'No network exposure', 'Hardwired safety'],
  },
  {
    level: '0',
    name: 'Physical Process',
    description: 'The actual physical equipment and process being controlled. This is what we are protecting - in our case, the attraction vehicles, motors, and safety systems.',
    examples: ['Attraction vehicles', 'Motors', 'Conveyors', 'Pumps', 'Physical sensors'],
    color: '#f59e0b',
    ipRange: 'N/A',
    securityRequirements: ['Physical interlocks', 'Hardwired E-stops', 'Fail-safe design'],
  },
];

interface UserZone {
  id: string;
  name: string;
  level: string;
  devices: UserDevice[];
  ipRange: string;
}

interface UserDevice {
  id: string;
  name: string;
  type: 'plc' | 'hmi' | 'scada' | 'historian' | 'firewall' | 'server' | 'sensor' | 'safety';
  ipAddress: string;
}

interface IDMZComponent {
  id: string;
  name: string;
  type: 'firewall' | 'data-diode' | 'jump-server' | 'historian-mirror' | 'patch-server';
  enabled: boolean;
  direction: 'it-to-ot' | 'ot-to-it' | 'both';
  description: string;
  required: boolean;
}

const REQUIRED_IDMZ_COMPONENTS: IDMZComponent[] = [
  {
    id: 'fw-it',
    name: 'IT-Side Firewall',
    type: 'firewall',
    enabled: false,
    direction: 'both',
    description: 'First line of defense. Filters all traffic entering the DMZ from IT networks. Should block all OT protocols.',
    required: true,
  },
  {
    id: 'fw-ot',
    name: 'OT-Side Firewall',
    type: 'firewall',
    enabled: false,
    direction: 'both',
    description: 'Second firewall. Filters traffic exiting DMZ to OT. Should only allow specific authorized connections.',
    required: true,
  },
  {
    id: 'data-diode',
    name: 'Data Diode',
    type: 'data-diode',
    enabled: false,
    direction: 'ot-to-it',
    description: 'Hardware-enforced one-way data flow. Allows OT data to flow to IT for reporting, but physically prevents any data from flowing back. Essential for high-security environments.',
    required: true,
  },
  {
    id: 'jump-server',
    name: 'Jump Server',
    type: 'jump-server',
    enabled: false,
    direction: 'both',
    description: 'Secure access point for authorized personnel. All remote access to OT must go through this server with MFA and full session logging.',
    required: true,
  },
  {
    id: 'historian-mirror',
    name: 'Historian Mirror',
    type: 'historian-mirror',
    enabled: false,
    direction: 'ot-to-it',
    description: 'Read-only replica of OT historian data. IT systems access this copy, never the production historian. Data is pushed from OT, not pulled by IT.',
    required: false,
  },
  {
    id: 'patch-server',
    name: 'Patch Server',
    type: 'patch-server',
    enabled: false,
    direction: 'it-to-ot',
    description: 'Staging area for OT system updates. Patches are reviewed and tested in DMZ before deployment to OT. Prevents direct download from internet to OT.',
    required: false,
  },
];

interface ArchitectureObjective {
  id: string;
  category: 'zones' | 'idmz' | 'devices';
  title: string;
  description: string;
  hint: string;
  points: number;
  validator: (zones: UserZone[], idmzComponents: IDMZComponent[]) => { completed: boolean; feedback: string };
}

const ARCHITECTURE_OBJECTIVES: ArchitectureObjective[] = [
  {
    id: 'zone-1',
    category: 'zones',
    title: 'Create Control Zone (Level 2)',
    description: 'Create a zone for your PLCs at Purdue Level 2. This zone will contain the Main PLC, Safety PLC, and Effects PLC.',
    hint: 'Click "Add Zone" and set the level to 2. Name it something like "Control Zone" or "PLC Network".',
    points: 10,
    validator: (zones) => {
      const hasLevel2 = zones.some(z => z.level === '2');
      return {
        completed: hasLevel2,
        feedback: hasLevel2 ? 'Control zone created at Level 2!' : 'Create a zone at Purdue Level 2 for your PLCs.',
      };
    },
  },
  {
    id: 'zone-2',
    category: 'zones',
    title: 'Create Operations Zone (Level 3)',
    description: 'Create a zone for HMI stations and SCADA servers at Purdue Level 3.',
    hint: 'Operators need a separate zone from control systems. Create a Level 3 zone for HMIs.',
    points: 10,
    validator: (zones) => {
      const hasLevel3 = zones.some(z => z.level === '3');
      return {
        completed: hasLevel3,
        feedback: hasLevel3 ? 'Operations zone created at Level 3!' : 'Create a zone at Purdue Level 3 for operations.',
      };
    },
  },
  {
    id: 'zone-3',
    category: 'zones',
    title: 'Create IDMZ Zone (Level 3.5)',
    description: 'Create the critical Industrial DMZ zone at Level 3.5. This is the security boundary between IT and OT.',
    hint: 'The IDMZ is required for proper segmentation. Create it at Level 3.5.',
    points: 15,
    validator: (zones) => {
      const hasIDMZ = zones.some(z => z.level === '3.5');
      return {
        completed: hasIDMZ,
        feedback: hasIDMZ ? 'IDMZ created!' : 'Create the Industrial DMZ at Level 3.5.',
      };
    },
  },
  {
    id: 'device-1',
    category: 'devices',
    title: 'Add Main PLC to Control Zone',
    description: 'Add the Main PLC (controls ride vehicles) to your Level 2 Control Zone with IP 10.3.0.10.',
    hint: 'Select your Control Zone, click Add Device, set type to PLC, and use IP 10.3.0.10.',
    points: 10,
    validator: (zones) => {
      const hasPLC = zones.some(z =>
        z.level === '2' &&
        z.devices.some(d => d.type === 'plc' && d.ipAddress.includes('10.3.'))
      );
      return {
        completed: hasPLC,
        feedback: hasPLC ? 'Main PLC added to Control Zone!' : 'Add a PLC to your Level 2 zone.',
      };
    },
  },
  {
    id: 'device-2',
    category: 'devices',
    title: 'Add Safety PLC to Control Zone',
    description: 'Add the Safety PLC (controls E-stops and interlocks) to your Level 2 zone with IP 10.3.0.11.',
    hint: 'Safety systems should be in the same zone as control but on a separate device.',
    points: 10,
    validator: (zones) => {
      const hasSafety = zones.some(z =>
        z.level === '2' &&
        z.devices.some(d => d.type === 'safety')
      );
      return {
        completed: hasSafety,
        feedback: hasSafety ? 'Safety PLC added!' : 'Add a Safety device to your Level 2 zone.',
      };
    },
  },
  {
    id: 'device-3',
    category: 'devices',
    title: 'Add HMI to Operations Zone',
    description: 'Add an HMI station for operators to your Level 3 Operations Zone.',
    hint: 'HMIs belong in the Operations zone (Level 3), not with PLCs.',
    points: 10,
    validator: (zones) => {
      const hasHMI = zones.some(z =>
        z.level === '3' &&
        z.devices.some(d => d.type === 'hmi')
      );
      return {
        completed: hasHMI,
        feedback: hasHMI ? 'HMI added to Operations Zone!' : 'Add an HMI to your Level 3 zone.',
      };
    },
  },
  {
    id: 'idmz-1',
    category: 'idmz',
    title: 'Enable IT-Side Firewall',
    description: 'Enable the firewall on the IT side of the DMZ. This blocks unauthorized IT traffic from entering.',
    hint: 'In the IDMZ Designer, toggle on the IT-Side Firewall.',
    points: 15,
    validator: (_, idmz) => {
      const enabled = idmz.find(c => c.id === 'fw-it')?.enabled;
      return {
        completed: !!enabled,
        feedback: enabled ? 'IT-Side Firewall enabled!' : 'Enable the IT-Side Firewall in the IDMZ.',
      };
    },
  },
  {
    id: 'idmz-2',
    category: 'idmz',
    title: 'Enable OT-Side Firewall',
    description: 'Enable the firewall on the OT side of the DMZ. Defense in depth requires TWO firewalls.',
    hint: 'In the IDMZ Designer, toggle on the OT-Side Firewall.',
    points: 15,
    validator: (_, idmz) => {
      const enabled = idmz.find(c => c.id === 'fw-ot')?.enabled;
      return {
        completed: !!enabled,
        feedback: enabled ? 'OT-Side Firewall enabled!' : 'Enable the OT-Side Firewall in the IDMZ.',
      };
    },
  },
  {
    id: 'idmz-3',
    category: 'idmz',
    title: 'Enable Data Diode',
    description: 'Enable the data diode for one-way data flow from OT to IT. This prevents any IT commands from reaching OT.',
    hint: 'Data diodes are hardware-enforced security. Toggle it on in the IDMZ Designer.',
    points: 20,
    validator: (_, idmz) => {
      const enabled = idmz.find(c => c.id === 'data-diode')?.enabled;
      return {
        completed: !!enabled,
        feedback: enabled ? 'Data Diode enabled - one-way protection active!' : 'Enable the Data Diode for one-way security.',
      };
    },
  },
  {
    id: 'idmz-4',
    category: 'idmz',
    title: 'Enable Jump Server',
    description: 'Enable the jump server for secure remote access. All maintenance access must go through this controlled entry point.',
    hint: 'Jump servers provide audited, controlled access. Enable it in the IDMZ Designer.',
    points: 15,
    validator: (_, idmz) => {
      const enabled = idmz.find(c => c.id === 'jump-server')?.enabled;
      return {
        completed: !!enabled,
        feedback: enabled ? 'Jump Server enabled - secure access configured!' : 'Enable the Jump Server for controlled access.',
      };
    },
  },
];

const WORKFLOW_STEPS = [
  { id: 'learn', label: 'Learn', description: 'Understand the Purdue Model' },
  { id: 'zones', label: 'Configure Zones', description: 'Create network zones' },
  { id: 'idmz', label: 'Design IDMZ', description: 'Set up security boundary' },
  { id: 'complete', label: 'Complete', description: 'All objectives done' },
] as const;

export function ArchitectureTrainingDashboard() {
  const [activeTab, setActiveTab] = useState<'learn' | 'zones' | 'idmz' | 'objectives'>('learn');
  const [expandedLevel, setExpandedLevel] = useState<string | null>('3.5');
  const [userZones, setUserZones] = useState<UserZone[]>([]);
  const [idmzComponents, setIdmzComponents] = useState<IDMZComponent[]>(REQUIRED_IDMZ_COMPONENTS);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState<string | null>(null);
  const [newZone, setNewZone] = useState({ name: '', level: '2', ipRange: '' });
  const [newDevice, setNewDevice] = useState({ name: '', type: 'plc' as UserDevice['type'], ipAddress: '' });

  const addZone = () => {
    if (!newZone.name) return;
    const zone: UserZone = {
      id: `zone-${Date.now()}`,
      name: newZone.name,
      level: newZone.level,
      ipRange: newZone.ipRange || getDefaultIPRange(newZone.level),
      devices: [],
    };
    setUserZones([...userZones, zone]);
    setNewZone({ name: '', level: '2', ipRange: '' });
    setShowAddZone(false);
  };

  const getDefaultIPRange = (level: string) => {
    switch (level) {
      case '5':
      case '4': return '10.0.0.0/24';
      case '3.5': return '10.1.0.0/24';
      case '3': return '10.2.0.0/24';
      case '2': return '10.3.0.0/24';
      case '1': return '10.4.0.0/24';
      default: return '10.0.0.0/24';
    }
  };

  const addDevice = (zoneId: string) => {
    if (!newDevice.name || !newDevice.ipAddress) return;
    const device: UserDevice = {
      id: `device-${Date.now()}`,
      name: newDevice.name,
      type: newDevice.type,
      ipAddress: newDevice.ipAddress,
    };
    setUserZones(userZones.map(z =>
      z.id === zoneId ? { ...z, devices: [...z.devices, device] } : z
    ));
    setNewDevice({ name: '', type: 'plc', ipAddress: '' });
    setShowAddDevice(null);
  };

  const removeZone = (zoneId: string) => {
    setUserZones(userZones.filter(z => z.id !== zoneId));
  };

  const removeDevice = (zoneId: string, deviceId: string) => {
    setUserZones(userZones.map(z =>
      z.id === zoneId ? { ...z, devices: z.devices.filter(d => d.id !== deviceId) } : z
    ));
  };

  const toggleIDMZComponent = (componentId: string) => {
    setIdmzComponents(idmzComponents.map(c =>
      c.id === componentId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const completedObjectives = ARCHITECTURE_OBJECTIVES.filter(obj =>
    obj.validator(userZones, idmzComponents).completed
  ).length;

  const totalPoints = ARCHITECTURE_OBJECTIVES
    .filter(obj => obj.validator(userZones, idmzComponents).completed)
    .reduce((sum, obj) => sum + obj.points, 0);

  const maxPoints = ARCHITECTURE_OBJECTIVES.reduce((sum, obj) => sum + obj.points, 0);

  const zoneObjectives = ARCHITECTURE_OBJECTIVES.filter(obj => obj.category === 'zones');
  const deviceObjectives = ARCHITECTURE_OBJECTIVES.filter(obj => obj.category === 'devices');
  const idmzObjectives = ARCHITECTURE_OBJECTIVES.filter(obj => obj.category === 'idmz');

  const zoneProgress = zoneObjectives.filter(obj => obj.validator(userZones, idmzComponents).completed).length;
  const deviceProgress = deviceObjectives.filter(obj => obj.validator(userZones, idmzComponents).completed).length;
  const idmzProgress = idmzObjectives.filter(obj => obj.validator(userZones, idmzComponents).completed).length;

  const getCurrentWorkflowStep = () => {
    if (completedObjectives === ARCHITECTURE_OBJECTIVES.length) return 3;
    if (idmzProgress > 0) return 2;
    if (zoneProgress > 0 || deviceProgress > 0) return 1;
    return 0;
  };

  const currentStep = getCurrentWorkflowStep();

  const tabs = [
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'zones', label: 'Configure Zones', icon: Grid3X3 },
    { id: 'idmz', label: 'Design IDMZ', icon: Shield },
    { id: 'objectives', label: 'Objectives', icon: Target },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="text-cyan-400" />
            Architecture Training Lab
          </h1>
          <p className="text-slate-400 mt-1">
            Design your ICS network architecture following the Purdue Model
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{completedObjectives}/{ARCHITECTURE_OBJECTIVES.length}</div>
            <div className="text-[10px] text-slate-400">Objectives</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">{totalPoints}</div>
            <div className="text-[10px] text-slate-400">/ {maxPoints} pts</div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Your Progress</span>
          <span className="text-xs text-slate-400">{completedObjectives}/{ARCHITECTURE_OBJECTIVES.length} objectives complete</span>
        </div>
        <div className="flex items-center gap-2">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    index < currentStep
                      ? 'bg-emerald-500 text-white'
                      : index === currentStep
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  index <= currentStep ? 'text-white' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  index < currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'learn' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Understanding the Purdue Model</h2>
            <p className="text-slate-300 mb-4">
              The Purdue Enterprise Reference Architecture (PERA) is the foundation of ICS network security.
              It defines a hierarchical model where each level has specific functions and security requirements.
              The key principle is: <strong>traffic should only flow between adjacent levels</strong>, never skip levels.
            </p>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-red-300">Critical Rule</h4>
                  <p className="text-sm text-slate-300">
                    Level 4-5 (IT) should NEVER have direct access to Level 0-2 (OT control systems).
                    ALL traffic must pass through the IDMZ (Level 3.5) for inspection and mediation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {PURDUE_LEVELS.map((level) => (
              <div
                key={level.level}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLevel(expandedLevel === level.level ? null : level.level)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: level.color + '20', color: level.color }}
                  >
                    L{level.level}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-white">{level.name}</h3>
                    <p className="text-sm text-slate-400">{level.description.slice(0, 100)}...</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-500">{level.ipRange}</span>
                  </div>
                  {expandedLevel === level.level ? (
                    <ChevronDown size={20} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-500" />
                  )}
                </button>

                {expandedLevel === level.level && (
                  <div className="border-t border-slate-800 p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                      <p className="text-sm text-slate-300">{level.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Typical Components</h4>
                      <div className="flex flex-wrap gap-2">
                        {level.examples.map((ex) => (
                          <span
                            key={ex}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ backgroundColor: level.color + '20', color: level.color }}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Security Requirements</h4>
                      <ul className="space-y-1">
                        {level.securityRequirements.map((req, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle size={14} className="text-emerald-400" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {level.level === '3.5' && (
                      <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="text-pink-400 shrink-0 mt-1" size={20} />
                          <div>
                            <h4 className="font-semibold text-pink-300">Why the IDMZ is Critical</h4>
                            <p className="text-sm text-slate-300 mt-1">
                              In our attraction scenario, the IDMZ prevents corporate IT systems from directly
                              accessing ride control PLCs. Even if an attacker compromises the enterprise network,
                              they cannot send Modbus commands directly to the Safety PLC. They would need to
                              breach multiple firewalls, bypass the data diode, and compromise the jump server.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Attraction Network Architecture</h3>
            <p className="text-sm text-slate-400 mb-4">
              Here's how our theme park attraction maps to the Purdue Model:
            </p>

            <div className="space-y-2">
              {[
                { level: '4-5', name: 'Corporate Network', items: ['Marketing systems', 'Wait time displays', 'ERP'] },
                { level: '3.5', name: 'IDMZ', items: ['Firewalls', 'Jump server', 'Data diode'] },
                { level: '3', name: 'Operations', items: ['Operator HMI', 'SCADA', 'Engineering WS'] },
                { level: '2', name: 'Control', items: ['Main PLC (502)', 'Safety PLC (503)', 'Effects PLC (504)'] },
                { level: '1', name: 'Field', items: ['Motor drives', 'Sensors', 'I/O modules'] },
                { level: '0', name: 'Physical', items: ['Ride vehicles', 'Track', 'Show effects'] },
              ].map((row, i) => (
                <div key={row.level} className="flex items-center gap-4">
                  <div className="w-16 text-center">
                    <span className="text-xs font-mono text-slate-500">L{row.level}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{row.name}</span>
                      <div className="flex gap-2">
                        {row.items.map((item) => (
                          <span key={item} className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < 5 && (
                    <div className="w-8 flex justify-center">
                      <ArrowDown size={16} className="text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ArrowRight className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Ready to Start Building?</h3>
                <p className="text-sm text-slate-400">
                  Now that you understand the Purdue Model, it's time to build your own network architecture.
                  You'll create zones, add devices, and configure the IDMZ.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('zones')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                Start Building
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-2 font-medium">Your first objective:</p>
              <div className="flex items-center gap-2 text-sm text-white">
                <Circle size={14} className="text-slate-500" />
                <span>Create a Control Zone at Level 2 for your PLCs</span>
                <span className="ml-auto text-xs text-amber-400">+10 pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Your Network Zones</h3>
                <button
                  onClick={() => setShowAddZone(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Zone
                </button>
              </div>

          {showAddZone && (
            <div className="p-4 bg-slate-800 border border-cyan-500/30 rounded-xl">
              <h4 className="font-medium text-white mb-4">Create New Zone</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Zone Name</label>
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="e.g., Control Zone"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Purdue Level</label>
                  <select
                    value={newZone.level}
                    onChange={(e) => setNewZone({ ...newZone, level: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="5">Level 5 - Enterprise</option>
                    <option value="4">Level 4 - Site Business</option>
                    <option value="3.5">Level 3.5 - IDMZ</option>
                    <option value="3">Level 3 - Operations</option>
                    <option value="2">Level 2 - Control</option>
                    <option value="1">Level 1 - Field</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={addZone}
                    disabled={!newZone.name}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowAddZone(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {userZones.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-center mb-6">
                <Grid3X3 size={48} className="mx-auto text-slate-600 mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Zones Created Yet</h4>
                <p className="text-slate-400">Start by creating your first network zone.</p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <p className="text-sm text-amber-300 font-medium mb-2">Recommended first step:</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">L2</div>
                  <div>
                    <p className="text-sm text-white">Create a Control Zone at Level 2</p>
                    <p className="text-xs text-slate-400">This zone will contain your PLCs (Main, Safety, Effects)</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewZone({ name: 'Control Zone', level: '2', ipRange: '' });
                  setShowAddZone(true);
                }}
                className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium"
              >
                Create Control Zone (Level 2)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userZones.sort((a, b) => parseFloat(b.level) - parseFloat(a.level)).map((zone) => {
                const levelInfo = PURDUE_LEVELS.find(l => l.level === zone.level);
                return (
                  <div
                    key={zone.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                    style={{ borderLeftWidth: '4px', borderLeftColor: levelInfo?.color }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: levelInfo?.color + '20', color: levelInfo?.color }}
                          >
                            L{zone.level}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{zone.name}</h4>
                            <p className="text-xs text-slate-500">
                              {levelInfo?.name} | {zone.devices.length} devices
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">{zone.ipRange || getDefaultIPRange(zone.level)}</span>
                          <button
                            onClick={() => setShowAddDevice(showAddDevice === zone.id ? null : zone.id)}
                            className="p-2 hover:bg-slate-800 rounded-lg text-cyan-400"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeZone(zone.id)}
                            className="p-2 hover:bg-slate-800 rounded-lg text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {showAddDevice === zone.id && (
                        <div className="p-3 bg-slate-800/50 rounded-lg mb-4">
                          <div className="grid grid-cols-4 gap-3">
                            <input
                              type="text"
                              value={newDevice.name}
                              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                              placeholder="Device name"
                            />
                            <select
                              value={newDevice.type}
                              onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value as UserDevice['type'] })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                            >
                              <option value="plc">PLC</option>
                              <option value="safety">Safety PLC</option>
                              <option value="hmi">HMI</option>
                              <option value="scada">SCADA</option>
                              <option value="historian">Historian</option>
                              <option value="firewall">Firewall</option>
                              <option value="server">Server</option>
                              <option value="sensor">Sensor/IO</option>
                            </select>
                            <input
                              type="text"
                              value={newDevice.ipAddress}
                              onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                              placeholder="IP Address"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => addDevice(zone.id)}
                                className="px-3 py-1.5 bg-cyan-500 text-white rounded text-sm"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setShowAddDevice(null)}
                                className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {zone.devices.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {zone.devices.map((device) => (
                            <div
                              key={device.id}
                              className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                {device.type === 'plc' && <Cpu size={14} className="text-amber-400" />}
                                {device.type === 'safety' && <Shield size={14} className="text-red-400" />}
                                {device.type === 'hmi' && <Monitor size={14} className="text-emerald-400" />}
                                {device.type === 'scada' && <Server size={14} className="text-cyan-400" />}
                                {device.type === 'historian' && <Database size={14} className="text-blue-400" />}
                                {device.type === 'firewall' && <Shield size={14} className="text-pink-400" />}
                                {device.type === 'server' && <Server size={14} className="text-slate-400" />}
                                {device.type === 'sensor' && <Zap size={14} className="text-green-400" />}
                                <div>
                                  <p className="text-xs text-white">{device.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{device.ipAddress}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeDevice(zone.id, device.id)}
                                className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-amber-400" />
                  <h4 className="font-semibold text-white">Zone Objectives</h4>
                </div>
                <div className="space-y-3">
                  {zoneObjectives.map((obj) => {
                    const result = obj.validator(userZones, idmzComponents);
                    return (
                      <div key={obj.id} className={`p-3 rounded-lg ${result.completed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'}`}>
                        <div className="flex items-start gap-2">
                          {result.completed ? (
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${result.completed ? 'text-emerald-300' : 'text-white'}`}>{obj.title}</p>
                            {!result.completed && (
                              <p className="text-xs text-slate-400 mt-1">{obj.hint}</p>
                            )}
                          </div>
                          <span className="text-xs text-amber-400">{obj.points}pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={18} className="text-amber-400" />
                  <h4 className="font-semibold text-white">Device Objectives</h4>
                </div>
                <div className="space-y-3">
                  {deviceObjectives.map((obj) => {
                    const result = obj.validator(userZones, idmzComponents);
                    return (
                      <div key={obj.id} className={`p-3 rounded-lg ${result.completed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'}`}>
                        <div className="flex items-start gap-2">
                          {result.completed ? (
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${result.completed ? 'text-emerald-300' : 'text-white'}`}>{obj.title}</p>
                            {!result.completed && (
                              <p className="text-xs text-slate-400 mt-1">{obj.hint}</p>
                            )}
                          </div>
                          <span className="text-xs text-amber-400">{obj.points}pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(zoneProgress + deviceProgress) === (zoneObjectives.length + deviceObjectives.length) && (
                <button
                  onClick={() => setActiveTab('idmz')}
                  className="w-full p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center hover:bg-emerald-500/30 transition-colors"
                >
                  <p className="text-emerald-300 font-medium">All zone objectives complete!</p>
                  <p className="text-sm text-slate-400 mt-1">Continue to Design IDMZ</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'idmz' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-3 space-y-6">
              <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Server size={18} className="text-blue-400" />
                <h4 className="font-semibold text-white">IT Network</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">Level 4-5: Enterprise systems</p>
              <div className="space-y-2">
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">Business Apps</div>
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">ERP Systems</div>
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">Internet Gateway</div>
              </div>
            </div>

            <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-pink-400" />
                <h4 className="font-semibold text-white">Industrial DMZ</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">Level 3.5: Security boundary</p>

              <div className="space-y-2">
                {idmzComponents.map((component) => (
                  <button
                    key={component.id}
                    onClick={() => toggleIDMZComponent(component.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      component.enabled
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {component.type === 'firewall' && <Shield size={14} className={component.enabled ? 'text-emerald-400' : 'text-slate-500'} />}
                        {component.type === 'data-diode' && <Lock size={14} className={component.enabled ? 'text-emerald-400' : 'text-slate-500'} />}
                        {component.type === 'jump-server' && <Server size={14} className={component.enabled ? 'text-emerald-400' : 'text-slate-500'} />}
                        {component.type === 'historian-mirror' && <Database size={14} className={component.enabled ? 'text-emerald-400' : 'text-slate-500'} />}
                        {component.type === 'patch-server' && <Server size={14} className={component.enabled ? 'text-emerald-400' : 'text-slate-500'} />}
                        <span className={`text-xs font-medium ${component.enabled ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {component.name}
                        </span>
                      </div>
                      {component.required && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">REQ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      {component.direction === 'it-to-ot' && <span>IT → OT</span>}
                      {component.direction === 'ot-to-it' && <span>OT → IT</span>}
                      {component.direction === 'both' && <span>Bidirectional</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={18} className="text-emerald-400" />
                <h4 className="font-semibold text-white">OT Network</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">Level 0-3: Control systems</p>
              <div className="space-y-2">
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">SCADA/HMI</div>
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">PLCs/RTUs</div>
                <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-300">Field Devices</div>
              </div>
            </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="font-semibold text-white mb-4">Component Details</h4>
                <div className="space-y-3">
                  {idmzComponents.map((component) => (
                    <div key={component.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-white">{component.name}</h5>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          component.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {component.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-amber-400" />
                  <h4 className="font-semibold text-white">IDMZ Objectives</h4>
                </div>
                <div className="space-y-3">
                  {idmzObjectives.map((obj) => {
                    const result = obj.validator(userZones, idmzComponents);
                    return (
                      <div key={obj.id} className={`p-3 rounded-lg ${result.completed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'}`}>
                        <div className="flex items-start gap-2">
                          {result.completed ? (
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${result.completed ? 'text-emerald-300' : 'text-white'}`}>{obj.title}</p>
                            {!result.completed && (
                              <p className="text-xs text-slate-400 mt-1">{obj.hint}</p>
                            )}
                          </div>
                          <span className="text-xs text-amber-400">{obj.points}pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={16} className="text-pink-400" />
                  <span className="text-sm font-medium text-pink-300">Quick Guide</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">1.</span>
                    <span>Click components in the IDMZ panel to enable them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">2.</span>
                    <span>Enable both firewalls for defense in depth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">3.</span>
                    <span>Data diode prevents any IT commands reaching OT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">4.</span>
                    <span>Jump server provides secure remote access</span>
                  </li>
                </ul>
              </div>

              {idmzProgress === idmzObjectives.length && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
                  <Award className="mx-auto text-amber-400 mb-2" size={32} />
                  <p className="text-emerald-300 font-medium">All IDMZ objectives complete!</p>
                  <p className="text-sm text-slate-400 mt-1">Your network architecture is secure.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'objectives' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="text-amber-400" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white">Architecture Objectives</h3>
                  <p className="text-sm text-slate-400">Complete these to build a secure network architecture</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">{totalPoints} pts</div>
                <div className="text-xs text-slate-400">{completedObjectives} / {ARCHITECTURE_OBJECTIVES.length} complete</div>
              </div>
            </div>
          </div>

          {(['zones', 'devices', 'idmz'] as const).map((category) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {category === 'zones' && 'Zone Configuration'}
                {category === 'devices' && 'Device Placement'}
                {category === 'idmz' && 'IDMZ Design'}
              </h4>
              {ARCHITECTURE_OBJECTIVES.filter(obj => obj.category === category).map((obj) => {
                const result = obj.validator(userZones, idmzComponents);
                return (
                  <div
                    key={obj.id}
                    className={`p-4 rounded-xl border ${
                      result.completed
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.completed ? (
                        <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                      ) : (
                        <Circle className="text-slate-600 shrink-0 mt-0.5" size={20} />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-white">{obj.title}</h5>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">
                            {obj.points} pts
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{obj.description}</p>
                        <div className={`p-2 rounded text-xs ${
                          result.completed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {result.feedback}
                        </div>
                        {!result.completed && (
                          <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                            <div className="flex items-start gap-2 text-xs text-amber-300">
                              <Lightbulb size={12} className="shrink-0 mt-0.5" />
                              <p>{obj.hint}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {completedObjectives === ARCHITECTURE_OBJECTIVES.length && (
            <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-center">
              <Award className="mx-auto text-amber-400 mb-3" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">Architecture Complete!</h3>
              <p className="text-slate-300">
                Excellent work! You've designed a properly segmented ICS network following the Purdue Model.
                Your zones are configured, devices are placed, and the IDMZ is protecting your OT systems.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
