import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Lock,
  Eye,
  Activity,
  FileCode,
  Network,
  Server,
} from 'lucide-react';

interface DefenseControl {
  id: string;
  name: string;
  category: 'network' | 'host' | 'application' | 'monitoring';
  description: string;
  enabled: boolean;
  effectiveness: number;
  tritonMitigation: string;
}

const defenseControls: DefenseControl[] = [
  {
    id: 'network-isolation',
    name: 'SIS Network Isolation',
    category: 'network',
    description: 'Complete network separation between SIS and BPCS',
    enabled: true,
    effectiveness: 95,
    tritonMitigation: 'Prevents lateral movement from compromised engineering workstations',
  },
  {
    id: 'firewall-rules',
    name: 'SIS Firewall Rules',
    category: 'network',
    description: 'Strict firewall rules blocking unauthorized protocols',
    enabled: true,
    effectiveness: 85,
    tritonMitigation: 'Blocks TriStation protocol from unauthorized sources',
  },
  {
    id: 'firmware-validation',
    name: 'Firmware Validation',
    category: 'host',
    description: 'Cryptographic verification of SIS firmware integrity',
    enabled: false,
    effectiveness: 90,
    tritonMitigation: 'Detects unauthorized firmware modifications',
  },
  {
    id: 'config-monitoring',
    name: 'Configuration Monitoring',
    category: 'host',
    description: 'Real-time monitoring of SIS configuration changes',
    enabled: true,
    effectiveness: 80,
    tritonMitigation: 'Alerts on unauthorized logic changes',
  },
  {
    id: 'protocol-whitelist',
    name: 'Protocol Whitelisting',
    category: 'application',
    description: 'Only allow approved protocols to SIS controllers',
    enabled: true,
    effectiveness: 88,
    tritonMitigation: 'Blocks TRITON proprietary protocol commands',
  },
  {
    id: 'code-signing',
    name: 'Code Signing Enforcement',
    category: 'application',
    description: 'Require signed code for SIS logic uploads',
    enabled: false,
    effectiveness: 92,
    tritonMitigation: 'Prevents upload of malicious safety logic',
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    category: 'monitoring',
    description: 'ML-based detection of unusual SIS behavior',
    enabled: true,
    effectiveness: 75,
    tritonMitigation: 'Identifies reconnaissance and exploitation attempts',
  },
  {
    id: 'sis-logging',
    name: 'Comprehensive SIS Logging',
    category: 'monitoring',
    description: 'Log all SIS communications and state changes',
    enabled: true,
    effectiveness: 70,
    tritonMitigation: 'Provides forensic evidence of attack attempts',
  },
];

const attackStages = [
  {
    stage: 1,
    name: 'Initial Access',
    description: 'Attacker gains access to corporate network via phishing',
    controlsBlocking: ['network-isolation'],
  },
  {
    stage: 2,
    name: 'Lateral Movement',
    description: 'Attacker moves to engineering workstation',
    controlsBlocking: ['network-isolation', 'firewall-rules'],
  },
  {
    stage: 3,
    name: 'SIS Reconnaissance',
    description: 'Attacker discovers SIS controllers on network',
    controlsBlocking: ['anomaly-detection', 'sis-logging'],
  },
  {
    stage: 4,
    name: 'Payload Delivery',
    description: 'TRITON malware uploaded to engineering workstation',
    controlsBlocking: ['firmware-validation', 'code-signing'],
  },
  {
    stage: 5,
    name: 'SIS Compromise',
    description: 'Malicious logic uploaded to safety controllers',
    controlsBlocking: ['protocol-whitelist', 'code-signing', 'config-monitoring'],
  },
  {
    stage: 6,
    name: 'Safety Bypass',
    description: 'SIS fails to respond to dangerous conditions',
    controlsBlocking: ['firmware-validation', 'anomaly-detection'],
  },
];

