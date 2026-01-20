import { useState } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  FileCode,
  Activity,
} from 'lucide-react';

interface ProtocolAttack {
  id: string;
  name: string;
  protocol: string;
  description: string;
  payload: string;
  expectedBehavior: string;
  mitigations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const protocolAttacks: ProtocolAttack[] = [
  {
    id: 'modbus-fc16',
    name: 'Write Multiple Registers',
    protocol: 'Modbus TCP',
    description: 'Attempt to write multiple holding registers to a PLC',
    payload: 'FC16: Address 0x0000, Quantity 10, Values [0xFFFF...]',
    expectedBehavior: 'Should be blocked by function code filtering',
    mitigations: ['Function code whitelist', 'Register address filtering', 'Rate limiting'],
    severity: 'high',
  },
  {
    id: 'modbus-fc8',
    name: 'Diagnostic Function',
    protocol: 'Modbus TCP',
    description: 'Send diagnostic command to query device information',
    payload: 'FC8: Subfunction 0x00 (Return Query Data)',
    expectedBehavior: 'Should be allowed for diagnostics',
    mitigations: ['Subfunction filtering', 'Source IP whitelist'],
    severity: 'low',
  },
  {
    id: 'modbus-replay',
    name: 'Replay Attack',
    protocol: 'Modbus TCP',
    description: 'Capture and replay legitimate Modbus commands',
    payload: 'Captured FC5: Force Single Coil ON',
    expectedBehavior: 'Should be detected by sequence number tracking',
    mitigations: ['Sequence number validation', 'Timestamp checking', 'Anomaly detection'],
    severity: 'high',
  },
  {
    id: 'enip-enumerate',
    name: 'Device Enumeration',
    protocol: 'Ethernet/IP',
    description: 'ListIdentity request to discover CIP devices',
    payload: 'ListIdentity: Broadcast 0x0063',
    expectedBehavior: 'Should be blocked from unauthorized sources',
    mitigations: ['Broadcast filtering', 'Source validation', 'Network segmentation'],
    severity: 'medium',
  },
  {
    id: 'opcua-anonymous',
    name: 'Anonymous Connection',
    protocol: 'OPC UA',
    description: 'Attempt anonymous connection without authentication',
    payload: 'CreateSession: SecurityPolicy=None',
    expectedBehavior: 'Should be rejected - require authentication',
    mitigations: ['Disable anonymous access', 'Certificate authentication', 'Minimum security policy'],
    severity: 'high',
  },
  {
    id: 'opcua-malformed',
    name: 'Malformed Message',
    protocol: 'OPC UA',
    description: 'Send malformed OPC UA message to crash server',
    payload: 'Invalid MessageHeader with oversized chunk',
    expectedBehavior: 'Server should handle gracefully without crash',
    mitigations: ['Input validation', 'Message size limits', 'Exception handling'],
    severity: 'medium',
  },
];

interface TestResult {
  attackId: string;
  blocked: boolean;
  filterUsed: string | null;
  responseTime: number;
  notes: string;
}

export function ProtocolAttackTest() {
  const [selectedAttack, setSelectedAttack] = useState<ProtocolAttack | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTest = () => {
    if (!selectedAttack) return;

    setTesting(true);

    setTimeout(() => {
      const blocked = Math.random() > 0.3;
      const filterUsed = blocked
        ? selectedAttack.mitigations[Math.floor(Math.random() * selectedAttack.mitigations.length)]
        : null;

      setResults(prev => [
        ...prev,
        {
          attackId: selectedAttack.id,
          blocked,
          filterUsed,
          responseTime: Math.floor(Math.random() * 50) + 10,
          notes: blocked
            ? `Attack blocked by ${filterUsed}`
            : 'Attack reached target - review filtering rules',
        },
      ]);

      setTesting(false);
    }, 1500);
  };

  const getSeverityColor = (severity: ProtocolAttack['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getLatestResult = (attackId: string) => {
    return results.filter(r => r.attackId === attackId).pop();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Tests Run</p>
          <p className="text-2xl font-bold text-white">{results.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Attacks Blocked</p>
          <p className="text-2xl font-bold text-emerald-400">
            {results.filter(r => r.blocked).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Attacks Passed</p>
          <p className="text-2xl font-bold text-red-400">
            {results.filter(r => !r.blocked).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-cyan-400">
            {results.length > 0
              ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
              : 0}ms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Protocol Attack Library</h3>
          {protocolAttacks.map((attack) => {
            const result = getLatestResult(attack.id);
            return (
              <button
                key={attack.id}
                onClick={() => setSelectedAttack(attack)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedAttack?.id === attack.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{attack.name}</span>
                  {result && (
                    result.blocked ? (
                      <Shield size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-400" />
                    )
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2">{attack.protocol}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(attack.severity)}`}>
                    {attack.severity.toUpperCase()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedAttack ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedAttack.name}</h3>
                    <p className="text-sm text-slate-400">{selectedAttack.protocol}</p>
                  </div>
                  <button
                    onClick={runTest}
                    disabled={testing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      testing
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {testing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        <span>Run Attack</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm text-slate-300 mb-4">{selectedAttack.description}</p>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Attack Payload</h4>
                    <code className="text-sm text-cyan-400 font-mono">{selectedAttack.payload}</code>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Expected Behavior</h4>
                    <p className="text-sm text-slate-300">{selectedAttack.expectedBehavior}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Mitigations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAttack.mitigations.map((mit) => (
                        <span key={mit} className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                          {mit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Test Results</h3>
                {results.filter(r => r.attackId === selectedAttack.id).length > 0 ? (
                  <div className="space-y-2">
                    {results
                      .filter(r => r.attackId === selectedAttack.id)
                      .map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            result.blocked
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result.blocked ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : (
                                <XCircle size={18} className="text-red-400" />
                              )}
                              <span className={`font-medium ${result.blocked ? 'text-emerald-400' : 'text-red-400'}`}>
                                {result.blocked ? 'BLOCKED' : 'PASSED THROUGH'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{result.responseTime}ms</span>
                          </div>
                          <p className="text-xs text-slate-400">{result.notes}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileCode size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Run the attack to test your protocol filters</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Zap size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">Select a protocol attack to begin testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
