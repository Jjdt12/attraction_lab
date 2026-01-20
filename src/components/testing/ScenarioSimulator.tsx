import { useState, useEffect, useRef } from 'react';
import {
  Target,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Loader2,
  Info,
} from 'lucide-react';
import { useLabEnvironment } from '../../contexts/LabEnvironmentContext';
import { useSecurity } from '../../contexts/SecurityContext';

interface AttackStage {
  id: string;
  name: string;
  description: string;
  checkType: 'firewall' | 'ids' | 'acl' | 'segmentation' | 'protocol';
  requiredControl: string;
}

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  attackVector: string;
  targetLayer: number;
  techniques: string[];
  mitigations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  stages: AttackStage[];
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
    stages: [
      { id: 'initial', name: 'Initial Access', description: 'Attacker gains foothold via phishing', checkType: 'firewall', requiredControl: 'Email filtering firewall rule' },
      { id: 'recon', name: 'Network Reconnaissance', description: 'Scanning for OT systems', checkType: 'ids', requiredControl: 'IDS signature for port scanning' },
      { id: 'lateral', name: 'Lateral Movement to DMZ', description: 'Moving toward IDMZ boundary', checkType: 'segmentation', requiredControl: 'IDMZ zone with firewall' },
      { id: 'breach', name: 'IDMZ Breach Attempt', description: 'Trying to cross IT/OT boundary', checkType: 'firewall', requiredControl: 'Deny rule from IT to OT' },
      { id: 'impact', name: 'OT Network Access', description: 'Attempting to reach PLCs', checkType: 'acl', requiredControl: 'ACL blocking unauthorized IPs' },
    ],
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
    stages: [
      { id: 'position', name: 'Network Position', description: 'Attacker on OT network segment', checkType: 'segmentation', requiredControl: 'Proper zone segmentation' },
      { id: 'intercept', name: 'Traffic Interception', description: 'Capturing Modbus traffic', checkType: 'ids', requiredControl: 'IDS signature for ARP spoofing' },
      { id: 'inject', name: 'Command Injection', description: 'Sending malicious function codes', checkType: 'protocol', requiredControl: 'Protocol filter for Modbus' },
      { id: 'execute', name: 'PLC Execution', description: 'PLC processes malicious command', checkType: 'acl', requiredControl: 'ACL limiting Modbus sources' },
      { id: 'impact', name: 'Physical Impact', description: 'Unauthorized process change', checkType: 'ids', requiredControl: 'IDS for anomalous values' },
    ],
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
    stages: [
      { id: 'access', name: 'Legitimate Access', description: 'User logs in with valid credentials', checkType: 'acl', requiredControl: 'Role-based ACL limiting access' },
      { id: 'escalate', name: 'Privilege Abuse', description: 'Accessing unauthorized systems', checkType: 'acl', requiredControl: 'Least privilege ACL rules' },
      { id: 'modify', name: 'Configuration Change', description: 'Modifying PLC program', checkType: 'ids', requiredControl: 'IDS for config changes' },
      { id: 'cover', name: 'Log Tampering', description: 'Attempting to hide actions', checkType: 'ids', requiredControl: 'IDS for log anomalies' },
      { id: 'impact', name: 'Process Manipulation', description: 'Causing operational impact', checkType: 'protocol', requiredControl: 'Protocol filter for write commands' },
    ],
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
    stages: [
      { id: 'delivery', name: 'Update Delivery', description: 'Malicious update reaches network', checkType: 'firewall', requiredControl: 'Firewall blocking external downloads' },
      { id: 'staging', name: 'Update Staging', description: 'Update placed on staging server', checkType: 'segmentation', requiredControl: 'DMZ for update servers' },
      { id: 'transfer', name: 'OT Transfer', description: 'Update transferred to OT network', checkType: 'firewall', requiredControl: 'Firewall restricting IT to OT' },
      { id: 'install', name: 'Installation', description: 'Firmware installed on PLC', checkType: 'ids', requiredControl: 'IDS for firmware changes' },
      { id: 'impact', name: 'Backdoor Active', description: 'Malicious code executing', checkType: 'ids', requiredControl: 'IDS for anomalous behavior' },
    ],
  },
];

interface StageResult {
  stageId: string;
  stageName: string;
  blocked: boolean;
  blockingControl: string | null;
  status: 'pending' | 'running' | 'passed' | 'blocked';
}

