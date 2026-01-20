import { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  Network,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface RedundancyConfig {
  processorRedundancy: {
    type: '1oo1' | '1oo2' | '2oo2' | '2oo3' | 'tmr';
    enabled: boolean;
    failoverTime: number;
  };
  ioRedundancy: {
    inputVoting: '1oo1' | '1oo2' | '2oo2' | '2oo3';
    outputVoting: '1oo1' | '1oo2' | '2oo2';
    enabled: boolean;
  };
  communicationRedundancy: {
    dualNetwork: boolean;
    protocol: 'hsrp' | 'vrrp' | 'prp' | 'hsr';
    switchoverTime: number;
  };
  powerRedundancy: {
    dualPower: boolean;
    upsBackup: boolean;
    batteryMinutes: number;
  };
}

const votingDescriptions = {
  '1oo1': 'Single channel - no redundancy',
  '1oo2': '1 out of 2 - trips on single sensor',
  '2oo2': '2 out of 2 - both must agree to trip',
  '2oo3': '2 out of 3 - majority voting (TMR)',
  tmr: 'Triple Modular Redundancy',
};

const protocolDescriptions = {
  hsrp: 'Hot Standby Router Protocol (Cisco)',
  vrrp: 'Virtual Router Redundancy Protocol',
  prp: 'Parallel Redundancy Protocol (IEC 62439-3)',
  hsr: 'High-availability Seamless Redundancy',
};

export function RedundancyConfig() {
  const [config, setConfig] = useState<RedundancyConfig>({
    processorRedundancy: {
      type: '2oo3',
      enabled: true,
      failoverTime: 50,
    },
    ioRedundancy: {
      inputVoting: '2oo3',
      outputVoting: '1oo2',
      enabled: true,
    },
    communicationRedundancy: {
      dualNetwork: true,
      protocol: 'prp',
      switchoverTime: 0,
    },
    powerRedundancy: {
      dualPower: true,
      upsBackup: true,
      batteryMinutes: 30,
    },
  });

  const getAvailabilityScore = () => {
    let score = 50;
    if (config.processorRedundancy.enabled) {
      if (config.processorRedundancy.type === '2oo3' || config.processorRedundancy.type === 'tmr') score += 15;
      else if (config.processorRedundancy.type === '1oo2' || config.processorRedundancy.type === '2oo2') score += 10;
    }
    if (config.ioRedundancy.enabled) score += 10;
    if (config.communicationRedundancy.dualNetwork) score += 10;
    if (config.powerRedundancy.dualPower) score += 8;
    if (config.powerRedundancy.upsBackup) score += 7;
    return Math.min(100, score);
  };

  const getSafetyScore = () => {
    let score = 50;
    if (config.ioRedundancy.inputVoting === '2oo3') score += 20;
    else if (config.ioRedundancy.inputVoting === '1oo2') score += 15;
    if (config.processorRedundancy.type === '2oo3') score += 15;
    if (config.communicationRedundancy.protocol === 'prp' || config.communicationRedundancy.protocol === 'hsr') score += 10;
    return Math.min(100, score);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Availability Score</p>
          <p className="text-2xl font-bold text-white">{getAvailabilityScore()}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${getAvailabilityScore()}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Safety Integrity</p>
          <p className="text-2xl font-bold text-cyan-400">{getSafetyScore()}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${getSafetyScore()}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Processor Config</p>
          <p className="text-lg font-bold text-white uppercase">{config.processorRedundancy.type}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Network Protocol</p>
          <p className="text-lg font-bold text-white uppercase">{config.communicationRedundancy.protocol}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-cyan-400" />
            <h3 className="font-semibold text-white">Processor Redundancy</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Enable Redundancy</span>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  processorRedundancy: {
                    ...prev.processorRedundancy,
                    enabled: !prev.processorRedundancy.enabled,
                  },
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.processorRedundancy.enabled
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.processorRedundancy.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Voting Architecture</label>
              <div className="grid grid-cols-2 gap-2">
                {(['1oo1', '1oo2', '2oo2', '2oo3'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      processorRedundancy: { ...prev.processorRedundancy, type },
                    }))}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      config.processorRedundancy.type === type
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-mono font-semibold text-white">{type}</p>
                    <p className="text-xs text-slate-500 mt-1">{votingDescriptions[type]}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Failover Time (ms)</label>
              <input
                type="number"
                value={config.processorRedundancy.failoverTime}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  processorRedundancy: {
                    ...prev.processorRedundancy,
                    failoverTime: Number(e.target.value),
                  },
                }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">I/O Redundancy</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Enable I/O Redundancy</span>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  ioRedundancy: { ...prev.ioRedundancy, enabled: !prev.ioRedundancy.enabled },
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.ioRedundancy.enabled
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.ioRedundancy.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Input Voting</label>
              <select
                value={config.ioRedundancy.inputVoting}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  ioRedundancy: { ...prev.ioRedundancy, inputVoting: e.target.value as any },
                }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {(['1oo1', '1oo2', '2oo2', '2oo3'] as const).map((type) => (
                  <option key={type} value={type}>{type} - {votingDescriptions[type]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Output Voting</label>
              <select
                value={config.ioRedundancy.outputVoting}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  ioRedundancy: { ...prev.ioRedundancy, outputVoting: e.target.value as any },
                }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {(['1oo1', '1oo2', '2oo2'] as const).map((type) => (
                  <option key={type} value={type}>{type} - {votingDescriptions[type]}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">
                <strong className="text-amber-400">Tip:</strong> Use 2oo3 input voting for critical measurements
                and 1oo2 output voting for safety-critical actuators.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white">Communication Redundancy</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Dual Network</span>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  communicationRedundancy: {
                    ...prev.communicationRedundancy,
                    dualNetwork: !prev.communicationRedundancy.dualNetwork,
                  },
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.communicationRedundancy.dualNetwork
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.communicationRedundancy.dualNetwork ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Redundancy Protocol</label>
              <div className="grid grid-cols-2 gap-2">
                {(['hsrp', 'vrrp', 'prp', 'hsr'] as const).map((protocol) => (
                  <button
                    key={protocol}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      communicationRedundancy: { ...prev.communicationRedundancy, protocol },
                    }))}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      config.communicationRedundancy.protocol === protocol
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white uppercase">{protocol}</p>
                    <p className="text-xs text-slate-500 mt-1">{protocolDescriptions[protocol]}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-slate-400">
                <strong className="text-emerald-400">PRP/HSR:</strong> Zero switchover time - ideal for
                safety-critical networks requiring IEC 62439-3 compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-400" />
            <h3 className="font-semibold text-white">Power Redundancy</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Dual Power Supply</p>
                <p className="text-xs text-slate-500">Redundant power modules</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  powerRedundancy: { ...prev.powerRedundancy, dualPower: !prev.powerRedundancy.dualPower },
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.powerRedundancy.dualPower
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.powerRedundancy.dualPower ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">UPS Backup</p>
                <p className="text-xs text-slate-500">Uninterruptible power supply</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  powerRedundancy: { ...prev.powerRedundancy, upsBackup: !prev.powerRedundancy.upsBackup },
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.powerRedundancy.upsBackup
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.powerRedundancy.upsBackup ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {config.powerRedundancy.upsBackup && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Battery Runtime (minutes)</label>
                <input
                  type="number"
                  value={config.powerRedundancy.batteryMinutes}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    powerRedundancy: { ...prev.powerRedundancy, batteryMinutes: Number(e.target.value) },
                  }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            )}

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-slate-400">
                <strong className="text-yellow-400">Best Practice:</strong> Battery backup should provide
                enough time for a controlled shutdown of the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
