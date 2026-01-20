import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Settings,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SISConfig {
  isolation: {
    networkSegmented: boolean;
    separatePhysical: boolean;
    dedicatedPower: boolean;
    independentIO: boolean;
  };
  hardening: {
    firmwareVerified: boolean;
    configLocked: boolean;
    physicalKeyswitch: boolean;
    auditLogging: boolean;
  };
  monitoring: {
    healthCheck: boolean;
    diagnosticsEnabled: boolean;
    heartbeatInterval: number;
    alarmOnFailure: boolean;
  };
  testing: {
    proofTestInterval: number;
    lastProofTest: string;
    bypassLogging: boolean;
    maintenanceMode: boolean;
  };
}

const defaultConfig: SISConfig = {
  isolation: {
    networkSegmented: true,
    separatePhysical: true,
    dedicatedPower: true,
    independentIO: true,
  },
  hardening: {
    firmwareVerified: true,
    configLocked: true,
    physicalKeyswitch: false,
    auditLogging: true,
  },
  monitoring: {
    healthCheck: true,
    diagnosticsEnabled: true,
    heartbeatInterval: 1000,
    alarmOnFailure: true,
  },
  testing: {
    proofTestInterval: 365,
    lastProofTest: '2024-06-15',
    bypassLogging: true,
    maintenanceMode: false,
  },
};