interface SimulationResult {
  scenarioId: string;
  blocked: boolean;
  stagesCompleted: number;
  totalStages: number;
  blockingControl: string | null;
  stageResults: StageResult[];
}

function useSecuritySafe() {
  try {
    return useSecurity();
  } catch {
    return null;
  }
}

export function ScenarioSimulator() {
  const { zones } = useLabEnvironment();
  const securityContext = useSecuritySafe();
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);
  const [running, setRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const hasUserConfiguredSecurity = () => {
    if (!securityContext) return false;
    const enabledRules = securityContext.rules?.filter(r => r.enabled) || [];
    return enabledRules.length > 0 || securityContext.config?.firewallEnabled || securityContext.config?.idsEnabled;
  };

  const checkStageBlocked = (stage: AttackStage): { blocked: boolean; control: string | null } => {
    if (!securityContext) {
      return { blocked: false, control: null };
    }

    const rules = securityContext.rules || [];

    switch (stage.checkType) {
      case 'firewall': {
        if (!securityContext.config?.firewallEnabled) {
          return { blocked: false, control: null };
        }
        const blockingRule = rules.find(
          r => r.ruleType === 'firewall' && r.enabled
        );
        return {
          blocked: !!blockingRule,
          control: blockingRule ? `Firewall: ${blockingRule.name}` : null
        };
      }
      case 'ids': {
        if (!securityContext.config?.idsEnabled) {
          return { blocked: false, control: null };
        }
        const detectingSignature = rules.find(
          r => r.ruleType === 'ids_signature' && r.enabled
        );
        return {
          blocked: !!detectingSignature,
          control: detectingSignature ? `IDS: ${detectingSignature.name}` : null
        };
      }
      case 'acl': {
        if (!securityContext.config?.authenticationEnabled) {
          return { blocked: false, control: null };
        }
        const blockingAcl = rules.find(
          r => r.ruleType === 'acl' && r.enabled
        );
        return {
          blocked: !!blockingAcl,
          control: blockingAcl ? `ACL: ${blockingAcl.name}` : null
        };
      }
      case 'protocol': {
        if (!securityContext.config?.protocolFilteringEnabled) {
          return { blocked: false, control: null };
        }
        const blockingFilter = rules.find(
          r => r.ruleType === 'protocol_filter' && r.enabled
        );
        return {
          blocked: !!blockingFilter,
          control: blockingFilter ? `Protocol Filter: ${blockingFilter.name}` : null
        };
      }
      case 'segmentation': {
        if (!securityContext.config?.networkSegmentationEnabled) {
          return { blocked: false, control: null };
        }
        const hasIdmzZone = zones.some(z => z.name.toLowerCase().includes('dmz'));
        const hasSegmentationRules = rules.some(
          r => r.ruleType === 'firewall' && r.enabled
        );
        return {
          blocked: hasIdmzZone && hasSegmentationRules,
          control: hasIdmzZone && hasSegmentationRules ? 'Network Segmentation' : null
        };
      }
      default:
        return { blocked: false, control: null };
    }
  };

  const runSimulation = () => {
    if (!selectedScenario) return;

    setRunning(true);
    setCurrentStageIndex(0);
    setStageResults(selectedScenario.stages.map(s => ({
      stageId: s.id,
      stageName: s.name,
      blocked: false,
      blockingControl: null,
      status: 'pending' as const,
    })));
  };

  useEffect(() => {
    if (!running || !selectedScenario || currentStageIndex < 0) return;

    if (currentStageIndex >= selectedScenario.stages.length) {
      setRunning(false);
      const finalResults = stageResults;
      const blockedStage = finalResults.find(r => r.blocked);
      setResults(prev => [...prev, {
        scenarioId: selectedScenario.id,
        blocked: !!blockedStage,
        stagesCompleted: blockedStage
          ? finalResults.findIndex(r => r.blocked) + 1
          : finalResults.length,
        totalStages: finalResults.length,
        blockingControl: blockedStage?.blockingControl || null,
        stageResults: finalResults,
      }]);
      setCurrentStageIndex(-1);
      return;
    }

    setStageResults(prev => prev.map((r, i) =>
      i === currentStageIndex ? { ...r, status: 'running' } : r
    ));

    simulationRef.current = setTimeout(() => {
      const stage = selectedScenario.stages[currentStageIndex];
      const { blocked, control } = checkStageBlocked(stage);

      setStageResults(prev => prev.map((r, i) =>
        i === currentStageIndex
          ? { ...r, blocked, blockingControl: control, status: blocked ? 'blocked' : 'passed' }
          : r
      ));

      if (blocked) {
        setTimeout(() => {
          setRunning(false);
          const finalResults = stageResults.map((r, i) =>
            i === currentStageIndex
              ? { ...r, blocked: true, blockingControl: control, status: 'blocked' as const }
              : r
          );
          setResults(prev => [...prev, {
            scenarioId: selectedScenario.id,
            blocked: true,
            stagesCompleted: currentStageIndex + 1,
            totalStages: selectedScenario.stages.length,
            blockingControl: control,
            stageResults: finalResults,
          }]);
          setCurrentStageIndex(-1);
        }, 500);
      } else {
        setCurrentStageIndex(prev => prev + 1);
      }
    }, 800);

    return () => {
      if (simulationRef.current) clearTimeout(simulationRef.current);
    };
  }, [running, currentStageIndex, selectedScenario]);

  const resetSimulation = () => {
    setResults([]);
    setStageResults([]);
    setCurrentStageIndex(-1);
    setRunning(false);
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
                      {running ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={resetSimulation}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                {!hasUserConfiguredSecurity() && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-300 font-medium">No security controls configured</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Configure firewall rules, IDS signatures, ACLs, or protocol filters in the Security Training section to test your defenses.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(running || stageResults.length > 0) && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Attack Stages</h4>
                    <div className="space-y-2">
                      {(stageResults.length > 0 ? stageResults : selectedScenario.stages.map(s => ({
                        stageId: s.id,
                        stageName: s.name,
                        blocked: false,
                        blockingControl: null,
                        status: 'pending' as const,
                      }))).map((stage, idx) => {
                        const stageInfo = selectedScenario.stages[idx];
                        return (
                          <div
                            key={stage.stageId}
                            className={`p-3 rounded-lg border transition-all ${
                              stage.status === 'blocked'
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : stage.status === 'passed'
                                ? 'bg-red-500/10 border-red-500/30'
                                : stage.status === 'running'
                                ? 'bg-cyan-500/10 border-cyan-500/30'
                                : 'bg-slate-800/50 border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 flex items-center justify-center">
                                {stage.status === 'blocked' ? (
                                  <Shield size={16} className="text-emerald-400" />
                                ) : stage.status === 'passed' ? (
                                  <XCircle size={16} className="text-red-400" />
                                ) : stage.status === 'running' ? (
                                  <Loader2 size={16} className="text-cyan-400 animate-spin" />
                                ) : (
                                  <span className="text-xs text-slate-500">{idx + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  stage.status === 'blocked' ? 'text-emerald-300' :
                                  stage.status === 'passed' ? 'text-red-300' :
                                  stage.status === 'running' ? 'text-cyan-300' : 'text-slate-400'
                                }`}>
                                  {stage.stageName}
                                </p>
                                <p className="text-xs text-slate-500">{stageInfo?.description}</p>
                              </div>
                              <div className="text-right">
                                {stage.status === 'blocked' && (
                                  <span className="text-xs text-emerald-400">Blocked</span>
                                )}
                                {stage.status === 'passed' && (
                                  <span className="text-xs text-red-400">Passed</span>
                                )}
                                {stage.status === 'running' && (
                                  <span className="text-xs text-cyan-400">Testing...</span>
                                )}
                                {stage.status === 'pending' && (
                                  <span className="text-xs text-slate-500">Pending</span>
                                )}
                              </div>
                            </div>
                            {stage.blockingControl && (
                              <p className="text-xs text-emerald-400 mt-2 ml-9">
                                Blocked by: {stage.blockingControl}
                              </p>
                            )}
                            {stage.status === 'pending' && stageInfo && (
                              <p className="text-xs text-slate-500 mt-1 ml-9">
                                Requires: {stageInfo.requiredControl}
                              </p>
                            )}
                          </div>
                        );
                      })}
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
                              {result.blocked ? `Stopped at stage ${result.stagesCompleted}` : `All ${result.totalStages} stages passed`}
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
