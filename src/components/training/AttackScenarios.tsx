import { useState } from 'react';
import {
  Skull,
  AlertTriangle,
  Shield,
  ChevronRight,
  ChevronDown,
  Server,
  Terminal,
  Clock,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  ExternalLink,
  Play,
  FileWarning,
} from 'lucide-react';

interface AttackScenario {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium';
  realWorldExample: string;
  description: string;
  attackPhases: AttackPhase[];
  technicalDetails: TechnicalDetail[];
  defenses: Defense[];
  modbusPacket?: string;
  mitreTechniques: string[];
}

interface AttackPhase {
  name: string;
  description: string;
  duration: string;
}

interface TechnicalDetail {
  label: string;
  value: string;
}

interface Defense {
  layer: 'firewall' | 'protocol' | 'ids' | 'acl';
  control: string;
  effectiveness: 'high' | 'medium' | 'low';
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'safety-bypass',
    name: 'Safety System Bypass Attack',
    severity: 'critical',
    realWorldExample: 'TRITON/TRISIS (2017) - Attack on Schneider Triconex SIS at Saudi petrochemical plant',
    description: `This attack targets the Safety Instrumented System (SIS) to disable safety protections.
    In our attraction scenario, the attacker disables the safety override coil, allowing the attraction to
    operate without proper safety checks. This could result in restraint failures, door openings during
    operation, or E-stop disabling.`,
    attackPhases: [
      {
        name: 'Reconnaissance',
        description: 'Scan network to identify Safety PLC. Map register addresses using FC 03 reads.',
        duration: '2-5 minutes',
      },
      {
        name: 'Credential Harvesting',
        description: 'If authentication exists, capture credentials through MITM or phishing.',
        duration: '1-7 days',
      },
      {
        name: 'Safety Logic Analysis',
        description: 'Download and analyze safety logic to understand interlock conditions.',
        duration: '1-3 days',
      },
      {
        name: 'Override Injection',
        description: 'Send FC 05 (Write Single Coil) to address 100 with value 0xFF00 (ON).',
        duration: '< 1 second',
      },
      {
        name: 'Persistence',
        description: 'Continuously write override value to prevent reset, or modify PLC logic.',
        duration: 'Ongoing',
      },
    ],
    technicalDetails: [
      { label: 'Target', value: 'Safety PLC (Port 503)' },
      { label: 'Function Code', value: 'FC 05 (Write Single Coil)' },
      { label: 'Target Address', value: 'Coil 100 (Safety Override)' },
      { label: 'Payload', value: '0xFF00 (Force ON)' },
      { label: 'Protocol', value: 'Modbus TCP' },
    ],
    modbusPacket: '00 01 00 00 00 06 01 05 00 64 FF 00',
    defenses: [
      { layer: 'firewall', control: 'Block all network access to Safety PLC port 503', effectiveness: 'high' },
      { layer: 'protocol', control: 'Block write function codes (FC 5, 6, 15, 16) to Safety PLC', effectiveness: 'high' },
      { layer: 'ids', control: 'Pattern signature for writes to coil 100', effectiveness: 'high' },
      { layer: 'acl', control: 'Require certificate auth for any Safety PLC access', effectiveness: 'medium' },
    ],
    mitreTechniques: ['T0816 - Safety System Bypass', 'T0831 - Manipulation of Control'],
  },
  {
    id: 'register-scan',
    name: 'Register Scanning & Enumeration',
    severity: 'medium',
    realWorldExample: 'Commonly observed in ICS honeypot research - attackers probe PLCs to map capabilities',
    description: `Before launching an attack, adversaries need to understand the target system. This
    reconnaissance attack rapidly reads all register values to map the system's data points. While not
    directly damaging, it provides the attacker with crucial information for subsequent attacks.`,
    attackPhases: [
      {
        name: 'Port Scanning',
        description: 'Identify Modbus-enabled devices on port 502.',
        duration: '1-10 minutes',
      },
      {
        name: 'Device Identification',
        description: 'Use FC 43 (Read Device Identification) to fingerprint PLCs.',
        duration: '< 1 minute',
      },
      {
        name: 'Register Enumeration',
        description: 'Sequentially read all coils (FC 01) and registers (FC 03) from 0-65535.',
        duration: '5-30 minutes',
      },
      {
        name: 'Data Analysis',
        description: 'Correlate register values with observed behavior to map data points.',
        duration: '1-7 days',
      },
    ],
    technicalDetails: [
      { label: 'Target', value: 'All PLCs (Ports 502-504)' },
      { label: 'Function Codes', value: 'FC 01, 02, 03, 04, 43' },
      { label: 'Address Range', value: '0-65535' },
      { label: 'Request Rate', value: '50-1000 requests/second' },
    ],
    defenses: [
      { layer: 'firewall', control: 'Whitelist only authorized source IPs', effectiveness: 'medium' },
      { layer: 'protocol', control: 'Rate limit to <50 requests/second per source', effectiveness: 'high' },
      { layer: 'ids', control: 'Threshold alert on >50 req/s', effectiveness: 'high' },
      { layer: 'acl', control: 'Require authentication for any PLC access', effectiveness: 'medium' },
    ],
    mitreTechniques: ['T0861 - Point & Tag Identification', 'T0846 - Remote System Discovery'],
  },
  {
    id: 'motor-manipulation',
    name: 'Motor Speed Manipulation',
    severity: 'high',
    realWorldExample: 'Stuxnet (2010) - Modified centrifuge speeds at Natanz nuclear facility',
    description: `This attack manipulates motor speed setpoints to cause physical damage or safety hazards.
    In our attraction, modifying vehicle motor speeds could cause collisions, derailments, or excessive
    forces on passengers. The attack might slowly change values to avoid detection.`,
    attackPhases: [
      {
        name: 'Baseline Recording',
        description: 'Monitor normal motor speed values over time to establish baseline.',
        duration: '1-24 hours',
      },
      {
        name: 'Setpoint Identification',
        description: 'Identify holding registers containing speed setpoints (registers 10-19).',
        duration: '1-4 hours',
      },
      {
        name: 'Gradual Modification',
        description: 'Slowly adjust speed values by 5-10% to avoid immediate detection.',
        duration: '30 minutes - several hours',
      },
      {
        name: 'Operator Deception',
        description: 'If HMI is accessible, spoof displayed values to hide manipulation.',
        duration: 'Concurrent with attack',
      },
    ],
    technicalDetails: [
      { label: 'Target', value: 'Main PLC (Port 502)' },
      { label: 'Function Code', value: 'FC 06 (Write Single Register)' },
      { label: 'Target Addresses', value: 'Registers 10-19 (Motor Speeds)' },
      { label: 'Payload', value: 'Modified speed values (RPM/percentage)' },
    ],
    modbusPacket: '00 01 00 00 00 06 01 06 00 0A XX XX',
    defenses: [
      { layer: 'firewall', control: 'Only allow writes from Engineering WS', effectiveness: 'high' },
      { layer: 'protocol', control: 'Restrict write access to motor registers', effectiveness: 'high' },
      { layer: 'ids', control: 'Anomaly detection for out-of-range values', effectiveness: 'medium' },
      { layer: 'acl', control: 'MFA required for write operations', effectiveness: 'high' },
    ],
    mitreTechniques: ['T0831 - Manipulation of Control', 'T0836 - Modify Parameter'],
  },
  {
    id: 'estop-manipulation',
    name: 'E-Stop System Manipulation',
    severity: 'critical',
    realWorldExample: 'Multiple incidents in automotive and manufacturing where safety stops were bypassed',
    description: `Emergency stop systems are critical safety controls. This attack either disables E-stops
    so they don't work when needed, or triggers false E-stops to cause operational disruption. In an
    attraction, a disabled E-stop during an actual emergency could prevent operators from stopping the ride.`,
    attackPhases: [
      {
        name: 'E-Stop Mapping',
        description: 'Read coils 0-3 to identify current E-stop states.',
        duration: '< 1 minute',
      },
      {
        name: 'Logic Analysis',
        description: 'Understand E-stop interlock relationships and reset sequences.',
        duration: '1-4 hours',
      },
      {
        name: 'Disable Attack',
        description: 'Write FALSE to E-stop coils or manipulate interlock logic.',
        duration: '< 1 second',
      },
      {
        name: 'Maintain State',
        description: 'Continuously override E-stop signals to prevent operator reset.',
        duration: 'Ongoing',
      },
    ],
    technicalDetails: [
      { label: 'Target', value: 'Safety PLC (Port 503)' },
      { label: 'Function Code', value: 'FC 05 (Write Single Coil), FC 15 (Write Multiple Coils)' },
      { label: 'Target Addresses', value: 'Coils 0-3 (E-Stop Coils)' },
      { label: 'Payload', value: '0x0000 (Force OFF)' },
    ],
    modbusPacket: '00 01 00 00 00 06 01 05 00 00 00 00',
    defenses: [
      { layer: 'firewall', control: 'Block ALL network writes to Safety PLC', effectiveness: 'high' },
      { layer: 'protocol', control: 'Only allow reads from Safety PLC via network', effectiveness: 'high' },
      { layer: 'ids', control: 'Sequence detection: read E-stop followed by write', effectiveness: 'high' },
      { layer: 'acl', control: 'No network write access to E-stop addresses', effectiveness: 'high' },
    ],
    mitreTechniques: ['T0816 - Safety System Bypass', 'T0800 - Activate Firmware Update Mode'],
  },
  {
    id: 'dos-attack',
    name: 'Denial of Service Attack',
    severity: 'high',
    realWorldExample: 'Ukraine power grid attacks (2015-2016) included DoS to prevent operator response',
    description: `Flood the PLC with requests to overwhelm its processing capability, causing legitimate
    commands to be dropped or delayed. This can prevent operators from controlling the ride or prevent
    the HMI from receiving status updates. Often used alongside other attacks to prevent response.`,
    attackPhases: [
      {
        name: 'Capacity Testing',
        description: 'Determine PLC request handling capacity through gradual load increase.',
        duration: '5-15 minutes',
      },
      {
        name: 'Attack Preparation',
        description: 'Set up multiple attack sources or amplification vectors.',
        duration: '1-4 hours',
      },
      {
        name: 'Flood Attack',
        description: 'Send thousands of Modbus requests per second from multiple sources.',
        duration: 'Duration of attack',
      },
      {
        name: 'Concurrent Attack',
        description: 'While operators are blinded, execute manipulation attack.',
        duration: 'Varies',
      },
    ],
    technicalDetails: [
      { label: 'Target', value: 'All PLCs' },
      { label: 'Method', value: 'Modbus request flooding' },
      { label: 'Rate', value: '>1000 requests/second' },
      { label: 'Goal', value: 'Exhaust PLC processing resources' },
    ],
    defenses: [
      { layer: 'firewall', control: 'Rate limiting per source IP', effectiveness: 'high' },
      { layer: 'protocol', control: 'Connection limits, request throttling', effectiveness: 'high' },
      { layer: 'ids', control: 'Threshold alerts for abnormal traffic volume', effectiveness: 'medium' },
      { layer: 'acl', control: 'Whitelist authorized sources', effectiveness: 'medium' },
    ],
    mitreTechniques: ['T0814 - Denial of Service', 'T0813 - Denial of Control'],
  },
];

