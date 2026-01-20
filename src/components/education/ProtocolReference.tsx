import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Shield, AlertTriangle, Lock } from 'lucide-react';

interface Protocol {
  id: string;
  name: string;
  port: number | string;
  layer: string;
  description: string;
  securityFeatures: string[];
  vulnerabilities: string[];
  bestPractices: string[];
  functionCodes?: { code: number | string; name: string; description: string; risk: 'low' | 'medium' | 'high' }[];
}

const protocols: Protocol[] = [
  {
    id: 'modbus',
    name: 'Modbus TCP',
    port: 502,
    layer: 'Application',
    description: 'Simple, robust serial communication protocol developed in 1979. Widely used for connecting electronic devices.',
    securityFeatures: ['None by default', 'Modbus/TCP Security (TLS) available in newer implementations'],
    vulnerabilities: [
      'No authentication',
      'No encryption',
      'No integrity checking',
      'Broadcast allows device enumeration',
      'Function codes can be abused',
    ],
    bestPractices: [
      'Network segmentation',
      'Function code filtering',
      'Whitelist allowed addresses',
      'Monitor for anomalies',
      'Consider Modbus/TCP Security extension',
    ],
    functionCodes: [
      { code: 1, name: 'Read Coils', description: 'Read discrete outputs', risk: 'low' },
      { code: 2, name: 'Read Discrete Inputs', description: 'Read discrete inputs', risk: 'low' },
      { code: 3, name: 'Read Holding Registers', description: 'Read analog outputs', risk: 'low' },
      { code: 4, name: 'Read Input Registers', description: 'Read analog inputs', risk: 'low' },
      { code: 5, name: 'Write Single Coil', description: 'Write single output', risk: 'medium' },
      { code: 6, name: 'Write Single Register', description: 'Write single register', risk: 'medium' },
      { code: 15, name: 'Write Multiple Coils', description: 'Write multiple outputs', risk: 'high' },
      { code: 16, name: 'Write Multiple Registers', description: 'Write multiple registers', risk: 'high' },
      { code: 43, name: 'Read Device ID', description: 'Device identification', risk: 'low' },
    ],
  },
  {
    id: 'enip',
    name: 'EtherNet/IP',
    port: '44818, 2222',
    layer: 'Application',
    description: 'Industrial protocol using standard Ethernet. Uses CIP (Common Industrial Protocol) for object-oriented device communication.',
    securityFeatures: ['CIP Security available', 'TLS transport option', 'Device authentication'],
    vulnerabilities: [
      'Legacy devices lack security',
      'Implicit messaging uses UDP',
      'Device enumeration possible',
      'Man-in-the-middle attacks',
    ],
    bestPractices: [
      'Enable CIP Security where available',
      'Segment from IT networks',
      'Filter implicit messaging',
      'Monitor for unauthorized devices',
    ],
  },
  {
    id: 'opcua',
    name: 'OPC UA',
    port: 4840,
    layer: 'Application',
    description: 'Modern industrial interoperability standard. Platform-independent with built-in security.',
    securityFeatures: [
      'X.509 certificate authentication',
      'AES-256 encryption',
      'Message signing',
      'Fine-grained access control',
      'Audit logging',
    ],
    vulnerabilities: [
      'Misconfiguration can disable security',
      'Certificate management complexity',
      'Anonymous access if enabled',
      'Implementation vulnerabilities',
    ],
    bestPractices: [
      'Use SignAndEncrypt security mode',
      'Disable anonymous access',
      'Implement certificate management',
      'Regular security updates',
      'Monitor audit logs',
    ],
  },
  {
    id: 'profinet',
    name: 'PROFINET',
    port: '34962-34964',
    layer: 'Application/Data Link',
    description: 'Ethernet-based automation protocol from Siemens. Used for real-time data exchange.',
    securityFeatures: ['PROFINET Security (TLS)', 'Device authentication', 'Integrity protection'],
    vulnerabilities: [
      'Real-time constraints limit encryption',
      'Legacy devices unsupported',
      'Broadcast discovery',
      'Timing attacks possible',
    ],
    bestPractices: [
      'Physical network isolation',
      'Use PROFINET Security where possible',
      'Monitor for anomalies',
      'Secure engineering workstations',
    ],
  },
  {
    id: 'dnp3',
    name: 'DNP3',
    port: 20000,
    layer: 'Application',
    description: 'Distributed Network Protocol used in utilities and SCADA systems.',
    securityFeatures: ['DNP3 Secure Authentication (SA)', 'Challenge-response auth', 'Aggressive mode'],
    vulnerabilities: [
      'SA not widely deployed',
      'Replay attacks on legacy',
      'Man-in-the-middle',
      'Address spoofing',
    ],
    bestPractices: [
      'Enable Secure Authentication v5',
      'Use aggressive mode',
      'VPN for remote connections',
      'Monitor for anomalies',
    ],
  },
];

export function ProtocolReference() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(protocols[0]);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-amber-400 bg-amber-500/10';
      case 'low': return 'text-emerald-400 bg-emerald-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {protocols.map((proto) => (
          <button
            key={proto.id}
            onClick={() => setSelectedProtocol(proto)}
            className={`p-3 rounded-lg border transition-all text-left ${
              selectedProtocol.id === proto.id
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <p className="font-medium text-white text-sm">{proto.name}</p>
            <p className="text-xs text-slate-500">Port {proto.port}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedProtocol.name}</h2>
              <p className="text-sm text-slate-400 mt-1">Port {selectedProtocol.port} | {selectedProtocol.layer}</p>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-cyan-400" />
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-4">{selectedProtocol.description}</p>
        </div>

        {['overview', 'security', 'vulnerabilities', 'best-practices', 'function-codes'].map((section) => {
          if (section === 'function-codes' && !selectedProtocol.functionCodes) return null;

          const isExpanded = expandedSection === section;
          const titles: Record<string, string> = {
            overview: 'Security Features',
            security: 'Security Capabilities',
            vulnerabilities: 'Known Vulnerabilities',
            'best-practices': 'Best Practices',
            'function-codes': 'Function Codes',
          };

          return (
            <div key={section} className="border-b border-slate-800 last:border-b-0">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span className="font-medium text-white">{titles[section]}</span>
                {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {section === 'overview' && (
                    <div className="space-y-2">
                      {selectedProtocol.securityFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                          <Shield size={14} className="text-cyan-400" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'vulnerabilities' && (
                    <div className="space-y-2">
                      {selectedProtocol.vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded">
                          <AlertTriangle size={14} className="text-red-400" />
                          <span className="text-sm text-slate-300">{vuln}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'best-practices' && (
                    <div className="space-y-2">
                      {selectedProtocol.bestPractices.map((practice, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded">
                          <Lock size={14} className="text-emerald-400" />
                          <span className="text-sm text-slate-300">{practice}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'function-codes' && selectedProtocol.functionCodes && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 px-3 text-xs text-slate-500">Code</th>
                            <th className="text-left py-2 px-3 text-xs text-slate-500">Name</th>
                            <th className="text-left py-2 px-3 text-xs text-slate-500">Description</th>
                            <th className="text-left py-2 px-3 text-xs text-slate-500">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProtocol.functionCodes.map((fc) => (
                            <tr key={fc.code} className="border-b border-slate-800/50">
                              <td className="py-2 px-3 font-mono text-sm text-cyan-400">{fc.code}</td>
                              <td className="py-2 px-3 text-sm text-white">{fc.name}</td>
                              <td className="py-2 px-3 text-sm text-slate-400">{fc.description}</td>
                              <td className="py-2 px-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${getRiskColor(fc.risk)}`}>
                                  {fc.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