export function TRITONDefense() {
  const [controls, setControls] = useState<DefenseControl[]>(defenseControls);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const toggleControl = (id: string) => {
    setControls(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const getOverallScore = () => {
    const enabled = controls.filter(c => c.enabled);
    if (enabled.length === 0) return 0;
    return Math.round(enabled.reduce((sum, c) => sum + c.effectiveness, 0) / controls.length);
  };

  const getStageBlocked = (stage: typeof attackStages[0]) => {
    return stage.controlsBlocking.some(controlId => {
      const control = controls.find(c => c.id === controlId);
      return control?.enabled;
    });
  };

  const getCategoryIcon = (category: DefenseControl['category']) => {
    switch (category) {
      case 'network':
        return Network;
      case 'host':
        return Server;
      case 'application':
        return FileCode;
      case 'monitoring':
        return Eye;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/10 to-slate-900 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert size={24} className="text-red-400" />
          <div>
            <h2 className="text-lg font-bold text-white">TRITON/TRISIS Attack Defense</h2>
            <p className="text-sm text-slate-400">
              Protection against attacks targeting Safety Instrumented Systems
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-900/80 rounded-lg">
          <p className="text-sm text-slate-300">
            TRITON is a sophisticated malware framework specifically designed to attack Triconex Safety
            Instrumented Systems. It was discovered in 2017 targeting a petrochemical facility and
            represents the first known malware capable of disabling safety systems in critical infrastructure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Defense Score</p>
          <p className="text-2xl font-bold text-white">{getOverallScore()}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                getOverallScore() >= 80 ? 'bg-emerald-500' : getOverallScore() >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${getOverallScore()}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Controls Enabled</p>
          <p className="text-2xl font-bold text-emerald-400">
            {controls.filter(c => c.enabled).length}/{controls.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Stages Blocked</p>
          <p className="text-2xl font-bold text-cyan-400">
            {attackStages.filter(s => getStageBlocked(s)).length}/{attackStages.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Critical Gaps</p>
          <p className="text-2xl font-bold text-amber-400">
            {controls.filter(c => !c.enabled && c.effectiveness >= 90).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Attack Kill Chain</h3>
          <div className="space-y-2">
            {attackStages.map((stage) => {
              const blocked = getStageBlocked(stage);
              return (
                <button
                  key={stage.stage}
                  onClick={() => setSelectedStage(selectedStage === stage.stage ? null : stage.stage)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    blocked
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  } ${selectedStage === stage.stage ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        {stage.stage}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{stage.name}</p>
                        <p className="text-xs text-slate-500">{stage.description}</p>
                      </div>
                    </div>
                    {blocked ? (
                      <Shield size={18} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-red-400" />
                    )}
                  </div>

                  {selectedStage === stage.stage && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Blocking Controls:</p>
                      <div className="flex flex-wrap gap-1">
                        {stage.controlsBlocking.map((controlId) => {
                          const control = controls.find(c => c.id === controlId);
                          return (
                            <span
                              key={controlId}
                              className={`text-xs px-2 py-0.5 rounded ${
                                control?.enabled
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {control?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Defense Controls</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {controls.map((control) => {
              const Icon = getCategoryIcon(control.category);
              return (
                <div
                  key={control.id}
                  className={`p-3 rounded-lg border transition-all ${
                    control.enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={control.enabled ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="text-sm font-medium text-white">{control.name}</span>
                    </div>
                    <button
                      onClick={() => toggleControl(control.id)}
                      className={`p-1 rounded transition-colors ${
                        control.enabled
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {control.enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{control.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Effectiveness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${control.effectiveness}%` }}
                        />
                      </div>
                      <span className="text-xs text-cyan-400">{control.effectiveness}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">TRITON-Specific Mitigations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'TriStation Protocol',
              desc: 'Block unauthorized TriStation communications to SIS',
              icon: Network,
              color: 'cyan',
            },
            {
              title: 'Engineering Workstations',
              desc: 'Harden and monitor systems with SIS access',
              icon: Server,
              color: 'amber',
            },
            {
              title: 'Safety Logic Integrity',
              desc: 'Verify SIS logic hasn\'t been modified',
              icon: FileCode,
              color: 'emerald',
            },
            {
              title: 'Physical Key Switches',
              desc: 'Require physical access for SIS changes',
              icon: Lock,
              color: 'pink',
            },
          ].map(({ title, desc, icon: Icon, color }) => (
            <div key={title} className={`p-4 bg-${color}-500/5 border border-${color}-500/20 rounded-lg`}>
              <Icon size={18} className={`text-${color}-400 mb-2`} />
              <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
