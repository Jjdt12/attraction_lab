import { useState } from 'react';
import {
  Target,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Activity,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  attackVector: string;
  targetLayer: number;
  techniques: string[];
  mitigations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeToExecute: number;
}

const attackScenarios: AttackScenario[] = [
  {
    id: 'ransomware-it',
    name: 'Ransomware Propagation',
    description: 'Simulate ransomware spreading from IT to OT network',
    attackVector: 'Phishing email with malicious attachment',
    targetLayer: 4,
    techniques: ['T1566 - Phishing', 'T1021 - Remote Services', 'T1486 - Data Encrypted'],
    mitigations: ['Network segmentation', 'IDMZ enforcement', 'Application whitelisting'],
    severity: 'critical',
    timeToExecute: 45,
  },
  {
    id: 'modbus-injection',
    name: 'Modbus Command Injection',
    description: 'Inject malicious Modbus commands to PLCs',
    attackVector: 'Man-in-the-middle on OT network',
    targetLayer: 1,
    techniques: ['T0831 - Manipulation of Control', 'T0843 - Program Upload'],
    mitigations: ['Protocol filtering', 'Function code whitelisting', 'Network monitoring'],
    severity: 'high',
    timeToExecute: 30,
  },
  {
    id: 'insider-threat',
    name: 'Malicious Insider',
    description: 'Authorized user with malicious intent',
    attackVector: 'Legitimate credentials with excessive privileges',
    targetLayer: 2,
    techniques: ['T0859 - Valid Accounts', 'T0821 - Modify Controller Tasking'],
    mitigations: ['Least privilege access', 'Audit logging', 'Dual authorization'],
    severity: 'high',
    timeToExecute: 20,
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Attack',
    description: 'Compromised firmware or software update',
    attackVector: 'Tampered vendor software',
    targetLayer: 1,
    techniques: ['T0862 - Supply Chain Compromise', 'T0839 - Module Firmware'],
    mitigations: ['Firmware validation', 'Secure update process', 'Vendor verification'],
    severity: 'critical',
    timeToExecute: 60,
  },
];

interface SimulationResult {
  scenarioId: string;
  blocked: boolean;
  stagesCompleted: number;
  blockingControl: string | null;
  duration: number;
}

export function ScenarioSimulator() {
  const { firewallRules, zones } = useLabEnvironment();
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const runSimulation = () => {
    if (!selectedScenario) return;

    setRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunning(false);

          const hasIdmz = zones.some(z => z.name.toLowerCase().includes('dmz'));
          const hasDenyRules = firewallRules.some(r => r.action === 'deny' && r.enabled);
          const blocked = hasIdmz && hasDenyRules && Math.random() > 0.3;

          setResults(prev => [
            ...prev,
            {
              scenarioId: selectedScenario.id,
              blocked,
              stagesCompleted: blocked ? Math.floor(Math.random() * 3) + 1 : 5,
              blockingControl: blocked ? selectedScenario.mitigations[0] : null,
              duration: selectedScenario.timeToExecute,
            },
          ]);

          return 100;
        }
        return prev + 2;
      });
    }, selectedScenario.timeToExecute * 10);
  };

  const getSeverityColor = (severity: AttackScenario['severity']) => {
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

  const getLatestResult = (scenarioId: string) => {
    return results.filter(r => r.scenarioId === scenarioId).pop();
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
          <p className="text-xs text-slate-400 mb-1">Attacks Succeeded</p>
          <p className="text-2xl font-bold text-red-400">
            {results.filter(r => !r.blocked).length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Defense Rate</p>
          <p className="text-2xl font-bold text-cyan-400">
            {results.length > 0
              ? Math.round((results.filter(r => r.blocked).length / results.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Attack Scenarios</h3>
          {attackScenarios.map((scenario) => {
            const result = getLatestResult(scenario.id);
            return (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{scenario.name}</span>
                  {result && (
                    result.blocked ? (
                      <Shield size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-400" />
                    )
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2">{scenario.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(scenario.severity)}`}>
                    {scenario.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">Level {scenario.targetLayer}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedScenario.name}</h3>
                    <p className="text-sm text-slate-400">{selectedScenario.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runSimulation}
                      disabled={running}
                      className={`p-2 rounded-lg transition-colors ${
                        running
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      } disabled:opacity-50`}
                    >
                      {running ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={() => setResults([])}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                {running && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Simulation Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Attack Vector</p>
                    <p className="text-sm text-white">{selectedScenario.attackVector}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Target Layer</p>
                    <p className="text-sm text-white">Purdue Level {selectedScenario.targetLayer}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">MITRE ATT&CK Techniques</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScenario.techniques.map((tech) => (
                        <span key={tech} className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Expected Mitigations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScenario.mitigations.map((mit) => (
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
                {results.filter(r => r.scenarioId === selectedScenario.id).length > 0 ? (
                  <div className="space-y-2">
                    {results
                      .filter(r => r.scenarioId === selectedScenario.id)
                      .map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            result.blocked
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.blocked ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : (
                                <XCircle size={18} className="text-red-400" />
                              )}
                              <span className={`font-medium ${result.blocked ? 'text-emerald-400' : 'text-red-400'}`}>
                                {result.blocked ? 'BLOCKED' : 'SUCCEEDED'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {result.stagesCompleted}/5 stages completed
                            </span>
                          </div>
                          {result.blockingControl && (
                            <p className="text-xs text-slate-400 mt-2">
                              Blocked by: <span className="text-emerald-400">{result.blockingControl}</span>
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Target size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No test results yet. Run the simulation to test your defenses.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Target size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">Select an attack scenario to begin testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