export function SISProtectionPanel() {
  const [config, setConfig] = useState<SISConfig>(defaultConfig);

  const updateIsolation = (key: keyof SISConfig['isolation'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      isolation: { ...prev.isolation, [key]: value },
    }));
  };

  const updateHardening = (key: keyof SISConfig['hardening'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      hardening: { ...prev.hardening, [key]: value },
    }));
  };

  const updateMonitoring = (key: keyof SISConfig['monitoring'], value: boolean | number) => {
    setConfig(prev => ({
      ...prev,
      monitoring: { ...prev.monitoring, [key]: value },
    }));
  };

  const getProtectionScore = () => {
    let score = 0;
    Object.values(config.isolation).forEach(v => v && (score += 10));
    Object.values(config.hardening).forEach(v => v && (score += 10));
    if (config.monitoring.healthCheck) score += 10;
    if (config.monitoring.alarmOnFailure) score += 10;
    if (config.testing.bypassLogging) score += 10;
    return Math.min(100, score);
  };

  const score = getProtectionScore();
  const daysSinceProofTest = Math.floor(
    (Date.now() - new Date(config.testing.lastProofTest).getTime()) / (1000 * 60 * 60 * 24)
  );
  const proofTestOverdue = daysSinceProofTest > config.testing.proofTestInterval;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">SIS Protection Score</p>
          <p className="text-2xl font-bold text-white">{score}%</p>
          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Config Status</p>
          <div className="flex items-center gap-2">
            {config.hardening.configLocked ? (
              <>
                <Lock size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Locked</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-amber-400" />
                <span className="text-amber-400 font-semibold">Unlocked</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Last Proof Test</p>
          <p className={`text-lg font-semibold ${proofTestOverdue ? 'text-red-400' : 'text-white'}`}>
            {daysSinceProofTest} days ago
          </p>
          {proofTestOverdue && (
            <p className="text-xs text-red-400 mt-1">Overdue!</p>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Maintenance Mode</p>
          <div className="flex items-center gap-2">
            {config.testing.maintenanceMode ? (
              <>
                <Settings size={20} className="text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-amber-400 font-semibold">Active</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Normal</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-cyan-400" />
            <h3 className="font-semibold text-white">Network Isolation</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            SIS should be completely isolated from the BPCS and other networks to prevent compromise.
          </p>

          <div className="space-y-3">
            {[
              { key: 'networkSegmented', label: 'Network Segmented', desc: 'SIS on separate VLAN/subnet' },
              { key: 'separatePhysical', label: 'Separate Physical Network', desc: 'Dedicated switches and cabling' },
              { key: 'dedicatedPower', label: 'Dedicated Power Supply', desc: 'UPS independent from BPCS' },
              { key: 'independentIO', label: 'Independent I/O', desc: 'No shared sensors with BPCS' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => updateIsolation(key as keyof SISConfig['isolation'], !config.isolation[key as keyof SISConfig['isolation']])}
                className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                  config.isolation[key as keyof SISConfig['isolation']]
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                {config.isolation[key as keyof SISConfig['isolation']] ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <XCircle size={18} className="text-slate-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">System Hardening</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Hardening measures to prevent unauthorized changes to the SIS configuration.
          </p>

          <div className="space-y-3">
            {[
              { key: 'firmwareVerified', label: 'Firmware Verified', desc: 'Cryptographic signature validated' },
              { key: 'configLocked', label: 'Configuration Locked', desc: 'Changes require physical access' },
              { key: 'physicalKeyswitch', label: 'Physical Keyswitch', desc: 'Hardware write-protect enabled' },
              { key: 'auditLogging', label: 'Audit Logging', desc: 'All changes logged immutably' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => updateHardening(key as keyof SISConfig['hardening'], !config.hardening[key as keyof SISConfig['hardening']])}
                className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                  config.hardening[key as keyof SISConfig['hardening']]
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                {config.hardening[key as keyof SISConfig['hardening']] ? (
                  <CheckCircle2 size={18} className="text-amber-400" />
                ) : (
                  <XCircle size={18} className="text-slate-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Health Monitoring</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Health Check</p>
                <p className="text-xs text-slate-500">Continuous self-diagnostics</p>
              </div>
              <button
                onClick={() => updateMonitoring('healthCheck', !config.monitoring.healthCheck)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.monitoring.healthCheck
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.monitoring.healthCheck ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Diagnostics</p>
                <p className="text-xs text-slate-500">Extended diagnostics mode</p>
              </div>
              <button
                onClick={() => updateMonitoring('diagnosticsEnabled', !config.monitoring.diagnosticsEnabled)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.monitoring.diagnosticsEnabled
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.monitoring.diagnosticsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Alarm on Failure</p>
                <p className="text-xs text-slate-500">Alert when SIS fails diagnostic</p>
              </div>
              <button
                onClick={() => updateMonitoring('alarmOnFailure', !config.monitoring.alarmOnFailure)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.monitoring.alarmOnFailure
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.monitoring.alarmOnFailure ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="block text-sm text-white mb-1">Heartbeat Interval (ms)</label>
              <input
                type="number"
                value={config.monitoring.heartbeatInterval}
                onChange={(e) => updateMonitoring('heartbeatInterval', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={18} className="text-pink-400" />
            <h3 className="font-semibold text-white">Testing & Maintenance</h3>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              proofTestOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white">Proof Test Status</p>
                {proofTestOverdue ? (
                  <AlertTriangle size={16} className="text-red-400" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Last test: {config.testing.lastProofTest} ({daysSinceProofTest} days ago)
              </p>
              <p className="text-xs text-slate-400">
                Interval: Every {config.testing.proofTestInterval} days
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Bypass Logging</p>
                <p className="text-xs text-slate-500">Log all SIS bypasses</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  testing: { ...prev.testing, bypassLogging: !prev.testing.bypassLogging }
                }))}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.testing.bypassLogging
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.testing.bypassLogging ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className={`p-4 rounded-lg border ${
              config.testing.maintenanceMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/50 border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">
                    {config.testing.maintenanceMode
                      ? 'WARNING: SIS may not respond to trips'
                      : 'SIS operating normally'}
                  </p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    testing: { ...prev.testing, maintenanceMode: !prev.testing.maintenanceMode }
                  }))}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    config.testing.maintenanceMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {config.testing.maintenanceMode ? 'Exit Maintenance' : 'Enter Maintenance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
