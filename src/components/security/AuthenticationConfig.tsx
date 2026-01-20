import { useState } from 'react';
import {
  Key,
  Shield,
  Fingerprint,
  Clock,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';

interface AuthConfig {
  primaryAuth: 'local' | 'ldap' | 'radius' | 'certificate';
  backupAuth: 'local' | 'none';
  mfa: {
    enabled: boolean;
    methods: ('totp' | 'hardware' | 'sms' | 'email')[];
    requiredForRoles: string[];
  };
  session: {
    timeout: number;
    maxConcurrent: number;
    lockoutThreshold: number;
    lockoutDuration: number;
  };
  certificates: {
    enabled: boolean;
    requireClientCert: boolean;
    validityDays: number;
    autoRenew: boolean;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecial: boolean;
    expiryDays: number;
    historyCount: number;
  };
}

const defaultConfig: AuthConfig = {
  primaryAuth: 'ldap',
  backupAuth: 'local',
  mfa: {
    enabled: true,
    methods: ['totp', 'hardware'],
    requiredForRoles: ['admin', 'engineer'],
  },
  session: {
    timeout: 30,
    maxConcurrent: 3,
    lockoutThreshold: 5,
    lockoutDuration: 15,
  },
  certificates: {
    enabled: true,
    requireClientCert: false,
    validityDays: 365,
    autoRenew: true,
  },
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecial: true,
    expiryDays: 90,
    historyCount: 12,
  },
};

export function AuthenticationConfig() {
  const [config, setConfig] = useState<AuthConfig>(defaultConfig);

  const updateConfig = <K extends keyof AuthConfig>(
    key: K,
    value: AuthConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getAuthScore = () => {
    let score = 0;
    if (config.mfa.enabled) score += 25;
    if (config.certificates.enabled) score += 20;
    if (config.primaryAuth !== 'local') score += 15;
    if (config.backupAuth !== 'none') score += 10;
    if (config.session.lockoutThreshold <= 5) score += 10;
    if (config.passwordPolicy.minLength >= 12) score += 10;
    if (config.passwordPolicy.requireSpecial) score += 5;
    if (config.certificates.requireClientCert) score += 5;
    return Math.min(100, score);
  };

  const score = getAuthScore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Auth Security Score</p>
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
          <p className="text-xs text-slate-400 mb-1">Primary Auth</p>
          <p className="text-lg font-bold text-cyan-400 uppercase">{config.primaryAuth}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">MFA Status</p>
          <div className="flex items-center gap-2">
            {config.mfa.enabled ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-amber-400" />
                <span className="text-amber-400 font-semibold">Disabled</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Session Timeout</p>
          <p className="text-lg font-bold text-white">{config.session.timeout} min</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-cyan-400" />
            <h3 className="font-semibold text-white">Authentication Methods</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Primary Authentication</label>
              <div className="grid grid-cols-2 gap-2">
                {(['local', 'ldap', 'radius', 'certificate'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => updateConfig('primaryAuth', method)}
                    className={`p-3 rounded-lg border transition-all ${
                      config.primaryAuth === method
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-sm font-medium uppercase">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Backup Authentication</label>
              <div className="grid grid-cols-2 gap-2">
                {(['local', 'none'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => updateConfig('backupAuth', method)}
                    className={`p-3 rounded-lg border transition-all ${
                      config.backupAuth === method
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-sm font-medium capitalize">{method}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={18} className="text-emerald-400" />
              <h3 className="font-semibold text-white">Multi-Factor Authentication</h3>
            </div>
            <button
              onClick={() => updateConfig('mfa', { ...config.mfa, enabled: !config.mfa.enabled })}
              className={`px-3 py-1 rounded-lg transition-colors ${
                config.mfa.enabled
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.mfa.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {config.mfa.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Allowed Methods</label>
                <div className="flex flex-wrap gap-2">
                  {(['totp', 'hardware', 'sms', 'email'] as const).map((method) => {
                    const isSelected = config.mfa.methods.includes(method);
                    return (
                      <button
                        key={method}
                        onClick={() => {
                          const methods = isSelected
                            ? config.mfa.methods.filter(m => m !== method)
                            : [...config.mfa.methods, method];
                          updateConfig('mfa', { ...config.mfa, methods });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {method.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Required for Roles</label>
                <div className="flex flex-wrap gap-2">
                  {['admin', 'engineer', 'operator', 'vendor'].map((role) => {
                    const isRequired = config.mfa.requiredForRoles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          const roles = isRequired
                            ? config.mfa.requiredForRoles.filter(r => r !== role)
                            : [...config.mfa.requiredForRoles, role];
                          updateConfig('mfa', { ...config.mfa, requiredForRoles: roles });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                          isRequired
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">Session Control</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Timeout (minutes)</label>
              <input
                type="number"
                value={config.session.timeout}
                onChange={(e) => updateConfig('session', { ...config.session, timeout: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Concurrent</label>
              <input
                type="number"
                value={config.session.maxConcurrent}
                onChange={(e) => updateConfig('session', { ...config.session, maxConcurrent: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Lockout Threshold</label>
              <input
                type="number"
                value={config.session.lockoutThreshold}
                onChange={(e) => updateConfig('session', { ...config.session, lockoutThreshold: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Lockout Duration (min)</label>
              <input
                type="number"
                value={config.session.lockoutDuration}
                onChange={(e) => updateConfig('session', { ...config.session, lockoutDuration: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Certificate Management</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">TLS Certificates</span>
              <button
                onClick={() => updateConfig('certificates', { ...config.certificates, enabled: !config.certificates.enabled })}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  config.certificates.enabled
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.certificates.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {config.certificates.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Require Client Certificate</span>
                  <button
                    onClick={() => updateConfig('certificates', { ...config.certificates, requireClientCert: !config.certificates.requireClientCert })}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      config.certificates.requireClientCert
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.certificates.requireClientCert ? 'Yes' : 'No'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Auto-Renew</span>
                  <button
                    onClick={() => updateConfig('certificates', { ...config.certificates, autoRenew: !config.certificates.autoRenew })}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      config.certificates.autoRenew
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.certificates.autoRenew ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Validity Period (days)</label>
                  <input
                    type="number"
                    value={config.certificates.validityDays}
                    onChange={(e) => updateConfig('certificates', { ...config.certificates, validityDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-red-400" />
          <h3 className="font-semibold text-white">Password Policy</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Min Length</label>
            <input
              type="number"
              value={config.passwordPolicy.minLength}
              onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, minLength: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expiry (days)</label>
            <input
              type="number"
              value={config.passwordPolicy.expiryDays}
              onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, expiryDays: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">History Count</label>
            <input
              type="number"
              value={config.passwordPolicy.historyCount}
              onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, historyCount: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2">
              <input
                type="checkbox"
                checked={config.passwordPolicy.requireUppercase}
                onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, requireUppercase: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Uppercase</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2">
              <input
                type="checkbox"
                checked={config.passwordPolicy.requireNumbers}
                onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, requireNumbers: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Numbers</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2">
              <input
                type="checkbox"
                checked={config.passwordPolicy.requireSpecial}
                onChange={(e) => updateConfig('passwordPolicy', { ...config.passwordPolicy, requireSpecial: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Special Chars</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