export function AttackScenarios() {
  const [expandedScenario, setExpandedScenario] = useState<string | null>('safety-bypass');
  const [showPacketDetails, setShowPacketDetails] = useState(false);

  const severityColors = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const layerColors = {
    firewall: 'bg-orange-500/20 text-orange-300',
    protocol: 'bg-blue-500/20 text-blue-300',
    ids: 'bg-purple-500/20 text-purple-300',
    acl: 'bg-green-500/20 text-green-300',
  };

  const effectivenessIcons = {
    high: <CheckCircle size={12} className="text-emerald-400" />,
    medium: <AlertTriangle size={12} className="text-amber-400" />,
    low: <XCircle size={12} className="text-red-400" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skull className="text-red-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">Attack Scenarios</h2>
            <p className="text-sm text-slate-400">
              Understand how attackers compromise ICS systems and how to defend against them
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {ATTACK_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              expandedScenario === scenario.id
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mb-2 ${severityColors[scenario.severity]}`}>
              {scenario.severity.toUpperCase()}
            </div>
            <h3 className="text-sm font-medium text-white mb-1">{scenario.name}</h3>
            <p className="text-[10px] text-slate-500 line-clamp-2">
              {scenario.attackPhases.length} phases | {scenario.defenses.length} defenses
            </p>
          </button>
        ))}
      </div>

      {expandedScenario && (
        <div className="space-y-6">
          {ATTACK_SCENARIOS.filter(s => s.id === expandedScenario).map((scenario) => (
            <div key={scenario.id} className="space-y-6">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{scenario.name}</h3>
                    <p className="text-sm text-slate-300">{scenario.description}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileWarning size={14} className="text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">Real-World Example</span>
                  </div>
                  <p className="text-sm text-slate-400">{scenario.realWorldExample}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {scenario.mitreTechniques.map((tech) => (
                    <span key={tech} className="px-2 py-1 bg-slate-800 rounded text-xs text-cyan-300 font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Target size={16} className="text-red-400" />
                    Attack Phases
                  </h4>

                  <div className="space-y-3">
                    {scenario.attackPhases.map((phase, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-300 text-sm font-bold">
                            {index + 1}
                          </div>
                          {index < scenario.attackPhases.length - 1 && (
                            <div className="w-0.5 h-full bg-red-500/20 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-white">{phase.name}</h5>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock size={10} />
                              {phase.duration}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Terminal size={16} className="text-cyan-400" />
                    Technical Details
                  </h4>

                  <div className="space-y-2">
                    {scenario.technicalDetails.map((detail, index) => (
                      <div key={index} className="flex justify-between p-2 bg-slate-800/50 rounded">
                        <span className="text-xs text-slate-500">{detail.label}</span>
                        <span className="text-xs text-white font-mono">{detail.value}</span>
                      </div>
                    ))}
                  </div>

                  {scenario.modbusPacket && (
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">Modbus TCP Packet (Hex)</span>
                        <button
                          onClick={() => setShowPacketDetails(!showPacketDetails)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300"
                        >
                          {showPacketDetails ? 'Hide breakdown' : 'Show breakdown'}
                        </button>
                      </div>
                      <code className="text-sm text-red-300 font-mono">{scenario.modbusPacket}</code>

                      {showPacketDetails && (
                        <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                          <div><span className="text-blue-400">00 01</span> - Transaction ID</div>
                          <div><span className="text-slate-500">00 00</span> - Protocol ID (Modbus)</div>
                          <div><span className="text-slate-500">00 06</span> - Length (6 bytes)</div>
                          <div><span className="text-green-400">01</span> - Unit ID</div>
                          <div><span className="text-red-400">05</span> - Function Code (Write Coil)</div>
                          <div><span className="text-amber-400">00 64</span> - Address (100)</div>
                          <div><span className="text-orange-400">FF 00</span> - Value (ON)</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-emerald-400" />
                  Defense Strategies
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {scenario.defenses.map((defense, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${layerColors[defense.layer]}`}>
                          {defense.layer.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {effectivenessIcons[defense.effectiveness]}
                          <span className="text-slate-500">{defense.effectiveness}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">{defense.control}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-3">Defense in Depth Principle</h4>
        <p className="text-xs text-slate-400 mb-4">
          No single defense is 100% effective. Implement multiple layers so that if one fails, others provide protection.
          The attack scenarios above show how each layer contributes to overall security.
        </p>

        <div className="flex items-center justify-center gap-4">
          {[
            { layer: 'Firewall', desc: 'Network boundary', color: 'orange' },
            { layer: 'Protocol', desc: 'Application layer', color: 'blue' },
            { layer: 'IDS', desc: 'Detection & alerting', color: 'purple' },
            { layer: 'ACL', desc: 'Identity & access', color: 'green' },
          ].map((item, i) => (
            <div key={item.layer} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={16} className="text-slate-600" />}
              <div className={`px-3 py-2 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30`}>
                <div className={`text-xs font-medium text-${item.color}-300`}>{item.layer}</div>
                <div className="text-[10px] text-slate-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
