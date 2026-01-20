import { useState } from 'react';
import {
  Globe,
  Building2,
  Monitor,
  Cpu,
  CircuitBoard,
  Cog,
  Shield,
  Info,
  ChevronRight,
  Server,
  Database,
  Laptop,
  Router,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface PurdueLevel {
  level: number;
  name: string;
  altName: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  components: string[];
  securityConsiderations: string[];
  protocols: string[];
}

const purdueLevels: PurdueLevel[] = [
  {
    level: 5,
    name: 'Enterprise Network',
    altName: 'Enterprise Zone',
    description: 'Corporate IT network with business applications, email, ERP systems, and internet connectivity.',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    components: ['Corporate Servers', 'Email Systems', 'ERP/SAP', 'Business Intelligence', 'Internet Gateway'],
    securityConsiderations: ['Standard IT security', 'Perimeter firewall', 'Anti-malware', 'VPN for remote'],
    protocols: ['HTTP/HTTPS', 'SMTP', 'DNS', 'LDAP'],
  },
  {
    level: 4,
    name: 'Site Business Planning',
    altName: 'Site Business Zone',
    description: 'Site-level business systems including scheduling, operations management, and reporting.',
    icon: Building2,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/30',
    components: ['Production Scheduling', 'MES Servers', 'Reporting Systems', 'Engineering Workstations'],
    securityConsiderations: ['Segregated from enterprise', 'Role-based access', 'Audit logging', 'Patch management'],
    protocols: ['SQL', 'OPC', 'HTTP', 'File Transfer'],
  },
  {
    level: 3,
    name: 'Site Operations',
    altName: 'Manufacturing Zone',
    description: 'Site-wide control systems including SCADA, historians, and control room operations.',
    icon: Monitor,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    components: ['SCADA Servers', 'Historian', 'HMI Servers', 'Alarm Management', 'Control Room'],
    securityConsiderations: ['OT-specific firewall', 'Whitelist applications', 'Industrial IDS', 'Secure remote access'],
    protocols: ['OPC UA', 'OPC DA', 'Modbus TCP', 'Database'],
  },
  {
    level: 2,
    name: 'Area Supervisory Control',
    altName: 'Control Zone',
    description: 'Local control room systems including HMI workstations and area controllers.',
    icon: Cpu,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    components: ['HMI Workstations', 'Area Controllers', 'Data Concentrators', 'Local Historians'],
    securityConsiderations: ['Air-gapped or strict firewall', 'Physical security', 'USB restrictions', 'Minimal attack surface'],
    protocols: ['Modbus', 'Ethernet/IP', 'ProfiNET', 'DNP3'],
  },
  {
    level: 1,
    name: 'Basic Control',
    altName: 'Cell/Area Zone',
    description: 'PLC/DCS controllers, RTUs, and safety systems that directly control processes.',
    icon: CircuitBoard,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    components: ['PLCs', 'DCS Controllers', 'RTUs', 'Safety PLCs (SIS)', 'Variable Frequency Drives'],
    securityConsiderations: ['Firmware validation', 'Change management', 'Physical protection', 'Redundant systems'],
    protocols: ['Modbus RTU', 'HART', 'Foundation Fieldbus', 'ProfiSafe'],
  },
  {
    level: 0,
    name: 'Process',
    altName: 'Field Zone',
    description: 'Physical equipment including sensors, actuators, motors, and field devices.',
    icon: Cog,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    components: ['Sensors', 'Actuators', 'Motors', 'Valves', 'Transmitters', 'Final Control Elements'],
    securityConsiderations: ['Physical access control', 'Tamper detection', 'Signal verification', 'Fail-safe design'],
    protocols: ['4-20mA', 'HART', 'Foundation Fieldbus', 'AS-i'],
  },
];

export function PurdueModel() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showIdmz, setShowIdmz] = useState(true);
  const { zones, devices } = useLabEnvironment();

  const getDevicesForLevel = (level: number) => {
    const levelZone = zones.find(z => z.level === level);
    return levelZone ? devices.filter(d => d.zoneId === levelZone.id) : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            The Purdue Enterprise Reference Architecture (PERA) model defines hierarchical levels for industrial control systems.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-slate-400">Show IDMZ</span>
          <button
            onClick={() => setShowIdmz(!showIdmz)}
            className={`relative w-10 h-5 rounded-full transition-colors ${showIdmz ? 'bg-cyan-500' : 'bg-slate-700'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                showIdmz ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {purdueLevels.map((level, index) => (
            <div key={level.level}>
              <button
                onClick={() => setSelectedLevel(selectedLevel === level.level ? null : level.level)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedLevel === level.level
                    ? level.bgColor + ' border-opacity-100'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${level.bgColor}`}>
                      <level.icon size={24} className={level.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${level.bgColor} ${level.color}`}>
                          Level {level.level}
                        </span>
                        <h3 className="font-semibold text-white">{level.name}</h3>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{level.altName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{getDevicesForLevel(level.level).length} devices</p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-slate-500 transition-transform ${selectedLevel === level.level ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {selectedLevel === level.level && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                    <p className="text-sm text-slate-300">{level.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Typical Components</h4>
                        <ul className="space-y-1">
                          {level.components.map((comp) => (
                            <li key={comp} className="text-sm text-slate-400 flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${level.color.replace('text-', 'bg-')}`} />
                              {comp}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Protocols</h4>
                        <div className="flex flex-wrap gap-1">
                          {level.protocols.map((proto) => (
                            <span key={proto} className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
                              {proto}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Security Considerations</h4>
                      <ul className="grid grid-cols-2 gap-1">
                        {level.securityConsiderations.map((sec) => (
                          <li key={sec} className="text-sm text-slate-400 flex items-center gap-2">
                            <Shield size={12} className="text-cyan-500" />
                            {sec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </button>

              {showIdmz && index === 2 && (
                <div className="my-2">
                  <button
                    onClick={() => setSelectedLevel(selectedLevel === 3.5 ? null : 3.5)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedLevel === 3.5
                        ? 'bg-pink-500/10 border-pink-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    } border-dashed`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-pink-500/10">
                        <Shield size={24} className="text-pink-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400">
                            IDMZ
                          </span>
                          <h3 className="font-semibold text-white">Industrial DMZ</h3>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">Buffer zone between IT and OT networks</p>
                      </div>
                    </div>

                    {selectedLevel === 3.5 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                        <p className="text-sm text-slate-300">
                          The Industrial DMZ provides a secure buffer zone that allows controlled data exchange
                          between enterprise IT networks and operational OT networks without direct connectivity.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Components</h4>
                            <ul className="space-y-1">
                              {['Jump Server', 'Data Diode', 'Patch Server', 'Historian Mirror', 'Remote Access Gateway'].map((comp) => (
                                <li key={comp} className="text-sm text-slate-400 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                  {comp}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Principles</h4>
                            <ul className="space-y-1">
                              {['No direct IT-OT paths', 'All traffic inspected', 'Minimal services', 'Hardened systems'].map((princ) => (
                                <li key={princ} className="text-sm text-slate-400 flex items-center gap-2">
                                  <Shield size={12} className="text-pink-500" />
                                  {princ}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-cyan-400" />
              <h3 className="font-semibold text-white">Quick Reference</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <h4 className="text-xs font-semibold text-cyan-400 mb-2">IT vs OT Boundary</h4>
                <p className="text-xs text-slate-400">
                  Levels 4-5 are typically IT-managed. Levels 0-3 are OT-managed. The IDMZ bridges these domains.
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <h4 className="text-xs font-semibold text-cyan-400 mb-2">Data Flow Direction</h4>
                <p className="text-xs text-slate-400">
                  Process data flows UP (Level 0 to 5). Commands flow DOWN (Level 3 to 0). The IDMZ controls both.
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <h4 className="text-xs font-semibold text-cyan-400 mb-2">Defense in Depth</h4>
                <p className="text-xs text-slate-400">
                  Each level boundary should have security controls. More critical levels require stronger controls.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Your Configuration</h3>
            <div className="space-y-3">
              {zones.map((zone) => {
                const zoneDevices = devices.filter(d => d.zoneId === zone.id);
                return (
                  <div key={zone.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span className="text-sm text-slate-300">{zone.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-xs text-slate-500">{zoneDevices.length} devices</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
